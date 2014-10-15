var SCORE = 0;
var RLSS = function() {
	this.init = function() {
		this.loadedCount = 0;
		var img = ['player', 'enemy', 'bullet'];
		this.images = {};
		
		for (var i in img) {
			this.images[img[i]] = new Image();
			this.images[img[i]].addEventListener('load', this.onImageLoad.bind(this), false);
			this.images[img[i]].src = "media/" + img[i] + ".gif";
		}
		
		this.canvas = document.getElementById('stage');
		this.ctx = this.canvas.getContext('2d');
		this.scale = 1;
		
		window.addEventListener('resize', this.onWindowResize.bind(this));
	}
	
	this.onWindowResize = function() {
		this.scale = Math.min(window.innerWidth / 800, window.innerHeight / 600);
		this.canvas.setAttribute('width', 800*this.scale);
		this.canvas.setAttribute('height', 600*this.scale);
		this.canvas.setAttribute('style', 'margin: 0 ' + (window.innerWidth - this.canvas.width)/2 + "px");
	}
	
	this.onImageLoad = function() {
		this.loadedCount++;
		if (this.loadedCount == 2) {
			this.run();
		}
	}
	
	this.run = function() {
		this.onWindowResize();
		
		this.bgGradient = this.ctx.createLinearGradient(0, 0, 0, 600); //x1, y1, x2, y2, NOT x,y,w,h
		this.bgGradient.addColorStop(0, 'rgb(140, 140, 255)');
		this.bgGradient.addColorStop(1, 'rgb(90, 90, 140)');
		
		this._lastTime = (new Date).getTime();
		this.ticker = setInterval(this._tick.bind(this), 1000/60);
		
		this.player = new Player(this.images.player);
		this.gameObjects = [];
		
		this.reset();
		
		window.addEventListener('keydown', this._keyHandler.bind(this));
		window.addEventListener('keyup', this._keyHandler.bind(this));
	}
	
	this.reset = function() {
		this.player.acceleration = {x:0,y:0};
		this.player.speed = {x:0,y:0};
		this.player.position = {x: this.images.player.width / 2, y: (600 - this.images.player.height) / 2};
		
		this.gameObjects = [];
		this.enemyClock = 0;
		this.keyTracker = {};
		
		RLSS.prototype.HIT_COUNT = 0;
		RLSS.prototype.MISS_COUNT = 0;
		RLSS.prototype.SHOT_COUNT = 0;
		
		this.player.alive = true;
	}
	
	this._keyHandler = function(evt) {
		this.keyTracker[evt.keyCode] = evt.type == 'keydown';
		
		if (evt.type == 'keyup') {
			switch (evt.keyCode) {
				case 32: //space
					if (this.player.alive) {
						this.fireBullet();
					}
				break;
				case 13: //enter
					if (!this.player.alive) {
						this.reset();
					}
				break;
			}
		}
	}
	
	this.fireBullet = function() {
		this.gameObjects.push(new Bullet(this.player.position.x + this.player.width/2, this.player.position.y, this.images.bullet));
		RLSS.prototype.SHOT_COUNT++;
	}
	
	this.createEnemy = function() {
		var e = new Enemy(800 + this.images.enemy.width / 2, Math.random() * (600 - this.images.enemy.height) + this.images.enemy.height / 2, this.images.enemy);
		e.init();
		this.gameObjects.push(e);
	}
	
	this._tick = function() {
		var now = (new Date).getTime();
		var passed = now - this._lastTime;
		
		this.ctx.save();
		this.ctx.scale(this.scale, this.scale);
		if (this.player.alive) {
			
			this._update(passed);
			this._render(passed);
			
			this.enemyClock += passed;
			if (this.enemyClock > 1000) {
				this.createEnemy();
				this.enemyClock %= 1000;
			}
		} else {
			this.renderGameOver();
		}
		this.ctx.restore();
		
		this._lastTime = now;
	}
	
	this.renderGameOver = function() {
		this.ctx.clearRect(0,0,800,600);
		
		this.ctx.save();
		this.ctx.fillStyle = this.bgGradient;
		this.ctx.fillRect(0,0,800, 600);
		this.ctx.restore();
		
		this.ctx.save();
		this.ctx.font = "80px YWFT Caliper";
		s = 'GAME OVER';
		this.ctx.fillStyle = 'white';
		this.ctx.fillText(s, (800 - this.ctx.measureText(s).width)/2, 300);
		this.ctx.restore();
		
		this.ctx.save();
		this.ctx.font = "24px YWFT Caliper";
		this.ctx.textAlign = "right";
		var a = RLSS.prototype.HIT_COUNT / Math.max(RLSS.prototype.SHOT_COUNT, 1);
		s = "Hits: " + RLSS.prototype.HIT_COUNT;
		this.ctx.fillStyle = 'white';
		this.ctx.fillText(s, 500, 380);
		s = "- Escapes: " + RLSS.prototype.MISS_COUNT;
		this.ctx.fillText(s, 500, 420);
		s = "x Accuracy: " + (Math.round(100 * a)) + "%";
		this.ctx.fillText(s, 522, 460);
		s = "= SCORE: " + Math.round(100 * a) * (RLSS.prototype.HIT_COUNT - RLSS.prototype.MISS_COUNT);
		this.ctx.fillText(s, 500, 500);
		this.ctx.restore();
		
		this.ctx.save();
		this.ctx.fillStyle = 'white';
		this.ctx.font = "24px YWFT Caliper";
		s = "Press ENTER to restart";
		this.ctx.fillText(s, (800 - this.ctx.measureText(s).width) / 2, 560);
		this.ctx.restore();
	}
	
	this._update = function(passed) {
		this.player.acceleration.x = ((this.keyTracker[37] ? -1 : 0) + (this.keyTracker[39] ? 1 : 0)) * 200;
		this.player.acceleration.y = ((this.keyTracker[38] ? -1 : 0) + (this.keyTracker[40] ? 1 : 0)) * 200;
		
		this.player.update(passed);
		
		for (var i in this.gameObjects) {
			this.gameObjects[i].update(passed);
		}
		
		var dead = [];
		
		//check collisions
		for (i in this.gameObjects) {
			if (this.gameObjects[i].constructor == Enemy && this.gameObjects[i].alive && this.isColliding(this.gameObjects[i], this.player)) {
				//game over, man. game over.
				this.player.die();
				break;
			}
			for (var j in this.gameObjects) {
				if (i != j && this.gameObjects[i].alive && this.gameObjects[j].alive && this.isColliding(this.gameObjects[i], this.gameObjects[j])) {
					this.gameObjects[i].die();
					this.gameObjects[j].die();
					dead.push(this.gameObjects[i]);
					dead.push(this.gameObjects[j]);
				}
			}
		}
		//check edges
		for (i in this.gameObjects) {
			if (this.gameObjects[i].position.x < -this.gameObjects[i].width || this.gameObjects[i].position.x > 800 + this.gameObjects[i].width) {
				if (this.gameObjects[i].constructor == Enemy) {
					RLSS.prototype.MISS_COUNT++;
				}
				dead.push(this.gameObjects[i]);
			}
		}
		
		while (dead.length > 0) {
			this.gameObjects.splice(this.gameObjects.indexOf(dead.pop()), 1);
		}
	}
	
	this.isColliding = function(a, b) {
		if (a.constructor != b.constructor) {
			var bounds = {
				x: a.position.x - a.width/2 - b.width/2,
				y: a.position.y - a.height/2 - b.height/2,
				width: a.width + b.width,
				height: a.height + b.height
			}
			
			return b.position.x >= bounds.x && b.position.x <= bounds.x + bounds.width && b.position.y >= bounds.y && b.position.y <= bounds.y + bounds.height;
		} else {
			return false;
		}
	}
	
	this._render = function(passed) {
		this.ctx.clearRect(0,0,800,600);
		//draw bg
		this.ctx.save();
		this.ctx.fillStyle = this.bgGradient;
		this.ctx.fillRect(0,0,800, 600);
		this.ctx.restore();
		
		//draw player
		this.player.render(this.ctx);
		
		//draw game objects
		for (var i in this.gameObjects) {
			this.gameObjects[i].render(this.ctx);
		}
		
		//draw score
		this.ctx.save();
		this.ctx.font = "10px YWFT Caliper";
		var s = 'HIT: ' + RLSS.prototype.HIT_COUNT;
		this.ctx.fillStyle = 'white';
		this.ctx.fillText(s, 790 - this.ctx.measureText(s).width, 10);
		s = 'ESCAPE: ' + RLSS.prototype.MISS_COUNT;
		this.ctx.fillText(s, 790 - this.ctx.measureText(s).width, 20);
		this.ctx.restore();
	}
};

