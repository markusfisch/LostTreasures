'use strict'

var M = Math,
	D = document,
	W = window,
	FA = Float32Array,
	text,
	gl,
	idMat = new FA([
		1, 0, 0, 0,
		0, 1, 0, 0,
		0, 0, 1, 0,
		0, 0, 0, 1]),
	projMat = new FA(idMat),
	controlsProjMat,
	viewMat = new FA(idMat),
	modelViewMat = new FA(16),
	tmpMat = new FA(16),
	horizon = 75,
	staticLightViewMat = new FA(16),
	lightProjMat = new FA(idMat),
	lightViewMat = new FA(idMat),
	lightDirection = [0, 0, 0],
	skyColor = [.43, .73, .96, 1],
	shadowFramebuffer,
	shadowDepthTextureSize = 512,
	shadowDepthTexture,
	shadowProgram,
	program,
	seaProgram,
	controlsProgram,
	seaHalf,
	sea,
	floor,
	player,
	bindModel,
	setModel,
	drawModel,
	showTouchControls = false,
	touchStick,
	diveButton,
	bubbleModel,
	bubbleLast,
	bubbleColor = [1, 1, 1, .3],
	bubblesLength = 0,
	bubbles = [],
	entitiesLength = 0,
	entities = [],
	coins,
	coinsFound = 0,
	width,
	height,
	ymax,
	widthToGl,
	heightToGl,
	now,
	factor,
	last,
	first,
	pointersLength,
	pointersX = [],
	pointersY = [],
	pointersId = [],
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

function setOrthogonal(out, l, r, b, t, near, far) {
	var lr = 1 / (l - r),
		bt = 1 / (b - t),
		nf = 1 / (near - far)
	out[0] = -2 * lr
	out[1] = 0
	out[2] = 0
	out[3] = 0
	out[4] = 0
	out[5] = -2 * bt
	out[6] = 0
	out[7] = 0
	out[8] = 0
	out[9] = 0
	out[10] = 2 * nf
	out[11] = 0
	out[12] = (l + r) * lr
	out[13] = (t + b) * bt
	out[14] = (far + near) * nf
	out[15] = 1
}

function setPerspective(out, fov, aspect, near, far) {
	var f = 1 / M.tan(fov),
		d = near - far
	out[0] = f / aspect
	out[1] = 0
	out[2] = 0
	out[3] = 0
	out[4] = 0
	out[5] = f
	out[6] = 0
	out[7] = 0
	out[8] = 0
	out[9] = 0
	out[10] = (far + near) / d
	out[11] = -1
	out[12] = 0
	out[13] = 0
	out[14] = (2 * far * near) / d
	out[15] = 0
}

function dist(a, x, y, z) {
	var dx = a[12] - x,
		dy = a[13] - y,
		dz = a[14] - z
	return dx*dx + dy*dy + dz*dz
}

function drawCameraModel(count, uniforms, color) {
	gl.uniform4fv(uniforms.color, color)
	gl.drawElements(gl.TRIANGLES, count, gl.UNSIGNED_SHORT, 0)
}

function drawShadowModel(count) {
	gl.drawElements(gl.TRIANGLES, count, gl.UNSIGNED_SHORT, 0)
}

function setCameraModel(uniforms, mm) {
	multiply(modelViewMat, lightViewMat, mm)
	gl.uniformMatrix4fv(uniforms.lightModelViewMat, false, modelViewMat)
	multiply(modelViewMat, viewMat, mm)
	gl.uniformMatrix4fv(uniforms.modelViewMat, false, modelViewMat)
	// the model matrix needs to be inverted and transposed to
	// scale the normals correctly
	invert(modelViewMat, mm)
	transpose(modelViewMat, modelViewMat)
	gl.uniformMatrix4fv(uniforms.normalMat, false, modelViewMat)
}

function setShadowModel(uniforms, mm) {
	multiply(modelViewMat, lightViewMat, mm)
	gl.uniformMatrix4fv(uniforms.lightModelViewMat, false, modelViewMat)
}

