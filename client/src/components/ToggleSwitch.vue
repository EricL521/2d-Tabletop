<script setup>
import { ref } from 'vue';

defineProps({
	offBackgroundColor: String,
	onBackgroundColor: String,
	offLabel: String,
	onLabel: String,
});
const emit = defineEmits(['switch']);
const input = ref(null);

const isOn = ref(false);
emit('switch', isOn.value);
</script>

<template>
	<label class="left-right-flex" id="parent">
		<div class="switch">
			<input type="checkbox" name="is-public" v-model="isOn" ref="input">			
			<span class="slider" :style="'background-color: ' + (isOn? onBackgroundColor: offBackgroundColor)"></span>
		</div>
		<div class="switch-label-container">
			<p :class="{'switch-label': true, invisible: isOn}">{{ offLabel }}</p>
			<p :class="{'switch-label': true, invisible: !isOn}">{{ onLabel }}</p>
		</div>
	</label>
</template>

<style scoped>
p {
	padding: 0.1em;
	padding-bottom: 0;
	margin: 0;
}
.switch-label-container {
	display: grid;
}
.switch-label {
	grid-column: 1 / span 1;
	grid-row: 1 / span 1;
	transition: 0.4s;
	user-select: none;
}
.invisible {
	opacity: 0;
}

#parent {
	position: relative;
	cursor: pointer;

	width: fit-content;
	height: min-content;
	font-size: 150%;
}

.switch {
	position: relative;
	height: 100%;
	aspect-ratio: 2/1;
}
.slider {
	display: inline-block;
	position: absolute;
	height: 100%;
	aspect-ratio: 2/1;
	border-radius: 100vh;
	border: 1px solid #7280AC;
	-moz-box-sizing: border-box; 
	-webkit-box-sizing: border-box;
	box-sizing: border-box;
	transition: 0.4s;
}
.switch input {
	display: none;
}
.slider:before {
	content: "";
	height: 90%;
	aspect-ratio: 1/1;
	border: 1px solid #7280AC;
	-moz-box-sizing: border-box; 
	-webkit-box-sizing: border-box; 
	box-sizing: border-box;
	border-radius: 100vh;
	background-color: white;
	transition: 0.4s;

	position: absolute;
	left: 2.5%;
	top: 5%;
}
input:checked + .slider:before {
	left: 97.5%;
	transform: translate(-100%, 0);
}
</style>