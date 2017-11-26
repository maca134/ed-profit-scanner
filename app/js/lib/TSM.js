const request = require('request');
const async = require('async');

class Node {
	constructor(x, y, z) {
		this.x = x;
		this.y = y;
		this.z = z;
		this.right = this;
		this.left = this;
		this.life = 3;
		this.inhibitation = 0;
		this.isWinner = 0;
	}
	potential(system) {
		return (system.x - this.x) * (system.x - this.x) + (system.y - this.y) * (system.y - this.y) + (system.z - this.z) * (system.z - this.z);
	}
	move(system, value) {
		this.x += value * (system.x - this.x);
		this.y += value * (system.y - this.y);
		this.z += value * (system.z - this.z);
	}
	distance(other, length) {
		let right = 0;
		let left = 0;
		let current = other;
		while (current != this) {
			current = current.left;
			left++;
		}
		right = length - left;
		return (left < right) ? left : right;
	}
	compare(other) {
		return this.x === other.x && this.y === other.y && this.z === other.z;
	}
}

class Ring {
	constructor(start) {
		this.start = start;
		this.length = 1;
	}
	moveAllNodes(system, gain) {
		let current = this.start;
		let best = this.findMinimum(system);
		for (let i=0; i<this.length; i++) {
			current.move(system, this.f(gain, best.distance(current, this.length)));
			current = current.right;
		}		
	}
	findMinimum(system) {
		let actual;
		let node = this.start;
		let best = node;
		let min = node.potential(system);
		for (let i=1; i<this.length; i++) {
			node = node.right;
			actual = node.potential(system);
			if (actual < min) {
				min = actual;
				best = node;
			}
		}
		best.isWinner++;
		return best;
	}
	deleteNode(node) {
		let previous = node.left;
		let next = node.right;
		if (previous != null) {
			previous.right = next;
		}
		if (next != null) {
			next.left = previous;
		}
		if (next == node) {
			next = null;
		}
		if (this.start == node) {
			this.start = next;
		}
		this.length--;
	}
	duplicateNode(node) {
		let newNode = new Node(node.x, node.y, node.z);
		let next = node.left;
		next.right = newNode;
		node.left = newNode;
		node.inhibitation = 1;	
		newNode.left = next;
		newNode.right = node;
		newNode.inhibitation = 1;
		this.length++;
	}
	tourLength() {
		let dist = 0.0;
		let current = this.start;
		let previous = current.left;
		for (let i=0; i<this.length; i++) {
			dist += Math.sqrt( 
					(current.x - previous.x) * (current.x - previous.x) + 
					(current.y - previous.y) * (current.y - previous.y) + 
					(current.z - previous.z) * (current.z - previous.z));
			current = previous;
			previous = previous.left;
		}
		return dist;
	}
	f(gain, n) {
		return (0.70710678 * Math.exp(-(n * n) / (gain * gain)));
	}
}

class System {
	constructor(name) {
		this.name = name;
		this.x = 0;
		this.y = 0;
		this.z = 0;
	}
	getCoords(complete) {
		let self = this;
		request({
			method: 'GET',
			url: 'https://www.edsm.net/api-v1/system',
			qs: {
				systemName: this.name,
				showCoordinates: 1
			}
		}, (e, r, b) => {
			try {
				let data = JSON.parse(b);
				self.x = data.coords.x;
				self.y = data.coords.y;
				self.z = data.coords.z;
				complete();
			} catch (e) {
				complete(e);
			}
		});
	}
}

