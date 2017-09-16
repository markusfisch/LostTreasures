'use strict'

var M = Math,
	D = document,
	W = window,
	FA = Float32Array,
	text,
	gl,
	im = new FA([
		1, 0, 0, 0,
		0, 1, 0, 0,
		0, 0, 1, 0,
		0, 0, 0, 1]),
	pm,
	vm = new FA(im),
	cm = new FA(im),
	nm = new FA(16),
	mvp = new FA(im),
	m = new FA(16),
	far = 75,
	skyColor = [.43, .73, .96, 1],
	lightDirection = [.5, .5, 1],
	program,
	seaProgram,
	seaHalf,
	sea,
	floor,
	player,
	bubbleModel,
	bubbleLast,
	bubbleColor = [1, 1, 1, 1],
	bubblesLength = 0,
	bubbles = [],
	entitiesLength = 0,
	entities = [],
	coins,
	coinsFound = 0,
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

function dist(a, x, y, z) {
	var dx = a[12] - x,
		dy = a[13] - y,
		dz = a[14] - z
	return dx*dx + dy*dy + dz*dz
}

function drawModel(mm, model, uniforms, color) {
	multiply(mvp, vm, mm)
	multiply(mvp, pm, mvp)

	// we need to invert and transpose the model matrix so the
	// normals are scaled correctly
	invert(nm, mm)
	transpose(nm, nm)

	gl.uniformMatrix4fv(uniforms.mvp, gl.FALSE, mvp)
	gl.uniformMatrix4fv(uniforms.nm, gl.FALSE, nm)
	gl.uniform4fv(uniforms.color, color)

	gl.drawElements(gl.TRIANGLES, model.count, gl.UNSIGNED_SHORT, 0)
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
	gl.uniform1f(uniforms.radius, seaHalf)

	var model = sea.model
	bindModel(attribs, model)
	drawModel(sea.matrix, model, uniforms, sea.color)
}

function drawBubbles(uniforms, attribs) {
	bindModel(attribs, bubbleModel)
	for (var i = bubblesLength; i--;) {
		var bm = bubbles[i]
		if (bm[13] > -.5) {
			continue
		}
		bm[13] -= -.2
		drawModel(bm, bubbleModel, uniforms, bubbleColor)
	}
}

function drawPlayer(uniforms, attribs) {
	// render player with separate matrix because the
	// view matrix is generated from the player matrix
	translate(m, player.matrix, 0, player.depth, 0)
	rotate(m, m, player.tilt +
		M.sin(player.roll += .1 * factor) *
		(.05 - player.v / (player.maxSpeed * 10)), .2, .2, 1)

	var model = player.model
	bindModel(attribs, model)
	drawModel(m, model, uniforms, player.color)

	if (player.v != 0) {
		rotate(m, m, now * .005, 0, 0, 1)
	}
	model = player.prop
	bindModel(attribs, model)
	drawModel(m, model, uniforms, player.color)
}

function drawFloor(uniforms, attribs) {
	var model = floor.model,
		matrix = floor.matrix
	bindModel(attribs, model)
	drawModel(matrix, model, uniforms, floor.color)
}

function draw() {
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
	gl.useProgram(program)

	var uniforms = program.uniforms,
		attribs = program.attribs

	gl.uniform3fv(uniforms.light, lightDirection)
	gl.uniform4fv(uniforms.sky, skyColor)
	gl.uniform1f(uniforms.far, far)

	drawFloor(uniforms, attribs)

	var pm = player.matrix,
		px = pm[12],
		py = player.depth,
		pz = pm[14]

	for (var model, i = entitiesLength; i--;) {
		var e = entities[i]
		if (e.found) {
			continue
		}
		var em = e.matrix
		if (e.isTreasure && dist(em, px, py, pz) < 8) {
			e.found = true
			if (++coinsFound == coins) {
				text.innerHTML = 'You found all coins!<br/>' +
					'<a href="javascript:newGame()">Play again?</a>'
			} else {
				text.innerText = 'Found a coin! ' +
					(coins - coinsFound) + ' left ...'
			}
			continue
		}
		if (model != e.model) {
			model = e.model
			bindModel(attribs, model)
		}
		drawModel(em, model, uniforms, e.color)
		if (e.update) {
			e.update()
		}
	}

	drawPlayer(uniforms, attribs)
	drawBubbles(uniforms, attribs)
	// draw transparent objects over opaque ones and from back to front
	drawSea()
}

