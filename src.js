'use strict'

var M = Math,
	D = document,
	W = window,
	FA = Float32Array,
	gl,
	im = new FA([
		1, 0, 0, 0,
		0, 1, 0, 0,
		0, 0, 1, 0,
		0, 0, 0, 1]),
	pm,
	vm = new FA(im),
	nm = new FA(16),
	cm = new FA(16),
	m = new FA(16),
	//far = 100,
	far = 50,
	skyColor = [.43, .73, .96, 1],
	lightDirection = [.5, .5, 1],
	program,
	seaProgram,
	entitiesLength = 0,
	entities = [],
	sea,
	ground,
	player,
	width,
	height,
	now,
	factor,
	last,
	first,
	pointersLength,
	pointersX = [],
	pointersY = [],
	keysDown = []

M.PI2 = M.PI2 || M.PI / 2
M.TAU = M.TAU || M.PI * 2

// from https://github.com/toji/gl-matrix
function invert(out, a) {
	var a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3],
		a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7],
		a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11],
		a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15],
		b00 = a00 * a11 - a01 * a10,
		b01 = a00 * a12 - a02 * a10,
		b02 = a00 * a13 - a03 * a10,
		b03 = a01 * a12 - a02 * a11,
		b04 = a01 * a13 - a03 * a11,
		b05 = a02 * a13 - a03 * a12,
		b06 = a20 * a31 - a21 * a30,
		b07 = a20 * a32 - a22 * a30,
		b08 = a20 * a33 - a23 * a30,
		b09 = a21 * a32 - a22 * a31,
		b10 = a21 * a33 - a23 * a31,
		b11 = a22 * a33 - a23 * a32,
		// calculate the determinant
		d = b00 * b11 -
			b01 * b10 +
			b02 * b09 +
			b03 * b08 -
			b04 * b07 +
			b05 * b06

	if (!d) {
		return null
	}

	d = 1.0 / d

	out[0] = (a11 * b11 - a12 * b10 + a13 * b09) * d
	out[1] = (a02 * b10 - a01 * b11 - a03 * b09) * d
	out[2] = (a31 * b05 - a32 * b04 + a33 * b03) * d
	out[3] = (a22 * b04 - a21 * b05 - a23 * b03) * d
	out[4] = (a12 * b08 - a10 * b11 - a13 * b07) * d
	out[5] = (a00 * b11 - a02 * b08 + a03 * b07) * d
	out[6] = (a32 * b02 - a30 * b05 - a33 * b01) * d
	out[7] = (a20 * b05 - a22 * b02 + a23 * b01) * d
	out[8] = (a10 * b10 - a11 * b08 + a13 * b06) * d
	out[9] = (a01 * b08 - a00 * b10 - a03 * b06) * d
	out[10] = (a30 * b04 - a31 * b02 + a33 * b00) * d
	out[11] = (a21 * b02 - a20 * b04 - a23 * b00) * d
	out[12] = (a11 * b07 - a10 * b09 - a12 * b06) * d
	out[13] = (a00 * b09 - a01 * b07 + a02 * b06) * d
	out[14] = (a31 * b01 - a30 * b03 - a32 * b00) * d
	out[15] = (a20 * b03 - a21 * b01 + a22 * b00) * d
}

// from https://github.com/toji/gl-matrix
function multiply(out, a, b) {
	var a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3],
		a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7],
		a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11],
		a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15]

	// cache only the current line of the second matrix
	var b0  = b[0], b1 = b[1], b2 = b[2], b3 = b[3]
	out[0] = b0*a00 + b1*a10 + b2*a20 + b3*a30
	out[1] = b0*a01 + b1*a11 + b2*a21 + b3*a31
	out[2] = b0*a02 + b1*a12 + b2*a22 + b3*a32
	out[3] = b0*a03 + b1*a13 + b2*a23 + b3*a33

	b0 = b[4]; b1 = b[5]; b2 = b[6]; b3 = b[7]
	out[4] = b0*a00 + b1*a10 + b2*a20 + b3*a30
	out[5] = b0*a01 + b1*a11 + b2*a21 + b3*a31
	out[6] = b0*a02 + b1*a12 + b2*a22 + b3*a32
	out[7] = b0*a03 + b1*a13 + b2*a23 + b3*a33

	b0 = b[8]; b1 = b[9]; b2 = b[10]; b3 = b[11]
	out[8] = b0*a00 + b1*a10 + b2*a20 + b3*a30
	out[9] = b0*a01 + b1*a11 + b2*a21 + b3*a31
	out[10] = b0*a02 + b1*a12 + b2*a22 + b3*a32
	out[11] = b0*a03 + b1*a13 + b2*a23 + b3*a33

	b0 = b[12]; b1 = b[13]; b2 = b[14]; b3 = b[15]
	out[12] = b0*a00 + b1*a10 + b2*a20 + b3*a30
	out[13] = b0*a01 + b1*a11 + b2*a21 + b3*a31
	out[14] = b0*a02 + b1*a12 + b2*a22 + b3*a32
	out[15] = b0*a03 + b1*a13 + b2*a23 + b3*a33
}

