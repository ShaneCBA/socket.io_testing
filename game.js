
class World {
	constructor(canvas, socket){
		this.canvas = canvas;
		this.ctx = canvas.getContext("2d");
		this.client;
		this.players = {};
		this.keyState = {};
		this.socket = socket;
	}

	keyUp(e){
		this.keyState[e.keyCode || e.which] = false;
	}
	keyDown(e){
		this.keyState[e.keyCode || e.which] = true;
	}

	touchStart(e){
		var touchX = e.changedTouches.item(0).clientX;
		var touchY = e.changedTouches.item(0).clientY;
		if (e.currentTarget.clientWidth/3 + e.currentTarget.getBoundingClientRect().left < touchX && touchX < (e.currentTarget.clientWidth/3 + e.currentTarget.getBoundingClientRect().left)*2){
			if (e.currentTarget.clientHeight/2+e.currentTarget.getBoundingClientRect().top > touchY){
				keyState[87] = true;
				keyState[83] = false;
				keyState[65] = false;
				keyState[68] = false;
			}
			else{
				keyState[83] = true;
				keyState[87] = false;
				keyState[65] = false;
				keyState[68] = false;
			}
		}
		else {
			if (e.currentTarget.clientWidth/2 + e.currentTarget.getBoundingClientRect().left > touchX){
				keyState[65] = true;
				keyState[87] = false;
				keyState[83] = false;
				keyState[68] = false;
			}
			else{
				keyState[68] = true;
				keyState[87] = false;
				keyState[83] = false;
				keyState[65] = false;
			}
		}
		e.preventDefault();
	}
	touchEnd(e){
		e.preventDefault();
		keyState[87] = false;
		keyState[83] = false;
		keyState[65] = false;
		keyState[68] = false;
	}

	start(name, color){
		var self = this;
		if (color.match('[a-fA-F0-9]{6}') == undefined){
			color = "";
			let c = (Math.random()).toString(16);
			color = c.substring(c.length-6,c.length);
		}
		this.client = new Player(50,50,name, color);
		setInterval(function(){
			self.update();
		}, 1);
	}

	update(){
		if (keyState[87] && (keyState[65] || keyState[68]) ){
			if (keyState[65]){
				this.client.moveX(-0.5);
				this.client.moveY(-0.5);
			}
			if (keyState[68]){
				this.client.moveX(0.5);
				this.client.moveY(-0.5);
			}
		}
		else if (keyState[83] && (keyState[65] || keyState[68]) ){
			if (keyState[65]){
				this.client.moveX(-0.5);
				this.client.moveY(0.5);
			}
			if (keyState[68]){
				this.client.moveX(0.5);
				this.client.moveY(0.5);
			}}
		else if (keyState[87]){this.client.moveY(-1)}//up
		else if (keyState[83]){this.client.moveY(1)}//down
		else if (keyState[65]){this.client.moveX(-1)}//left
		else if (keyState[68]){this.client.moveX(1)}//right
		if (keyState[87] || keyState[83] || keyState[65] || keyState[68]){
			this.moved();
		}
		this.draw();
	}

	moved(){
		this.socket.emit('move player',{x:this.client.x,y:this.client.y,name:this.client.name,color:this.client.color});
	}

	draw(){
		this.ctx.clearRect(0,0,canvas.width,canvas.height);
		this.sortPlayers();
		this.drawPlayers();
	}

	drawPlayers(){
		for ( var key in self.players) {
			var plr = new Player(self.players[key].x,self.players[key].y,self.players[key].name, self.players[key].color);
			plr.msg = (self.players[key].msg != undefined)?self.players[key].msg:undefined;
			plr.draw(this.ctx);
		}
	}

	updatePlayers(players){// TOBE REPLACED
		self.players = players;
	}

	updatePlayer(player){//FMT: {id:((ID)),x,y,etc};
		var id = player.id;
		if (!player.dead){
			delete player.id;
			self.players[id] = player;
		}
		else {
			delete self.players[id];
		}
	}

	sortPlayers(){
		var indexArray = [];
		//indexArray = Object.keys(this.players);
		var i;
		var newObj = {};
		this.players[this.socket.id] = {x:this.client.x,y:this.client.y,name:this.client.name,color:this.client.color,msg:this.client.msg};
		for (i in self.players){
			indexArray.push(i);
		}
		indexArray.sort(function(a,b){
			return (self.players[a].y < self.players[b].y)?-1:1;
		});
		for (let n = 0; n < indexArray.length; n++){
			newObj[indexArray[n]] = self.players[indexArray[n]];
		}
		self.players = newObj;

	}
	sendMsg(msg){
		this.socket.emit('chat message', msg);
		this.client.msg = {content:msg,time:(new Date()).getTime()};
		debug("Message Sent");
	}
	newChat(chat){
		self.players[chat.id].msg = {content:chat.content,time:(new Date()).getTime()};
	}
}



// GameObject( X-Position, Y-Position, Width, Height, Image-Source[Directory or url])
class GameObject {
	constructor(x,y,w,h,src){
		this.x = x;
		this.y = y;
		this.width = w;
		this.height = h;
		this.img = new Image();
		this.img.src = src;
	}

	draw(ctx){
		 ctx.drawImage(this.img,this.x,this.y, this.width, this.height);
	}

	setXY(x,y){
		this.x = x;
		this.y = y;
	}

	moveX(x){
		this.x += x;
	}

	moveY(y){
		this.y += y;
	}
}

class Player extends GameObject {
	constructor(x,y,name,color) {
		super(x,y,120,120,"./pegnin.svg?color="+color);
		this.color = color;
		this.name = name;
	}
	draw(ctx){
		super.draw(ctx)
		ctx.font = "35px Impact";
		ctx.fillStyle = "#000000";
		ctx.strokeStyle = "white";
		ctx.lineWidth = 1;
		ctx.textAlign="center"; 
		ctx.fillText(this.name, this.x+this.width/2,this.y-10);
		ctx.strokeText(this.name, this.x+this.width/2,this.y-10);
		if (this.msg != undefined){
			if((new Date()).getTime() - this.msg.time < 5000){
				ctx.font = "20px Arial";

				ctx.shadowBlur=6;
				ctx.shadowOffsetY=1;
				ctx.shadowColor="rgba(0,0,0,0.4)";
				ctx.fillStyle = "#FFFFFF";
				ctx.strokeStyle = "transparent";
				let width = ctx.measureText(this.msg.content).width;
				let padding = 10;
				ctx.fillRect((this.x+this.width/2)-(width/2+padding),this.y-50-padding-20+5,(width+padding*2),20+padding*2-5);

				ctx.shadowBlur=0;
				ctx.shadowOffsetY=0;
				ctx.shadowColor="transparent";
				ctx.fillStyle = "#000000";
				ctx.textAlign="center"; 
				ctx.fillText(this.msg.content, this.x+this.width/2,this.y-50);
				ctx.strokeText(this.msg.content, this.x+this.width/2,this.y-50);
			}
			else {this.msg = undefined;}
		}
	}
}



function debug(thing){
	if (doDebug){
		console.log(thing);
	}
}