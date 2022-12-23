// manages creation of boards, and joining and leaving boards
// does not manage updating boards, will use webrtc for most things
// does create listeners for routed sockets

// im just gonna save the sockets because theoretically it points to the same object in memory
class Board {
	static boards = new Map();
	static addBoard(board) {return Board.boards.set(board.id, board);};
	static getBoard(id) {return Board.boards.get(id);};
	static deleteBoard(id) {return Board.boards.delete(id);};

	// array of available board ids
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

		// socket.id => socket object
		this.players = new Map();
		// set of client socket ids
		this.routes = new Set();
	}

	// added on join request
	addPlayer (socket) {
		this.players.set(socket.id, {
			socket
		});
	}
	// returns player socket
	getPlayer (socketId) {
		return this.players.get(socketId).socket;
	}
	// do later -______----------__________----------____________----------------__________--------------
	removePlayer (socket) {
		this.players.delete(socket.id);
		this.routes.delete(socket.id);
	}

	// adds close and open events
	createRoute(playerId) {
		const player = this.getPlayer(playerId);
		const host = this.host.socket;
		if (!player)
			return;
		// add sender to routes
		this.routes.add(playerId);
		
		// add listeners
		player.on('disconnect', () => {
			host.emit('routeClose', playerId);
			this.routes.delete(playerId);
		});
		host.on('disconnect', () => player.emit('routeClose'));

		// open route
		player.emit('routeOpen', host.id); host.emit('routeOpen', playerId);
	}
	// sends data to the things
	sendData(senderId, receieverId, ...data) {
		if (!(this.routes.has(senderId) || this.routes.has(receieverId)))
			return;
		// if sender is host, then it can send to all players
		// must have created route to use
		if (senderId === this.host.socket.id) {
			const socket = this.getPlayer(receieverId);
			socket.emit('routeData', senderId, ...data);
		}
		// if sender is a player, then it can only send to the host
		else if (receieverId === this.host.socket.id) {
			const socket = this.host.socket;
			socket.emit('routeData', senderId, ...data);
		}
	}
}

module.exports = { Board };