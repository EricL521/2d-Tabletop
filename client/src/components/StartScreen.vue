<script setup>
	import { ref } from 'vue';
	import ToggleSwitch from './ToggleSwitch.vue';

	const name = ref("");
	
	const gameName = ref("");
	const gamePassword = ref("");
	const isPublic = ref(false);	
	const createGame = () => {

	};

	const gameId = ref("");
	const joinGame = () => {

	}
</script>

<template>
	<div class="up-down-flex">
		<input id="name" placeholder="Ingame Name" v-model="name">
		<div class="left-right-flex" id="parent-div">
			<div class="up-down-flex" id="join-board">
				<h1>Join Board</h1>
				<input placeholder="Game Id" v-model="gameId">
				<button @click="joinGame">Join</button>
			</div>
			<div class="up-down-flex" id="create-board">
				<h1>Create Board</h1>
				<div class="up-down-flex" style="height: min-content; width: 100%;">
					<input placeholder="Game Name" v-model="gameName">
					<input placeholder="Game Password (optional)" v-model="gamePassword">
				</div>
				<ToggleSwitch offBackgroundColor="#99FFCE" onBackgroundColor="#C54A44" offLabel="Private" onLabel="Public"
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
	}
	input {
		margin: 0.1em;
	}
	input:required {
		border: 2px solid #C3423F;
		background-color: #E7B4B1;
	}
	button {
		width: 50%;
		box-shadow: 0.1rem 0.2rem #7280AC;
		background-color: #BCE3B5;
		transition-duration: 0.1s;
		cursor: pointer;
	}
	button:hover {
		background-color: #AFDDA6;
		transform: translate(-0.05rem, -0.1rem);
		box-shadow: 0.15rem 0.3rem #7280AC;
	}
	button:active {
		background-color: #A2D897;
		transform: translate(0.1rem, 0.2rem);
		box-shadow: 0 0 #7280AC;
	}

	#create-board, #left-div, #parent-div, #join-board {
		height: 100%;
		width: 100%;
	}
	#create-board {
		flex-shrink: 2;
	}
</style>
