<script setup>
import { computed, onMounted, onUnmounted, ref, toRaw } from 'vue';
import BoardItem from '../BoardItem.vue';
const props = defineProps(['data']);
const emit = defineEmits(['updateHeader', 'changeScreen', 'updateData']);
// eslint-disable-next-line vue/no-setup-props-destructure
const board = props.data.board;
window.board = toRaw(board);
console.log(`${board.name} - ${board.id}`);
emit('updateHeader', true, `${board.name} - ${board.id}`);

const cancelEvent = (e) => {e.preventDefault(); e.stopPropagation();};

// NOTE: COMPUTED IS NEEDED TO FORCE THE UPDATE
const updater = ref(0);
const items = computed(() => {
	updater.value; // force update when updater changes
	return board.boardItems;
});
board.onAny(() => {
	updater.value ++;
});

const globalPosition = ref([0, 0]);
const globalPosStyle = computed(() => {
	return {
		left: `${globalPosition.value[0]}px`,
		top: `${globalPosition.value[1]}px`,
	};
});
let startingMousePos = [0, 0];
let dragging = false;
const mouseDown = (e) => {
	if (selectedItem.value)
		return;

	cancelEvent(e);
	dragging = true;
	backgroundCursor.value = "grabbing";
	startingMousePos = [e.clientX, e.clientY];
};
const mouseMove = (e) => {
	if (!dragging) return;
	if (selectedItem.value)
		return;

	cancelEvent(e);
	// unselect
	updateSelection(null, null);
	globalPosition.value = [
		globalPosition.value[0] + e.clientX - startingMousePos[0],
		globalPosition.value[1] + e.clientY - startingMousePos[1],
	];
	startingMousePos = [e.clientX, e.clientY];
};
const mouseUp = (e) => {
	if (selectedItem.value)
		return;
	
	cancelEvent(e);
	dragging = false;
	backgroundCursor.value = "grab";
};
const globalScale = ref(1);
const globalScaleStyle = computed(() => {
	return {
		transform: `scale(${globalScale.value})`,
	};
});
const zoom = (e) => {
	cancelEvent(e);
	if (selectedItem.value) return;

	const delta = e.deltaY;
	let deltaScale = 0;
	if (delta > 0)
		deltaScale = 1/1.1;
	else
		deltaScale = 1.1;
	
	globalScale.value *= deltaScale;
	// scale globalPos
	globalPosition.value = scalePoint(globalPosition.value, [e.clientX, e.clientY], deltaScale);
};
// everything is [x, y], except scale, hwich is a number
const scalePoint = (point, center, scale) => {
	const x = (point[0] - center[0]) * scale + center[0];
	const y = (point[1] - center[1]) * scale + center[1];
	return [x, y];
};

const backgroundCursor = ref("grab");
const cursorStyle = computed(() => {return {
		cursor: backgroundCursor.value,
}});

const selectedItem = ref(null);
board.on("itemSelect", (key, item) => {
	setTimeout(() => {
		selectedItem.value = item;
		if (selectedItem.value)
			backgroundCursor.value = "pointer";
		else
			backgroundCursor.value = "grab";
	}, 0);
});
// this is where parenting is done
const updateSelection = (e, key) => {
	if (e)
		cancelEvent(e);
	// if deselecting and parenting, then parent
	if (selectedItem.value && selectedItem.value.key != key) {
		if (selectedItem.value.parent != parentingItem.value?.key)
			board.parentItem(selectedItem.value.key, parentingItem.value?.key);
		parentingItem.value = null;
		parentingArea.value = 0;
	}
	board.selectItem(key);
	// changes selected item in board.on("itemSelect")
};

const parentingItem = ref(null);
const parentingArea = ref(0);
const onIntersect = (key, areaPercent) => {
	if (!selectedItem.value)
		return;
	if (parentingItem.value && parentingItem.value.key == key) {
		parentingArea.value = areaPercent;
		if (parentingArea.value == 0)
			return parentingItem.value = null;
	}
	if (areaPercent > parentingArea.value) {
		parentingItem.value = board.getItem(key);
		parentingArea.value = areaPercent;
	}
};

