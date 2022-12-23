/* eslint-disable no-unused-vars */
import { createApp } from 'vue'
import App from './App.vue'

import './assets/main.css'

import './assets/peerjs.min.js'
// create global peerjs object (in vuejs)
const peer = new Peer(null, {
	config: { // i wrote my own rerouting so im gonna use it
		iceServers: []
	},
	host: '/',
	path: '/peerjs',
	port: 9000 // firefox takes a LONG time to connect for some reason, but it still does :)
});
peer.on('open', () => {
	console.log("open");
});
peer.on('error', (err) => {
	console.error(err);
});
window.peer = peer;

const app = createApp(App);
app.provide('peer', peer);
app.mount('#app');
