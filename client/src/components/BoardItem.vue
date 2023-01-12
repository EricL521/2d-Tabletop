<script setup>
import { computed, getCurrentInstance, ref, watch } from 'vue';
import Moveable from "vue3-moveable";

const emit = defineEmits(['updateSelection', 'updateIntersection', 'move', 'finishMove', 'resize', 'finishResize', 'rotate', 'finishRotate']);
const props = defineProps(['parentElement', 'selectedItem', 'parentingItem', 'thisItem', 'x', 'y', 'z',
							'width', 'height', 'rotation', 'type', 'data', 'children', 'isChild', 'parent']);
const key = getCurrentInstance().vnode.key;
const isSelected = ref(props.selectedItem && props.selectedItem.key === key);
// if child is selected, move parent to top
const childSelected = ref(false);
const parentSelected = ref(false);
const isParenting = ref(false);
watch(() => props.parentingItem, (parentingItem) => {
	if (!parentingItem)
		return isParenting.value = false;
	isParenting.value = parentingItem.key === key || props.thisItem.isAncestorOf(parentingItem);
});
function itemWatcher(event) {
	if (!["move", "resize", "rotate", "select"].includes(event))
		return;
	// watch for overlapping if items not related at all
	if ((props.thisItem.isParentOf(this) || !props.thisItem.isAncestorOf(this))
		&& !props.thisItem.isDescendantOf(this))
		onIntersect(key, this.percentAreaCoveredBy(props.thisItem));
}
watch(() => props.selectedItem, (selectedItem, oldSelectedItem) => {
	if (oldSelectedItem)
		oldSelectedItem.offAny(itemWatcher);

	isSelected.value = selectedItem? (selectedItem.key === key): false;
	childSelected.value = props.thisItem.isAncestorOf(selectedItem);
	parentSelected.value = props.thisItem.isDescendantOf(selectedItem);
	if (!selectedItem || isSelected.value)
		return;

	// call itemWatcher once b/c the first time, it is not called
	itemWatcher.bind(selectedItem)("select");
	selectedItem.onAny(itemWatcher);
}, {deep: false});
const onIntersect = (itemKey, areaPercent) => {
	emit('updateIntersection', itemKey, areaPercent);
};

// store a local copy of each of the transforms, so that we can update some of them without updating others
const position = ref([props.x, props.y]);
watch([() => props.x, () => props.y], ([x, y]) => {if (!dragging.value) position.value = [x, y];});
const size = ref([props.width, props.height]);
watch([() => props.width, () => props.height], ([width, height]) => {if (!resizing.value) size.value = [width, height];});
const rotation = ref(props.rotation);
watch(() => props.rotation, (newRotation) => {if (!rotating.value) rotation.value = newRotation;});
// x and y are the center of the item
const positionStyle = computed(() => {
	return {
		left: position.value[0] - size.value[0]/2 + 'px',
		top: position.value[1] - size.value[1]/2 + 'px',
		zIndex: props.z
	};
});
const sizeStyle = computed(() => {return {
	width: size.value[0] + 'px',
	height: size.value[1] + 'px'
}});
const rotationStyle = computed(() => {return {
	transform: 'rotate(' + rotation.value + 'deg)'
}});

const cursorType = ref("pointer");
const cursorStyle = computed(() => {return {cursor: cursorType.value}});
watch(isSelected, () => {
	if (isSelected.value)
		cursorType.value = "grab";
	else
		cursorType.value = "pointer";
});

const updateSelection = (e, key) => {
	// event is cancelled in gamescren
	emit('updateSelection', e, key);
};
const finishDrag = (itemKey, x, y, z) => {
	if (itemKey != null)
		emit('finishMove', itemKey, x, y, z);
	else
		emit('finishMove', key, props.x, props.y, props.z);
};
const finishResize = (itemKey, width, height) => {
	if (itemKey != null)
		emit('finishResize', itemKey, width, height);
	else
		emit('finishResize', key, props.width, props.height);
};
const finishRotate = (itemKey, rotation) => {
	if (itemKey != null)
		emit('finishRotate', itemKey, rotation);
	else
		emit('finishRotate', key, props.rotation);
}; // -------_______----------- TODO: add listener to gamescreen

// storing whether the item is being dragged, resized, or rotated, so it won't update if someone else is doing it
const moving = computed(() => dragging.value || resizing.value || rotating.value);
const dragging = ref(false); const resizing = ref(false); const rotating = ref(false);
const dragStart = () => {
	if (!isSelected.value) return;

	cursorType.value = "grabbing";
	dragging.value = true;
};
const resizeStart = ({setOrigin, dragStart}) => {
	if (!isSelected.value) return;

	resizing.value = true;
	setOrigin(['%', '%']);
	dragStart && dragStart.set([position.value[0] - size.value[0]/2, position.value[1] - size.value[1]/2]);
};
const rotateStart = (e) => {
	if (!isSelected.value) return;

	rotating.value = true;
	e.set(rotation.value);
};