// from https://github.com/toji/gl-matrix
function rotate(out, a, rad, x, y, z) {
	var len = M.sqrt(x * x + y * y + z * z),
		s, c, t,
		a00, a01, a02, a03,
		a10, a11, a12, a13,
		a20, a21, a22, a23,
		b00, b01, b02,
		b10, b11, b12,
		b20, b21, b22

	if (M.abs(len) < 0.000001) {
		return
	}

	len = 1 / len
	x *= len
	y *= len
	z *= len

	s = M.sin(rad)
	c = M.cos(rad)
	t = 1 - c

	a00 = a[0]; a01 = a[1]; a02 = a[2]; a03 = a[3]
	a10 = a[4]; a11 = a[5]; a12 = a[6]; a13 = a[7]
	a20 = a[8]; a21 = a[9]; a22 = a[10]; a23 = a[11]

	// construct the elements of the rotation matrix
	b00 = x * x * t + c; b01 = y * x * t + z * s; b02 = z * x * t - y * s
	b10 = x * y * t - z * s; b11 = y * y * t + c; b12 = z * y * t + x * s
	b20 = x * z * t + y * s; b21 = y * z * t - x * s; b22 = z * z * t + c

	// perform rotation-specific matrix multiplication
	out[0] = a00 * b00 + a10 * b01 + a20 * b02
	out[1] = a01 * b00 + a11 * b01 + a21 * b02
	out[2] = a02 * b00 + a12 * b01 + a22 * b02
	out[3] = a03 * b00 + a13 * b01 + a23 * b02
	out[4] = a00 * b10 + a10 * b11 + a20 * b12
	out[5] = a01 * b10 + a11 * b11 + a21 * b12
	out[6] = a02 * b10 + a12 * b11 + a22 * b12
	out[7] = a03 * b10 + a13 * b11 + a23 * b12
	out[8] = a00 * b20 + a10 * b21 + a20 * b22
	out[9] = a01 * b20 + a11 * b21 + a21 * b22
	out[10] = a02 * b20 + a12 * b21 + a22 * b22
	out[11] = a03 * b20 + a13 * b21 + a23 * b22

	if (a !== out) {
		// if the source and destination differ, copy the unchanged last row
		out[12] = a[12]
		out[13] = a[13]
		out[14] = a[14]
		out[15] = a[15]
	}
}

// from https://github.com/toji/gl-matrix
function scale(out, a, x, y, z) {
	out[0] = a[0] * x
	out[1] = a[1] * x
	out[2] = a[2] * x
	out[3] = a[3] * x
	out[4] = a[4] * y
	out[5] = a[5] * y
	out[6] = a[6] * y
	out[7] = a[7] * y
	out[8] = a[8] * z
	out[9] = a[9] * z
	out[10] = a[10] * z
	out[11] = a[11] * z
	out[12] = a[12]
	out[13] = a[13]
	out[14] = a[14]
	out[15] = a[15]
}

// from https://github.com/toji/gl-matrix
function translate(out, a, x, y, z) {
	if (a === out) {
		out[12] = a[0] * x + a[4] * y + a[8] * z + a[12]
		out[13] = a[1] * x + a[5] * y + a[9] * z + a[13]
		out[14] = a[2] * x + a[6] * y + a[10] * z + a[14]
		out[15] = a[3] * x + a[7] * y + a[11] * z + a[15]
	} else {
		var a00, a01, a02, a03,
			a10, a11, a12, a13,
			a20, a21, a22, a23

		a00 = a[0]; a01 = a[1]; a02 = a[2]; a03 = a[3]
		a10 = a[4]; a11 = a[5]; a12 = a[6]; a13 = a[7]
		a20 = a[8]; a21 = a[9]; a22 = a[10]; a23 = a[11]

		out[0] = a00; out[1] = a01; out[2] = a02; out[3] = a03
		out[4] = a10; out[5] = a11; out[6] = a12; out[7] = a13
		out[8] = a20; out[9] = a21; out[10] = a22; out[11] = a23

		out[12] = a00 * x + a10 * y + a20 * z + a[12]
		out[13] = a01 * x + a11 * y + a21 * z + a[13]
		out[14] = a02 * x + a12 * y + a22 * z + a[14]
		out[15] = a03 * x + a13 * y + a23 * z + a[15]
	}
}

