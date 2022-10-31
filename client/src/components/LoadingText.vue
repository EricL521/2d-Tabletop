<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue';

const index = ref(0);
const spacingStyle = computed(() => {return {
	width: index.value * 0.5 + 'em'
}});
const counterSpacingStyle = computed(() => {return {
	width: (2 - index.value) * 0.5 + 'em'
}})

let interval;
onMounted(() => {
	interval = setInterval(() => {
		if (index.value ++ >= 2)
			index.value = 0;
	}, 1250);
});
onUnmounted(() => {
	clearInterval(interval);
})
</script>

<template>
<h1>
	<slot>Loading</slot>
	<span :style="spacingStyle"></span> .
	<span :style="counterSpacingStyle"></span>
</h1>
</template>

<style scoped>
span {
	display: inline-block;
	height: 100%;
	transition: width 0.5s ease;
}
</style>