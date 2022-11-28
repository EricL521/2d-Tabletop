<script setup>
import { computed, getCurrentInstance, onMounted, ref, watch } from 'vue';
import { resizeElement, dragElement } from './BoardItemHelper.js';

const emit = defineEmits(['updateSelection', 'updateIntersection', 'move', 'finishMove', 'resize', 'finishResize']);
const props = defineProps(['selectedItem', 'parentingItemKey', 'x', 'y', 'z', 'absoluteX', 'absoluteY',
							'width', 'height', 'type', 'data', 'children', 'isChild']);
const key = getCurrentInstance().vnode.key;
const isSelected = ref(false);
const isParenting = ref(false);
watch(() => props.parentingItemKey, (newVal) => {
	isParenting.value = newVal === key;
});
// watch if selected item overlaps with this one
watch(() => props.selectedItem, (newVal) => {
	isSelected.value = newVal? (newVal.key === key): false;
	if (newVal && !(newVal.key == key))
		emit('updateIntersection', key, intersectionArea(newVal));
}, {deep: true});
// returns the percent area of intersection if intersecting, or null if not
const intersectionArea = (item) => {
	const smallXItem = item.width < props.width? item: props;
	const bigXItem = item.width < props.width? props: item;
	const smallYItem = item.height < props.height? item: props;
	const bigYItem = item.height < props.height? props: item;

	const lowerXIn = smallXItem.absoluteX >= bigXItem.absoluteX && smallXItem.absoluteX <= bigXItem.absoluteX + bigXItem.width;
	const upperXIn = smallXItem.absoluteX + smallXItem.width >= bigXItem.absoluteX && smallXItem.absoluteX + smallXItem.width <= bigXItem.absoluteX + bigXItem.width;
	const lowerYIn = smallYItem.absoluteY >= bigYItem.absoluteY && smallYItem.absoluteY <= bigYItem.absoluteY + bigYItem.height;
	const upperYIn = smallYItem.absoluteY + smallYItem.height >= bigYItem.absoluteY && smallYItem.absoluteY + smallYItem.height <= bigYItem.absoluteY + bigYItem.height;
	
	if (!((lowerXIn || upperXIn) && (lowerYIn || upperYIn)))
		return 0;
	
	return (lowerXIn? Math.abs(props.x + props.width - item.x): Math.abs(item.x + item.width - props.x)) * 
			(lowerYIn? Math.abs(props.y + props.height - item.y): Math.abs(item.y + item.height - props.y)) / 
			(props.width * props.height);
}

const cancelEvent = (e) => {e.preventDefault(); e.stopPropagation();};

const positionStyle = computed(() => {
	return {
		left: props.x + 'px',
		top: props.y + 'px',
		zIndex: isSelected.value? 10000: props.z
	};
});
const sizeStyle = computed(() => {return {
	width: props.width + 'px',
	height: props.height + 'px'
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
// echoes outlinecursor if resizing, otherwise is nul
const backgroundCursor = computed(() => {
	if (resizing.value)
		return outlineMouseStyle.value;
	return null;
});

const updateSelection = (e, key) => {
	cancelEvent(e);
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

const resizing = ref(false);
const boardItem = ref(null);
// outline defined above
onMounted(() => {
	dragElement(boardItem.value, isSelected, emit, finishMove, cursorType);
	resizeElement(outline.value, boardItem.value, isSelected, emit, finishMove, finishResize, resizeDirection, resizing);
});
</script>

<template>
	<div :id="key" class="board-item" :class="{child: props.isChild, selected: isSelected || isParenting, transparent: isSelected}"
		:style="[positionStyle, cursorStyle, sizeStyle]" 
	@click="(e) => updateSelection(e, key)" ref="boardItem">
		<div ref="outline" id="outline" :class="{hidden: !isSelected}" :style="outlineMouseStyle" @mousemove="updateResizeDirection">
			<div class="left"></div>
			<div class="right"></div>
			<div class="top"></div>
			<div class="bottom"></div>
		</div>
		<div id="background" v-if="isSelected && backgroundCursor" :style="backgroundCursor"></div>
		<div id="children">
			<BoardItem v-for="[key, item] in props.children" :key="key"
			@updateSelection="updateSelection" :selectedItem = "props.selectedItem"
			
			:x="item.x" :y="item.y" :z="item.z" @finishMove="finishMove" 
			@move="(x, y, z) => {item.x = x? x: item.x; item.y = y? y: item.y; item.z = z? z: item.z;}"
			
			:width="item.width" :height="item.height" 
			@finishResize="finishResize"
			@resize="(width, height) => {item.width = width? width: item.width; item.height = height? height: item.height;}"
			
			:type="item.type" :data="item.data"
			:children="item.children" :isChild="true">
			</BoardItem>
		</div>
		
		<div id="content">
			<img class="item" v-if="props.type == 'img'" :src="props.data.dataURL">
			<p v-else>Backup thing</p>
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

.board-item {
	position: absolute;
	transition: all 0.5s ease, z-index 0s ease 0.25s;
}
.board-item.child {
	transition: inherit;
}
.board-item.selected {
	box-shadow: #25171a 0.4em 0.4em 0.8em;
	transform: translate(-0.3em, -0.3em);
}
.board-item.transparent {
	opacity: 0.75;
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
#outline div {
	position: absolute;
	pointer-events: all;
	background-color: #727DAC;
}
#outline .left {
	position: absolute;
	left: 0;
	width: 0.3em;
	top: 0;
	height: 100%;
}
#outline .right {
	position: absolute;
	right: 0;
	width: 0.3em;
	top: 0;
	height: 100%;
}
#outline .top {
	position: absolute;
	left: 0;
	width: 100%;
	top: 0;
	height: 0.3em;
}
#outline .bottom {
	position: absolute;
	left: 0;
	width: 100%;
	bottom: 0;
	height: 0.3em;
}
#outline.hidden {
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