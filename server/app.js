const express = require('express')
const path = require('path')
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
	console.log('a user connected');
	
	socket.onAny((event, ...args) => {
		try {
			socketEvents.get(event)(socket, ...args);
		} catch (error) {
			console.error(error);
		}
	});
});