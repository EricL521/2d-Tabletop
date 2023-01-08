// modified from https://stackoverflow.com/questions/64690514/creating-a-resizable-draggable-rotate-view-in-javascript
const minWidth = 20;
const minHeight = 20;

const cancelEvent = (event) => {
	event.preventDefault();
	event.stopPropagation();
};

// adds drag functionality to an element
export const dragElement = (elmnt, isSelected, emit) => {
	elmnt.addEventListener('mousedown', (event) => {
		if (!isSelected.value)
			return;
		cancelEvent(event);

		// initial values
		const initX = elmnt.offsetLeft;
		const initY = elmnt.offsetTop;
		const initMouseX = event.clientX;
		const initMouseY = event.clientY;
	
		const eventMoveHandler = (event) => {
			cancelEvent(event);
			emit('move', initX + (event.clientX - initMouseX),
				initY + (event.clientY - initMouseY));
		}
	
		elmnt.addEventListener('mousemove', eventMoveHandler, false);

		window.addEventListener('mouseup', function eventEndHandler() {
			elmnt.removeEventListener('mousemove', eventMoveHandler, false);
			window.removeEventListener('mouseup', eventEndHandler);
		}, false);
	
	}, false);
};

// adds resize functionality to an element
// resizeElmnts is in order [topLeft, top, topRight, left, right, bottomLeft, bottom, bottomRight]
export const resizeElement = (elmnt, resizeElmnts, isSelected, rotation, emit) => {
	const resizeHandler = (event, top = false, left = false, xResize = false, yResize = false) => {
		if (!isSelected.value)
			return;
		cancelEvent(event);

		const initX = elmnt.offsetLeft;
		const initY = elmnt.offsetTop;
		const initMouseX = event.clientX;
		const initMouseY = event.clientY;
	
		const initW = elmnt.offsetWidth;
		const initH = elmnt.offsetHeight;
	
		const initRotate = rotation.value;
		const initRadians = initRotate * Math.PI / 180;
		const cosFraction = Math.cos(initRadians);
		const sinFraction = Math.sin(initRadians);
		const eventMoveHandler = (event) => {
			var wDiff = (event.clientX - initMouseX);
			var hDiff = (event.clientY - initMouseY);
			var rotatedWDiff = cosFraction * wDiff + sinFraction * hDiff;
			var rotatedHDiff = cosFraction * hDiff - sinFraction * wDiff;
	
			let newW = initW, newH = initH, newX = initX, newY = initY;
	
			if (xResize) {
				if (left) {
					// wDiff is negative if increasing size from left
					newW = initW - rotatedWDiff;
					if (newW < minWidth) {
						newW = minWidth;
						rotatedWDiff = initW - minWidth;
					}
				} else {
					newW = initW + rotatedWDiff;
					if (newW < minWidth) {
						newW = minWidth;
						rotatedWDiff = minWidth - initW;
					}
				}
				newX += rotatedWDiff * cosFraction;
				newY += rotatedWDiff * sinFraction;
			}
	
			if (yResize) {
				if (top) {
					newH = initH - rotatedHDiff;
					if (newH < minHeight) {
						newH = minHeight;
						rotatedHDiff = initH - minHeight;
					}
				} else {
					newH = initH + rotatedHDiff;
					if (newH < minHeight) {
						newH = minHeight;
						rotatedHDiff = minHeight - initH;
					}
				}
				newX -= rotatedHDiff * sinFraction;
				newY += rotatedHDiff * cosFraction;
			}
	
			emit('resize', newW, newH);
			emit('move', newX, newY);
		};
	
	
		window.addEventListener('mousemove', eventMoveHandler, false);
		window.addEventListener('mouseup', function eventEndHandler() {
			window.removeEventListener('mousemove', eventMoveHandler, false);
			window.removeEventListener('mouseup', eventEndHandler);
		}, false);
	};
	
	resizeElmnts[0].addEventListener("mousedown", (event) => resizeHandler(event, true, true, true, true));
	resizeElmnts[1].addEventListener("mousedown", (event) => resizeHandler(event, true, false, false, true));
	resizeElmnts[2].addEventListener("mousedown", (event) => resizeHandler(event, true, false, true, true));
	resizeElmnts[3].addEventListener("mousedown", (event) => resizeHandler(event, false, true, true, false));
	resizeElmnts[4].addEventListener("mousedown", (event) => resizeHandler(event, false, false, true, false));
	resizeElmnts[5].addEventListener("mousedown", (event) => resizeHandler(event, false, true, true, true));
	resizeElmnts[6].addEventListener("mousedown", (event) => resizeHandler(event, false, false, false, true));
	resizeElmnts[7].addEventListener("mousedown", (event) => resizeHandler(event, false, false, true, true));
};

// handle rotation
export const rotateElement = (elmnt, rotateElmnt, isSelected, emit) => {
	rotateElmnt.onmousedown = (event) => {
		if (!isSelected.value)
			return;
		cancelEvent(event);

		const boxRect = elmnt.getBoundingClientRect();
		var elmntX = boxRect.left + boxRect.width / 2;
		var elmntY = boxRect.top + boxRect.height / 2;
	
		const eventMoveHandler = (event) => {
			var angle = Math.atan2(event.clientY - elmntY, event.clientX - elmntX) - Math.PI / 4;
			emit('rotate', angle * 180 / Math.PI);
		};
	
		document.onmousemove = eventMoveHandler;
	
		document.onmouseup = () => {
			document.onmousemove = null;
			document.onmouseup = null;
		};
	};
};