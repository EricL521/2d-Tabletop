<script setup>
import { computed, getCurrentInstance, ref, watch } from 'vue';
import Moveable from "vue3-moveable";

const emit = defineEmits(['updateSelection', 'updateIntersection', 'move', 'finishMove', 'resize', 'finishResize', 'rotate', 'finishRotate']);
const props = defineProps(['parentElement', 'selectedItem', 'parentingItem', 'thisItem', 'x', 'y', 'z', 'absoluteX', 'absoluteY',
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

// store a reactive copy of each of the transforms, so that we can update some of them without updating others
const position = ref([props.x, props.y]);
watch([() => props.x, () => props.y], ([x, y]) => {
	if (!dragging.value) {
		position.value = [x, y];
		localPosition = [x, y];
	}
});
const size = ref([props.width, props.height]);
watch([() => props.width, () => props.height], ([width, height]) => {
	if (!resizing.value) {
		size.value = [width, height]; 
		localResize = [width, height];
	}
});
const rotation = ref(props.rotation);
watch(() => props.rotation, (newRotation) => {
	if (!rotating.value) {
		rotation.value = newRotation; 
		localRotation = newRotation;
	}
});
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
	// emit('updateSelection', e, key);
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
const dragging = ref(false); let localPosition = [props.x, props.y];
const resizing = ref(false); let localResize = [props.width, props.height];
// eslint-disable-next-line vue/no-setup-props-destructure
const rotating = ref(false); let localRotation = props.rotation;
const dragStart = () => dragging.value = true;
const resizeStart = ({setOrigin, dragStart}) => {
	resizing.value = true;
	setOrigin(['%', '%']);
	dragStart && dragStart.set([position.value[0] - size.value[0]/2, position.value[1] - size.value[1]/2]);
};
const rotateStart = (e) => {
	rotating.value = true;
	e.set(localRotation);
};

const move = ({left, top}) => {
	localPosition = [left + localResize[0]/2, top + localResize[1]/2];
	boardItem.value.style.left = left + 'px';
	boardItem.value.style.top = top + 'px';
};
const resize = ({width, height, drag}) => {
	localResize = [width, height];
	boardItem.value.style.width = width + 'px';
	boardItem.value.style.height = height + 'px';
	if (drag.beforeTranslate)
		move({left: drag.beforeTranslate[0], top: drag.beforeTranslate[1]});
};
const rotate = ({beforeRotate}) => {
	localRotation = beforeRotate;
	boardItem.value.style.transform = 'rotate(' + (beforeRotate) + 'deg)';
};

const end = () => {
	[dragging, resizing, rotating].forEach(ref => ref.value = false);
};
const dragEnd = () => {
	end();
	finishDrag(key, localPosition[0], localPosition[1], props.z);
};
const resizeEnd = () => {
	end();
	finishDrag(key, localPosition[0], localPosition[1]);
	finishResize(key, localResize[0], localResize[1]);
};
const rotateEnd = () => {
	end();
	finishRotate(key, localRotation);
};

const boardItem = ref(null);
const childrenDiv = ref(null);
</script>

<template>
	<div ref="boardItem" :id="key" class="board-item" 
		:class="{child: props.isChild, childSelected: childSelected, selected: isSelected, parenting: isParenting, 'no-transition': moving}"
		:style="[positionStyle, sizeStyle, rotationStyle, cursorStyle]"
		@click="(e) => updateSelection(e, key)">
		<div ref="childrenDiv" id="children">
			<!-- IF SOMETHING IS WORKING FOR THE PARENT, BUT NOT THE CHILDREN THE PROBLEM IS HERE -->
			<BoardItem v-for="item in props.children" :key="item.key" :thisItem="item" :parentElement="childrenDiv"
			@updateSelection="updateSelection" :selectedItem = "props.selectedItem"
			@updateIntersection="onIntersect" :parentingItem="props.parentingItem"
			
			:x="item.x" :y="item.y" :z="item.z" @finishMove="finishDrag" :absoluteX="item.absoluteX" :absoluteY="item.absoluteY"
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

	<Moveable
		:target="boardItem" :container="props.parentElement"
		:draggable="true" :resizable="true" :rotatable="true" :pinchable="true"
		@drag="move" @resize="resize" @rotate="rotate" 
		@dragStart="dragStart" @resizeStart="resizeStart" @rotateStart="rotateStart"
		@dragEnd="dragEnd" @resizeEnd="resizeEnd" @rotateEnd="rotateEnd"
	/>
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
.no-transition {
	transition: none !important;
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
	filter: drop-shadow(0.1em 0.1em 0.25em #25171a);
	transform: translate(-0.3em, -0.3em);
	z-index: 9999 !important; 
}
.board-item.parenting.child {
	filter: none;
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
	filter: none;
	transform: translate(0, 0);
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