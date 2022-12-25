// also stores all instances of class
export class BoardItemJSON {
	static items = new Map(); // key => item
	static get(key) { return this.items.get(key); }
	static set(key, item) { this.items.set(key, item); }
	static delete(key) { this.items.delete(key); }
	static has(key) { return this.items.has(key); }
	// returns array of items
	static getSimplifiedItems() {
		const items = [];
		for (const item of this.items.values())
			items.push(item.simplified);
		return items;
	}

	constructor ({key, playerName, x, y, z, width, height, type, data, parent, children}) {
		BoardItemJSON.set(key, this);

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
		if (BoardItemJSON.has(parent))
			this.parent = BoardItemJSON.get(parent);
		// children is a set of objects
		this.children = children? children: new Set();
		if (Array.isArray(children))
			children.forEach(childKey => this.children.add(BoardItemJSON.get(childKey)));
	}

	// returns a simplified version of this item, which has no special classes
	// also, parent and children are stored as keys instead of objects
	get simplified() {
		const item = structuredClone(this);
		item.parent = item.parent? item.parent.key: null;
		item.children = [];
		for (const child of this.children)
			item.children.push(child.key);
		return item;
	}
	get isChild() { return this.parent? true: false; }

	get absoluteX() {
		return this.x + (this.parent? this.parent.absoluteX: 0);
	}
	get absoluteY() {
		return this.y + (this.parent? this.parent.absoluteY: 0);
	}

	// returns whther this item is a descendant of the item with the given key
	isDescendantOf(item) {
		if (!this.parent)
			return false;
		if (item.key == this.parent.key)
			return true;
		const result = this.parent.isDescendantOf(item);
		return result;
	}
	// i keep makign this typo
	isDescendentOf(item) {
		return this.isDescendantOf(item);
	}
	isAncestorOf(child) {
		if (!child) // if childItem does not exist, then it is not a descendant
			return false;
		return child.isDescendantOf(this);
	}

	// returns percent area of this item covered by other item
	percentAreaCoveredBy(item) {
		// created to only call absoluteX and absoluteY once
		const otherItem = {x: item.absoluteX, y: item.absoluteY, width: item.width, height: item.height};
		const thisItem = {x: this.absoluteX, y: this.absoluteY, width: this.width, height: this.height};
		
		// get lower of the 2 rightX values, and higher of the 2 leftX values
		const lowerX = Math.min(thisItem.x + this.width, otherItem.x + otherItem.width);
		const higherX = Math.max(thisItem.x, otherItem.x);
		// do same for y
		const lowerY = Math.min(thisItem.y + this.height, otherItem.y + otherItem.height);
		const higherY = Math.max(thisItem.y, otherItem.y);
		// if the lower is less than the higher, then the items do not overlap
		if (lowerX < higherX || lowerY < higherY)
			return 0;
		
		return (higherX - lowerX) * (higherY - lowerY) / (thisItem.width * thisItem.height);
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
		for (const child of this.children) {
			child.resizeBy(x, y);
			// resize x and y values
			child.moveTo(child.x * x, child.y * y);
		}
		
		this.width *= x;
		this.height *= y;
	}

	// update is if function was called to update current item to match other item
	addChild(child, update) {
		if (!update) {
			if (child && child.parent && child.parent.key == this.key)
				return false; // don't add child if it is already a child of this
			if (this && this.parent && this.parent.key == child.key)
				return false; // can't reverse parenting direction
		}

		if (this.children.has(child))
			return false;

		this.children.add(child);
		if (!update)
			child.setParent(this, true);
		
		return true;
	}
	removeChild(child, update) {
		if (!this.children.has(child))
			return false;
		this.children.delete(child);
		if (!update)
			child.removeParent(true);
		
		return true;
	}
	setParent(parent, update) {
		if (parent && parent.parent && parent.parent.key == this.key)
			return false; // can't reverse parenting direction
		if (this && this.parent && this.parent.key == parent.key)
			return false; // don't set if already parent
		
		if (this.parent == parent)
			return false;

		if (parent)
			this.removeParent(true);
		else if (!parent)
			return true;
		
		this.parent = parent;
		// update position
		this.x -= parent.absoluteX;
		this.y -= parent.absoluteY;
		
		if (!update)
			parent.addChild(this.key, true);
		
		return true;
	}
	removeParent(update) {
		if (!this.parent)
			return false;

		if (!update)
			this.parent.removeChild(this.key, true);
		
		// update position
		this.x += this.parent.absoluteX;
		this.y += this.parent.absoluteY;
		this.parent = null;

		return true;
	}

	select() {
		this.selected = true;
	}
	deselect() {
		this.selected = false;
	}

}