// peerjs server
const { PeerServer } = require('peer');
const peerServer = PeerServer({ port: 9000, path: '/peerjs' });
peerServer.on('connection', (client) => { console.log("peerjs connection"); });
peerServer.on('disconnect', (client) => { console.log("peerjs disconnect"); });

const express = require('express');
const path = require('path');
const app = express();
const port = 3000;
const http = require('http');
const server = http.createServer(app);

const { Server } = require("socket.io");
const fs = require('fs');
const io = new Server(server);

// actual webpage is /api (directed to here)
app.get('/', (req, res) => {
	res.send("api is online");
});

server.listen(port, () => {
	console.log(`Running on localhost:${port}`);
});

const socketEvents = new Map();
const eventFiles = fs.readdirSync("./socketEvents").filter(file => file.endsWith(".js"));
for (const file of eventFiles) {
	const socketEvent = require(`./socketEvents/${file}`);
	socketEvents.set(socketEvent.name, socketEvent.function);
}
io.on('connection', (socket) => {
	socket.onAny((event, ...args) => {
		try {
			socketEvents.get(event)(socket, ...args);
		} catch (error) {
			console.log(event);
			console.error(error);
		}
	});
});