// keys assigned in board, as they need to be synced
const addItem = (position, size, type, data, parent) => {
	board.addItem({
		position, size,
		type, data,
		parent: parent? parent: null
	});
};
const uploadData = (e) => {
	cancelEvent(e);
	
	for (const file of e.dataTransfer.files) {
		const fileReader = new FileReader();
		
		fileReader.readAsDataURL(file);
		fileReader.onload = async (file) => {
			const res = file.target.result;
			const img = await resizeImg(100000, res);
			const offsetPos = [e.clientX - globalPosition.value[0], e.clientY - globalPosition.value[1]];
			const scaledPos = scalePoint(offsetPos, [0, 0], 1/globalScale.value);
			addItem([scaledPos[0], scaledPos[1], 0], [img.width, img.height], "img", {dataURL: img.toDataURL()});
		};
	}
};
// returns canvas with the image on it
// NOTE: does not upsize image if it's smaller than pixels
const resizeImg = async (pixels, dataURL) => {
	const img = new Image();
	img.src = dataURL;

	return new Promise((res) => {
		img.onload = () => {
			let width, height;
			if (img.width * img.height <= pixels) {
				height = img.height;
				width = img.width;
			}
			else {
				const aspectRatio = img.width / img.height;
				height = Math.sqrt(pixels / aspectRatio);
				width = height * aspectRatio;
			}

			const canvas = document.createElement('canvas');
			canvas.width = width;
			canvas.height = height;
			const ctx = canvas.getContext("2d");
			ctx.drawImage(img, 0, 0, width, height);

			res(canvas);
		};
	});
};
onMounted(() => {
	document.addEventListener("drop", uploadData);
	document.addEventListener("dragover", cancelEvent);
	document.addEventListener("drag", cancelEvent);
	
	document.addEventListener("wheel", zoom);
});
onUnmounted(() => {
	document.removeEventListener("drop", uploadData);
	document.removeEventListener("dragover", cancelEvent);
	document.removeEventListener("drag", cancelEvent);

	document.removeEventListener("wheel", zoom);
});

// use document.getlemenetbyid in case it already is mounted
const moveableContainer = ref(document.getElementById("moveable-container"));
</script>

<template>
	<div id="game-screen">
		<!-- <div id="tool-bar">
			<img src="../../assets/icons/Paint_Brush.svg">
		</div> -->
		<div id="background" :style="cursorStyle" @click="updateSelection" 
		@mousedown="mouseDown" @mousemove="mouseMove" @mouseup="mouseUp" @mouseleave="mouseUp"></div>
		<div id="board-item-container" :style="[globalPosStyle, globalScaleStyle]">
			<!-- For nonchildren only -->
			<BoardItem v-for="[key, item] in items" :key="key" :thisItem="item" :updater="updater"
			@updateSelection="updateSelection" :selectedItem="selectedItem"
			@updateIntersection="onIntersect" :parentingItem="parentingItem"
			
			:position="item.position" @finishMove="(key, position) => board.moveItem(key, position)" 
			:size="item.size" :scale="item.scale" @finishScale="(key, scale) => board.scaleItem(key, scale)"
			:rotation="item.rotation" @finishRotate="(key, rotation) => board.rotateItem(key, rotation)" 

			:type="item.type" :data="item.data"
			:children="item.children"

			:parentElement="moveableContainer"/>
		</div>
		<div ref="moveableContainer" id="moveable-container"></div>
	</div>
</template>

<style scoped>
#game-screen, #background {
	position: absolute;
	width: 100%;
	height: 100%;
	user-select: none;
}

#board-item-container {
	position: absolute;
	overflow: visible;
}
#moveable-container {
	position: absolute;
	left: 0;
	top: 0;
	width: 0;
	height: 0;
	pointer-events: all;
	z-index: 1000000;
}

#tool-bar {
	position: fixed;
	left: 0;
	top: 4em;
	z-index: 1000000;

	display: flex;
	flex-direction: row;
	justify-content: start;
	align-items: center;
}
#tool-bar img {
	width: 5em;
	height: auto;
}
</style>