// from https://github.com/toji/gl-matrix
function transpose(out, a) {
	if (out === a) {
		var a01 = a[1], a02 = a[2], a03 = a[3],
			a12 = a[6], a13 = a[7], a23 = a[11]

		out[1] = a[4]
		out[2] = a[8]
		out[3] = a[12]
		out[4] = a01
		out[6] = a[9]
		out[7] = a[13]
		out[8] = a02
		out[9] = a12
		out[11] = a[14]
		out[12] = a03
		out[13] = a13
		out[14] = a23
	} else {
		out[0] = a[0]
		out[1] = a[4]
		out[2] = a[8]
		out[3] = a[12]
		out[4] = a[1]
		out[5] = a[5]
		out[6] = a[9]
		out[7] = a[13]
		out[8] = a[2]
		out[9] = a[6]
		out[10] = a[10]
		out[11] = a[14]
		out[12] = a[3]
		out[13] = a[7]
		out[14] = a[11]
		out[15] = a[15]
	}
}

function drawModel(mm, model, uniforms, color) {
	multiply(m, vm, mm)
	multiply(m, pm, m)

	// we need to invert and transpose the model matrix so the
	// normals are scaled correctly
	invert(nm, mm)
	transpose(nm, nm)

	gl.uniformMatrix4fv(uniforms.mvp, gl.FALSE, m)
	gl.uniformMatrix4fv(uniforms.nm, gl.FALSE, nm)
	gl.uniform4fv(uniforms.color, color)

	gl.drawElements(
		gl.TRIANGLES,
		model.numberOfVertices,
		gl.UNSIGNED_SHORT,
		0)
}

function bindModel(attribs, model) {
	gl.bindBuffer(gl.ARRAY_BUFFER, model.vertices)
	gl.vertexAttribPointer(attribs.vertex, 3, gl.FLOAT, gl.FALSE, 0, 0)
	gl.bindBuffer(gl.ARRAY_BUFFER, model.normals)
	gl.vertexAttribPointer(attribs.normal, 3, gl.FLOAT, gl.FALSE, 0, 0)
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, model.indicies)
}

function drawSea() {
	gl.useProgram(seaProgram)

	var uniforms = seaProgram.uniforms,
		attribs = seaProgram.attribs

	gl.uniform3fv(uniforms.light, lightDirection)
	gl.uniform4fv(uniforms.sky, skyColor)
	gl.uniform1f(uniforms.far, far)
	gl.uniform1f(uniforms.time, (now - first) / 500)

	var model = sea.model
	bindModel(attribs, model)
	drawModel(sea.matrix, model, uniforms, sea.color)
}

function drawGround(uniforms, attribs) {
	var model = ground.model
	bindModel(attribs, model)
	drawModel(ground.matrix, model, uniforms, ground.color)
}

function draw() {
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
	gl.useProgram(program)

	var uniforms = program.uniforms,
		attribs = program.attribs

	gl.uniform3fv(uniforms.light, lightDirection)
	gl.uniform4fv(uniforms.sky, skyColor)
	gl.uniform1f(uniforms.far, far)

	drawGround(uniforms, attribs)

	for (var model, i = entitiesLength; i--;) {
		var e = entities[i]
		if (model != e.model) {
			model = e.model
			bindModel(attribs, model)
		}
		drawModel(e.matrix, model, uniforms, e.color)
		if (e.update) {
			e.update()
		}
	}

	// draw transparent objects over opaque ones and from back to front
	drawSea()
}

function move(x, y, z) {
	translate(m, im, x, y, z)
	multiply(vm, m, vm)
}

function turn(rad, x, y, z) {
	rotate(m, im, rad, x, y, z)
	multiply(vm, m, vm)
}