class TSM {
	constructor(systems) {
		this.cycle = 0;
		this.maxCycles = 2000;
		this.systems = systems;
		this.neurons = null;
		this.alpha = 0.05;
		this.gain = 50.0;
		this.isRunning = false;
		this.lastLength = null;
		this.update = 5;
		this.createFirstNeuron();
	}
	createFirstNeuron() {
		let start = new Node(0.5, 0.5, 0.5);
		this.neurons = new Ring(start);
	}
	run() {
		let done = false;
		while (this.cycle < this.maxCycles) {
			if (this.survey()) {
				done = true;
				break;
			}
		}
		if (!done)
			return false;
		var node = this.neurons.start;
		while (!node.compare(this.systems[0]))
			node = node.right;
		var path = [];
		for (var i=0; i<this.neurons.length; i++) {
			path.push(this.systems.find(s => node.compare(s)));
			node = node.right;
		}
		return path;
	}
	survey () {
		let done = false;
		for (let i=0; i<this.systems.length; i++)
			this.neurons.moveAllNodes(this.systems[i], this.gain);
		var node = this.neurons.start;
		for (var i=0; i<this.neurons.length; i++) {
			node.inhibitation = 0;
			switch (node.isWinner) {
				case 0:
					node.life--;
					if (node.life == 0)
						this.neurons.deleteNode(node);
				break;
				case 1:
					node.life = 3;
				break;
				default:
					node.life = 3;
					this.neurons.duplicateNode(node);
				break;
			}
			node.isWinner = 0;
			node = node.right;
		}
		this.gain = this.gain * (1 - this.alpha);
		if (this.cycle++ % this.update == 0) {
			var length = this.neurons.tourLength();
			if (length == this.lastLength) {
				done = true;
			} else {
				this.lastLength = length;
			}
		}
		return done;
	}
}

/*
var systems = [
	'MEROPE',
	'COL 285 SECTOR CX-J C9-8',
	'PLEIADES SECTOR KH-V C2-13',
	'C LUPI',
	'CAPRICORNI SECTOR MX-U C2-8',
	'HIP 116559',
	'HIP 116600',
	'HIP 753',
	'SYNUEFAI NP-Q C21-4',
	'ARIES DARK REGION FW-W D1-63',
	'ARIES DARK REGION ST-Q B5-2',
	'PLEIADES SECTOR IR-W D1-42',
	'COL 285 SECTOR OH-B B1-2',
	'COL 285 SECTOR DG-X D1-96',
	'HIP 6295',
	'PEGASI SECTOR ZU-Y D59',
	'COL 285 SECTOR LN-T D3-57',
	'COL 285 SECTOR GI-J C9-26',
	'SYNUEFAI BU-G C27-11',
	'COL 285 SECTOR SZ-P D5-68',
	'COL 359 SECTOR UM-U C3-15',
	'COL 285 SECTOR UA-E C12-7',
	'SYNUEFAI YZ-O B52-1',
	'HR 9026',
	'HIP 12341',
	'HYADES SECTOR HG-O B6-0',
	'SYNUEFE ON-S C20-15',
	'SYNUEFE YM-H D11-44',
	'HIP 28508',
	'HIP 27977',
	'COL 285 SECTOR OC-L C8-11',
	'HIP 81805',
	'HR 4996',
	'COL 285 SECTOR ZP-O D6-106',
	'COL 285 SECTOR CN-N B22-1',
	'COL 285 SECTOR DC-J C10-6',
	'COL 285 SECTOR GT-U B18-1',
	'COL 285 SECTOR NI-S D4-68',
	'COL 285 SECTOR XZ-N C7-8',
	'COL 285 SECTOR GW-V D2-53',
	'WREGOE BX-B D13-36',
	'COL 285 SECTOR TO-Q D5-40',
	'PRAEA EUQ YT-A C4',
	'HIP 71558',
	'COL 285 SECTOR YA-D C13-21',
	'PRAEA EUQ VO-R B4-6',
	'COL 285 SECTOR ID-Z C14-17',
	'HIP 95631',
	'Eol Prou RO-Q d5-122',
	'Eol Prou PZ-O d6-1936',
	'HYPUAE AIN ZP-N C20-2',
	'HIP 70181',
	'Pleiades Sector YF-N B7-1',
	'Cave Sector DL-Y D4',
	'Gliese 3254',
	'COL 359 Sector ZR-H C24-20',
	'COL 359 Sector VP-F D11-19',
	'Swoiwns OK-C D14-21',
	'COL 359 Sector ZR-H C24-17',
	'Swoiwns GY-F D12-3',
];
async.mapLimit(systems, 4, function (name, next) {
	let system = new System(name);
	system.getCoords(e => next(e, system));
}, function (err, systems) {
	let path = new TSM(systems).run();
	console.log(path.map(s => s.name));
});
*/