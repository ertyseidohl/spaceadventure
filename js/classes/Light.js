;(function(exports){

	var Light = function(_, options) {

		this.noCollision = true;

		this.pos = options.pos;
		this.color = options.color || "white";

		this.intersects = [];

		this.update = function() {
			var segments = _.getAllBoxSegments();
			var points = boxSegmentsToPoints(segments);
			var angles = this.getAllAngles(points);
			this.getSortedIntersects(angles, segments);
		};
	};

	Light.prototype.getSortedIntersects = function(angles, segments) {
		var i, j, dx, dy, ray, closest, intersect;
		this.intersects = [];
		for(i = 0; i < angles.length; i++) {
			dx = Math.cos(angles[i]);
			dy = Math.sin(angles[i]);

			ray = {
				x1: this.pos.x,
				y1: this.pos.y,
				x2: this.pos.x + dx,
				y2: this.pos.y + dy
			};

			closest = null;
			for (j = 0; j < segments.length; j++) {
				intersect = getIntersection(ray, segments[j]);
				if (!intersect) continue;
				if (!closest || intersect.param < closest.param) {
					closest = intersect;
				}
			}

			if (!closest) continue;
			closest.angle = angles[i];

			this.intersects.push(closest);
		}

		this.intersects = pareIntersects(this.intersects);

		this.intersects = this.intersects.sort(function(a,b) {
			return a.angle - b.angle;
		});
	};

	Light.prototype.getAllAngles = function(points) {
		var i, angles = [];
		for (i = 0; i < points.length; i++) {
			var angle = Math.atan2(points[i].y - this.pos.y,
				points[i].x - this.pos.x);
			points[i].angle = angle;
			angles.push(angle - 0.00001, angle, angle + 0.00001);
		}
		return angles;
	};

	Light.prototype.draw = function(ctx) {
		if(this.intersects.length === 0) return;
		//draw polygon
		var i, intersect;
		ctx.fillStyle = this.color;
		ctx.beginPath();
		ctx.moveTo(this.intersects[0].x, this.intersects[0].y);
		for (i = 1; i < this.intersects.length; i++) {
			intersect = this.intersects[i];
			ctx.lineTo(intersect.x, intersect.y);
		}
		ctx.fill();
	};

	var pareIntersects = function(intersects) {
		var set = {};
		return intersects.filter(function(i) {
			var key = (i.x | 0) + "," + (i.y | 0);
			if (key in set) {
				return false;
			} else {
				set[key] = true;
				return true;
			}
		});
	};

	var boxSegmentsToPoints = function(segArr) {
		var points = [];

		segArr.forEach(function(seg) {
			points.push({
				x: seg.x1,
				y: seg.y1
			});
		});

		return points;
	};

	var getIntersection = function(ray, seg) {
		var r = new PLine(ray);
		var s = new PLine(seg);
		if (r.d.x / r.getMagnitude() == s.d.x / s.getMagnitude() &&
			r.d.y / r.getMagnitude() == s.d.y / s.getMagnitude() ) {
			//parallel
			return null;
		}
		var T2 = (r.d.x * (s.p.y - r.p.y) + r.d.y * (r.p.x - s.p.x)) /
			(s.d.x * r.d.y - s.d.y * r.d.x);
		var T1 = (s.p.x + s.d.x * T2 - r.p.x) / r.d.x;

		if(T1 < 0) return null;
		if(T2 < 0 || T2 > 1) return null;

		return {
			x: r.p.x + r.d.x * T1,
			y: r.p.y + r.d.y * T1,
			param: T1
		};
	};

	var PLine = function(line){
		this.magnitude = false;
		this.p = { //position
			x: line.x1,
			y: line.y1
		};
		this.d = { //direction
			x: line.x2 - line.x1,
			y: line.y2 - line.y1
		};
	};

	PLine.prototype.getMagnitude = function() {
		if (!this.magnitude) {
			this.magnitude = Math.sqrt(
				this.d.x * this.d.x +
				this.d.y * this.d.y
			);
		}
		return this.magnitude;
	};

	exports.Light = Light;
})(this);
