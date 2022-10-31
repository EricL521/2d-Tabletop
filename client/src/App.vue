<script setup>
import { computed, ref } from 'vue';
import AppHeader from './AppHeader.vue';

import HomeScreen from './components/Screens/HomeScreen.vue';
import CreateScreen from './components/Screens/CreateScreen.vue';
import JoinScreen from './components/Screens/JoinScreen.vue';
import GameScreen from './components/Screens/GameScreen.vue';

const minHeader = ref(false);
const titleContent = ref(null);

const screens = {HomeScreen, CreateScreen, JoinScreen, GameScreen};
const screen = ref("HomeScreen");
const currentScreen = computed(() => screens[screen.value]);

// used to transfer data between components
const data = ref({});
</script>

<template>
	<AppHeader :min="minHeader" :title="titleContent"></AppHeader>
	<main>
		<component :is="currentScreen" @changeScreen="(newScreen) => screen = newScreen"
			@updateData="(newData) => data = newData" :data="data"
			@updateHeader="(min, title) => {minHeader = min; titleContent = title;}"/>
	</main>
</template>

<style scoped>
main {
	width: 100%;
	position: relative;
	flex-grow: 1;
	transition-duration: 0.5s;
}
</style>
