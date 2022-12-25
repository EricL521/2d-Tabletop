import { BoardItemJSON } from "./boardItemJSON";
import { BoardConn } from "./boardConn";
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
		// all items are stored in boardItemJSON class
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
		console.log("processing connection");
		this.emit("connUpdate", "Connecting");
		conn.on("open", () => {
			this.emit("connUpdate", "Connected");

			// custom conn which stringifies data before sending
			const boardConn = new BoardConn(conn);
			this.initializeBoardConn(boardConn);

			this.onceConnection(boardConn);
		});
	}
	// ran for a reroute through server
	onSocketConnection(otherSocketId) {
		console.log("processing socket connection");

		this.emit("connUpdate", "Connected");

		// custom conn which stringifies data before sending
		const boardConn = new BoardConn(this.socket, this.id, otherSocketId);
		this.initializeBoardConn(boardConn);

		this.onceConnection(boardConn);
	}
	// adds listeners to boardConn
	initializeBoardConn(boardConn) {
		// on first connecting, conn will emit a name
		// data is in this form: [eventName, restOfData]
		boardConn.on('data', (data) => this.onData(boardConn, data));

		boardConn.on('close', () => {
			this.emit("connUpdate", "Disconnected");
			this.onceConnectionClose(boardConn);
			boardConn.delete();
		});

		boardConn.on('error', (error) => {
			this.emit("connUpdate", `Failed: ${error}`);
		});
	}
	// data is an array [eventName, ...restOfData]
	onData(boardConn, data) {
		console.log(data);
		try {
			// call specific event
			if (this.constructor.connectionEvents.has(data[0]))
				this.constructor.connectionEvents.get(data[0])
				.bind(this)(boardConn, ...data.slice(1));
			else if (Board.connectionEvents.has(data[0]))
				Board.connectionEvents.get(data[0])
				.bind(this)(boardConn, ...data.slice(1));
			// call onany
			if (this.constructor.connectionEvents.onAny)
				this.constructor.connectionEvents.onAny.call.bind(this)(data[0], boardConn, ...data.slice(1));
			else if (Board.connectionEvents.onAny)
				Board.connectionEvents.onAny.call.bind(this)(data[0], boardConn, ...data.slice(1));
		} catch (error) {
			console.error(error, data);
		}
	}
	// optional
	onceConnection() { }
	onceConnectionClose() { }

	getItem(key) {
		return BoardItemJSON.get(key);
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
	// addItem returns item object
	addItem(itemData) {
		const key = this.nextKey ++;
		itemData.key = key;
		itemData.playerName = itemData.playerName? itemData.playerName: this.playerName;
		const item = new BoardItemJSON(itemData);
		if (!item.isChild)
			this.boardItems.set(key, item);
		this.emit("itemCreate", key);
		return item;
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
		const child = this.getItem(childKey);
		const parent = this.getItem(parentKey);
		if (!parent)
			return this.unparentItem(childKey); // no parent

		this.boardItems.delete(childKey);
		parent.addChild(child);

		this.emit("itemParent", childKey, parentKey);
	}
	unparentItem(childKey) {
		const child = this.getItem(childKey);
		if (child.removeParent()) {
			this.boardItems.set(childKey, child);

			this.emit("itemUnparent", childKey);
		}
	}

	addPlayer(name) {
		this.playerNames.add(name);
	}
	removePlayer(name) {
		this.playerNames.delete(name);
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
		if (this.listeners.has(eventName))
			this.listeners.get(eventName).forEach(func => func(...data));
		this.onAnyFuncs.forEach(func => func(eventName, ...data));
	}
}