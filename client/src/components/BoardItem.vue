<script setup>
import { computed, getCurrentInstance, ref, watch } from 'vue';
import Moveable from "vue3-moveable";

const emit = defineEmits(['updateSelection', 'updateIntersection', 'finishMove', 'finishScale', 'finishRotate']);
const props = defineProps(['parentElement', 'selectedItem', 'parentingItem', 'thisItem', 'position',
							'size', 'scale', 'rotation', 'type', 'data', 'children', 'isChild',
							'parentPosition', 'parentScale', 'parentRotation']); // these are used to cancel out parent transforms
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
const localPos = ref(props.position);
watch(() => props.location, (newPosition) => {if (!dragging.value) localPos.value = newPosition;});
const localScale = ref(props.scale); 
watch(() => props.scale, (newScale) => {if (!scaling.value) localScale.value = newScale;});
const localRotation = ref(props.rotation);
watch(() => props.rotation, (newRotation) => {if (!rotating.value) localRotation.value = newRotation;});
const zStyle = computed(() => {
	return {
		zIndex: props.z
	};
});
// returns the position of the lement after centering it
const getCenteredPos = (pos, size) => [pos[0] - size[0]/2, pos[1] - size[1]/2];
const sizeStyle = computed(() => {return {
	// NOTE: the size is changed by scale in transform
	width: props.size[0] + 'px',
	height: props.size[1] + 'px'
}});
// also contains position
const transformStyle = computed(() => {return {
	transform: getTransform(localPos.value, localRotation.value, localScale.value)
}});
const getTransform = (position, rotation, scale) => {
	const pos = getCenteredPos(position, props.size);
	return 'translate(' + pos[0] + 'px, ' + pos[1] + 'px' + ')' + ' ' +
		'rotate(' + rotation + 'deg)' + ' ' +
		'scale(' + scale[0] + ', ' + scale[1] + ')';
};
const reverseParentTransform = computed(() => {
	if (!props.isChild)
		return {};
	return {
		transform: 'scale(' + (1/props.parentScale[0]) + ', ' + (1/props.parentScale[1]) + ')' +
			'rotate(' + -props.parentRotation + 'deg)' + ' ' +
			'translate(' + -props.parentPosition[0] + 'px, ' + -props.parentPosition[1] + 'px' + ')'
	};
});

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
const finishDrag = (itemKey, position) => {
	emit('finishMove', itemKey, position);
};
const finishScale = (itemKey, size) => {
	emit('finishScale', itemKey, size);
};
const finishRotate = (itemKey, rotation) => {
	emit('finishRotate', itemKey, rotation);
};

// storing whether the item is being dragged, resized, or rotated, so it won't update if someone else is doing it
const moving = computed(() => dragging.value || scaling.value || rotating.value);
const dragging = ref(false); const scaling = ref(false); const rotating = ref(false);
const dragStart = ({set}) => {
	if (!isSelected.value) return;

	cursorType.value = "grabbing";
	dragging.value = true;
	// NOTE: There is no need to getCeneteredPos, because drag also does not use getCenteredPos
	set(localPos.value);
};
const scaleStart = (e) => {
	if (!isSelected.value) return;

	scaling.value = true;
	e.set(localScale.value);
	if (e.dragStart)
		dragStart(e.dragStart);
};
const rotateStart = (e) => {
	if (!isSelected.value) return;

	rotating.value = true;
	e.set(localRotation.value);
};

const drag = ({beforeTranslate}) => {
	if (!isSelected.value) return;
	if (!beforeTranslate) return;

	// NOTE: There is no need to getCeneteredPos, because drag also does not use getCenteredPos
	localPos.value = beforeTranslate.slice(0, 2);
	props.thisItem.moveTo(localPos.value);
	boardItem.value.style.transform = getTransform(localPos.value, localRotation.value, localScale.value);
};
// this one is different (with e), because I want drag function to be called that
const scale = (e) => {
	if (!isSelected.value) return;
 
	localScale.value = e.scale;
	props.thisItem.scaleTo(localScale.value);
	boardItem.value.style.transform = getTransform(localPos.value, localRotation.value, localScale.value);
	drag(e.drag);
};
const rotate = ({beforeRotate}) => {
	if (!isSelected.value) return;

	localRotation.value = beforeRotate % 360;
	props.thisItem.rotateTo(localRotation.value);
	boardItem.value.style.transform = getTransform(localPos.value, localRotation.value, localScale.value);
};

const end = () => {
	[dragging, scaling, rotating].forEach(ref => ref.value = false);
};
const dragEnd = () => {
	if (!isSelected.value) return;

	end();
	cursorType.value = "grab";
	finishDrag(key, ...localPos.value);
};
const scaleEnd = () => {
	if (!isSelected.value) return;

	end();
	dragEnd();
	finishScale(key, localScale.value);
};
const rotateEnd = () => {
	if (!isSelected.value) return;

	end();
	finishRotate(key, localRotation.value);
};

const boardItem = ref(null);
</script>

<template>
	<div ref="boardItem" :id="key" class="board-item" 
		:class="{child: props.isChild, childSelected: childSelected, parentSelected: parentSelected, selected: isSelected, 
				parenting: isParenting, 'no-transition': moving}"
		:style="[zStyle, sizeStyle, transformStyle, cursorStyle]"
		@click="(e) => updateSelection(e, key)">
		<div id="children">
			<!-- IF SOMETHING IS WORKING FOR THE PARENT, BUT NOT THE CHILDREN THE PROBLEM IS HERE -->
			<BoardItem v-for="item in props.children" :key="item.key" :thisItem="item" 
			@updateSelection="updateSelection" :selectedItem="props.selectedItem"
			@updateIntersection="onIntersect" :parentingItem="props.parentingItem"
			
			:position="item.position" @finishMove="finishDrag"
			:size="item.size" :scale="item.scale" @finishScale="finishScale"
			:rotation="item.rotation" @finishRotate="finishRotate"
			
			:type="item.type" :data="item.data"
			:children="item.children" :isChild="true" 
			
			:parentElement="props.parentElement"
			:parent-position="getCenteredPos(localPos, props.size)" :parent-scale="localScale" :parent-rotation="localRotation">
			</BoardItem>
		</div>
		
		<div id="content">
			<img class="item" v-if="props.type == 'img'" :src="props.data.dataURL">
			<p v-else>Backup thing</p>
		</div>
	</div>

	<div id="moveable-wrapper" :class="{hidden: !isSelected}" :style="reverseParentTransform">
		<Moveable
			className="moveable"
			:target="boardItem" :container="props.parentElement" :origin="false"
			:draggable="true" :scalable="true" :rotatable="true" :pinchable="true"
			@drag="drag" @scale="scale" @rotate="rotate" 
			@drag-start="dragStart" @scale-start="scaleStart" @rotate-start="rotateStart"
			@drag-end="dragEnd" @scale-end="scaleEnd" @rotate-end="rotateEnd"
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
	width: 100%;
	height: 100%;
	z-index: 1000000;
	overflow: visible;

	pointer-events: none;

	transition: opacity 0.5s ease;
	opacity: 1;
}
#moveable-wrapper.hidden {
	opacity: 0;
	pointer-events: none;
}
.moveable {
	width: 0px !important;
	height: 0px !important;
	pointer-events: all !important;
}

.board-item {
	position: absolute;
	transition: all 0.5s ease, z-index 0s ease 0.25s;
	pointer-events: all;
	left: 0;
	top: 0;
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