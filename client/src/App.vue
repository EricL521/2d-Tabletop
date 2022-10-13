<script setup>
import { computed, ref } from 'vue';
import AppHeader from './AppHeader.vue';

import HomeScreen from './components/HomeScreen.vue';
import CreateScreen from './components/CreateScreen.vue';
import JoinScreen from './components/JoinScreen.vue';
import GameScreen from './components/GameScreen.vue';

const minHeader = ref(false);

const screens = {HomeScreen, CreateScreen, JoinScreen, GameScreen};
const screen = ref("HomeScreen");
const currentScreen = computed(() => screens[screen.value]);

// used to transfer data between components
const data = ref({});
</script>

<template>
	<AppHeader :min="minHeader"></AppHeader>
	<main>
		<component :is="currentScreen" @changeScreen="(newScreen) => screen = newScreen"
			@updateData="(newData) => data = newData" :data="data"
			@minHeader="(min) => minHeader = min"/>
	</main>
</template>

<style scoped>
main {
	margin-top: 2em;
	width: 100%;
	position: relative;
	flex-grow: 1;
	transition-duration: 0.5s;
}
</style>
