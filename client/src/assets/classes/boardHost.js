// code for the host of the game
import { Board } from "./board";

const connectionEvents = new Map();
connectionEvents.on = connectionEvents.set;

connectionEvents.on('join', (board, conn, password, playerName) => {
	console.log("processing join event");
	if (!password || board.password === password) {
		board.addPlayer(playerName, conn);
		conn.send(['joinResponse', true, board.name, [...board.playerNames], board.settings]);
		console.log("success");
	}
	else {
		conn.send(['joinResponse', false]);
		conn.close();
	}
});

export class BoardHost extends Board {
	static connectionEvents = connectionEvents;

	constructor (name, gameId, password, settings, playerName, peer) {
		super(name, gameId, password, settings, playerName);
		
		this.playerConnections = new Map(); 
		// conn => name b/c connections fire disconnect events

		console.log(peer.id);

		peer.on('connection', this.onConnection.bind(this));
	}

	addPlayer (name, connection) {
		super.addPlayer(name);
		this.playerConnections.set(connection, name);
	}
	removePlayer (connection) {
		connection.close();
		super.removePlayer(this.playerConnections.get(connection));
		this.playerConnections.delete(connection);
	}
}