// code for the host of the game
import { Board } from "./board";
import { BoardItemJSON } from "./boardItemJSON";

const connectionEvents = new Map();
connectionEvents.on = connectionEvents.set;

export class BoardHost extends Board {
	static connectionEvents = connectionEvents;

	constructor (socket, name, gameId, password, settings, playerName, peer) {
		super(socket, name, gameId, password, settings, playerName);
		
		this.playerConnections = new Map(); 
		// connID => name b/c connections fire disconnect events

		peer.on('connection', this.onConnection.bind(this));
		socket.on("routeOpen", this.onSocketConnection.bind(this));
	}
	onceConnectionClose (conn) {
		this.removePlayer(conn);
	}
	
	// ignoreconn is the connection which the update came from
	updatePlayers (ignoredConn, event, ...args) {
		for (const conn of this.playerConnections.keys())
			if (conn !== ignoredConn)
				conn.send(event, ...args);
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
	parentItem (childKey, parentKey, playerConn) {
		super.parentItem(childKey, parentKey);
		this.updatePlayers(playerConn, 'parentItem', childKey, parentKey);
	}
	unparentItem (childKey, playerConn) {
		super.unparentItem(childKey);
		this.updatePlayers(playerConn, 'unparentItem', childKey);
	}

	addPlayer (name, connection) {
		super.addPlayer(name);
		this.playerConnections.set(connection, name);
	}
	removePlayer (connection) {
		super.removePlayer(this.playerConnections.get(connection));
		this.playerConnections.delete(connection.id);
	}
}

connectionEvents.on('join', function (conn, password, playerName) {
	if (!password || this.password === password) {
		this.addPlayer(playerName, conn);
		conn.send('joinResponse', true, this.name, this.playerNames, 
					this.settings, BoardItemJSON.getSimplifiedItems(), this.nextKey);
	}
	else {
		conn.send('joinResponse', false);
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
connectionEvents.on('parentItem', function(conn, childKey, parentKey) {
	this.parentItem(childKey, parentKey, conn);
});
connectionEvents.on('unparentItem', function(conn, childKey) {
	this.unparentItem(childKey, conn);
});