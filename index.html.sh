#!/usr/bin/env bash
extract() {
	local ECHO=0
	while read -r
	do
		[[ $REPLY == *$1* ]] && {
			ECHO=1
		}
		(( ECHO )) && {
			# skip comments
			REPLY=${REPLY%%//*}
			# skip indent
			REPLY=${REPLY##*$'\t'}
			# skip empty lines
			[ "$REPLY" ] || continue
			echo "$REPLY"
		}
		[[ $REPLY == \</script* ]] && {
			ECHO=0
		}
	done
}
cat << EOF
<!doctype html>
<html>
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width"/>
<title>js13k2017</title>
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
$(extract 'x-shader' < preview.html)
<script>
$(closurecompiler < src.js)
</script>
</body>
</html>
EOF
