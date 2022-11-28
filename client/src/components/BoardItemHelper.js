// also slightly copied from w3schools
export const resizeElement = (borderElmnt, parentElmnt, selected, emit, finishMove, finishResize, resizeDirection, resizing) => {
	let borderSize, initialWidth, initialHeight,
		initElmntLeft, initElmntWidth,
		initElmntTop, initElmntHeight;
	borderElmnt.onmousedown = resizeMouseDown;

	function resizeMouseDown(e) {
		if (selected) {
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

		const width = (resizeDirection.value[0] > 0)? mouseX - initElmntLeft: initElmntWidth - mouseX + initElmntLeft;
		const height = (resizeDirection.value[1] > 0)? mouseY - initElmntTop: initElmntHeight - mouseY + initElmntTop;
		const resizeScale = (width / initialWidth + height / initialHeight) / 2; // a decimal
		const percentChange = resizeScale - 1; // a decimal
		

		if (resizeDirection.value[0] > 0) {
			if (resizeDirection.value[1] > 0)
				emit("resize", initialWidth * resizeScale + borderOffset, initialHeight * resizeScale + borderOffset);
			else if (resizeDirection.value[1] < 0) {
				emit("resize", (initialWidth * resizeScale) + borderOffset, (initialHeight * resizeScale) + borderOffset);
				emit("move", null, initElmntTop - (initialHeight * percentChange) - borderOffset);
			}
			else
				emit("resize", width + borderOffset, null);
		}
		else if (resizeDirection.value[0] < 0) {
			if (resizeDirection.value[1] > 0) {
				emit("resize", (initialWidth * resizeScale) + borderOffset, (initialHeight * resizeScale) + borderOffset);
				emit("move", initElmntLeft - (initialWidth * percentChange) - borderOffset, null);
			}
			else if (resizeDirection.value[1] < 0) {
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
			if (resizeDirection.value[1] > 0)
				emit("resize", null, height + borderOffset);
			else if (resizeDirection.value[1] < 0) {
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
		finishMove();
		finishResize();
	}
};

// mostly copied from w3schools
export const dragElement = (elmnt, selected, emit, finishMove, cursorType) => {
	let startingX = 0, startingY = 0;
	elmnt.onmousedown = dragMouseDown;

	function dragMouseDown(e) {
		if (selected.value) {
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
		const deltaX = startingX - e.clientX;
		const deltaY = startingY - e.clientY;
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
		finishMove();
	}
};