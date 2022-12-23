// sets up a route through server to host
const { Board } = require("../classes/board.js");

// sends data to client/host
module.exports = {
	name: "requestRoute",
	function: (socket, boardId) => {
		boardId = parseInt(boardId);
		const board = Board.boards.get(boardId);
		if (!board)
			return;
		
		board.addPlayer(socket);
		board.createRoute(socket.id);
	}
}