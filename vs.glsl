attribute vec3 vertex;
attribute vec3 normal;

uniform mat4 mvp;
uniform mat4 mm;
uniform vec3 light;

varying mediump float intensity;
varying mediump float z;

void main() {
	gl_Position = mvp * vec4(vertex, 1.);
	z = gl_Position.z;
	intensity = max(.0, dot(
		normalize(mat3(
			// transpose matrix
			mm[0][0], mm[0][1], mm[0][2],
			mm[1][0], mm[1][1], mm[1][2],
			mm[2][0], mm[2][1], mm[2][2]) * normal),
		normalize(light)));
}
