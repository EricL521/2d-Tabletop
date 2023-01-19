<script setup>
import { computed, getCurrentInstance, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import Moveable from "moveable";

const emit = defineEmits(['updateSelection', 'updateIntersection', 'finishMove', 'finishScale', 'finishRotate']);
const props = defineProps(['updater', 'parentElement', 'selectedItem', 'parentingItem', 'thisItem', 'position',
							'size', 'scale', 'rotation', 'type', 'data', 'children', 'isChild']);
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

const cancelEvent = (e) => {e.preventDefault(); e.stopPropagation();};

// store a local copy of each of the transforms, so that we can update some of them without updating others
const localPos = ref(props.position);
watch(() => props.position, (newPosition) => {if (!dragging.value) localPos.value = newPosition;});
const localScale = ref(props.scale); 
watch(() => props.scale, (newScale) => {if (!scaling.value) localScale.value = newScale;});
const localRotation = ref(props.rotation);
watch(() => props.rotation, (newRotation) => {if (!rotating.value) localRotation.value = newRotation;});

const zStyle = computed(() => {
	return {
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

const cursorType = ref("pointer");
const cursorStyle = computed(() => {return {cursor: cursorType.value}});
watch(isSelected, () => {
	// if grabbing, don't change cursor
	if (cursorType.value === "grabbing")
		return;
	
	if (isSelected.value)
		cursorType.value = "grab";
	else
		cursorType.value = "pointer";
});

// start of interacting managing
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
// dragging should select element
const dragStart = ({set, inputEvent}) => {
	cancelEvent(inputEvent);
	// if there is no item selected, then this item should be selected when dragging
	if (!isSelected.value) {
		// update transition
		boardItem.value.classList.add("no-transition");
		updateSelection(inputEvent, key);
	}

	cursorType.value = "grabbing";
	dragging.value = true;
	// NOTE: There is no need to getCenteredPos, because drag also does not use getCenteredPos
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
	if (snap.value) // round to dragSnap
		localPos.value = localPos.value.map((x) => Math.round(x / dragSnap) * dragSnap);
	props.thisItem.moveTo(localPos.value);
	boardItem.value.style.transform = getTransform(localPos.value, localRotation.value, localScale.value);
};
// this one is different (with e), because I want drag function to be called that
const scale = (e) => {
	if (!isSelected.value) return;
 
	localScale.value = e.scale;
	if (snap.value) // round to scaleSnap
		localScale.value = localScale.value.map((x) => Math.round(x / scaleSnap) * scaleSnap);
	props.thisItem.scaleTo(localScale.value);
	boardItem.value.style.transform = getTransform(localPos.value, localRotation.value, localScale.value);
	drag(e.drag);
};
const rotate = ({beforeRotate}) => {
	if (!isSelected.value) return;

	localRotation.value = beforeRotate % 360;
	if (snap.value) // round to rotateSnap
		localRotation.value = Math.round(localRotation.value / rotateSnap) * rotateSnap;
	props.thisItem.rotateTo(localRotation.value);
	boardItem.value.style.transform = getTransform(localPos.value, localRotation.value, localScale.value);
};

// resets the dragging, scaling, rotating
const end = () => {
	[dragging, scaling, rotating].forEach(ref => ref.value = false);
};
const dragEnd = () => {
	if (!dragging.value) return;
	end();
	cursorType.value = "grab";
	finishDrag(key, localPos.value);
};
const scaleEnd = () => {
	if (!scaling.value) return;
	end();
	finishScale(key, localScale.value);
	dragEnd();
};
const rotateEnd = () => {
	if (!rotating.value) return;
	end();
	finishRotate(key, localRotation.value);
};

// snap values
const dragSnap = 5;
const scaleSnap = 0.25;
const rotateSnap = 15;
// detect if shift key is pressed
const snap = ref(false);
const keyDown = (e) => {if (e.key === "Shift") snap.value = true;};
const keyUp = (e) => {if (e.key === "Shift") snap.value = false;};
document.addEventListener('keydown', keyDown);
document.addEventListener('keyup', keyUp);
watch(snap, (snap) => {
	if (!moveable) return;
	if (snap) {
		moveable.keepRatio = true;
		moveable.throttleDrag = dragSnap;
		moveable.throttleScale = scaleSnap;
		moveable.throttleRotate = rotateSnap;
	}
	else {
		moveable.keepRatio = false;
		moveable.throttleDrag = 0;
		moveable.throttleScale = 0;
		moveable.throttleRotate = 0;
	}
});

const boardItem = ref(null);
let moveable = null;
let moveableElement = null;
onMounted(() => {
	new Promise((res) => {
		const moveableSettings = {
			className: `moveable${key}`,
			target: boardItem.value,
			container: props.parentElement,
			draggable: true, scalable: true, rotatable: true, pinchable: true,
			origin: false
		};
		
		if (props.parentElement)
			return res(new Moveable(props.parentElement, moveableSettings));
		const unwatch = watch(() => props.parentElement, (parent) => {
			unwatch();
			return res(new Moveable(parent, moveableSettings));
		});
	}).then((m) => {
		moveable = m;
		moveableElement = document.querySelector(`.moveable${key}`);
		moveableElement.style.transition = "opacity 0.5s ease";

		m.on("dragStart", dragStart).on("drag", drag).on("dragEnd", dragEnd);
		m.on("scaleStart", scaleStart).on("scale", scale).on("scaleEnd", scaleEnd);
		m.on("rotateStart", rotateStart).on("rotate", rotate).on("rotateEnd", rotateEnd);
		window.m = m;
	});
});
watch(isSelected, (isSelected) => {
	if (!moveableElement)
		return;
	
	moveableElement.style.opacity = isSelected ? 1 : 0;
	moveableElement.style.pointerEvents = isSelected ? "all" : "none";
});

onBeforeUnmount(() => {
	document.removeEventListener('keydown', keyDown);
	document.removeEventListener('keyup', keyUp);
	if (!moveable) return;
	moveable.destroy();
});
</script>

<template>
	<div ref="boardItem" :id="key" class="board-item" 
		:class="{child: props.isChild, childSelected: childSelected, parentSelected: parentSelected, selected: isSelected, 
				parenting: isParenting, 'no-transition': moving}"
		:style="[zStyle, sizeStyle, transformStyle, cursorStyle]"
		@click="(e) => updateSelection(e, key)">
		<div id="children">
			<!-- IF SOMETHING IS WORKING FOR THE PARENT, BUT NOT THE CHILDREN THE PROBLEM IS HERE -->
			<BoardItem v-for="item in props.children" :key="item.key" :thisItem="item" :updater="props.updater"
			@updateSelection="updateSelection" :selectedItem="props.selectedItem"
			@updateIntersection="onIntersect" :parentingItem="props.parentingItem"
			
			:position="item.position" @finishMove="finishDrag"
			:size="item.size" :scale="item.scale" @finishScale="finishScale"
			:rotation="item.rotation" @finishRotate="finishRotate"
			
			:type="item.type" :data="item.data"
			:children="item.children" :isChild="true" 
			
			:parentElement="props.parentElement"/>
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
.board-item div {
	position: absolute;
	display: block;
	width: 100%;
	height: 100%;
}

.board-item {
	position: absolute;
	transition: all 0.5s ease, z-index 0s ease 0.25s;
	pointer-events: all;
	left: 0;
	top: 0;
}
.board-item.no-transition {
	transition: opacity 0.5s ease !important;
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
	image-rendering: crisp-edges;
}
</style>