function input() {
	if (keysDown[49]) {
		rotate(vm, im, M.PI2 * .7, 1, 0, 0)
		translate(vm, vm, 0, -30, -10)
	} else if (keysDown[50]) {
		rotate(vm, im, M.PI2 * .4, 1, 0, 0)
		translate(vm, vm, 0, -8, -10)
	}

	var s = .05
	if (keysDown[16]) {
		if (keysDown[87]) {
			move(0, -s, 0)
		} else if (keysDown[83]) {
			move(0, s, 0)
		}
	} else {
		if (keysDown[87]) {
			move(0, 0, s)
		} else if (keysDown[83]) {
			move(0, 0, -s)
		}
	}
	if (keysDown[65]) {
		move(s, 0, 0)
	} else if (keysDown[68]) {
		move(-s, 0, 0)
	}

	var a = .01
	if (keysDown[16]) {
		if (keysDown[37]) {
			turn(-a, 0, 0, 1)
		} else if (keysDown[39]) {
			turn(a, 0, 0, 1)
		}
	} else {
		if (keysDown[37]) {
			turn(-a, 0, 1, 0)
		} else if (keysDown[39]) {
			turn(a, 0, 1, 0)
		}
	}
	if (keysDown[38]) {
		turn(-a, 1, 0, 0)
	} else if (keysDown[40]) {
		turn(a, 1, 0, 0)
	}
}

function run() {
	requestAnimationFrame(run)

	now = Date.now()
	factor = (now - last) / 16
	last = now

	input()
	draw()
}

function setPointer(event, down) {
	if (!down) {
		pointersLength = event.touches ? event.touches.length : 0
	} else if (event.touches) {
		var touches = event.touches
		pointersLength = touches.length

		for (var i = pointersLength; i--;) {
			var t = touches[i]
			pointersX[i] = t.pageX
			pointersY[i] = t.pageY
		}
	} else {
		pointersLength = 1
		pointersX[0] = event.pageX
		pointersY[0] = event.pageY
	}

	if (down) {
		// map to WebGL coordinates
		var xf = 2 / width,
			yf = 2 / height

		for (var i = pointersLength; i--;) {
			pointersX[i] = pointersX[i] * xf - 1
			pointersY[i] = -(pointersY[i] * yf - 1)
		}
	}

	event.preventDefault()
}

function pointerUp(event) {
	setPointer(event, false)
}

function pointerMove(event) {
	setPointer(event, pointersLength)
}

function pointerDown(event) {
	setPointer(event, true)
}

function setKey(event, down) {
	keysDown[event.keyCode] = down
	event.preventDefault()
}

function keyUp(event) {
	setKey(event, false)
}

function keyDown(event) {
	setKey(event, true)
}

function resize() {
	width = gl.canvas.clientWidth
	height = gl.canvas.clientHeight

	gl.canvas.width = width
	gl.canvas.height = height
	gl.viewport(0, 0, width, height)

	var aspect = width / height,
		near = .1,
		r = near - far,
		f = 1 / M.tan(M.PI * .125)

	pm = new FA([
		f / aspect, 0, 0, 0,
		0, f, 0, 0,
		0, 0, (far + near) / r, -1,
		0, 0, (2 * far * near) / r, 0])

	invert(cm, vm)
}

function cacheUniformLocations(program, uniforms) {
	if (program.uniforms === undefined) {
		program.uniforms = {}
	}
	for (var i = 0, l = uniforms.length; i < l; ++i) {
		var name = uniforms[i]
		program.uniforms[name] = gl.getUniformLocation(program, name)
	}
}

function cacheAttribLocations(program, attribs) {
	if (program.attribs === undefined) {
		program.attribs = {}
	}
	for (var i = 0, l = attribs.length; i < l; ++i) {
		var name = attribs[i]
		program.attribs[name] = gl.getAttribLocation(program, name)
		gl.enableVertexAttribArray(program.attribs[name])
	}
}

function compileShader(src, type) {
	var shader = gl.createShader(type)

	gl.shaderSource(shader, src)
	gl.compileShader(shader)

	return gl.getShaderParameter(shader, gl.COMPILE_STATUS) ?
		shader :
		null
}

function linkProgram(vs, fs) {
	var p = gl.createProgram()
	if (p) {
		gl.attachShader(p, vs)
		gl.attachShader(p, fs)
		gl.linkProgram(p)

		if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
			gl.deleteProgram(p)
			p = null
		}
	}

	return p
}

function buildProgram(vertexSource, fragmentSource) {
	var p, vs, fs
	if ((vs = compileShader(vertexSource, gl.VERTEX_SHADER))) {
		if ((fs = compileShader(fragmentSource, gl.FRAGMENT_SHADER))) {
			p = linkProgram(vs, fs)
			gl.deleteShader(fs)
		}

		gl.deleteShader(vs)
	}

	return p
}

