import { BoardItemJSON } from "./boardItemJSON";
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

	constructor (socket, name, gameId, password, settings, playerName) {
		// throw errors if invalid child class
		if (this.constructor == Board)
			throw new Error("Board is an abstract class");
		if (this.constructor.connectionEvents == null)
			throw new Error(`${this.constructor.name}.connectionEvents must be defined`);
		
		this.socket = socket; // for routing through server
		
		this.selectedItemKey = null;
		this.boardItems = new Map(); // structured order
		this.allItems = new Map(); // unstructured, with all children just in the map
		this.nextKey = 0; // overriden in boardClient
		
		this.name = name; // can be null
		this.id = gameId;
		this.password = password;
		this.settings = settings; // can be null
		this.playerName = playerName;
		this.playerNames = new Set([playerName]);

		this.onAnyFuncs = [];
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

	getItem(key) {
		return this.allItems.get(key);
	}
	selectItem(key) {
		if (key == this.selectedItemKey)
			return;
		const newItem = this.getItem(key);
		const oldItem = this.getItem(this.selectedItemKey);
		if (oldItem)
			oldItem.deselect();
		if (newItem) {
			newItem.select();
		}
		this.selectedItemKey = key;
		this.emit("itemSelect", key, newItem);
	}
	// should override next group of functions
	addItem(itemData) {
		const key = this.nextKey ++;
		const item = new BoardItemJSON(key, itemData.playerName? itemData.playerName: this.playerName, 
									itemData.x, itemData.y, itemData.z, itemData.width, itemData.height, 
									itemData.type, itemData.data, itemData.parent, itemData.children);
		this.boardItems.set(key, item);
		this.allItems.set(key, item);
		this.emit("itemCreate", key);
	}
	moveItem(key, x, y) {
		const item = this.getItem(key);
		item.moveTo(x, y);
		this.emit("itemMove", key);
	}
	resizeItem(key, width, height) {
		const item = this.getItem(key);
		item.resizeTo(width, height);
		this.emit("itemResize", key);
	}
	// sets the parent item of childkey to parentkey
	parentItem(childKey, parentKey) {
		const parent = this.getItem(parentKey);
		const child = this.getItem(childKey);

		if (child && child.parent && child.parent.key == parentKey)
			return;
		if (parent && parent.parent && parent.parent.key == childKey)
			return; // can't reverse parenting direction
		if (!this.boardItems.has(childKey)) // NOTE: boarditem is the ordered map
			this.unparentItem(childKey); // reset childkey
		if (!parent)
			return; // no parent
		

		this.boardItems.delete(childKey);
		parent.addChild(child);

		this.emit("itemParent", childKey, parentKey);
	}
	unparentItem(childKey) {
		const child = this.getItem(childKey);
		const parent = child.parent;
		if (!parent)
			return; // no parent
		
		parent.removeChild(child);
		this.boardItems.set(childKey, child);

		this.emit("itemUnparent", childKey);
	}

	// add an event listener
	on (eventName, callback) {
		if (!this.listeners.has(eventName))
			this.listeners.set(eventName, []);
		this.listeners.get(eventName).push(callback);
	}
	onAny (callback) {
		this.onAnyFuncs.push(callback);
	}
	// call the event listeners
	emit (eventName, ...data) {
		this.onAnyFuncs.forEach(func => func(eventName, ...data));
		if (this.listeners.has(eventName)) {
			this.listeners.get(eventName).forEach(func => func(...data));
		}
	}

	addPlayer(name) {
		this.playerNames.add(name);
	}
	removePlayer(name) {
		this.playerNames.delete(name);
	}
}