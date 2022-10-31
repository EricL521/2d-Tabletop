<script setup>
	import { inject } from 'vue';
	import { BoardHost } from '../../assets/classes/boardHost.js';
	import LoadingText from '../LoadingText.vue'
	
	const peer = inject('peer');
	const props = defineProps(['data']);
	const emit = defineEmits(['changeScreen', 'updateData']);

	socket.emit('createBoard', peer.id, props.data.settings, (gameId) => {
		const board = new BoardHost(props.data.gameName, gameId, props.data.password, props.data.settings, 
									props.data.playerName, peer);
		// update data
		emit('updateData', {
			"playerName": props.data.playerName,
			"board": board,
		});
		emit('changeScreen', 'GameScreen');
	});
	
</script>

<template>
	<div class="up-down-flex">
		<LoadingText>creating</LoadingText>
	</div>
</template>