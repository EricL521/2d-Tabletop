<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
const props = defineProps(['text']);
const displayText = ref(props.text); // for transitioning text
let transitionInterval = null;
// where the transition happens
watch(() => props.text, (newText) => {
	clearInterval(transitionInterval);
	if (!newText)
		newText = "";
	
	// array of chars which need to be changed
	let unfinishedChars = new Set();
	for (let i = 0; i < displayText.value.length; i ++)
		if (i >= newText.length || displayText.value[i] !== newText[i])
			unfinishedChars.add(i);
	
	transitionInterval = setInterval(() => {
		if (newText == displayText.value)
			return clearInterval(transitionInterval);

		// randomize all characters
		unfinishedChars.forEach((i) => {
			// chance decreases as more characters finish
			if (!(Math.random() * 2 > Math.pow(unfinishedChars.size / displayText.value.length, 1/2)))
				return; // chance of not changing
			
			// chance of just going to the correct value
			if (i < newText.length && Math.random() > Math.pow(unfinishedChars.size / displayText.value.length, 1/2))
				displayText.value = displayText.value.substring(0, i) + newText[i] + displayText.value.substring(i + 1);
			else // random character within new text
				displayText.value = displayText.value.substring(0, i) + 
								newText[Math.floor(Math.random() * newText.length)] + 
								displayText.value.substring(i + 1);
			if (newText[i] == displayText.value[i])
				unfinishedChars.delete(i);
		});
		
		const lengthDifference = newText.length - displayText.value.length;
		// increasing chance of removing or adding character as more chars finish, and when length difference is greater
		if (lengthDifference > 0 && Math.sqrt(lengthDifference) * Math.random() > unfinishedChars.size / displayText.value.length) { // adding
			displayText.value += newText[Math.floor(Math.random() * newText.length)];
			unfinishedChars.add(displayText.value.length - 1);
		}
		if (lengthDifference < 0 && Math.sqrt(-lengthDifference) * Math.random() > unfinishedChars.size / displayText.value.length) { // removing
			displayText.value = displayText.value.substring(0, displayText.value.length - 1);
			unfinishedChars.delete(displayText.value.length);
		}
	}, 25);
});

// for period animation
const index = ref(0);
const spacingStyle = computed(() => {return {
	width: index.value * 0.5 + 'em'
}});
const counterSpacingStyle = computed(() => {return {
	width: (2 - index.value) * 0.5 + 'em'
}});
let interval;
onMounted(() => {
	interval = setInterval(() => {
		if (index.value ++ >= 2)
			index.value = 0;
	}, 1000);
});
onUnmounted(() => {
	clearInterval(interval);
});
</script>

<template>
<h1>
	<p>{{ displayText }}</p>
	<span :style="spacingStyle"></span> .
	<span :style="counterSpacingStyle"></span>
</h1>
</template>

<style scoped>
p {
	display: inline-block;
	margin: 0;
	transition: all 0.5s ease;
}
span {
	display: inline-block;
	height: 100%;
	transition: width 0.5s ease;
}
</style>