function updateView(p) {
	invert(vm, p)
	translate(m, im, 0, 6, -30)
	multiply(vm, m, vm)
}

function getFloorOffset(x, z) {
	var fm = floor.model,
		size = fm.size
	x = ((x + floor.radius) / floor.mag) | 0
	z = ((z + floor.radius) / floor.mag) | 0
	if (x < 0 || x > size || z < 0 || z > size) {
		return -1
	}
	return (M.abs(z * size + x) | 0) % fm.heightMap.length
}

function addToFloor(x, z, h) {
	var offset = getFloorOffset(x, z)
	floor.model.heightMap[offset] += h
}

function getFloorHeight(x, z) {
	var offset = getFloorOffset(x, z)
	return offset < 0 ? 0 : floor.model.heightMap[offset]
}

function alignSea(x, z) {
	var sm = sea.matrix,
		ss = sea.mag,
		sr = sea.radius,
		sx = M.round(x / sr) * sr,
		sz = M.round(z / sr) * sr
	translate(sm, im, sx, 0, sz)
	scale(sm, sm, ss, 1, ss)
}

function move(p, step) {
	translate(p, p, 0, 0, step)
	var fr = floor.radius,
		x = p[12],
		z = p[14]
	if (x < -fr || x > fr || z < -fr || z > fr) {
		if (!text.warning) {
			text.innerHTML =
				'<span class="Warning">You left the dive area!<span>'
			text.warning = true
		}
	} else if (text.warning) {
		text.innerText = ''
		text.warning = false
	}
	alignSea(x, z)
}

function turn(p, rad) {
	rotate(p, p, rad, 0, 1, 0)
	player.tilt += rad * 4
}

function addBubble(x, y, z) {
	for (var i = bubblesLength; i--;) {
		var bm = bubbles[i]
		if (bm[13] > -.5) {
			translate(bm, im,
				x + (M.random() * 2 - 1),
				y,
				z + (M.random() * 2 - 1))
			break
		}
	}
}

function input() {
	if (keysDown[82]) {
		W.location.reload(true)
	}

	var p = player.matrix,
		s = player.maxSpeed,
		a = player.maxTurn

	if (player.v != 0) {
		move(p, -player.v)
		player.v *= .94
		if (M.abs(player.v) < .01) {
			player.v = 0
		}
	}
	if (player.tilt != 0) {
		player.tilt *= .75
		if (M.abs(player.tilt) < .01) {
			player.tilt = 0
		}
	}

	var forward = false,
		backward = false,
		left = false,
		right = false,
		dive = false

	if (pointersLength > 0) {
		for (var i = pointersLength; i--;) {
			var px = pointersX[i],
				py = pointersY[i]

			if (px < -.5) {
				left = true
			} else if (px > .5) {
				right = true
			}

			if (py < -.5) {
				forward = true
			} else if (py > .5) {
				backward = true
			}

			if (px > -.5 && px < .5 && py > -.5 && py < .5) {
				dive = true
			}
		}
	} else {
		forward = keysDown[87] || keysDown[38] || keysDown[75],
		backward = keysDown[83] || keysDown[40] || keysDown[74],
		left = keysDown[65] || keysDown[37] || keysDown[72],
		right = keysDown[68] || keysDown[39] || keysDown[76],
		dive = keysDown[32]
	}

	if (left) {
		turn(p, a)
	} else if (right) {
		turn(p, -a)
	} else {
		s *= 1.5
	}

	if (backward) {
		player.v = -s / 2
	} else if (forward || left || right) {
		player.v = s
	}

	var px = p[12],
		pz = p[14],
		h = getFloorHeight(px, pz),
		d = player.depth - 2
	if (dive && h < d) {
		player.depth -= .05
		if (player.depth < -1 && now - bubbleLast > 32) {
			addBubble(px, player.depth, pz)
			bubbleLast = now
		}
	} else if (!dive || h - 2 > d) {
		player.depth *= .98
		if (M.abs(player.depth) < .5) {
			player.depth = -.5
		}
	}

	updateView(p)
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
	event.stopPropagation()
	event.cancelBubble = true
	event.returnValue = false
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

function setProjectionMatrix() {
	var aspect = width / height,
		near = .1,
		r = near - far,
		f = 1 / M.tan(M.PI * .125)

	pm = new FA([
		f / aspect, 0, 0, 0,
		0, f, 0, 0,
		0, 0, (far + near) / r, -1,
		0, 0, (2 * far * near) / r, 0])
}

function resize() {
	width = gl.canvas.clientWidth
	height = gl.canvas.clientHeight

	gl.canvas.width = width
	gl.canvas.height = height
	gl.viewport(0, 0, width, height)

	setProjectionMatrix()
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
	return gl.getShaderParameter(shader, gl.COMPILE_STATUS) ? shader : null
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
	var model = {count: indicies.length}

	model.vertices = gl.createBuffer()
	gl.bindBuffer(gl.ARRAY_BUFFER, model.vertices)
	gl.bufferData(gl.ARRAY_BUFFER, new FA(vertices), gl.STATIC_DRAW)

	model.normals = gl.createBuffer()
	gl.bindBuffer(gl.ARRAY_BUFFER, model.normals)
	gl.bufferData(gl.ARRAY_BUFFER,
		new FA(calculateNormals(vertices, indicies)),
		gl.STATIC_DRAW)

	model.indicies = gl.createBuffer()
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, model.indicies)
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indicies),
		gl.STATIC_DRAW)

	return model
}