function bindCameraModel(attribs, model) {
	gl.bindBuffer(gl.ARRAY_BUFFER, model.vertices)
	gl.vertexAttribPointer(attribs.vertex, 3, gl.FLOAT, false, 0, 0)
	gl.bindBuffer(gl.ARRAY_BUFFER, model.normals)
	gl.vertexAttribPointer(attribs.normal, 3, gl.FLOAT, false, 0, 0)
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, model.indicies)
}

function bindShadowModel(attribs, model) {
	gl.bindBuffer(gl.ARRAY_BUFFER, model.vertices)
	gl.vertexAttribPointer(attribs.vertex, 3, gl.FLOAT, false, 0, 0)
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, model.indicies)
}

function drawTouchControls() {
	var uniforms = controlsProgram.uniforms,
		attribs = controlsProgram.attribs

	gl.useProgram(controlsProgram)
	gl.uniformMatrix4fv(uniforms.projMat, false, controlsProjMat)

	gl.enableVertexAttribArray(attribs.vertex)
	bindModel = bindShadowModel

	var model = touchStick.model
	bindModel(attribs, model)
	translate(tmpMat, touchStick.matrix, touchStick.dx, touchStick.dy, 0)
	gl.uniformMatrix4fv(uniforms.modelViewMat, false, tmpMat)
	drawCameraModel(model.count, uniforms, touchStick.color)

	var model = diveButton.model
	bindModel(attribs, model)
	var s = diveButton.scale
	scale(tmpMat, diveButton.matrix, s, s, s)
	gl.uniformMatrix4fv(uniforms.modelViewMat, false, tmpMat)
	drawCameraModel(model.count, uniforms, diveButton.color)

	gl.disableVertexAttribArray(attribs.vertex)
}

function drawSea() {
	var uniforms = seaProgram.uniforms,
		attribs = seaProgram.attribs

	gl.useProgram(seaProgram)
	gl.uniformMatrix4fv(uniforms.projMat, false, projMat)
	gl.uniform3fv(uniforms.lightDirection, lightDirection)
	gl.uniform4fv(uniforms.sky, skyColor)
	gl.uniform1f(uniforms.far, horizon)
	gl.uniform1f(uniforms.time, (now - first) / 500)
	gl.uniform1f(uniforms.radius, seaHalf)

	var model = sea.model
	bindModel(attribs, model)

	var mm = sea.matrix
	multiply(modelViewMat, viewMat, mm)
	gl.uniformMatrix4fv(uniforms.modelViewMat, false, modelViewMat)
	// the model matrix needs to be inverted and transposed to
	// scale the normals correctly
	invert(modelViewMat, mm)
	transpose(modelViewMat, modelViewMat)
	gl.uniformMatrix4fv(uniforms.normalMat, false, modelViewMat)

	drawModel(model.count, uniforms, sea.color)
}

function drawBubbles(uniforms, attribs) {
	bindModel(attribs, bubbleModel)
	for (var i = bubblesLength; i--;) {
		var bm = bubbles[i]
		if (bm[13] > -.5) {
			continue
		}
		bm[13] -= -.02
		setModel(uniforms, bm)
		drawModel(bubbleModel.count, uniforms, bubbleColor)
	}
}

function drawPlayer(uniforms, attribs) {
	var model = player.model,
		color = player.color

	bindModel(attribs, model)
	setModel(uniforms, player.boatMat)
	drawModel(model.count, uniforms, color)

	model = player.prop

	bindModel(attribs, model)
	setModel(uniforms, player.propMat)
	drawModel(model.count, uniforms, color)
}

function drawEntities(uniforms, attribs) {
	for (var model, i = entitiesLength; i--;) {
		var e = entities[i]
		if (e.found) {
			continue
		}
		if (model != e.model) {
			model = e.model
			bindModel(attribs, model)
		}
		setModel(uniforms, e.matrix)
		drawModel(model.count, uniforms, e.color)
	}
}

function drawFloor(uniforms, attribs) {
	var model = floor.model
	bindModel(attribs, model)
	setModel(uniforms, floor.matrix)
	drawModel(model.count, uniforms, floor.color)
}

