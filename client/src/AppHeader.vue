<script setup>
const props = defineProps(['min']);
</script>

<template>
	<header :style="{width: headerWidth}" :class="{'min-header': props.min}">
		<div id="title">
			<h1 id="name" :class="{'min-name': props.min}">2D Tabletop Simulator</h1>
			<sub v-if="!props.min">Not at all based on Tabletop Simulator, also this name is very subject to change</sub>
		</div>
		<div id="filler" :class="{'min-filler': props.min}"></div>
	</header>
</template>

<style scoped>
* {
	transition-property: width, height, font-size, padding, border-radius, box-shadow;
	transition-duration: 0.5s;
}

header {
	box-sizing: border-box;
	height: min-content;
	width: min-content;
	max-width: 100vw;
	display: flex;
	flex-direction: row;
	justify-content: flex-start;

	padding: 1em;
	padding-bottom: 1.5em;

	border-bottom: 2px solid #7280AC;
	box-shadow: 0 5px 10px #7280AC;
	background-color: #F1E4ED;
	border-radius: 0 0 2em 2em;

	z-index: 100;
	overflow: hidden;
}
#filler {
	width: 100vw;
	flex-shrink: 1;
}
#title {
	width: min-content;
}
#name {
	padding: 0;
	margin: 0;
	display: block;
	white-space: nowrap;
	font-weight: 600;
}

.min-name {
	font-size: 1.5em;
	font-weight: 400;
}
.min-header {
	position: fixed;
	top: 0;
	left: 0;
	border-radius: 0 0 1em 0;
	padding: 0.5em;
	box-shadow: 2px 0 5px #7280AC, 0 2px 5px #7280AC;

	align-items: flex-start;
}
#filler.min-filler {
	width: 0;
}
</style>
