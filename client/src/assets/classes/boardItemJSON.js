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
	// size are constant; scale is used to resize
	// position is in form [x, y, z]
	// size is in [width, height]
	// scale is in form [x, y]
	constructor ({key, playerName, position, size, scale, rotation, type, data, parent, children}) {
		BoardItemJSON.set(key, this);

		this.selected = false;

		this.key = key;
		this.playerName = playerName;
		this.position = position;
		this.size = size;
		this.scale = scale;
		// in radians
		this.rotation = Number.isFinite(rotation)? rotation: 0;

		this.type = type;
		this.data = data;

		this.parent = parent;
		// children is a set of objects
		this.children = children? children: new Set();

		// event => new Set(functions)
		this.eventListeners = new Map();
		// set of listeners called on any event
		this.anyEventListeners = new Set();
	}

	// adds listener on event
	on(event, func) {
		if (this.eventListeners.has(event))
			this.eventListeners.get(event).add(func);
		else
			this.eventListeners.set(event, new Set([func]));
	}
	// removes listener from event
	off(event, func) {
		if (this.eventListeners.has(event))
			this.eventListeners.get(event).delete(func);
	}
	onAny(func) {
		this.anyEventListeners.add(func);
	}
	offAny(func) {
		this.anyEventListeners.delete(func);
	}
	// emits to all listeners of event
	emit(event, ...data) {
		if (this.eventListeners.has(event))
			for (const func of this.eventListeners.get(event))
				func.bind(this)(...data);
		// emit to onAny listeners
		for (const func of this.anyEventListeners)
			func.bind(this)(event, ...data);
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

	get absolutePosition() {
		// if this item has no parent, then its absolute position is its position
		if (!this.parent)
			return this.position;
		
		return this.parent.getAbsolutePosition(this.position);
	}
	// for the next 2 functions, I'm using cousin to refer to a point on the same level as the item
	// returns the absolute position of a point[x, y], which is a child point to this item
	getAbsolutePosition(point) {
		// top and left values of this item, in [left, top]
		const topLeft = [this.position[0] - this.size[0] / 2, this.position[1] - this.size[1] / 2];
		const cousinPoint = this.rotatePoint( // rotate point to be in line with this item
			[point[0] + topLeft[0], point[1] + topLeft[1]],
			this.position, this.rotation
		);
		if (!this.parent)
			return cousinPoint;
		
		// if there is a parent, then we need to unrotate that too
		return this.parent.getAbsolutePosition(cousinPoint);
	}
	// returns the relative position of a point[x, y], which is an absolute position
	getRelativePosition(point) {
		// if there is a parent, then we need to get the point relative to that
		// if there is no parent, then the point is already a cousin
		if (this.parent)
			point = this.parent.getRelativePosition(point);

		const topLeft = [this.position[0] - this.size[0]/2, this.position[1] - this.size[1]/2];
		// cousinPoint because it is on the same level as this item
		const childPoint = this.rotatePoint( // account for rotation
			[point[0] - topLeft[0], point[1] - topLeft[1]],
			[this.size[0]/2, this.size[1]/2], -this.rotation
		);
		return childPoint;
	}
	get absoluteSize() {
		const absoluteScale = this.absoluteScale;
		return [this.size[0] * absoluteScale[0], this.size[1] * absoluteScale[1]];
	}
	get absoluteScale() {
		const parentAbsoluteScale = this.parent? this.parent.absoluteScale: [1, 1];
		return [this.scale[0] * parentAbsoluteScale[0], this.scale[1] * parentAbsoluteScale[1]];
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
		if (!parent) // if parent does not exist, then this is not a child of it
			return false;
		return parent.isParentOf(this);
	}

	// returns percent area of this item covered by other item
	percentAreaCoveredBy(item) {
		// created to only call absolutePosition and Size once
		const otherItem = {pos: item.absolutePosition, size: item.absoluteSize, rotation: item.absoluteRotation};
		const thisItem = {pos: this.absolutePosition, size: this.absoluteSize, rotation: this.absoluteRotation};
		// caculate point of each item, taking rotation into account (rotation is around center of item and in radians)
		const otherPoints = this.rotatePolygon([
			[otherItem.pos[0] - otherItem.size[0]/2, otherItem.pos[1] - otherItem.size[1]/2], 
			[otherItem.pos[0] + otherItem.size[0]/2, otherItem.pos[1] - otherItem.size[1]/2], 
			[otherItem.pos[0] + otherItem.size[0]/2, otherItem.pos[1] + otherItem.size[1]/2], 
			[otherItem.pos[0] - otherItem.size[0]/2, otherItem.pos[1] + otherItem.size[1]/2]], 
			[otherItem.pos[0], otherItem.pos[1]], 
			otherItem.rotation
		);
		const thisPoints = this.rotatePolygon([
			[thisItem.pos[0] - thisItem.size[0]/2, thisItem.pos[1] - thisItem.size[1]/2],
			[thisItem.pos[0] + thisItem.size[0]/2, thisItem.pos[1] - thisItem.size[1]/2],
			[thisItem.pos[0] + thisItem.size[0]/2, thisItem.pos[1] + thisItem.size[1]/2],
			[thisItem.pos[0] - thisItem.size[0]/2, thisItem.pos[1] + thisItem.size[1]/2]],
			[thisItem.pos[0], thisItem.pos[1]],
			thisItem.rotation
		);
		// get poly of intersection
		const intersectionPoly = polygonClipping.intersection([otherPoints], [thisPoints]);
		// if no intersection, return 0
		if (intersectionPoly.length == 0)
			return 0;
		// get area of intersection
		return this.polygonArea(intersectionPoly[0][0]) / (thisItem.size[0] * thisItem.size[1]);
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

	moveTo (position) {
		this.position = [
			Number.isFinite(position[0])? position[0]: this.position[0],
			Number.isFinite(position[1])? position[1]: this.position[1],
			Number.isFinite(position[2])? position[2]: this.position[2],
		];

		this.emit("move", this.position);
	}
	// updates scale, size is NOT changed
	scaleTo (scale) {
		this.scale = [
			scale[0]? scale[0]: this.scale[0],
			scale[1]? scale[1]: this.scale[1]
		]
		this.emit("resize", this.scale);
	}
	rotateTo (rotation) {
		this.rotation = rotation;

		this.emit("rotate", this.rotation);
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
		
		this.emit("addChild", child.key);
		return true;
	}
	removeChild(child, update) {
		if (!this.children.has(child))
			return false;
		this.children.delete(child);
		if (!update)
			child.removeParent(true);
		
		this.emit("removeChild", child.key);
		return true;
	}
	setParent(parent, update) {
		if (parent?.parent?.key == this.key)
			return false; // can't reverse parenting direction
		if (this.parent == parent)
			return false; // don't set if already parent
		if (parent?.key == this.key)
			return false; // can't be parent of self
		
		if (this.parent == parent)
			return false;

		if (parent)
			this.removeParent(true);
		else if (!parent)
			return true;
		
		this.parent = parent;
		// update position
		// NOTE: This does assume this.position is absolute, but it is b/c we removeparent earlier
		[this.position[0], this.position[1]] = this.parent.getRelativePosition(this.position.slice(0, 2));
		// correct rotation
		this.rotation -= parent.absoluteRotation;
		// correct for scale
		this.scale = [
			this.scale[0] / parent.absoluteScale[0],
			this.scale[1] / parent.absoluteScale[1]
		];
		
		if (!update)
			parent.addChild(this, true);
		
		this.emit("setParent", parent.key);
		return true;
	}
	removeParent(update) {
		if (!this.parent)
			return false;

		if (!update)
			this.parent.removeChild(this, true);
		
		// set to absolutes
		[this.position[0], this.position[1]] = this.absolutePosition;
		this.rotation = this.absoluteRotation;
		this.scale = this.absoluteScale;
		this.parent = null;

		this.emit("removeParent");
		return true;
	}

	select() {
		this.selected = true;
		this.emit("select");
	}
	deselect() {
		this.selected = false;
		this.emit("deselect");
	}

}