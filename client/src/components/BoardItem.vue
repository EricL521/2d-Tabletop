<script setup>
import { computed, getCurrentInstance, onMounted, ref, watch } from 'vue';
import { resizeElement, dragElement, rotateElement } from './BoardItemHelper.js';

const emit = defineEmits(['updateSelection', 'updateIntersection', 'move', 'finishMove', 'resize', 'finishResize', 'rotate', 'finishRotate']);
const props = defineProps(['selectedItem', 'parentingItem', 'thisItem', 'x', 'y', 'z', 'absoluteX', 'absoluteY',
							'width', 'height', 'rotation', 'type', 'data', 'children', 'isChild', 'parent']);
const key = getCurrentInstance().vnode.key;
const isSelected = ref(false);
// if child is selected, move parent to top
const childSelected = ref(false);
const isParenting = ref(false);
watch(() => props.parentingItem, (parentingItem) => {
	if (!parentingItem)
		return isParenting.value = false;
	isParenting.value = parentingItem.key === key || props.thisItem.isAncestorOf(parentingItem);
});
watch(() => props.selectedItem, (selectedItem) => {
	isSelected.value = selectedItem? (selectedItem.key === key): false;
	childSelected.value = props.thisItem.isAncestorOf(selectedItem);
	if (!selectedItem || isSelected.value)
		return;

	// watch for overlapping if items not related at all
	if ((props.thisItem.isParentOf(selectedItem) || !props.thisItem.isAncestorOf(selectedItem))
		&& !props.thisItem.isDescendantOf(selectedItem))
		onIntersect(key, selectedItem.percentAreaCoveredBy(props.thisItem));
}, {deep: true});
const onIntersect = (itemKey, areaPercent) => {
	emit('updateIntersection', itemKey, areaPercent);
};

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
const rotationStyle = computed(() => {return {
	transform: 'rotate(' + props.rotation + 'deg)'
}});

const cursorType = ref("pointer");
const cursorStyle = computed(() => {return {cursor: cursorType.value}});
watch(isSelected, () => {
	if (isSelected.value)
		cursorType.value = "grab";
	else
		cursorType.value = "pointer";
});

// outline cursor
const outline = ref(null);
const resizeDirection = ref([0, 0]); // x, y
// also turns on cursor events
const outlineMouseStyle = computed(() => {
	let cursorValue = "";
	if (resizeDirection.value[1] !== 0)
		cursorValue += (resizeDirection.value[0] > 0)? "n": "s";
	if (resizeDirection.value[0] !== 0)
		cursorValue += (resizeDirection.value[1] > 0)? "w": "e";
	cursorValue += "-resize";
	return {
		cursor: cursorValue
	};
});
const cornerDistance = 15; // px
const updateResizeDirection = (e) => {
	if (resizing.value || !isSelected.value)
		return; // don't update cursor while resizing or when not selected

	const outlineBox = outline.value.getBoundingClientRect();
	// ± 1 from center
	const relativeX = e.clientX - outlineBox.x - outlineBox.width / 2;
	const relativeY = e.clientY - outlineBox.y - outlineBox.height / 2;
	let direction = [0, 0];
	if (Math.abs(relativeY) > outline.value.offsetHeight / 2 - cornerDistance)
		direction[1] = (relativeY > 0)? 1: -1;
	if (Math.abs(relativeX) > outline.value.offsetWidth / 2 - cornerDistance)
		direction[0] = (relativeX > 0)? 1: -1;
	resizeDirection.value = direction;
};
// copies outlinecursor if resizing, or crosshair if rotating otherwise is null
const backgroundCursor = computed(() => {
	if (resizing.value)
		return outlineMouseStyle.value;
	if (rotating.value)
		return {cursor: "crosshair"};
	return null;
});

const updateSelection = (e, key) => {
	// event is cancelled in gamescren
	emit('updateSelection', e, key);
};
const finishMove = (itemKey, x, y, z) => {
	if (itemKey)
		emit('finishMove', itemKey, x, y, z);
	else
		emit('finishMove', key, props.x, props.y, props.z);
};
const finishResize = (itemKey, width, height) => {
	if (itemKey)
		emit('finishResize', itemKey, width, height);
	else
		emit('finishResize', key, props.width, props.height);
};
const finishRotate = (itemKey, rotation) => {
	if (itemKey)
		emit('finishRotate', itemKey, rotation);
	else
		emit('finishRotate', key, props.rotation);
}; // -------_______----------- TODO: add listener to gamescreen

const resizing = ref(false);
const rotater = ref(null);
const rotating = ref(false);
const currentRotation = computed(() => props.rotation);
const boardItem = ref(null);
// outline defined above
onMounted(() => {
	dragElement(boardItem.value, isSelected, emit, finishMove, cursorType);
	resizeElement(outline.value, boardItem.value, isSelected, emit, finishMove, finishResize, resizeDirection, resizing);
	rotateElement(rotater.value, boardItem.value, isSelected, emit, finishRotate, currentRotation, rotating);
});
</script>

