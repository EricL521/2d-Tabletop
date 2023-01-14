/* eslint-disable no-unused-vars */
import { createApp } from 'vue'
import App from './App.vue'

import './assets/main.css'

import './assets/peerjs.min.js'
// create global peerjs object (in vuejs)
const peer = new Peer(null, {	
	host: 'localhost',
	port: 9000,
	secure: false, // this is what fixed it!
	path: '/peerjs',
});
peer.on('open', () => {
	console.log("peerjs connected");
});
peer.on('error', (err) => {
	console.error(err);
});
window.peer = peer;

const app = createApp(App);
app.provide('peer', peer);
app.mount('#app');
