<script setup>
import { computed, onMounted, ref } from 'vue';
import BoardItem from '../BoardItem.vue';
const props = defineProps(['data']);
const emit = defineEmits(['updateHeader', 'changeScreen', 'updateData']);
// eslint-disable-next-line vue/no-setup-props-destructure
const board = props.data.board;
console.log(`${board.name} - ${board.id}`);
emit('updateHeader', true, `${board.name} - ${board.id}`);

const cancelEvent = (e) => {e.preventDefault(); e.stopPropagation();};

// NOTE: COMPUTED IS NEEDED TO FORCE THE UPDATE
const updater = ref(0);
const items = computed(() => {
	updater.value; // force update when updater changes
	console.log("updated");
	return board.boardItems;
});
board.onAny(() => {
	updater.value++;
});

const selectedItem = ref(null);
board.on("itemSelect", (key, item) => {
	setTimeout(() => selectedItem.value = item, 0);
});
const updateSelection = (e, key) => {
	cancelEvent(e);
	// if deselecting and parenting, then parent
	if (selectedItem.value && selectedItem.value.key != key) {
		board.parentItem(selectedItem.value, parentingItem.value);
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
const addItem = (x, y, z, width, height, type, data, parent) => {
	board.addItem({
		x, y, z, 
		width, height,
		type, data,
		parent: parent? parent: null
	});
};

const uploadData = (e) => {
	cancelEvent(e);
	
	const fileReader = new FileReader();
	console.log(e);
	fileReader.readAsDataURL(e.dataTransfer.files[0]);
	fileReader.onload = async (file) => {
		const res  = file.target.result;
		const img = await resizeImg(100000, res);
		addItem(e.clientX, e.clientY, 0, img.width, img.height, "img", {dataURL: img.toDataURL()});
	};
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
const boardItemContainer = ref(null);
onMounted(() => {
	document.addEventListener("drop", uploadData);
	document.addEventListener("dragover", cancelEvent);
	document.addEventListener("drag", cancelEvent);
});
</script>

<template>
	<div id="game-screen">
		<div id="tool-bar">
			<img src="../../assets/icons/Paint_Brush.svg">
		</div>
		<div ref="boardItemContainer" id="board-item-container" :class="{pointer: selectedItem}" @click="(e) => {updateSelection(e);}">
			<!-- For nonchildren only -->
			<BoardItem v-for="[key, item] in items" :key="key" :thisItem="item" :parentElement="boardItemContainer"
			@updateSelection="updateSelection" :selectedItem="selectedItem"
			@updateIntersection="onIntersect" :parentingItem="parentingItem"
			
			:x="item.x" :y="item.y" :z="item.z"	@finishMove="(key, x, y, z) => board.moveItem(key, x, y, z)" 
			:width="item.width" :height="item.height" @finishResize="(key, width, height) => board.resizeItem(key, width, height)"
			:rotation="item.rotation" @finishRotate="(key, rotation) => board.rotateItem(key, rotation)" 

			:type="item.type" :data="item.data"
			:children="item.children">
			</BoardItem>
		</div>
	</div>
</template>

<style scoped>
#game-screen, #board-item-container {
	width: 100%;
	height: 100%;
	user-select: none;
}
#board-item-container.pointer {
	cursor: pointer;
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

.highlight {
	border-color: #7280AC;
	background-color: #B2B9D2;
}
</style>