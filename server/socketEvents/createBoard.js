const { Board } = require("../classes/board.js");

module.exports = {
	name: "createBoard",
	function: (socket, peerId, settings, callback) => {
		const board = new Board(peerId, socket, settings);
		callback(board.id);
	}
};