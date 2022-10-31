// base board class

// these can be overrided in client and host
// this binded to the board instance
// CAN NOT BE ARROW FUNCTIONS, because they can't be binded
const connectionEvents = new Map();
connectionEvents.on = connectionEvents.set;
// also supports onany(event, ...args), which is only called if there is no event handler for event

// only used for extending
export class Board {
	static connectionEvents = connectionEvents; // expected to be replaced

	constructor (name, gameId, password, settings, playerName) {
		// throw errors if invalid child class
		if (this.constructor == Board)
			throw new Error("Board is an abstract class");
		if (this.constructor.connectionEvents == null)
			throw new Error(`${this.constructor.name}.connectionEvents must be defined`);
		
		this.selectedItemKey = null; 
		this.selectedItemZ = null;
		this.boardItems = new Map();
		this.nextKey = 0; // overriden in boardClient
		
		this.name = name; // can be null
		this.id = gameId;
		this.password = password;
		this.settings = settings; // can be null
		this.playerName = playerName;
		this.playerNames = new Set([playerName]);

		this.listeners = new Map();
		// name: [callback, callback, ...]
	}

	// peer.onconnection equals this
	// however, it is called differently in host and client
	onConnection(conn) {
		this.emit("connUpdate", "Connecting");
		
		// on first connecting, conn will emit a name
		// data is in this form: [eventName, restOfData]
		conn.on('data', (data) => {
			try {
				// call specific event
				if (this.constructor.connectionEvents.has(data[0]))
					this.constructor.connectionEvents.get(data[0])
					.bind(this)(conn, ...data.slice(1));
				else if (Board.connectionEvents.has(data[0]))
					Board.connectionEvents.get(data[0])
					.bind(this)(conn, ...data.slice(1));
				// call onany
				else if (this.constructor.connectionEvents.onAny)
					this.constructor.connectionEvents.onAny.call.bind(this)(data[0], conn, ...data.slice(1));
				else if (Board.connectionEvents.onAny)
					Board.connectionEvents.onAny.call.bind(this)(data[0], conn, ...data.slice(1));
				else
					console.log(`Unhandled Event: ${data[0]}`);
			} catch (error) {
				console.error(error, data);
			}
		});

		conn.on('open', () => {
			this.emit("connUpdate", "Connected");
			this.onceConnection(conn);
		});

		conn.on('close', () => {
			this.emit("connUpdate", "Disconnected");
			this.onceConnectionClose(conn);
		});

		conn.on('error', (error) => {
			this.emit("connUpdate", `Failed: ${error}`);
		});
	}
	// optional
	onceConnection() { }
	onceConnectionClose() { }

	selectItem(key) {
		if (key == this.selectedItemKey)
			return;
		const newItem = this.boardItems.get(key);
		const oldItem = this.boardItems.get(this.selectedItemKey);
		if (oldItem) {
			oldItem.selected = false;
			oldItem.z = this.selectedItemZ;
		}
		if (newItem) {
			newItem.selected = true;
			this.selectedItemZ = newItem.z;
			newItem.z = 10000;
		}
		this.selectedItemKey = key;
		this.emit("update");
	}
	// should override next group of functions
	addItem(item) {
		const key = this.nextKey ++;
		if (!item.playerName)
			item.playerName = this.playerName;
		item.key = key;
		item.selected = false;
		this.boardItems.set(key, item);
		this.emit("update", "add", key);
	}
	moveItem(key, x, y) {
		const item = this.boardItems.get(key);
		item.x = x;
		item.y = y;
		this.emit("update", "move", key);
	}
	resizeItem(key, width, height) {
		const item = this.boardItems.get(key);
		item.width = width;
		item.height = height;
		this.emit("update", "resize", key);
	}
	

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
		this.playerNames.delete(name);
	}
}