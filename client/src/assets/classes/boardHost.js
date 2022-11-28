// code for the host of the game
import { Board } from "./board";

const connectionEvents = new Map();
connectionEvents.on = connectionEvents.set;

export class BoardHost extends Board {
	static connectionEvents = connectionEvents;

	constructor (name, gameId, password, settings, playerName, peer) {
		super(name, gameId, password, settings, playerName);
		
		this.playerConnections = new Map(); 
		// conn => name b/c connections fire disconnect events

		peer.on('connection', this.onConnection.bind(this));
	}
	onceConnectionClose (conn) {
		this.removePlayer(conn);
	}

	updatePlayers (ignoredConn, event, ...args) {
		for (const conn of this.playerConnections.keys())
			if (conn !== ignoredConn)
				conn.send([event, ...args]);
	}
	// connection is the connection of the player that added the item, or null
	addItem (item, playerConn) {
		super.addItem(item);
		this.updatePlayers(playerConn, 'addItem', item);
	}
	moveItem (key, x, y, playerConn) {
		super.moveItem(key, x, y);
		this.updatePlayers(playerConn, 'moveItem', key, x, y);
	}
	resizeItem (key, width, height, playerConn) {
		super.resizeItem(key, width, height);
		this.updatePlayers(playerConn, 'resizeItem', key, width, height);
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

connectionEvents.on('join', function (conn, password, playerName) {
	if (!password || this.password === password) {
		this.addPlayer(playerName, conn);
		conn.send(['joinResponse', true, this.name, Array.from(this.playerNames), 
					this.settings, Array.from(this.allItems), this.nextKey]);
	}
	else {
		conn.send(['joinResponse', false]);
		conn.close();
	}
});
connectionEvents.on('addItem', function (conn, item) {
	this.addItem(item, conn);
});
connectionEvents.on('moveItem', function(conn, key, x, y) {
	this.moveItem(key, x, y, conn);
});
connectionEvents.on('resizeItem', function(conn, key, width, height) {
	this.resizeItem(key, width, height, conn);
});