function drawCameraView() {
	var uniforms = program.uniforms,
		attribs = program.attribs

	gl.useProgram(program)
	gl.bindFramebuffer(gl.FRAMEBUFFER, null)
	gl.viewport(0, 0, width, height)
	gl.clearColor(skyColor[0], skyColor[1], skyColor[2], skyColor[3])
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

	gl.uniformMatrix4fv(uniforms.projMat, false, projMat)
	gl.uniformMatrix4fv(uniforms.lightProjMat, false, lightProjMat)
	gl.uniform3fv(uniforms.lightDirection, lightDirection)
	gl.uniform4fv(uniforms.sky, skyColor)
	gl.uniform1f(uniforms.far, horizon)

	gl.activeTexture(gl.TEXTURE0)
	gl.bindTexture(gl.TEXTURE_2D, shadowDepthTexture)
	gl.uniform1i(uniforms.shadowDepthTexture, 0)

	gl.enableVertexAttribArray(attribs.vertex)
	gl.enableVertexAttribArray(attribs.normal)
	bindModel = bindCameraModel
	setModel = setCameraModel
	drawModel = drawCameraModel

	drawFloor(uniforms, attribs)
	drawEntities(uniforms, attribs)
	drawPlayer(uniforms, attribs)
	drawBubbles(uniforms, attribs)

	// draw transparent objects over opaque ones and from back to front
	drawSea()

	gl.disableVertexAttribArray(attribs.vertex)
	gl.disableVertexAttribArray(attribs.normal)

	showTouchControls && drawTouchControls()
}

function drawShadowMap() {
	var attribs = shadowProgram.attribs,
		uniforms = shadowProgram.uniforms

	gl.useProgram(shadowProgram)
	gl.bindFramebuffer(gl.FRAMEBUFFER, shadowFramebuffer)
	gl.viewport(0, 0, shadowDepthTextureSize, shadowDepthTextureSize)
	gl.clearColor(0, 0, 0, 1)
	gl.clearDepth(1)
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

	gl.uniformMatrix4fv(uniforms.lightProjMat, false, lightProjMat)

	gl.enableVertexAttribArray(attribs.vertex)
	bindModel = bindShadowModel
	setModel = setShadowModel
	drawModel = drawShadowModel
	drawFloor(uniforms, attribs)
	drawEntities(uniforms, attribs)
	drawPlayer(uniforms, attribs)
	drawBubbles(uniforms, attribs)
	gl.disableVertexAttribArray(attribs.vertex)
}

function draw() {
	drawShadowMap()
	drawCameraView()
}

function updateLightView(x, z) {
	translate(lightViewMat, staticLightViewMat, -x, 0, -z)
	lightDirection[0] = lightViewMat[2]
	lightDirection[1] = lightViewMat[6]
	lightDirection[2] = lightViewMat[10]
}

function update() {
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
		if (e.update) {
			e.update()
		}
	}

	// render boat with separate matrix because the
	// view matrix is generated from the player matrix
	var boatMat = player.boatMat,
		velo = player.v
	translate(boatMat, pm, 0, py, 0)
	rotate(boatMat, boatMat, player.tilt +
		M.sin(player.roll += .1 * (10 + M.max(py, -10)) / 10) *
		(.05 - velo / (player.maxSpeed * 10)), .2, .2, 1)

	player.propRot += velo
	rotate(player.propMat, boatMat, player.propRot, 0, 0, 1)

	updateLightView(px, pz)
}

function updateView(mat) {
	invert(viewMat, mat)
	translate(tmpMat, idMat, 0, 6, -30)
	multiply(viewMat, tmpMat, viewMat)
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
	translate(sm, idMat, sx, 0, sz)
	scale(sm, sm, ss, 1, ss)
}

