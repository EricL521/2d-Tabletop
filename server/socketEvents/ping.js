module.exports = {
	name: "ping",
	function: (socket, callback) => {
		console.log("ping");
		socket.emit("pong");
		callback();
	}
}