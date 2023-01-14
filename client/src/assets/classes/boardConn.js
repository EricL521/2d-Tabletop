// there's only one socket object
// set up socket listeners
socket.on("routeData", (senderId, ...data) => BoardConn.get(senderId).emit("data", ...data));
socket.on("routeClose", (senderId, ...data) => BoardConn.get(senderId).emit("close", ...data));

// represents a connection to another client
// wraps conn class
// also manages routing through server
export class BoardConn {
	// id => BoardConn
	static connections = new Map();
	static set(id, conn) {return BoardConn.connections.set(id, conn);}
	static get(id) {return BoardConn.connections.get(id);}
	static delete(id) {return BoardConn.connections.delete(id);}
	static has(id) {return BoardConn.connections.has(id);}

	// conn is either a socket or a peer
	// if conn is a socket:
	// boardID and receiverSocketId are required
	// receiverSocketId is used as this boardconn id
	constructor(conn, boardId, receiverSocketId) {
		this.isSocket = !!receiverSocketId;
		this.id = this.isSocket ? receiverSocketId : conn.id;

		// add to connections
		BoardConn.set(this.id, this);

		this.conn = conn;
		this.boardId = boardId;
		this.receiverSocketId = receiverSocketId;

		this.eventListeners = new Map();
		// event: [callback, callback, ...]
	}
	delete() {
		BoardConn.delete(this.id);
	}

	send(...args) {
		console.log("sending");
		if (this.isSocket)
			return this.conn.emit("routeData", this.boardId, this.receiverSocketId, JSON.stringify(args, replacer));
		return this.conn.send(JSON.stringify(args, replacer));
	}

	on(event, listener) {
		if (this.eventListeners.has(event))
			this.eventListeners.get(event).push(listener);
		else
			this.eventListeners.set(event, [listener]);
		
		if (this.isSocket)
			return; // no need to use peer
		
		return this.conn.on(event, (...args) => this.emit(event, ...args));
	}
	// emits to all listeners, NOT to peer
	emit(event, ...args) {
		if (!this.eventListeners.has(event))
			return;
		
		if (event === "data") {
			const data = JSON.parse(args[0], reviver);
			return this.eventListeners.get("data").forEach((listener) => listener(data));
		}
		return this.eventListeners.get(event).forEach((listener) => listener(...args));
	}
}

// copied from https://stackoverflow.com/questions/29085197/how-do-you-json-stringify-an-es6-map
function replacer(key, value) {
	if(value instanceof Map) {
		return {
			dataType: 'Map',
			value: Array.from(value), // or with spread: value: [...value]
		};
	} else if (value instanceof Set) {
		return {
			dataType: 'Set',
			value: Array.from(value),
		};
	} else {
		return value;
	}	
}
function reviver(key, value) {
	if(typeof value === 'object' && value !== null) {
		if (value.dataType === 'Map') {
			return new Map(value.value);
		} else if (value.dataType === 'Set') {
			return new Set(value.value);
		}
	}
	return value;
}