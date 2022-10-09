// base board class

// only used for extending
export class Board {
	static connectionEvents = null; // expected to be replaced

	constructor (name, gameId, password, settings, playerName) {
		// throw errors if invalid child class
		if (this.constructor == Board)
			throw new Error("Board is an abstract class");
		if (this.constructor.connectionEvents == null)
			throw new Error(`${this.constructor.name} must be defined`);
		
		this.name = name; // can be null
		this.gameId = gameId;
		this.password = password;
		this.settings = settings; // can be null
		this.playerName = playerName;

		this.playerNames = new Set([playerName]);

		this.listeners = new Map();
		// name: [callback, callback, ...]
	}

	// peer.onconnection equals this
	// however, differnet things are done in client vs host
	onConnection(conn) {
		this.emit("connUpdate", "Connecting");
		
		// on first connecting, conn will emit a name
		// data is in this form: [eventName, restOfData]
		conn.on('data', (data) => {
			try {
				if (this.constructor.connectionEvents.has(data[0]))
					this.constructor.connectionEvents.get(data[0])(this, conn, ...data.slice(1));
			} catch (error) {
				console.error(error, data);
			}
		});

		conn.on('error', () => {
			console.log('connection error');
		});

		conn.on('open', () => {
			this.emit("connUpdate", "Connected");
			this.onceConnection(conn);
		});
	}
	// optional
	onceConnection() { }

	// add an event listener
	on (eventName, callback) {
		if (!this.listeners.has(eventName))
			this.listeners.set(eventName, []);
		this.listeners.get(eventName).push(callback);
	}
	// call the event listeners
	emit (eventName, ...data) {
		if (this.listeners.has(eventName))
			this.listeners.get(eventName).forEach(func => func(...data));
	}

	addPlayer(name) {
		this.playerNames.add(name);
	}
	removePlayer(name) {
		this.playerNames.remove(name);
	}
}