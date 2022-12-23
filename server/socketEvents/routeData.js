const { Board } = require("../classes/board.js");

// sends data to client/host
module.exports = {
	name: "routeData",
	function: (socket, boardId, receieverId, ...data) => {
		boardId = parseInt(boardId);
		const board = Board.boards.get(boardId);
		if (!board)
			return;
		
		board.sendData(socket.id, receieverId, ...data);
	}
}