function move(mat, step) {
	translate(mat, mat, 0, 0, step)
	var fr = floor.radius,
		x = mat[12],
		z = mat[14]
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

function turn(mat, rad) {
	rotate(mat, mat, rad, 0, 1, 0)
	player.tilt += rad * 4
}

function addBubble(x, y, z) {
	for (var i = bubblesLength; i--;) {
		var bm = bubbles[i]
		if (bm[13] > -.5) {
			translate(bm, idMat,
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

	var pm = player.matrix,
		s = player.maxSpeed,
		a = player.maxTurn

	if (player.v != 0) {
		move(pm, -player.v)
		player.v *= .99
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

	touchStick.dx = touchStick.dy = 0
	diveButton.scale = 1

	if (showTouchControls && pointersLength > 0) {
		var tol = .2, idx = touchStick.pointer
		if (idx > -1) {
			var dx = pointersX[idx] - touchStick.x,
				dy = pointersY[idx] - touchStick.y,
				dsq = dx*dx + dy*dy

			if (dx > tol) {
				right = true
			} else if (dx < -tol) {
				left = true
			}

			if (dy > tol) {
				backward = true
			} else if (dy < -tol) {
				forward = true
			}

			touchStick.dx = dx
			touchStick.dy = dy
		}

		var dbx = diveButton.x,
			dby = diveButton.y,
			dbsq = diveButton.sizeSq
		for (var i = pointersLength; i--;) {
			var dx = pointersX[i] - dbx,
				dy = pointersY[i] - dby,
				dsq = dx*dx + dy*dy

			if (dsq < dbsq) {
				dive = true
				diveButton.scale = .8
				break
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
		turn(pm, a)
	} else if (right) {
		turn(pm, -a)
	} else {
		s *= 1.5
	}

	if (backward) {
		player.v = -s / 2
	} else if (forward || left || right) {
		player.v = s
	}

	var px = pm[12],
		pz = pm[14],
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

	updateView(pm)
}

function run() {
	requestAnimationFrame(run)

	now = Date.now()
	factor = (now - last) / 16
	last = now

	input()
	update()
	draw()
}

function getPointerOnTouchStick() {
	var tsq = touchStick.sizeSq,
		tx = touchStick.x + touchStick.dx,
		ty = touchStick.y + touchStick.dy

	for (var i = pointersLength; i--;) {
		var dx = pointersX[i] - tx,
			dy = pointersY[i] - ty,
			dsq = dx*dx + dy*dy

		if (dsq < tsq) {
			return i
		}
	}

	return -1
}

function setPointer(event, down) {
	var touches = event.touches
	if (!down) {
		pointersLength = touches ? touches.length : 0
	} else if (event.touches) {
		pointersLength = touches.length
		for (var i = pointersLength; i--;) {
			var t = touches[i]
			pointersX[i] = t.pageX
			pointersY[i] = t.pageY
			pointersId[i] = t.identifier
		}
	} else {
		pointersLength = 1
		pointersX[0] = event.pageX
		pointersY[0] = event.pageY
		pointersId[0] = 0
	}

	if (down) {
		// map to WebGL coordinates
		for (var i = pointersLength; i--;) {
			pointersX[i] = pointersX[i] * widthToGl - 1
			pointersY[i] = -(pointersY[i] * heightToGl - ymax)
		}
	}

	event.preventDefault()
	event.stopPropagation()
	event.cancelBubble = true
	event.returnValue = false
}

function pointerUp(event) {
	setPointer(event, false)
	var ct = event.changedTouches
	if (ct) {
		for (var i = ct.length; i--;) {
			if (ct[i].identifier === touchStick.identifier) {
				touchStick.pointer = -1
				break
			}
		}
	}
}

function pointerMove(event) {
	setPointer(event, pointersLength)
}

function pointerDown(event) {
	setPointer(event, true)
	if (showTouchControls && touchStick.pointer < 0) {
		var i = getPointerOnTouchStick()
		if (i > -1) {
			touchStick.identifier = event.touches[i].identifier
			touchStick.pointer = i
		}
	}
}

function setKey(event, down) {
	keysDown[event.keyCode] = down
	event.stopPropagation()
}

function keyUp(event) {
	setKey(event, false)
}

function keyDown(event) {
	setKey(event, true)
}

function setControls() {
	var size = M.min(ymax, 1) * .2,
		padding = size * 2.5,
		x = 1 - padding,
		y = -(ymax - padding)

	translate(tmpMat, idMat, x, y, 0)
	scale(touchStick.matrix, tmpMat, size, size, 1)
	touchStick.x = x
	touchStick.y = y
	touchStick.sizeSq = size * size

	x = -1 + padding
	translate(tmpMat, idMat, x, y, 0)
	scale(diveButton.matrix, tmpMat, size, size, 1)
	diveButton.x = x
	diveButton.y = y
	diveButton.sizeSq = size * size
}

function setProjectionMatrix() {
	var aspect = width / height
	setPerspective(projMat, M.PI * .125, aspect, .1, horizon)
	controlsProjMat = new FA([
		1, 0, 0, 0,
		0, aspect, 0, 0,
		0, 0, 1, 0,
		0, 0, 0, 1])
}

function resize() {
	width = gl.canvas.clientWidth
	height = gl.canvas.clientHeight

	gl.canvas.width = width
	gl.canvas.height = height

	ymax = height / width
	widthToGl = 2 / width
	heightToGl = ymax * 2 / height

	setProjectionMatrix()
	setControls()
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

function createBubbleModel() {
	var vertices = [
		0.044, -0.027, 0.085,
		0.044, 0.072, 0.052,
		0.044, 0.072, -0.052,
		0.044, -0.027, -0.085,
		0.044, -0.089, 0,
		0.100, 0, 0,
		0, -0.095, 0.030,
		0, -0.095, -0.030,
		0, 0, 0.100,
		0, -0.058, 0.080,
		0, 0.095, 0.030,
		0, 0.058, 0.080,
		0, 0.058, -0.080,
		0, 0.095, -0.030,
		0, -0.058, -0.080,
		0, 0, -0.100,
		0.052, -0.068, 0.050,
		0.052, 0.026, 0.080,
		0.052, 0.085, 0,
		0.052, 0.026, -0.080,
		0.052, -0.068, -0.050,
		0.085, -0.016, 0.050,
		0.085, -0.052, 0,
		0.085, 0.042, 0.030,
		0.085, 0.042, -0.030,
		0.085, -0.016, -0.050,
	], indicies = [
		0, 16, 21,
		1, 17, 23,
		2, 18, 24,
		3, 19, 25,
		4, 20, 22,
		22, 25, 5,
		22, 20, 25,
		20, 3, 25,
		25, 24, 5,
		25, 19, 24,
		19, 2, 24,
		24, 23, 5,
		24, 18, 23,
		18, 1, 23,
		23, 21, 5,
		23, 17, 21,
		17, 0, 21,
		21, 22, 5,
		21, 16, 22,
		16, 4, 22,
		7, 20, 4,
		7, 14, 20,
		14, 3, 20,
		15, 19, 3,
		15, 12, 19,
		12, 2, 19,
		13, 18, 2,
		13, 10, 18,
		10, 1, 18,
		11, 17, 1,
		11, 8, 17,
		8, 0, 17,
		9, 16, 0,
		9, 6, 16,
		6, 4, 16,
		14, 15, 3,
		12, 13, 2,
		10, 11, 1,
		8, 9, 0,
		6, 7, 4,
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

function createButtonModel() {
	var vertices = [
		0, 0.988, 0,
		0, -0.988, 0,
		0.378, -0.913, 0,
		0.699, -0.699, 0,
		0.913, -0.378, 0,
		0.988, 0, 0,
		0.913, 0.378, 0,
		0.699, 0.699, 0,
		0.378, 0.913, 0,
	], indicies = [
		3, 7, 1,
		1, 2, 3,
		3, 4, 5,
		5, 6, 7,
		7, 8, 0,
		0, 1, 7,
		3, 5, 7,
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
		bubbles[i] = new FA(idMat)
	}
}

function createEntities() {
	var pyramids = [[-10, -40, 9], [-15, -25, 5]],
		pyramidModel = createPyramidModel()
	for (var i in pyramids) {
		var x = pyramids[i][0],
			z = pyramids[i][1],
			s = pyramids[i][2],
			h = s * .66
		translate(tmpMat, idMat, x, getFloorHeight(x, z), z)
		scale(tmpMat, tmpMat, s, h, s)
		addToFloor(x, z, h)
		entities.push({
			model: pyramidModel,
			matrix: new FA(tmpMat),
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
		translate(tmpMat, idMat, x, y, z)
		rotate(tmpMat, tmpMat, M.random() * M.TAU, 1, 1, 1)
		entities.push({
			model: coinModel,
			matrix: new FA(tmpMat),
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

function createFloor(mag) {
	var amp = 14,
		model = createFloorModel(5, .6, amp),
		hm = model.heightMap,
		base = -(10 + model.max)
	for (var i = hm.length; i--;) {
		hm[i] = base + hm[i] * amp
	}
	translate(tmpMat, idMat, 0, base, 0)
	scale(tmpMat, tmpMat, mag, 1, mag)
	floor = {
		model: model,
		matrix: new FA(tmpMat),
		color: [.3, .2, .1, 1],
		radius: model.radius * mag,
		mag: mag,
		amp: amp,
		base: base
	}
}

function newGame() {
	coins = 5 + ((M.random() * 5) | 0)
	coinsFound = 0

	text.innerText = 'Find ' + coins + ' lost coins!'
	text.warning = true

	createFloor(11)
	createEntities()
	createBubbles()

	translate(tmpMat, idMat, 0, -.5, 0)
	player.matrix = new FA(tmpMat)
	player.roll = 0
	player.v = 0
	player.depth = 0
	player.tilt = 0

	updateView(player.matrix)
}

function createControls() {
	var model = createButtonModel()
	touchStick = {
		model: model,
		matrix: new FA(idMat),
		color: [1, 1, 1, .1],
		pointer: -1,
		dx: 0,
		dy: 0
	}
	diveButton = {
		model: model,
		matrix: new FA(idMat),
		color: [1, 1, 1, .1],
		scale: 1
	}
}

function createPlayer() {
	player = {
		model: createBoatModel(),
		prop: createPropModel(),
		matrix: new FA(idMat),
		boatMat: new FA(idMat),
		propMat: new FA(idMat),
		propRot: 0,
		color: [1, 1, 1, 1],
		roll: 0,
		v: 0,
		depth: 0,
		tilt: 0,
		maxSpeed: .15,
		maxTurn: .01
	}
}

function createSea() {
	var model = createSeaModel(6), mag = 1.75
	sea = {
		model: model,
		matrix: new FA(idMat),
		color: [.4, .7, .8, .3],
		radius: model.radius * mag,
		mag: mag
	}
	alignSea(0, 0)
}

function cacheUniformLocations(program, uniforms) {
	if (program.uniforms === undefined) {
		program.uniforms = {}
	}
	for (var i = 0, l = uniforms.length; i < l; ++i) {
		var name = uniforms[i],
			loc = gl.getUniformLocation(program, name)
		if (!loc) {
			throw 'uniform "' + name + '" not found'
		}
		program.uniforms[name] = loc
	}
}

function cacheAttribLocations(program, attribs) {
	if (program.attribs === undefined) {
		program.attribs = {}
	}
	for (var i = 0, l = attribs.length; i < l; ++i) {
		var name = attribs[i],
			loc = gl.getAttribLocation(program, name)
		if (loc < 0) {
			throw 'attribute "' + name + '" not found'
		}
		program.attribs[name] = loc
	}
}

function cacheLocations(program, attribs, uniforms) {
	cacheAttribLocations(program, attribs)
	cacheUniformLocations(program, uniforms)
}

function compileShader(src, type) {
	var shader = gl.createShader(type)
	gl.shaderSource(shader, src)
	gl.compileShader(shader)
	var error = gl.getShaderInfoLog(shader)
	if (error.length > 0) {
		throw error
	}
	if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
		throw 'cannot compile shader'
	}
	return shader
}

function linkProgram(vs, fs) {
	var p = gl.createProgram()
	gl.attachShader(p, vs)
	gl.attachShader(p, fs)
	gl.linkProgram(p)
	if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
		throw new Error(gl.getProgramInfoLog(p))
	}
	return p
}

function buildProgram(vertexSource, fragmentSource) {
	return linkProgram(
		compileShader(vertexSource, gl.VERTEX_SHADER),
		compileShader(fragmentSource, gl.FRAGMENT_SHADER))
}

function createPrograms() {
	shadowProgram = buildProgram(
		D.getElementById('LightVertexShader').textContent,
		D.getElementById('LightFragmentShader').textContent)
	cacheLocations(shadowProgram, ['vertex'],
		['lightProjMat', 'lightModelViewMat'])

	program = buildProgram(
		D.getElementById('VertexShader').textContent,
		D.getElementById('FragmentShader').textContent)
	cacheLocations(program, ['vertex', 'normal'], [
		'projMat', 'modelViewMat', 'normalMat',
		'lightProjMat', 'lightModelViewMat', 'lightDirection',
		'far', 'sky', 'color', 'shadowDepthTexture'])

	seaProgram = buildProgram(
		D.getElementById('SeaVertexShader').textContent,
		D.getElementById('SeaFragmentShader').textContent)
	cacheLocations(seaProgram, ['vertex', 'normal'], [
		'projMat', 'modelViewMat', 'normalMat',
		'lightDirection',
		'far', 'sky', 'color',
		'time', 'radius'])

	controlsProgram = buildProgram(
		D.getElementById('ControlsVertexShader').textContent,
		D.getElementById('ControlsFragmentShader').textContent)
	cacheLocations(controlsProgram, ['vertex'], [
		'projMat', 'modelViewMat', 'color'])
}

function createShadowBuffer() {
	shadowFramebuffer = gl.createFramebuffer()
	gl.bindFramebuffer(gl.FRAMEBUFFER, shadowFramebuffer)

	shadowDepthTexture = gl.createTexture()
	gl.bindTexture(gl.TEXTURE_2D, shadowDepthTexture)
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, shadowDepthTextureSize,
		shadowDepthTextureSize, 0, gl.RGBA, gl.UNSIGNED_BYTE, null)

	var renderBuffer = gl.createRenderbuffer()
	gl.bindRenderbuffer(gl.RENDERBUFFER, renderBuffer)
	gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16,
		shadowDepthTextureSize, shadowDepthTextureSize)

	gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0,
		gl.TEXTURE_2D, shadowDepthTexture, 0)
	gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT,
		gl.RENDERBUFFER, renderBuffer)

	gl.bindTexture(gl.TEXTURE_2D, null)
	gl.bindRenderbuffer(gl.RENDERBUFFER, null)
	gl.bindFramebuffer(gl.FRAMEBUFFER, null)
}

function createLight() {
	setOrthogonal(lightProjMat, -40, 40, -40, 40, -80.0, 80)
	translate(staticLightViewMat, idMat, 0, 0, -40)
	rotate(staticLightViewMat, staticLightViewMat, M.PI2 * .5, 1, -1, 0)
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
	if (!(text = D.getElementById('Text')) || !(gl = getContext())) {
		alert('WebGL not available')
		return
	}

	createLight()
	createShadowBuffer()
	createPrograms()
	createSea()
	createPlayer()
	createControls()
	newGame()

	gl.enable(gl.DEPTH_TEST)
	gl.enable(gl.BLEND)
	gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)

	W.onresize = resize
	resize()

	D.onkeydown = keyDown
	D.onkeyup = keyUp

	D.onmousedown = pointerDown
	D.onmousemove = pointerMove
	D.onmouseup = pointerUp
	D.onmouseout = pointerUp

	if ('ontouchstart' in D) {
		showTouchControls = true
		D.ontouchstart = pointerDown
		D.ontouchmove = pointerMove
		D.ontouchend = pointerUp
		D.ontouchleave = pointerUp
		D.ontouchcancel = pointerUp

		// prevent pinch/zoom on iOS 11
		D.addEventListener('gesturestart', function(event) {
			event.preventDefault()
		}, false)
		D.addEventListener('gesturechange', function(event) {
			event.preventDefault()
		}, false)
		D.addEventListener('gestureend', function(event) {
			event.preventDefault()
		}, false)
	}

	last = Date.now() - 16
	first = last
	run()
}

W.onload = init
