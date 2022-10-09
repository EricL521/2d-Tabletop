<script setup>
	import { ref } from 'vue';
	import ToggleSwitch from './ToggleSwitch.vue';
	
	const emit = defineEmits(['changeScreen', 'updateData']);

	const playerName = ref("");
	const playerNameInput = ref(null);
	
	const gameName = ref("");
	const gameNameInput = ref(null);
	const joinGamePassword = ref("");
	const isPublic = ref(false);
	const createGame = () => {
		playerNameInput.value.required = false;
		gameNameInput.value.required = false;
		if (!playerName.value) {
			playerNameInput.value.focus();
			return playerNameInput.value.required = true;
		}
		if (!gameName.value) {
			gameNameInput.value.focus();
			return gameNameInput.value.required = true;
		}

		emit('updateData', {
			"playerName": playerName.value, 
			"gameName": gameName.value, 
			"gamePassword": joinGamePassword.value, 
			"settings": { "isPublic": isPublic.value }
		});
		emit('changeScreen', 'CreateScreen');
	};

	const gameId = ref("");
	const gameIdInput = ref(null);
	const joinGame = () => {
		playerNameInput.value.required = false;
		gameIdInput.value.required = false;
		if (!playerName.value) {
			playerNameInput.value.focus();
			return playerNameInput.value.required = true;
		}
		if (!gameId.value) {
			gameIdInput.value.focus();
			return gameIdInput.value.required = true;
		}

		emit('updateData', {
			"playerName": playerName.value, 
			"gameId": gameId.value, 
			"gamePassword": joinGamePassword.value
		});
		emit('changeScreen', 'JoinScreen');
	};
</script>

<template>
	<div class="up-down-flex">
		<input id="name" placeholder="Your Username" v-model="playerName" ref="playerNameInput">
		<div class="left-right-flex" id="parent-div">
			<div class="up-down-flex" id="join-board">
				<h1>Join Board</h1>
				<input placeholder="Game Id" v-model="gameId" ref="gameIdInput">
				<input placeholder="Game Password (optional)" v-model="joinGamePassword">
				<button @click="joinGame">Join</button>
			</div>
			<div class="up-down-flex" id="create-board">
				<div id="create-board-title">
					<h1 id="title-text">Create Board</h1>
					<sub>Note: creating a board means YOU are hosting the server</sub>
				</div>
				<div class="up-down-flex" id="game-credentials">
					<input placeholder="Game Name" v-model="gameName" ref="gameNameInput">
					<input placeholder="Game Password (optional)" v-model="joinGamePassword">
				</div>
				<ToggleSwitch offBackgroundColor="#99FFCE" onBackgroundColor="#CE6964" offLabel="Private" onLabel="Public"
				@switch="(val) => {isPublic = val;}"/>
				<button @click="createGame">Create!</button>
			</div>
		</div>
	</div>
</template>

<style scoped>
	input, button {
		width: 80%;
		font-size: 150%;
		font-weight: 100;
		border-radius: 100vw;
		text-align: center;
		transition: 0.1s;
	}
	input {
		margin: 0.1em;
	}
	input:before {
		content: "!";
		display: block;
		position: absolute;
		left: 0px;
		/* opacity: 0; */
		transition: 0.1s;
	}
	input:required {
		border: 2px solid #C3423F;
		background-color: #E7B4B1;
	}
	input:required:before {
		opacity: 1;
	}

	button {
		width: 50%;
		box-shadow: 0.1rem 0.2rem #7280AC, 0.05rem 0.1rem #7280AC;
		background-color: #BCE3B5;
		transition-duration: 0.1s;
		cursor: pointer;
	}
	button:hover {
		background-color: #AFDDA6;
		transform: translate(-0.05rem, -0.1rem);
		box-shadow: 0.15rem 0.3rem #7280AC, 0.1rem 0.2rem #7280AC, 0.05rem 0.1rem #7280AC;
	}
	button:active {
		background-color: #A2D897;
		transform: translate(0.1rem, 0.2rem);
		box-shadow: 0 0 #7280AC;
	}

	#name {
		font-size: 200%;
	}

	#create-board, #left-div, #parent-div, #join-board {
		height: 100%;
		width: 100%;
	}
	#create-board {
		flex-shrink: 2;
	}
	#create-board-title {
		width: min-content;
	}
	#title-text {
		padding: 0;
		margin: 0;
		display: inline-block;
		white-space: nowrap;
	}
	#game-credentials {
		height: min-content; 
		width: 100%;
	}
</style>
