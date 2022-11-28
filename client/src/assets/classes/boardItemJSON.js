export class BoardItemJSON {
	constructor (key, playerName, x, y, z, width, height, type, data, parent, children) {
		this.selected = false;

		this.key = key;
		this.playerName = playerName;
		this.x = x;
		this.y = y;
		this.z = z;
		this.width = width;
		this.height = height;

		this.type = type;
		this.data = data;

		this.parent = parent;
		this.children = children? children: new Map();
	}

	get absoluteX() {
		return this.x + (this.parent? this.parent.absoluteX: 0);
	}
	get absoluteY() {
		return this.y + (this.parent? this.parent.absoluteY: 0);
	}

	moveTo (x, y, z) {
		this.x = x? x: this.x;
		this.y = y? y: this.y;
		this.z = z? z: this.z;
	}
	resizeTo (width, height) {
		// can recieve null values
		width = width? width: this.width;
		height = height? height: this.height;

		for (const itemKeyPair of this.children) {
			const item = itemKeyPair[1];
			item.resizeBy(width / this.width, height / this.height);
			// resize x and y values
			item.moveTo(item.x * width / this.width, item.y * height / this.height);
		}
		this.width = width;
		this.height = height;
	}
	// multiplies width and height by x and y respectively
	resizeBy (x, y) {
		this.width *= x;
		this.height *= y;
	}

	setParent(parent) {
		this.removeParent();
		if (!parent)
			return;
		this.parent = parent;
		// update position
		this.x -= parent.absoluteX;
		this.y -= parent.absoluteY;
	}
	removeParent() {
		if (!this.parent)
			return;
		// update position
		this.x += this.parent.absoluteX;
		this.y += this.parent.absoluteY;
		this.parent = null;
	}

	addChild(child) {
		this.children.set(child.key, child);
		child.setParent(this);
	}
	removeChild(child) {
		this.children.delete(child.key);
		child.removeParent();
	}

	select() {
		this.selected = true;
	}
	deselect() {
		this.selected = false;
	}

}