function calculateNormals(vertices, indicies) {
	var normals = []

	for (var i = 0, l = indicies.length; i < l;) {
		var a = indicies[i++] * 3,
			b = indicies[i++] * 3,
			c = indicies[i++] * 3,
			x1 = vertices[a],
			y1 = vertices[a + 1],
			z1 = vertices[a + 2],
			x2 = vertices[b],
			y2 = vertices[b + 1],
			z2 = vertices[b + 2],
			x3 = vertices[c],
			y3 = vertices[c + 1],
			z3 = vertices[c + 2],
			ux = x2 - x1,
			uy = y2 - y1,
			uz = z2 - z1,
			vx = x3 - x1,
			vy = y3 - y1,
			vz = z3 - z1,
			nx = uy * vz - uz * vy,
			ny = uz * vx - ux * vz,
			nz = ux * vy - uy * vx

		normals[a] = nx
		normals[a + 1] = ny
		normals[a + 2] = nz

		normals[b] = nx
		normals[b + 1] = ny
		normals[b + 2] = nz

		normals[c] = nx
		normals[c + 1] = ny
		normals[c + 2] = nz
	}

	return normals
}

function createModel(vertices, indicies) {
	var model = {numberOfVertices: indicies.length}

	model.vertices = gl.createBuffer()
	gl.bindBuffer(gl.ARRAY_BUFFER, model.vertices)
	gl.bufferData(gl.ARRAY_BUFFER,
		new FA(vertices),
		gl.STATIC_DRAW)

	model.normals = gl.createBuffer()
	gl.bindBuffer(gl.ARRAY_BUFFER, model.normals)
	gl.bufferData(gl.ARRAY_BUFFER,
		new FA(calculateNormals(vertices, indicies)),
		gl.STATIC_DRAW)

	model.indicies = gl.createBuffer()
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, model.indicies)
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,
		new Uint16Array(indicies),
		gl.STATIC_DRAW)

	return model
}

// from http://www.playfuljs.com/realistic-terrain-in-130-lines/
function createHeightMap(size, roughness) {
	var map = new FA(size * size),
		max = size - 1
	function offset(x, y) {
		return (size * y + x) | 0
	}
	function set(x, y, value) {
		if (x == max || y == max) {
			value = get(x % max, y % max)
		}
		map[offset(x, y)] = value
	}
	function get(x, y) {
		return map[offset(x % max, y % max)]
	}
	var v = M.random()
	set(0, 0, v)
	set(max, 0, v)
	set(max, max, v)
	set(0, max, v)
	function square(x, y, step, offset) {
		var average =
			get(x - step, y - step) +
			get(x + step, y - step) +
			get(x + step, y + step) +
			get(x - step, y + step)
		set(x, y, average / 4 + offset)
	}
	function diamond(x, y, step, offset) {
		var a = 0, i = 0
		if (x - step > -1) { a += get(x - step, y); ++i }
		if (y - step > -1) { a += get(x, y - step); ++i }
		if (x + step < size) { a += get(x + step, y); ++i }
		if (y + step < size) { a += get(x, y + step); ++i }
		set(x, y, a / i + offset)
	}
	for (var step = max;;) {
		var x, y, half = step >> 1,
			scale = roughness * (step / max)
		if (half < 1) {
			break
		}
		for (y = half; y < max; y += step) {
			for (x = half; x < max; x += step) {
				square(x, y, half, M.random() * scale * 2 - scale)
			}
		}
		for (y = 0; y <= max; y += half) {
			for (x = (y + half) % step; x <= max; x += step) {
				diamond(x, y, half, M.random() * scale * 2 - scale)
			}
		}
		step = half
	}
	return map
}

function createMap(power, roughness, amplification) {
	var vertices = [],
		indicies = [],
		size = Math.pow(2, power) + 1,
		radius = size >> 1

	if (roughness > 0) {
		var heightMap = createHeightMap(size, roughness)
		amplification = amplification || 8
		for (var i = 0, y = 0, z = -radius, half = amplification / 2;
				z <= radius; ++z) {
			for (var x = -radius; x <= radius; ++x) {
				vertices.push(x)
				vertices.push(y + heightMap[i++] * amplification - half)
				vertices.push(z)
			}
		}
	} else {
		for (var i = 0, y = 0, z = -radius; z <= radius; ++z) {
			for (var x = -radius; x <= radius; ++x) {
				vertices.push(x)
				vertices.push(y + (M.random() - .5) * .5)
				vertices.push(z)
			}
		}
	}

	for (var i = 0, z = -radius; z < radius; ++z) {
		for (var x = -radius; x < radius; ++x) {
			// counter-clockwise order
			indicies.push(i)
			indicies.push(i + size)
			indicies.push(i + 1)

			indicies.push(i + 1)
			indicies.push(i + size)
			indicies.push(i + size + 1)
			++i
		}
		++i
	}

	return createModel(vertices, indicies)
}

