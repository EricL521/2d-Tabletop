const { Board } = require("../classes/board.js");

module.exports = {
	name: "joinBoard",
	function: (socket, boardId, callback) => {
		boardId = parseInt(boardId);

		const board = Board.boards.get(boardId);
		callback(board.host.peerId);
	}
};