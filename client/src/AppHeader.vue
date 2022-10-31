<script setup>
import { computed } from 'vue';

const props = defineProps(['min', 'title']);
const titleText = computed(() => {
	return props.title? props.title: // fallback text:
	'2D Tabletop Simulator'
});
</script>

<template>
	<header :class="{'min-header': props.min}">
		<div id="title">
			<h1 id="name" :class="{'min-name': props.min}">{{ titleText }}</h1>
			<sub v-if="!props.min">Not at all based on Tabletop Simulator, also this name is very subject to change</sub>
		</div>
		<div id="filler" :class="{'min-filler': props.min}"></div>
	</header>
</template>

<style scoped>
* {
	transition: all 0.5s ease, max-width 0s;
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

	z-index: 1000000;
	overflow: hidden;
}
#filler {
	width: 100vw;
	flex-shrink: 1;
	box-sizing: border-box;
}
#title {
	width: min-content;
}
#name {
	padding: 0;
	margin: 0;
	display: block;
	white-space: nowrap;
}
sub {
	bottom: 0;
}

#name.min-name {
	font-size: 1.5em;
	font-weight: 400;
}
header.min-header {
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
