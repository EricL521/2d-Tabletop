<script setup>
import StartScreen from './components/StartScreen.vue';
</script>

<template>
	<header>
		<div id="title">
			<h1 id="name">2D Tabletop Simulator</h1>
			<sub>Not at all based on Tabletop Simulator, also this name is very subject to change</sub>
		</div>
	</header>
	<main>
		<StartScreen />
	</main>
</template>

<style scoped>
header {
	width: 100%;
	height: 15%;
	padding: 1%;
	margin-bottom: 2%;
	-moz-box-sizing: border-box; 
	-webkit-box-sizing: border-box; 
	box-sizing: border-box;
	border-bottom: 2px solid #7280AC;
	box-shadow: 0 5px 10px #7280AC;
	background-color: #F1E4ED;
	border-radius: 0 0 2em 2em;

	display: flex;
	flex-direction: row;
	align-items: center;
	justify-content: left;
}
#title {
	width: min-content;
}
#name {
	padding: 0;
	margin: 0;
	display: inline-block;
	white-space: nowrap;
}

main {
	height: 85%;
	width: 100%;
}
</style>
