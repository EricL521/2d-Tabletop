<script setup>
import { computed, getCurrentInstance, onMounted, ref, watch } from 'vue';
import { resizeElement, dragElement } from './BoardItemHelper.js';

const emit = defineEmits(['updateSelection', 'updateIntersection', 'move', 'finishMove', 'resize', 'finishResize']);
const props = defineProps(['selectedItem', 'parentingItem', 'thisItem', 'x', 'y', 'z', 'absoluteX', 'absoluteY',
							'width', 'height', 'type', 'data', 'children', 'isChild', 'parent']);
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
	childSelected.value = selectedItem? props.thisItem.isAncestorOf(selectedItem): false;

	if (!selectedItem || (selectedItem.key === key))
		return;
	// watch for overlapping if different item
	if (!props.thisItem.isDescendantOf(selectedItem))
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

const resizing = ref(false);
const boardItem = ref(null);
// outline defined above
onMounted(() => {
	dragElement(boardItem.value, isSelected, emit, finishMove, cursorType);
	resizeElement(outline.value, boardItem.value, isSelected, emit, finishMove, finishResize, resizeDirection, resizing);
});
</script>

<template>
	<div :id="key" class="board-item" :class="{child: props.isChild, childSelected: childSelected, selected: isSelected, parenting: isParenting}"
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
			<!-- IF SOMETHING IS WORKING FOR THE PARENT, BUT NOT THE CHILDREN THE PROBLEM IS HERE -->
			<BoardItem v-for="item in props.children" :key="item.key" :thisItem="item"
			@updateSelection="updateSelection" :selectedItem = "props.selectedItem"
			@updateIntersection="onIntersect" :parentingItem="props.parentingItem"
			
			:x="item.x" :y="item.y" :z="item.z" @finishMove="finishMove" :absoluteX="item.absoluteX" :absoluteY="item.absoluteY"
			@move="(x, y, z) => {item.x = x? x: item.x; item.y = y? y: item.y; item.z = z? z: item.z;}"
			
			:width="item.width" :height="item.height" 
			@finishResize="finishResize"
			@resize="(width, height) => {item.width = width? width: item.width; item.height = height? height: item.height;}"
			
			:type="item.type" :data="item.data"
			:children="item.children" :isChild="true" :parent="item.parent">
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
/* Parenting has to appear first, to have lower priority */
.board-item.parenting {
	box-shadow: #25171a 0.4em 0.4em 0.8em;
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
	box-shadow: #25171a 0.4em 0.4em 0.8em;
	transform: translate(-0.3em, -0.3em);
	z-index: 10000 !important; 
}
.board-item.selected.child {
	transform: translate(0, 0);
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