function calculateMapIndicies(size) {
	var indicies = []
	for (var i = 0, z = 1; z < size; ++z) {
		for (var x = 1; x < size; ++x) {
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
	return indicies
}

function expandToHorizon(vertices, offset, lower) {
	for (var i = 0, l = vertices.length; i < l; ++i) {
		if (vertices[i] == -offset) {
			vertices[i] = -1000
		} else if (vertices[i] == offset) {
			vertices[i] = 1000
		} else {
			continue
		}
		if (!lower) {
			continue
		} else if (i % 3 == 0) {
			vertices[i + 1] = -1000
		} else if (i % 3 == 2) {
			vertices[i - 1] = -1000
		}
	}
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
		var x, y, half = step >> 1, scale = roughness * step / max
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

function createSeaModel(power) {
	var vertices = [],
		size = M.pow(2, power) + 1,
		mapSize = 2 * size - 1,
		offset = mapSize >> 1,
		z = 0

	for (var i = 1, base = 4, untilLast = size - 1;
			z < untilLast; ++z, i += mapSize * 3) {
		for (var x = 0; x < untilLast; ++x) {
			vertices.push(x - offset)
			vertices.push(M.random() * .5 - .5)
			vertices.push(z - offset)
		}
		// copy first column to make it seamless
		vertices.push(x - offset)
		vertices.push(vertices[i])
		vertices.push(z - offset)
		// copy terrain into second column to form a 2x2 map
		for (var x = 1, last = size - 1; x < size; ++x) {
			vertices.push(last + x - offset)
			vertices.push(vertices[base])
			vertices.push(z - offset)
			base += 3
		}
		base += size * 3
	}

	// copy first row to make it seamless
	for (var i = 1, x = 0; x < mapSize; ++x, i += 3) {
		vertices.push(x - offset)
		vertices.push(vertices[i])
		vertices.push(z - offset)
	}

	// and copy all of the above for the second row
	for (var base = (mapSize * 3) + 1, untilLast = size - 1,
			z = 0; z < untilLast; ++z) {
		for (var x = 0; x < mapSize; ++x) {
			vertices.push(x - offset)
			vertices.push(vertices[base])
			vertices.push(size + z - offset)
			base += 3
		}
	}

	expandToHorizon(vertices, offset)

	var model = createModel(vertices, calculateMapIndicies(mapSize))
	model.radius = offset
	seaHalf = offset
	return model
}

function createFloorModel(power, roughness, amplification) {
	var vertices = [],
		size = M.pow(2, power) + 1,
		offset = size >> 1,
		max = .5

	var heightMap = createHeightMap(size, roughness)
	for (var i = 0, z = 0; z < size; ++z) {
		for (var x = 0; x < size; ++x) {
			var h = heightMap[i++] * amplification
			max = M.max(max, h)
			vertices.push(x - offset)
			vertices.push(h)
			vertices.push(z - offset)
		}
	}

	expandToHorizon(vertices, offset, true)

	var model = createModel(vertices, calculateMapIndicies(size))
	model.heightMap = heightMap
	model.size = size
	model.radius = offset
	model.max = max
	return model
}

function mirrorModel(vertices, indicies) {
	var verticesLength = vertices.length,
		lastVertice = verticesLength / 3,
		firstNewIndex = indicies.length
	for (var i = 0; i < firstNewIndex; i += 3) {
		indicies.push(lastVertice + indicies[i + 2])
		indicies.push(lastVertice + indicies[i + 1])
		indicies.push(lastVertice + indicies[i])
	}
	var indiciesLength = indicies.length
	for (var i = 0; i < verticesLength;) {
		var x = vertices[i++],
			y = vertices[i++],
			z = vertices[i++]
		// don't copy vertices at axis of reflection to avoid
		// extra normals there
		if (x == 0) {
			var replacement = (i - 3) / 3 | 0,
				needle = lastVertice + replacement
			for (var j = firstNewIndex; j < indiciesLength; ++j) {
				var idx = indicies[j]
				if (idx > needle) {
					--indicies[j]
				} else if (idx == needle) {
					indicies[j] = replacement
				}
			}
			--lastVertice
		} else {
			vertices.push(-x)
			vertices.push(y)
			vertices.push(z)
		}
	}
}

function createBubbleModel() {
	var vertices = [
		0, 0.080, -0.080,
		0, 0, -0.113,
		0, -0.080, -0.080,
		0.069, 0.080, -0.040,
		0.098, 0, -0.056,
		0.069, -0.080, -0.040,
		0.069, 0.080, 0.040,
		0.098, 0, 0.056,
		0.069, -0.080, 0.040,
		0, 0.080, 0.080,
		0, 0, 0.113,
		0, -0.080, 0.080,
		0, 0.113, 0,
		0, -0.113, 0,
	], indicies = [
		13, 2, 5,
		1, 0, 3,
		2, 1, 4,
		0, 12, 3,
		13, 5, 8,
		4, 3, 6,
		5, 4, 7,
		3, 12, 6,
		13, 8, 11,
		7, 6, 9,
		8, 7, 10,
		6, 12, 9,
	]

	mirrorModel(vertices, indicies)
	return createModel(vertices, indicies)
}

function createPropModel() {
	var vertices = [
		0, 0.536, 3.083,
		-0.464, 0.268, 3.083,
		-0.536, 0.0, 3.083,
		-0.268, -0.464, 3.083,
		0.0, -0.536, 3.083,
		0.464, -0.268, 3.083,
		0.536, 0, 3.083,
		0.268, 0.464, 3.083,
		0, 0, 3.083,
	], indicies = [
		1, 2, 8,
		3, 4, 8,
		6, 8, 5,
		7, 0, 8,
	]

	return createModel(vertices, indicies)
}

function createBoatModel() {
	var vertices = [
		0.200, -0.380, -2.459,
		0.200, 0, -2.565,
		0.470, -0.268, -2.459,
		0.700, -0.496, -2.217,
		0.853, -0.649, -1.202,
		0.907, -0.702, -0.005,
		0.853, -0.649, 1.192,
		0.700, -0.496, 2.207,
		0.470, -0.268, 2.885,
		0.582, 0, -2.459,
		0.907, 0, -2.217,
		1.123, 0, -1.202,
		1.200, 0, -0.005,
		1.123, 0, 1.192,
		0.907, 0, 2.207,
		0.582, 0, 2.885,
		0.470, 0.268, -2.459,
		0.700, 0.496, -2.217,
		0.853, 0.649, -1.202,
		0.907, 0.702, -0.005,
		0.853, 0.649, 1.192,
		0.700, 0.496, 2.207,
		0.470, 0.268, 2.885,
		0.200, 0, 3.076,
		0.200, 0.380, -2.459,
		0.200, 0.702, -2.217,
		0.391, 0.918, -1.202,
		0.391, 0.993, 0.277,
		0.200, 0.918, 1.192,
		0.200, 0.702, 2.207,
		0.200, 0.380, 2.885,
		0.200, -0.702, -2.217,
		0.200, -0.918, -1.202,
		0.200, -0.993, -0.005,
		0.200, -0.918, 1.192,
		0.200, -0.702, 2.207,
		0.200, -0.380, 2.885,
		0, -0.380, -2.459,
		0, 0, -2.565,
		0, 0, 3.076,
		0, 0.380, -2.459,
		0, 0.702, -2.217,
		0, 0.918, -1.202,
		0, 0.993, 0.277,
		0, 0.918, 1.192,
		0, 0.702, 2.207,
		0, 0.380, 2.885,
		0, -0.702, -2.217,
		0, -0.918, -1.202,
		0, -0.993, -0.005,
		0, -0.918, 1.192,
		0, -0.702, 2.207,
		0, -0.380, 2.885,
		0.279, 1.761, -1.202,
		0.279, 1.761, -0.005,
		0, 1.761, -1.202,
		0, 1.761, -0.005,
		0.122, 1.919, -1.039,
		0.122, 1.919, -0.477,
		0, 1.919, -1.039,
		0, 1.919, -0.477,
	], indicies = [
		23, 36, 8,
		35, 6, 7,
		32, 5, 33,
		0, 3, 31,
		36, 7, 8,
		34, 5, 6,
		31, 4, 32,
		0, 1, 2,
		8, 14, 15,
		6, 12, 13,
		3, 11, 4,
		2, 1, 9,
		23, 8, 15,
		7, 13, 14,
		4, 12, 5,
		2, 10, 3,
		12, 20, 13,
		11, 17, 18,
		9, 1, 16,
		23, 15, 22,
		13, 21, 14,
		12, 18, 19,
		10, 16, 17,
		14, 22, 15,
		23, 22, 30,
		20, 29, 21,
		19, 26, 27,
		17, 24, 25,
		21, 30, 22,
		20, 27, 28,
		18, 25, 26,
		16, 1, 24,
		23, 52, 36,
		32, 47, 31,
		33, 48, 32,
		24, 41, 25,
		34, 49, 33,
		25, 42, 26,
		34, 51, 50,
		1, 40, 24,
		43, 54, 56,
		36, 51, 35,
		23, 46, 39,
		28, 43, 44,
		0, 38, 1,
		28, 45, 29,
		31, 37, 0,
		29, 46, 30,
		56, 58, 60,
		27, 53, 54,
		42, 53, 26,
		57, 60, 58,
		55, 57, 53,
		53, 58, 54,
		35, 34, 6,
		32, 4, 5,
		0, 2, 3,
		36, 35, 7,
		34, 33, 5,
		31, 3, 4,
		8, 7, 14,
		6, 5, 12,
		3, 10, 11,
		7, 6, 13,
		4, 11, 12,
		2, 9, 10,
		12, 19, 20,
		11, 10, 17,
		13, 20, 21,
		12, 11, 18,
		10, 9, 16,
		14, 21, 22,
		20, 28, 29,
		19, 18, 26,
		17, 16, 24,
		21, 29, 30,
		20, 19, 27,
		18, 17, 25,
		23, 39, 52,
		32, 48, 47,
		33, 49, 48,
		24, 40, 41,
		34, 50, 49,
		25, 41, 42,
		34, 35, 51,
		1, 38, 40,
		43, 27, 54,
		36, 52, 51,
		23, 30, 46,
		28, 27, 43,
		0, 37, 38,
		28, 44, 45,
		31, 47, 37,
		29, 45, 46,
		56, 54, 58,
		27, 26, 53,
		42, 55, 53,
		57, 59, 60,
		55, 59, 57,
		53, 57, 58,
	]

	mirrorModel(vertices, indicies)
	return createModel(vertices, indicies)
}

function createCoinModel() {
	var vertices = [
		0, 0.063, -0.637,
		0.588, -0.063, -0.243,
		0.637, -0.063, 0.0,
		0.588, -0.063, 0.243,
		0.450, -0.063, 0.450,
		0.243, -0.063, 0.588,
		0, -0.063, 0.637,
		0, -0.063, -0.637,
		0, 0.063, 0.637,
		0.243, 0.063, 0.588,
		0.450, 0.063, 0.450,
		0.588, 0.063, 0.243,
		0.637, 0.063, 0,
		0.588, 0.063, -0.243,
		0.450, 0.063, -0.450,
		0.243, 0.063, -0.588,
		0.450, -0.063, -0.450,
		0.243, -0.063, -0.588,
	], indicies = [
		14, 17, 15,
		12, 1, 13,
		10, 3, 11,
		8, 5, 9,
		15, 7, 0,
		13, 16, 14,
		11, 2, 12,
		9, 4, 10,
		10, 14, 8,
		17, 4, 5,
		14, 16, 17,
		12, 2, 1,
		10, 4, 3,
		8, 6, 5,
		15, 17, 7,
		13, 1, 16,
		11, 3, 2,
		9, 5, 4,
		8, 9, 10,
		10, 11, 12,
		12, 13, 14,
		14, 15, 0,
		0, 8, 14,
		10, 12, 14,
		6, 7, 17,
		17, 16, 1,
		1, 2, 3,
		3, 4, 17,
		5, 6, 17,
		17, 1, 3,
	]

	mirrorModel(vertices, indicies)
	return createModel(vertices, indicies)
}

function createPyramidModel() {
	// will have shared normals!
	return createModel([
		// tip
		0, 1, 0,
		// bottom
		-1, -1, -1,
		1, -1, -1,
		-1, -1, 1,
		1, -1, 1],[
		// front
		0, 3, 4,
		// right
		0, 4, 2,
		// back
		0, 1, 2,
		// left
		0, 3, 1,
		// bottom
		1, 3, 2,
		2, 3, 4])
}

function createBubbles() {
	bubbleLast = 0
	bubbleModel = createBubbleModel()
	bubblesLength = 32
	for (var i = bubblesLength; i--;) {
		bubbles[i] = new FA(im)
	}
}

function createPlayer() {
	player = {
		model: createBoatModel(),
		prop: createPropModel(),
		matrix: new FA(im),
		color: [1, 1, 1, 1],
		roll: 0,
		v: 0,
		depth: 0,
		tilt: 0,
		maxSpeed: .15,
		maxTurn: .01
	}
}

function createEntities() {
	var pyramids = [[-10, -40, 9], [-15, -25, 5]]
	for (var i in pyramids) {
		var x = pyramids[i][0],
			z = pyramids[i][1],
			s = pyramids[i][2],
			h = s * .66
		translate(m, im, x, getFloorHeight(x, z), z)
		scale(m, m, s, h, s)
		addToFloor(x, z, h)
		entities.push({
			model: createPyramidModel(),
			matrix: new FA(m),
			color: [.3, .2, .1, 1]
		})
	}

	var coinModel = createCoinModel(),
		coinColor = [1, .6, .1, 1],
		fs = floor.model.size * floor.mag * .35,
		r = fs * .5
	for (var i = 0; i < coins; ++i) {
		var x = -r + M.random() * fs,
			z = -r + M.random() * fs,
			y = getFloorHeight(x, z) + 2
		translate(m, im, x, y, z)
		rotate(m, m, M.random() * M.TAU, 1, 1, 1)
		entities.push({
			model: coinModel,
			matrix: new FA(m),
			color: coinColor,
			found: false,
			isTreasure: true,
			update: function() {
				rotate(this.matrix, this.matrix, .01, 1, 1, 1)
			}
		})
	}

	entitiesLength = entities.length
}

function createSea() {
	var model = createSeaModel(6), mag = 1.75
	sea = {
		model: model,
		matrix: new FA(im),
		color: [.4, .7, .8, .3],
		radius: model.radius * mag,
		mag: mag
	}
	alignSea(0, 0)
}

function createFloor(mag) {
	var amp = 14,
		model = createFloorModel(5, .6, amp),
		hm = model.heightMap,
		base = -(10 + model.max)
	for (var i = hm.length; i--;) {
		hm[i] = base + hm[i] * amp
	}
	translate(m, im, 0, base, 0)
	scale(m, m, mag, 1, mag)
	floor = {
		model: model,
		matrix: new FA(m),
		color: [.3, .2, .1, 1],
		radius: model.radius * mag,
		mag: mag,
		amp: amp,
		base: base
	}
}

function newGame() {
	coins = 1 + ((M.random() * 9) | 0)
	coinsFound = 0

	text.innerText = 'Find ' + coins + ' lost coins!'
	text.warning = true

	createFloor(11)
	createEntities()
	createBubbles()

	translate(m, im, 0, -.5, 0)
	player.matrix = new FA(m)
	player.roll = 0
	player.v = 0
	player.depth = 0
	player.tilt = 0

	updateView(player.matrix)
}

function cacheLocations() {
	var attribs = ['vertex', 'normal'],
		uniforms = ['mvp', 'nm', 'light', 'color', 'sky', 'far']

	cacheAttribLocations(program, attribs)
	cacheUniformLocations(program, uniforms)

	cacheAttribLocations(seaProgram, attribs)
	uniforms.push('time')
	uniforms.push('radius')
	cacheUniformLocations(seaProgram, uniforms)
}

function createPrograms() {
	var fs = D.getElementById('FragmentShader').textContent
	return (program = buildProgram(
			D.getElementById('VertexShader').textContent,
			fs)) &&
		(seaProgram = buildProgram(
			D.getElementById('SeaVertexShader').textContent,
			fs))
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
	if (!(text = D.getElementById('Text')) || !(gl = getContext()) ||
			!createPrograms()) {
		alert('WebGL not available')
		return
	}

	cacheLocations()
	createSea()
	createPlayer()
	newGame()

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
