import polygonClipping from 'polygon-clipping';

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
	static unsimplifyItems() {
		for (const item of this.items.values())
			item.unsimplify();
	}

	// x and y are the center of the item
	constructor ({key, playerName, x, y, z, width, height, rotation, type, data, parent, children}) {
		BoardItemJSON.set(key, this);

		this.selected = false;

		this.key = key;
		this.playerName = playerName;
		this.x = x;
		this.y = y;
		this.z = z;
		this.width = width;
		this.height = height;
		// in radians
		this.rotation = Number.isFinite(rotation)? rotation: 0;

		this.type = type;
		this.data = data;

		this.parent = parent;
		// children is a set of objects
		this.children = children? children: new Set();
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
	// unsimplifies this item, which replaces keys with the actual objects
	unsimplify() {
		this.parent = BoardItemJSON.get(this.parent);
		this.children = new Set();
		for (const childKey of this.children)
			this.children.add(BoardItemJSON.get(childKey));
	}

	get isChild() { return this.parent || Number.isFinite(this.parent)? true: false; }

	get absoluteX() {
		return this.x + (this.parent? this.parent.absoluteX: 0);
	}
	get absoluteY() {
		return this.y + (this.parent? this.parent.absoluteY: 0);
	}
	get absoluteRotation() {
		return this.rotation + (this.parent? this.parent.absoluteRotation: 0);
	}

	// returns whther this item is a descendant of the item with the given key
	isDescendantOf(item) {
		if (!this.parent)
			return false;
		if (this.isChildOf(item))
			return true;
		return this.parent.isDescendantOf(item);
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
	isParentOf(child) {
		// if child or child.parent does not exist, then it is not a child
		if (!child || !child.parent)
			return false;
		return child.parent.key == this.key;
	}
	isChildOf(parent) {
		return parent.isParentOf(this);
	}

	// returns percent area of this item covered by other item
	percentAreaCoveredBy(item) {
		// created to only call absoluteX and absoluteY once
		const otherItem = {x: item.absoluteX, y: item.absoluteY, width: item.width, height: item.height, rotation: item.absoluteRotation};
		const thisItem = {x: this.absoluteX, y: this.absoluteY, width: this.width, height: this.height, rotation: this.absoluteRotation};
		// caculate point of each item, taking rotation into account (rotation is around center of item and in radians)
		const otherPoints = this.rotatePolygon([
			[otherItem.x - otherItem.width/2, otherItem.y - otherItem.height/2], 
			[otherItem.x + otherItem.width/2, otherItem.y - otherItem.height/2], 
			[otherItem.x + otherItem.width/2, otherItem.y + otherItem.height/2], 
			[otherItem.x - otherItem.width/2, otherItem.y + otherItem.height/2]], 
			[otherItem.x, otherItem.y], 
			otherItem.rotation
		);
		const thisPoints = this.rotatePolygon([
			[thisItem.x - thisItem.width/2, thisItem.y - thisItem.height/2],
			[thisItem.x + thisItem.width/2, thisItem.y - thisItem.height/2],
			[thisItem.x + thisItem.width/2, thisItem.y + thisItem.height/2],
			[thisItem.x - thisItem.width/2, thisItem.y + thisItem.height/2]],
			[thisItem.x, thisItem.y],
			thisItem.rotation
		);
		// get poly of intersection
		const intersectionPoly = polygonClipping.intersection([otherPoints], [thisPoints]);
		// if no intersection, return 0
		if (intersectionPoly.length == 0)
			return 0;
		// get area of intersection
		return this.polygonArea(intersectionPoly[0][0]) / (thisItem.width * thisItem.height);
	}
	rotatePolygon(polygon, center, angle) { 
		const points = [];
		for (const point of polygon)
			points.push(this.rotatePoint(point, center, angle));
		return points;
	}
	// rotates point[x, y] clockwise around center by angle (in degrees)
	rotatePoint(point, center, angle) {
		// convert angle to radians
		// It is not negated because of a double negative - y axes is fliped in html, and css rotation is clockwise
		angle = angle * Math.PI / 180;
		const x = Math.cos(angle) * (point[0] - center[0]) - Math.sin(angle) * (point[1] - center[1]) + center[0];
		const y = Math.sin(angle) * (point[0] - center[0]) + Math.cos(angle) * (point[1] - center[1]) + center[1];
		return [x, y];
	}
	polygonArea (points) {
		let area = 0;

		for (let i = 0; i < points.length; i++) {
			let j = (i + 1) % points.length;
			let [x1, y1] = points[i];
			let [x2, y2] = points[j];
			area += x1 * y2 - x2 * y1;
		}

		return Math.abs(area / 2);
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
	rotateTo (rotation) {
		this.rotation = rotation;
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
		// correct for rotation
		// NOTE: you need to rotate centers around each other, not corners
		[this.x, this.y] = this.rotatePoint([this.x, this.y], [0, 0], -parent.absoluteRotation);
		this.rotation -= parent.absoluteRotation;
		
		if (!update)
			parent.addChild(this, true);
		
		return true;
	}
	removeParent(update) {
		if (!this.parent)
			return false;

		if (!update)
			this.parent.removeChild(this, true);
		
		// correct for rotation
		[this.x, this.y] = this.rotatePoint([this.x, this.y], [0, 0], this.parent.absoluteRotation);
		this.rotation += this.parent.absoluteRotation;
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