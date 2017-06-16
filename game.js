
var doDebug = false;

class World {
	constructor(canvas, socket){
		this.canvas = canvas;
		this.ctx = canvas.getContext("2d");
		this.client;
		this.players = {};
		this.keyState = {};
		this.socket = socket;
		this.mapObjs = [];
		this.keyUp.bind(this);
		this.keyDown.bind(this);
		this.touchStart.bind(this);
		this.update.bind(this);
		this.start.bind(this);
		this.moved.bind(this);
		this.draw.bind(this);
		this.drawPlayers.bind(this);
		this.updateMap.bind(this);
		this.drawMap.bind(this);
		this.updatePlayer.bind(this);
		this.joinRoom.bind(this);
		this.actions = {
			room:function (room) {
				this.joinRoom(room);
				this.players = {};
			}.bind(this)
		};
		this.conditions = {
			collide:function(obj1, obj2){
				return (((obj1.x < obj2.x + obj2.w) && (obj1.x + obj1.w > obj2.x + obj2.w)) || ((obj1.x + obj1.w > obj2.x) && (obj1.x < obj2.x))) && (((obj1.y < obj2.y + obj2.h) && (obj1.y + obj1.h > obj2.y + obj2.h)) || ((obj1.y + obj1.h > obj2.y) && (obj1.y < obj2.y)))
			}
		}
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

	start(name, color, room){
		room = (room || 0);
		if (color.match('[a-fA-F0-9]{6}') == undefined){
			color = "";
			let c = (Math.random()).toString(16);
			color = c.substring(c.length-6,c.length);
		}
		this.client = new Player(50,50,name, color);
		setInterval(function(){
			this.update();
		}.bind(this), 1);
		setTimeout(function(){this.socket.emit('join room', 0);}.bind(this),1000);
		
	}

	update(){
		if (this.keyState[87] && (this.keyState[65] || this.keyState[68]) ){
			if (this.keyState[65]){
				this.client.moveX(-0.5);
				this.client.moveY(-0.5);
			}
			if (this.keyState[68]){
				this.client.moveX(0.5);
				this.client.moveY(-0.5);
			}
		}
		else if (this.keyState[83] && (this.keyState[65] || this.keyState[68]) ){
			if (this.keyState[65]){
				this.client.moveX(-0.5);
				this.client.moveY(0.5);
			}
			if (this.keyState[68]){
				this.client.moveX(0.5);
				this.client.moveY(0.5);
			}}
		else if (this.keyState[87]){this.client.moveY(-1)}//up
		else if (this.keyState[83]){this.client.moveY(1)}//down
		else if (this.keyState[65]){this.client.moveX(-1)}//left
		else if (this.keyState[68]){this.client.moveX(1)}//right
		if (this.keyState[87] || this.keyState[83] || this.keyState[65] || this.keyState[68]){
			this.moved();
		}
		this.draw();
	}

	moved(){
		this.socket.emit('move player',{x:this.client.x,y:this.client.y,name:this.client.name,color:this.client.color});
		debug(this.players);
	}

	draw(){
		this.ctx.clearRect(0,0,canvas.width,canvas.height);
		//this.sortPlayers();
		this.drawPlayers();
		this.drawMap();
	}

	drawPlayers(){
		for ( var key in this.players) {
			var plr = new Player(this.players[key].x,this.players[key].y,this.players[key].name, this.players[key].color);
			plr.msg = (this.players[key].msg != undefined)?this.players[key].msg:undefined;
			plr.draw(this.ctx);
		}
	}
	drawMap(){
		if (this.mapObjs.length > 0){
			this.mapObjs.forEach(function(object){
				try{if (this.conditions[object.condition](object, this.client)) {this.actions[object.action](object.room);delete this.client.msg}}catch(e) {}
				var obj = new GameObject(object.x,object.y,object.w,object.h,object.src);
				obj.draw(this.ctx);
			}.bind(this));
		}
	}

	updatePlayer(player){//FMT: {id:((ID)),x,y,etc};
		var id = player.id;
		console.log("doot");
		if ('undefined' === typeof this.players[id]){
			this.players[id] = {};
			console.log(id+"is added");
		}
		if (!player.dead){
			delete player.id;
			this.players[id].x = player.x;
			this.players[id].y = player.y;
			this.players[id].color = player.color;
			this.players[id].name = player.name;
		}
		else {
			delete this.players[id];
			console.log(id+" is disconnected");
		}
	}

	sortPlayers(){
		var indexArray = [];
		var i;
		var newObj = {};
		this.players[this.socket.id] = {x:this.client.x,y:this.client.y,name:this.client.name,color:this.client.color,msg:this.client.msg};
		//indexArray = Object.keys(this.players);
		for (i in this.players){
			indexArray.push(i);
		}
		indexArray.sort(function(a,b){
			return (this.players[a].y < this.players[b].y)?-1:1;
		}.bind(this));
		for (let n = 0; n < indexArray.length; n++){
			newObj[indexArray[n]] = this.players[indexArray[n]];
		}
		if (this.players != {})
			this.players = newObj;

	}
	sendMsg(msg){
		this.socket.emit('chat message', msg);
		this.client.msg = {content:msg,time:(new Date()).getTime()};
		debug("Message Sent");
	}
	newChat(chat){
		this.players[chat.id].msg = {content:chat.content,time:(new Date()).getTime()};
	}

	updateMap(map){
		this.mapObjs = map.objects;
		debug(this.mapObjs);
		this.canvas.style.background = (map.background || "#FFFFFF");
	}

	joinRoom(room){
		this.socket.emit('join room', room);
		this.players = {};
	}
}



// GameObject( X-Position, Y-Position, Width, Height, Image-Source[Directory or url])
class GameObject {
	constructor(x,y,w,h,src){
		this.x = x;
		this.y = y;
		this.w = w;
		this.h = h;
		this.img = new Image();
		this.img.src = src;
	}

	draw(ctx){
		 ctx.drawImage(this.img,this.x,this.y, this.w, this.h);
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
		super(x,y,70,70,"./pegnin.svg?color="+color);
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
		ctx.fillText(this.name, this.x+this.w/2,this.y-10);
		ctx.strokeText(this.name, this.x+this.w/2,this.y-10);
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
				ctx.fillRect((this.x+this.w/2)-(width/2+padding),this.y-50-padding-20+5,(width+padding*2),20+padding*2-5);

				ctx.shadowBlur=0;
				ctx.shadowOffsetY=0;
				ctx.shadowColor="transparent";
				ctx.fillStyle = "#000000";
				ctx.textAlign="center"; 
				ctx.fillText(this.msg.content, this.x+this.w/2,this.y-50);
				ctx.strokeText(this.msg.content, this.x+this.w/2,this.y-50);
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