// code for the host of the game
import { Board } from "./board";

const connectionEvents = new Map();
connectionEvents.on = connectionEvents.set;

export class BoardClient extends Board {
	static connectionEvents = connectionEvents;

	constructor (gameId, password, hostPeerId, playerName, peer) {
		super(null, gameId, password, null, playerName);
		// nulls of these will be set once connected to host
		this.hostConn = null;

		// retry is whether or not it is a retry attempt
		this.connect = (isRetry) => {
			this.onConnection(peer.connect(hostPeerId), isRetry);
		}
	}

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
				// implement later
				console.log("rerourting through server")
			}
		}, 5000);

		super.onConnection(conn);
	}
	// ran once on connection
	onceConnection (conn) {
		clearTimeout(this.connCheck);
		delete this.connCheck;

		this.hostConn = conn;
		this.emit("connUpdate", "Joining");
		// on first connecting, conn will emit a request to join game
		conn.send(['join', this.password, this.playerName]);
	}

	// foreign: false if the local user added the item 
	addItem (item, foreign) {
		super.addItem(item);
		if (!foreign)
			this.hostConn.send(['addItem', item]);
	}
	moveItem (key, x, y, foreign) {
		super.moveItem(key, x, y);
		if (!foreign)
			this.hostConn.send(['moveItem', key, x, y]);
	}
	resizeItem (key, width, height, foreign) {
		super.resizeItem(key, width, height);
		if (!foreign)
			this.hostConn.send(['resizeItem', key, width, height]);
	}

}

connectionEvents.on('joinResponse', function (conn, success, boardName, playerNames, settings, boardItems, nextKey) {
	if (success) {
		this.name = boardName;
		this.playerNames = new Set(playerNames);
		this.settings = settings;
		this.boardItems = new Map(boardItems);
		this.nextKey = nextKey;
		
		delete this.password; // no longer needed

		this.emit("joined");
	}
	else {
		// implememnt later
	}
});
connectionEvents.on('addItem', function (conn, item) {
	this.addItem(item, true);
});
connectionEvents.on('moveItem', function(conn, key, x, y) {
	this.moveItem(key, x, y, true);
});
connectionEvents.on('resizeItem', function(conn, key, width, height) {
	this.resizeItem(key, width, height, true);
});