const drag = ({left, top}) => {
	if (!isSelected.value) return;

	position.value = [left + size.value[0]/2, top + size.value[1]/2];
	props.thisItem.moveTo(...position.value);
	boardItem.value.style.left = left + 'px';
	boardItem.value.style.top = top + 'px';
};
// this one is different, because I want drag function to be called that
const resize = (e) => {
	if (!isSelected.value) return;
	const width = e.width; const height = e.height;

	size.value = [width, height];
	props.thisItem.resizeTo(...size.value);
	boardItem.value.style.width = width + 'px';
	boardItem.value.style.height = height + 'px';
	if (e.drag.beforeTranslate)
		drag({left: e.drag.beforeTranslate[0], top: e.drag.beforeTranslate[1]});
};
const rotate = ({beforeRotate}) => {
	if (!isSelected.value) return;

	rotation.value = beforeRotate;
	props.thisItem.rotateTo(rotation.value);
	boardItem.value.style.transform = 'rotate(' + (beforeRotate) + 'deg)';
};

const end = () => {
	[dragging, resizing, rotating].forEach(ref => ref.value = false);
};
const dragEnd = () => {
	if (!isSelected.value) return;

	end();
	cursorType.value = "grab";
	finishDrag(key, ...position.value);
};
const resizeEnd = () => {
	if (!isSelected.value) return;

	end();
	dragEnd();
	finishResize(key, ...size.value);
};
const rotateEnd = () => {
	if (!isSelected.value) return;

	end();
	finishRotate(key, rotation.value);
};

const boardItem = ref(null);
const childrenDiv = ref(null);
</script>

<template>
	<div ref="boardItem" :id="key" class="board-item" 
		:class="{child: props.isChild, childSelected: childSelected, parentSelected: parentSelected, selected: isSelected, 
				parenting: isParenting, 'no-transition': moving}"
		:style="[positionStyle, sizeStyle, rotationStyle, cursorStyle]"
		@click="(e) => updateSelection(e, key)">
		<div ref="childrenDiv" id="children">
			<!-- IF SOMETHING IS WORKING FOR THE PARENT, BUT NOT THE CHILDREN THE PROBLEM IS HERE -->
			<BoardItem v-for="item in props.children" :key="item.key" :thisItem="item" :parentElement="childrenDiv"
			@updateSelection="updateSelection" :selectedItem = "props.selectedItem"
			@updateIntersection="onIntersect" :parentingItem="props.parentingItem"
			
			:x="item.x" :y="item.y" :z="item.z" @finishMove="finishDrag"
			:width="item.width" :height="item.height" @finishResize="finishResize"
			:rotation="item.rotation" @finishRotate="finishRotate"
			
			:type="item.type" :data="item.data"
			:children="item.children" :isChild="true" :parent="item.parent">
			</BoardItem>
		</div>
		
		<div id="content">
			<img class="item" v-if="props.type == 'img'" :src="props.data.dataURL">
			<p v-else>Backup thing</p>
		</div>
	</div>

	<div id="moveable-wrapper" :class="{hidden: !isSelected}">
		<Moveable
			className="moveable"
			:target="boardItem" :container="props.parentElement" :origin="false"
			:draggable="true" :resizable="true" :rotatable="true" :pinchable="true"
			@drag="drag" @resize="resize" @rotate="rotate" 
			@dragStart="dragStart" @resizeStart="resizeStart" @rotateStart="rotateStart"
			@dragEnd="dragEnd" @resizeEnd="resizeEnd" @rotateEnd="rotateEnd"
		/>
	</div>
</template>

<style scoped>
* {
	display: block;
	user-select: none;
	transition: inherit;
}
.board-item div {
	position: absolute;
	display: block;
	width: 100%;
	height: 100%;
}
#moveable-wrapper {
	position: absolute;
	left: 0;
	top: 0;
	width: 0;
	height: 0;
	z-index: 1000000;
	overflow: visible;

	pointer-events: all;

	transition: opacity 0.5s ease;
	opacity: 1;
}
#moveable-wrapper.hidden {
	opacity: 0;
	pointer-events: none;
}

.board-item {
	position: absolute;
	transition: all 0.5s ease, z-index 0s ease 0.25s;
	pointer-events: all;
}
.board-item.child {
	transition: inherit;
}
/* Parenting has to appear first, to have lower priority */
.board-item.parenting {
	z-index: 9999 !important; 
}
.board-item.childSelected {
	z-index: 10000 !important;
}
.board-item.selected {
	opacity: 0.8;
	z-index: 10000 !important; 
}
.board-item::before {
	content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: transparent;

	transition: box-shadow 0.5s ease;
}
.board-item.parenting::before, .board-item.selected::before, .board-item.parentSelected::before {
	box-shadow: 0em 0em 1em #25171a;
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
	image-rendering: auto;
}
</style>