function createCube() {
	return createModel([
		// front
		-1, -1, 1,
		1, -1, 1,
		-1, 1, 1,
		1, 1, 1,
		// right
		1, -1, 1,
		1, -1, -1,
		1, 1, 1,
		1, 1, -1,
		// back
		1, -1, -1,
		-1, -1, -1,
		1, 1, -1,
		-1, 1, -1,
		// left
		-1, -1, -1,
		-1, -1, 1,
		-1, 1, -1,
		-1, 1, 1,
		// bottom
		-1, -1, -1,
		1, -1, -1,
		-1, -1, 1,
		1, -1, 1,
		// top
		-1, 1, 1,
		1, 1, 1,
		-1, 1, -1,
		1, 1, -1],[
		// front
		0, 1, 3,
		0, 3, 2,
		// right
		4, 5, 7,
		4, 7, 6,
		// back
		8, 9, 11,
		8, 11, 10,
		// left
		12, 13, 15,
		12, 15, 14,
		// bottom
		16, 17, 19,
		16, 19, 18,
		// top
		20, 21, 23,
		20, 23, 22])
}

function createPlane() {
	return createModel([
		-1, 1, 0,
		-1, -1, 0,
		1, 1, 0,
		1, -1, 0],[
		0, 2, 1,
		2, 3, 1])
}

function createObjects() {
	var colorWhite = [1, 1, 1, 1],
		//plane = createPlane(),
		cube = createCube()

	sea = {
		model: createMap(6),
		matrix: new FA(im),
		color: [.4, .7, .8, .3],
	}

	translate(m, im, 0, -16, 0)
	ground = {
		model: createMap(6, .6, 16),
		matrix: new FA(m),
		color: [.3, .2, .1, 1],
	}

	entities.push((player = {
		model: cube,
		matrix: new FA(im),
		color: colorWhite,
		update: function() {
			rotate(this.matrix, this.matrix, .001, 1, 1, 1)
		},
	}))

	rotate(vm, vm, M.PI2 * .7, 1, 0, 0)
	translate(vm, vm, 0, -30, -10)

	entitiesLength = entities.length
}

function getContext() {
	for (var canvas = D.getElementById('Canvas'),
			ctx,
			types = ['webgl', 'experimental-webgl'],
			l = types.length,
			i = 0; i < l; ++i) {
		if ((ctx = canvas.getContext(types[i], {alpha: false}))) {
			return ctx
		}
	}
}

function init() {
	if (!(gl = getContext())) {
		alert('WebGL not available')
		return
	}
	var fs = D.getElementById('FragmentShader').textContent
	if (!(program = buildProgram(
			D.getElementById('VertexShader').textContent,
			fs)) ||
		!(seaProgram = buildProgram(
			D.getElementById('SeaVertexShader').textContent,
			fs))) {
		alert('GLSL did not compile')
		return
	}

	createObjects()
	cacheAttribLocations(program, ['vertex', 'normal'])
	cacheUniformLocations(program, [
		'mvp',
		'nm',
		'light',
		'color',
		'sky',
		'far'])
	cacheAttribLocations(seaProgram, ['vertex', 'normal'])
	cacheUniformLocations(seaProgram, [
		'mvp',
		'nm',
		'light',
		'time',
		'color',
		'sky',
		'far'])

	gl.enable(gl.DEPTH_TEST)
	gl.enable(gl.BLEND)
	gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
	gl.clearColor(skyColor[0], skyColor[1], skyColor[2], skyColor[3])

	W.onresize = resize
	resize()

	D.onkeydown = keyDown
	D.onkeyup = keyUp

	D.onmousedown = pointerDown
	D.onmousemove = pointerMove
	D.onmouseup = pointerUp
	D.onmouseout = pointerUp

	if ('ontouchstart' in D) {
		D.ontouchstart = pointerDown
		D.ontouchmove = pointerMove
		D.ontouchend = pointerUp
		D.ontouchleave = pointerUp
		D.ontouchcancel = pointerUp
	}

	last = Date.now() - 16
	first = last
	run()
}

W.onload = init
