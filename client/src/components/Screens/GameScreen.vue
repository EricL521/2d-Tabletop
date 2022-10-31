<script setup>
import { computed, ref } from 'vue';
import BoardItem from '../BoardItem.vue';
const props = defineProps(['data']);
const emit = defineEmits(['updateHeader', 'changeScreen', 'updateData']);
// eslint-disable-next-line vue/no-setup-props-destructure
const board = props.data.board;
emit('updateHeader', true, `${board.name} - ${board.id}`);

const cancelEvent = (e) => {e.preventDefault(); e.stopPropagation();};

const updateItems = ref(0);
board.on('update', () => updateItems.value ++);
// NOTE: only updating will update to the items in the board
const items = computed(() => {
	updateItems.value; // used to force update since board isn't reactive
	console.log("Updating Screen");
	return board.boardItems;
});
const updateSelection = (e, key) => {
	cancelEvent(e);
	board.selectItem(key)
};

// keys assigned in board, as they need to be synced
const addItem = (x, y, z, width, height, type, data, children) => {
	board.addItem({
		x, y, z, 
		width, height,
		type, data,
		children: children? children: []
	});
};

const uploadData = (e) => {
	cancelEvent(e);
	
	const fileReader = new FileReader();
	fileReader.readAsDataURL(e.dataTransfer.files[0]);
	fileReader.onload = async (file) => {
		const res = file.target.result;
		const img = await resizeImg(100000, res);
		addItem(e.clientX - img.width/2, e.clientY - img.height/2, 0, img.width, img.height, "img", {dataURL: img.toDataURL()});
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
</script>

<template>
	<div id="game-screen">
		<div id="tool-bar">
			<img src="../../assets/icons/Paint_Brush.svg">
		</div>
		<div id="board-item-container" @drop="uploadData"
		@dragover="cancelEvent" @drag="cancelEvent">
			<BoardItem v-for="[key, item] in items" :key="key"
			@click="(e) => updateSelection(e, key)" @deselect="updateSelection" :selected = "item.selected"
			:x="item.x" :y="item.y" :z="item.z" @finishMove="board.moveItem(key, item.x, item.y)" 
			@move="(x, y, z) => {item.x = x? x: item.x; item.y = y? y: item.y; item.z = z? z: item.z;}"
			:width="item.width" :height="item.height" @finishResize="board.resizeItem(key, item.width, item.height)"
			@resize="(width, height) => {item.width = width? width: item.width; item.height = height? height: item.height;}"
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