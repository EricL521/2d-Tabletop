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
		const result =  this.x + (this.parent? this.parent.absoluteX: 0);
		return result;
	}
	get absoluteY() {
		return this.y + (this.parent? this.parent.absoluteY: 0);
	}

	// returns whther this item is a descendant of the item with the given key
	isDescendantOf(parentItem) {
		if (!parentItem || !this.parent)
			return false;
		if (this.parent.key == parentItem.key)
			return true;
		return this.parent.isDescendantOf(parentItem);
	}
	// i keep makign this typo
	isDescendentOf(parentItem) {
		return this.isDescendantOf(parentItem);
	}
	isAncestorOf(childItem) {
		return childItem.isDescendantOf(this);
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

		this.resizeBy(width / this.width, height / this.height);
	}
	// multiplies width and height by x and y respectively
	// also updates children
	resizeBy (x, y) {
		for (const itemKeyPair of this.children) {
			const item = itemKeyPair[1];
			item.resizeBy(x, y);
			// resize x and y values
			item.moveTo(item.x * x, item.y * y);
		}
		
		this.width *= x;
		this.height *= y;
	}

	// calling these also automatically calls setParent and removeParent
	addChild(child) {
		this.children.set(child.key, child);
		child.setParent(this);
	}
	removeChild(child) {
		this.children.delete(child.key);
		child.removeParent();
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

	select() {
		this.selected = true;
	}
	deselect() {
		this.selected = false;
	}

}