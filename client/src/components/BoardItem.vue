<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import { resizeElement, dragElement } from './BoardItemHelper.js';

const emit = defineEmits(['deselect', 'move', 'finishMove', 'resize', 'finishResize']);
const props = defineProps(['selected', 'x', 'y', 'z', 'width', 'height', 'type', 'data', 'children']);

const positionStyle = computed(() => {
	return {
		left: props.x + 'px',
		top: props.y + 'px',
		zIndex: props.z
	};
});

const sizeStyle = computed(() => {return {
	width: props.width + 'px',
	height: props.height + 'px'
}});

const cursorType = ref("pointer");
const cursorStyle = computed(() => {return {cursor: cursorType.value}});
watch(() => props.selected, () => {
	if (props.selected)
		cursorType.value = "grab";
	else
		cursorType.value = "pointer";
});

// outline cursor
const outline = ref(null);
const outlineCursor = ref([0, 0]); // x, y
const outlineMouseStyle = computed(() => {
	let cursorValue = "";
	if (outlineCursor.value[1] !== 0)
		cursorValue += (outlineCursor.value[0] > 0)? "n": "s";
	if (outlineCursor.value[0] !== 0)
		cursorValue += (outlineCursor.value[1] > 0)? "w": "e";
	cursorValue += "-resize";
	return {
		cursor: cursorValue
	};
});
const cornerDistance = 20; // px
const updateCursor = (e) => {
	if (resizing.value)
		return; // don't update cursor while resizing

	// ± 1 from center
	const relativeX = e.offsetX - outline.value.offsetWidth / 2;
	const relativeY = e.offsetY - outline.value.offsetHeight / 2;
	let cursor = [0, 0];
	if (Math.abs(relativeY) > outline.value.offsetHeight / 2 - cornerDistance)
		cursor[1] = (relativeY > 0)? "1": "-1";
	if (Math.abs(relativeX) > outline.value.offsetWidth / 2 - cornerDistance)
		cursor[0] = (relativeX > 0)? "1": "-1";
	outlineCursor.value = cursor;
};
// echoes outlimecursor if selected
const backgroundCursor = computed(() => {
	if (resizing.value)
		return outlineMouseStyle.value;
	return {
		cursor: "pointer"
	};
});

const resizing = ref(false);
const boardItem = ref(null);
// outline defined above
onMounted(() => {
	dragElement(boardItem.value, props, emit, cursorType);
	resizeElement(outline.value, boardItem.value, props, emit, outlineCursor, resizing);
});

</script>

<template>
	<div :class="{selected: props.selected}" id="board-item" :style="[positionStyle, cursorStyle, sizeStyle]" ref="boardItem">
		<div ref="outline" id="outline" :class="{hidden: !props.selected}" :style="outlineMouseStyle" @mousemove="updateCursor"></div>
		<div id="background" v-if="props.selected" @click="(e) => emit('deselect', e)" :style="backgroundCursor"></div>
		<div id="children"></div>
		
		<img class="item" v-if="props.type == 'img'" :src="props.data.dataURL">
		<p v-else>Backup thing</p>
	</div>
</template>

<style scoped>
* {
	display: block;
	user-select: none;
	transition: inherit;
}

#board-item {
	position: absolute;
	transition: all 0.5s ease, z-index 0s ease 0.15s, border 0s;
}
#board-item.selected {
	box-shadow: #25171a 0.4em 0.4em 0.8em;
	transform: translate(-0.3em, -0.3em);
}
#outline {
	position: absolute;
	width: 100%;
	left: -0.3em;
	height: 100%;
	top: -0.3em;
	border: 0.3em solid #B2B9D2;
	z-index: -1;
}
#outline.hidden {
	opacity: 0;
}
#background {
	position: absolute;
	width: 200vw;
	height: 200vh;
	left: -100vw;
	top: -100vh;
	z-index: -10;
}
.item{
	width: 100%;
	height: 100%;
}
#children {
	position: absolute;
	left: 0;
	top: 0;
	width: 100%;
	height: 100%;

	overflow: visible;
}

img {
	image-rendering: pixelated;
}
</style>