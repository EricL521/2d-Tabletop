// manages creation of boards, and joining and leaving boards
// does not manage updating boards, will use webrtc for most things

// im just gonna save the sockets because theoretically it points to the same object in memory
class Board {
	static boards = new Map();
	static addBoard(board) {return Board.boards.set(board.id, board);};
	static getBoard(id) {return Board.boards.get(id);};
	static deleteBoard(id) {return Board.boards.delete(id);};

	static availableBoardIds = (() => {
		const tempBoard = [];
		for (let i = 100; i < 1000; i ++)
			tempBoard.push(i);
		return tempBoard;
	})();
	static generateBoardId = () => {
		return Board.availableBoardIds.splice(Math.floor(Board.availableBoardIds.length * Math.random()), 1)[0];
	};

	// for now, sockets will be stored in case they're needed in the future for transferring ownership
	constructor(hostPeerId, hostSocket, settings) {
		this.id = Board.generateBoardId();
		Board.addBoard(this);
		this.settings = settings;

		this.host = {
			peerId: hostPeerId,
			socket: hostSocket
		};

		this.players = [];
	}

	// host will communicate to this server to add a player
	addPlayer (socket) {
		this.players.push({
			socket
		});
	}
}

module.exports = { Board };