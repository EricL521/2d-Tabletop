<script setup>
// import { ref } from 'vue';

// const items = ref([]);
const props = defineProps(['data']);
</script>

<template>
	<h1>Game ID: {{ props.data.board.gameId }}</h1>
	<h1>GAME SCREN SO FAR</h1>
</template>