<template>
	<div ref="boardItem" :id="key" class="board-item" :class="{child: props.isChild, childSelected: childSelected, selected: isSelected, parenting: isParenting}"
		:style="[positionStyle, sizeStyle]">
	<div class="rotation" :style="[cursorStyle, rotationStyle]" @click="(e) => updateSelection(e, key)">
		<div ref="outline" id="outline" :class="{hidden: !isSelected}" :style="outlineMouseStyle" @mousemove="updateResizeDirection">
			<div id="left" :class="{'pointer-events': isSelected}"></div>
			<div id="right" :class="{'pointer-events': isSelected}"></div>
			<div id="top" :class="{'pointer-events': isSelected}"></div>
			<div id="bottom" :class="{'pointer-events': isSelected}"></div>
		</div>
		<div ref="rotater" id="rotater" :class="{hidden: !isSelected, 'pointer-events': isSelected}" @mousedown="rotateStart"></div>

		<div id="background" v-if="isSelected && backgroundCursor" :style="backgroundCursor"></div>
		<div id="children">
			<!-- IF SOMETHING IS WORKING FOR THE PARENT, BUT NOT THE CHILDREN THE PROBLEM IS HERE -->
			<BoardItem v-for="item in props.children" :key="item.key" :thisItem="item"
			@updateSelection="updateSelection" :selectedItem = "props.selectedItem"
			@updateIntersection="onIntersect" :parentingItem="props.parentingItem"
			
			:x="item.x" :y="item.y" :z="item.z" @finishMove="finishMove" :absoluteX="item.absoluteX" :absoluteY="item.absoluteY"
			@move="(x, y, z) => item.moveTo(x, y, z)"
			
			:width="item.width" :height="item.height" 
			@finishResize="finishResize"
			@resize="(width, height) => item.resizeTo(width, height)"

			:rotation="item.rotation" @rotate="(rotation) => item.rotateTo(rotation)"
			@finishRotate="finishRotate"
			
			:type="item.type" :data="item.data"
			:children="item.children" :isChild="true" :parent="item.parent">
			</BoardItem>
		</div>
		
		<div id="content">
			<img class="item" v-if="props.type == 'img'" :src="props.data.dataURL">
			<p v-else>Backup thing</p>
		</div>
	</div>
	</div>
</template>

<style scoped>
* {
	display: block;
	user-select: none;
	transition: inherit;
}
div {
	position: absolute;
	display: block;
	width: 100%;
	height: 100%;
}

.rotation {
	pointer-events: all;
}
.board-item {
	position: absolute;
	transition: all 0.5s ease, z-index 0s ease 0.25s;
	pointer-events: none;
}
.board-item.child {
	transition: inherit;
}
/* Parenting has to appear first, to have lower priority */
.board-item.parenting {
	filter: drop-shadow(0.1em 0.1em 0.25em #25171a);
	transform: translate(-0.3em, -0.3em);
	z-index: 9999 !important; 
}
.board-item.parenting.child {
	transform: translate(0, 0);
}
.board-item.childSelected {
	z-index: 10000 !important;
}
.board-item.selected {
	opacity: 0.75;
	filter: drop-shadow(0.1em 0.1em 0.25em #25171a);
	transform: translate(-0.3em, -0.3em);
	z-index: 10000 !important; 
}
.board-item.selected.child {
	transform: translate(0, 0);
}

.pointer-events {
	pointer-events: all;
}
#outline {
	position: absolute;
	left: -0.3em;
	top: -0.3em;
	width: calc(100% + 0.6em);
	height: calc(100% + 0.6em);
	z-index: 10;
	pointer-events: none;
}
#outline.hidden {
	opacity: 0;
}
#outline div {
	position: absolute;
	background-color: #727DAC;
}
#outline #left {
	position: absolute;
	left: 0;
	width: 0.3em;
	top: 0;
	height: 100%;
}
#outline #right {
	position: absolute;
	right: 0;
	width: 0.3em;
	top: 0;
	height: 100%;
}
#outline #top {
	position: absolute;
	left: 0;
	width: 100%;
	top: 0;
	height: 0.3em;
}
#outline #bottom {
	position: absolute;
	left: 0;
	width: 100%;
	bottom: 0;
	height: 0.3em;
}

#rotater {
	position: absolute;
	right: -2em;
	bottom: -2em;
	width: 1em;
	height: 1em;
	border-radius: 50%;
	border: 0.25em solid #25171A;
	z-index: 10;
	pointer-events: all;
	cursor: crosshair;
	background-color: #727DAC;
}
#rotater.hidden {
	right: -0.5em;
	bottom: -0.5em;
	transform: scale(0);
	opacity: 0;
	pointer-events: none;
}

#background {
	position: fixed;
	width: 300vw;
	height: 300vh;
	left: -150vw;
	top: -150vh;
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
	z-index: 1;

	overflow: visible;
}

img {
	image-rendering: pixelated;
}
</style>