RLSS.prototype.SHOT_COUNT = 0;
RLSS.prototype.HIT_COUNT = 0;
RLSS.prototype.MISS_COUNT = 0;

var GameObject = function() {
	this.width = 1;
	this.height = 1;
	this.color = 'white';
	this.alive = true;
	
	this.position = {x:0, y:0};
	this.speed = {x:0, y:0};
	this.acceleration = {x:0, y:0};
	
	this.update = function(passed) {
		this.speed.x += this.acceleration.x * passed / 1000;
		this.speed.y += this.acceleration.y * passed / 1000;
		
		this.position.x += this.speed.x * passed / 1000;
		this.position.y += this.speed.y * passed / 1000;
	}
	
	this.render = function(ctx) {
		ctx.save();
		ctx.translate(this.position.x - this.width / 2, this.position.y - this.height / 2);
		ctx.fillStyle = this.color;
		ctx.fillRect(0, 0, this.width, this.height)
		ctx.restore();
	}
	
	this.die = function() {
		this.alive = false;
	}
}

var Player = function(image) {
	this.image = image;
	this.width = image.width;
	this.height = image.height;
	
	this.update = function(passed) {
		this.__proto__.update.call(this, passed);
		this.position.x = Math.min(Math.max(this.width, this.position.x), 800 - this.width);
		this.position.y = Math.min(Math.max(this.height, this.position.y), 600 - this.height);
		if (this.position.x == this.width || this.position.x == 800 - this.width) {
			this.acceleration.x = 0;
			this.speed.x = 0;
		}
		if (this.position.y == this.height || this.position.y == 600 - this.height) {
			this.acceleration.y = 0;
			this.speed.y = 0;
		}
	}
	
	this.render = function(ctx) {
		ctx.save();
		ctx.translate(this.position.x - this.width / 2, this.position.y - this.height / 2);
		ctx.drawImage(this.image, 0,0);
		ctx.restore();
	}
}
Player.prototype = new GameObject;
Player.prototype.constructor = Player;

