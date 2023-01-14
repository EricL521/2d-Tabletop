// code for the host of the game
import { Board } from "./board";
import { BoardItemJSON } from "./boardItemJSON";

const connectionEvents = new Map();
connectionEvents.on = connectionEvents.set;

export class BoardClient extends Board {
	static connectionEvents = connectionEvents;

	constructor (socket, peer, gameId, password, hostPeerId, playerName) {
		super(socket, null, gameId, password, null, playerName);
		// null will be set once connected to host
		this.hostConn = null;

		// retry is whether or not it is a retry attempt
		this.connect = (isRetry) => {
			const conn = peer.connect(hostPeerId);
			this.onConnection(conn, isRetry);
		}
	}

	// takes in array of items creates them, and also creats this.boardItems (structured list) too
	parseItems(items) {
		items.forEach(item => this.addItem(item, true));
		BoardItemJSON.unsimplifyItems();
	}

	// overrided to add rerouting through server if failed to connect through webrtc
	onConnection (conn, isRetry) {
		this.connCheck = setTimeout(() => {
			delete this.connCheck; // no longer needed

			if (!isRetry) {
				conn.close();
				// try again
				this.connect(true);
				this.emit("connUpdate", "Connection Failed. Trying again");
			}
			else {
				conn.close();
				this.emit("connUpdate", "Rerouting through server");
				// route through server
				this.socket.on("routeOpen", this.onSocketConnection.bind(this));
				this.socket.emit("requestRoute", this.id); // this.id = boardid
			}
		}, 6000);
		super.onConnection(conn);
	}
	// ran once on connection
	onceConnection (conn) {
		clearTimeout(this.connCheck);
		delete this.connCheck;
		delete this.connect; // no longer needed

		this.hostConn = conn;
		this.emit("connUpdate", "Joining");
		// on first connecting, conn will emit a request to join game
		this.sendToHost('join', this.password, this.playerName);
	}

	// sends data to host
	sendToHost (...data) {
		this.hostConn.send(...data);
	}

	// foreign: false if the local user added the item 
	addItem (item, foreign) {
		super.addItem(item);
		if (!foreign)
			this.sendToHost('addItem', item);
	}
	moveItem (key, position, foreign) {
		super.moveItem(key, position);
		if (!foreign)
			this.sendToHost('moveItem', key, position);
	}
	scaleItem (key, scale, foreign) {
		super.scaleItem(key, scale);
		if (!foreign)
			this.sendToHost('scaleItem', key, scale);
	}
	parentItem (childKey, parentKey, foreign) {
		super.parentItem(childKey, parentKey);
		if (!foreign)
			this.sendToHost('parentItem', childKey, parentKey);
	}
	unparentItem (childKey, foreign) {
		super.unparentItem(childKey);
		if (!foreign)
			this.sendToHost('unparentItem', childKey);
	}

}

connectionEvents.on('joinResponse', function (conn, success, boardName, playerNames, settings, allItems, nextKey) {
	if (success) {
		this.name = boardName;
		this.playerNames = playerNames;
		this.settings = settings;
		this.parseItems(allItems);
		this.nextKey = nextKey;
		
		delete this.password; // no longer needed
		this.emit("join");
	}
	else {
		// implememnt later
	}
});
connectionEvents.on('addItem', function (conn, item) {
	this.addItem(item, true);
});
connectionEvents.on('moveItem', function(conn, key, position) {
	this.moveItem(key, position, true);
});
connectionEvents.on('scaleItem', function(conn, key, scale) {
	this.resizeItem(key, scale, true);
});
connectionEvents.on('parentItem', function(conn, childKey, parentKey) {
	this.parentItem(childKey, parentKey, true);
});
connectionEvents.on('unparentItem', function(conn, childKey) {
	this.unparentItem(childKey, true);
});