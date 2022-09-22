const express = require('express')
const path = require('path')
const app = express();
const port = 3000;
const http = require('http');
const server = http.createServer(app);

const { Server } = require("socket.io");
const io = new Server(server);

app.get('/', (req, res) => {
	res.send("api is online");
});

server.listen(port, () => {
	console.log(`Example app listening on port ${port}`)
});

io.on('connection', (socket) => {
	console.log('a user connected');

	socket.on("ping", () => {
		console.log("ping");
		socket.emit("pong");
	});
});