var Bullet = function(x,y, image) {
	this.image = image;
	this.width = this.image.width;
	this.height = this.image.height;
	this.alive = true;
	
	this.position = {x:x, y:y};
	this.speed = {x:500, y:0};
	
	this.render = function(ctx) {
		ctx.save();
		ctx.translate(this.position.x - this.width / 2, this.position.y - this.height / 2);
		ctx.drawImage(this.image, 0,0);
		ctx.restore();
	}
}
Bullet.prototype = new GameObject;
Bullet.prototype.constructor = Bullet;

var Enemy = function(x, y, image) {
	this.__proto__.ENEMY_COUNT++;
	this.image = image;
	this.width = image.width;
	this.height = image.height;
	
	this.position = {x:x, y:y};
	this.speed = {x:0, y:0};
	
	this.init = function() {
		this.speed.x = -Math.random() * 200 - 100;
	}
	
	this.render = function(ctx) {
		ctx.save();
		ctx.translate(this.position.x - this.width / 2, this.position.y - this.height / 2);
		ctx.drawImage(this.image, 0,0);
		ctx.restore();
	}
	
	this.die = function() {
		this.__proto__.ENEMY_COUNT--;
		RLSS.prototype.HIT_COUNT++;
	}
}
Enemy.prototype = new GameObject;
Enemy.prototype.constructor = Enemy;

var game = new RLSS();
window.addEventListener('load', game.init.bind(game));
