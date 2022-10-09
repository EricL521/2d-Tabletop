/* eslint-disable no-unused-vars */
import { createApp } from 'vue'
import App from './App.vue'

import './assets/main.css'

import './assets/peerjs.min.js'
const peer = new Peer(null, {
	host: '/',
	path: '/peerjs',
	port: 9000
});

const app = createApp(App);
app.provide('peer', peer);
app.mount('#app');
