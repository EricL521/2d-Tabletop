// code for the host of the game
import { Board } from "./board";

const connectionEvents = new Map();
connectionEvents.on = connectionEvents.set;

connectionEvents.on('joinResponse', (board, conn, success, boardName, playerNames, settings) => {
	if (success) {
		board.name = boardName;
		board.playerNames = new Set(playerNames);
		board.settings = settings;
		
		delete board.password; // no longer needed

		board.emit("joined");
	}
	else {
		// implememnt later
	}
});

export class BoardClient extends Board {
	static connectionEvents = connectionEvents;

	constructor (gameId, password, hostPeerId, playerName, peer) {
		super(null, gameId, password, null, playerName);
		// nulls of these will be set once connected to host

		console.log(hostPeerId);
		
		this.onConnection(peer.connect(hostPeerId));
	}

	// ran once on connection
	onceConnection (conn) {
		// on first connecting, conn will emit a request to join game
		conn.send(['join', this.password, this.playerName]);
	}
}