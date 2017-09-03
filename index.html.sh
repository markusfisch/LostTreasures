#!/usr/bin/env bash
squeeze() {
	while read -r
	do
		# skip comments
		REPLY=${REPLY%%//*}
		# skip indent
		REPLY=${REPLY##*$'\t'}
		# skip empty lines
		[ "$REPLY" ] || continue
		echo "$REPLY"
	done
}
cat << EOF
<!doctype html>
<html>
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width"/>
<title>js13k2016</title>
<style>
html, body {
margin: 0; padding: 0;
overflow: hidden;
}
canvas {
position: fixed;
width: 100%;
height: 100%;
}
</style>
</head>
<body>
<canvas id="Canvas">Sorry, this browser cannot render this content.</canvas>
<script id="VertexShader" type="x-shader/x-vertex">
$(squeeze < vs.glsl)
</script>
<script id="FragmentShader" type="x-shader/x-fragment">
$(squeeze < fs.glsl)
</script>
<script>
$(closurecompiler < src.js)
</script>
</body>
</html>
EOF
