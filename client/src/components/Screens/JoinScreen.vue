<script setup>
	import { inject, ref } from 'vue';
	import { BoardClient } from '../../assets/classes/boardClient';
	import LoadingText from '../LoadingText.vue';
	
	const peer = inject('peer');
	const props = defineProps(['data']);
	const emit = defineEmits(['changeScreen', 'updateData']);

	const status = ref("Connecting");

	socket.emit('joinBoard', props.data.gameId, (hostPeerId) => {
		const board = new BoardClient(socket, peer, props.data.gameId, props.data.gamePassword, hostPeerId, props.data.playerName);
		board.on("join", () => {
			emit('updateData', {
				"playerName": props.data.playerName,
				"board": board,
			});
			emit('changeScreen', 'GameScreen');
		});
		board.on("connUpdate", (newState) => {
			status.value = `${newState}`;
		});

		board.connect();
	});
</script>

<template>
	<div class="up-down-flex">
		<LoadingText :text="status"></LoadingText>
	</div>
</template>