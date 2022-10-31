// also slightly copied from w3schools
export const resizeElement = (borderElmnt, parentElmnt, props, emit, outlineCursor, resizing) => {
	let borderSize, initialWidth, initialHeight,
		initElmntLeft, initElmntWidth,
		initElmntTop, initElmntHeight;
	borderElmnt.onmousedown = resizeMouseDown;

	function resizeMouseDown(e) {
		if (props.selected) {
			e = e || window.event;
			e.preventDefault();
			e.stopPropagation();

			borderSize = (borderElmnt.offsetWidth - parentElmnt.offsetWidth) / 2;
			initialWidth = parentElmnt.offsetWidth;
			initialHeight = parentElmnt.offsetHeight;
			initElmntLeft = parentElmnt.offsetLeft; initElmntTop = parentElmnt.offsetTop;
			initElmntWidth = parentElmnt.offsetWidth; initElmntHeight = parentElmnt.offsetHeight;

			parentElmnt.classList.add('notransition');
			resizing.value = true;
			document.onmouseup = closeResizeElement;
			// call a function whenever the cursor moves:
			document.onmousemove = elementResize;
		}
	}

	function elementResize(e) {
		e = e || window.event;
		e.preventDefault();
		
		// adjust for transform css
		const rect = parentElmnt.getBoundingClientRect();
		const mouseX = e.pageX + (parentElmnt.offsetLeft - rect.left); 
		const mouseY = e.pageY + (parentElmnt.offsetTop - rect.top);

		const borderOffset = -borderSize/2;

		const width = (outlineCursor.value[0] > 0)? mouseX - initElmntLeft: initElmntWidth - mouseX + initElmntLeft;
		const height = (outlineCursor.value[1] > 0)? mouseY - initElmntTop: initElmntHeight - mouseY + initElmntTop;
		const resizeScale = (width / initialWidth + height / initialHeight) / 2; // a decimal
		const percentChange = resizeScale - 1; // a decimal
		

		if (outlineCursor.value[0] > 0) {
			if (outlineCursor.value[1] > 0)
				emit("resize", initialWidth * resizeScale + borderOffset, initialHeight * resizeScale + borderOffset);
			else if (outlineCursor.value[1] < 0) {
				emit("resize", (initialWidth * resizeScale) + borderOffset, (initialHeight * resizeScale) + borderOffset);
				emit("move", null, initElmntTop - (initialHeight * percentChange) - borderOffset);
			}
			else
				emit("resize", width + borderOffset, null);
		}
		else if (outlineCursor.value[0] < 0) {
			if (outlineCursor.value[1] > 0) {
				emit("resize", (initialWidth * resizeScale) + borderOffset, (initialHeight * resizeScale) + borderOffset);
				emit("move", initElmntLeft - (initialWidth * percentChange) - borderOffset, null);
			}
			else if (outlineCursor.value[1] < 0) {
				emit("resize", (initialWidth * resizeScale) + borderOffset, (initialHeight * resizeScale) + borderOffset);
				emit("move", initElmntLeft - (initialWidth * percentChange) - borderOffset, 
							initElmntTop - (initialHeight * percentChange) - borderOffset);
			}
			else {
				emit("resize", width + borderOffset, null);
				emit("move", mouseX - borderOffset, null);
			}
		}
		else {
			if (outlineCursor.value[1] > 0)
				emit("resize", null, height + borderOffset);
			else if (outlineCursor.value[1] < 0) {
				emit("resize", null, height + borderOffset);
				emit("move", null, mouseY - borderOffset);
			}
		}
	}

	function closeResizeElement() {
		/* stop moving when mouse button is released:*/
		document.onmouseup = null;
		document.onmousemove = null;

		parentElmnt.classList.remove('notransition');
		resizing.value = false;
		emit('finishMove');
		emit('finishResize');
	}
};

// mostly copied from w3schools
export const dragElement = (elmnt, props, emit, cursorType) => {
	let deltaX = 0, deltaY = 0, startingX = 0, startingY = 0;
	elmnt.onmousedown = dragMouseDown;

	function dragMouseDown(e) {
		if (props.selected) {
			cursorType.value = "grabbing";

			e = e || window.event;
			e.preventDefault();
			// get the mouse cursor position at startup:
			startingX = e.clientX;
			startingY = e.clientY;
			
			elmnt.classList.add('notransition');
			document.onmouseup = closeDragElement;
			// call a function whenever the cursor moves:
			document.onmousemove = elementDrag;
		}
	}

	function elementDrag(e) {
		e = e || window.event;
		e.preventDefault();
		// calculate the new cursor position:
		deltaX = startingX - e.clientX;
		deltaY = startingY - e.clientY;
		startingX = e.clientX;
		startingY = e.clientY;
		// turn off transition temporarily
		emit('move', elmnt.offsetLeft - deltaX, elmnt.offsetTop - deltaY);
	}

	function closeDragElement() {
		/* stop moving when mouse button is released:*/
		document.onmouseup = null;
		document.onmousemove = null;
		cursorType.value = "grab";

		elmnt.classList.remove('notransition');
		emit('finishMove');
	}
};