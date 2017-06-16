// index.js
var app = require('express')();
var fs = require('fs');
var https = require('https');
var options = {
	key: fs.readFileSync('./file.pem'),
	cert: fs.readFileSync('./file.crt')
};
var server = https.createServer(options,app);
var io = require('socket.io')(server);

server.listen(443,"0.0.0.0");

const users = {};


app.get('/', function (req, res) {
	res.sendFile(__dirname + '/index.html');
});
app.get('/game.js', function (req, res) {
	res.sendFile(__dirname + '/game.js');
});
app.get('/ytdl', function(req, res){
	res.writeHead(200, {'Content-Type':'text/html'});
	res.sendFile(__dirname + '/index.html');
});
app.get('/pegnin.svg', function (req, res) {
	fs.readFile('./pegnin.svg', 'utf8', function(err, data) {
		if (err){
			return console.log(err);
		}
		color = req.query.color;
		if (color != undefined){
			mtch = color.match('[a-fA-F0-9]{6}');
			if (mtch != null){
				color = mtch[0];
			}
			else {
				color = "1aeb1a";
			}
		} else {color = "1aeb1a"}

		data = data.replace("{{COLOR}}","#"+color);
		res.writeHead(200, {'Content-Type':'image/svg+xml'});
		res.end(data, 'utf-8');
		//res.sendFile(__dirname + '/pegnin.svg');
	});
});
app.get('/portal.svg', function (req, res) {
	res.sendFile(__dirname + '/portal.svg');
});



var rooms = [];
rooms.push({room:'hub',objects:[
	{x:200,y:200,w:75,h:75,src:"./portal.svg",action:'room',condition:'collide',room:1}
]});
rooms.push({room:'nope',background:"url(https://i.imgur.com/RbaEhHA.jpg) center/cover no-repeat",objects:[
	{x:0,y:100,w:75,h:75,src:"./portal.svg",action:'room',condition:'collide',room:0}
]});

io.on('connection', function (socket) {
	console.log('User connected');
	socket.player = {};

	socket.on('disconnect', function () {
		io.to(socket.room).emit('update player',{id:socket.id,dead:true});
		console.log('User disconnect');
	});

	socket.on('chat message', function (message) {
		console.log('[MSG] :: '+message);

		io.to(socket.room).emit('player chat', {id:socket.id,content:message});
	});

	socket.on('move player', function (move) {
		socket.player.y = move.y;
		socket.player.x = move.x;
		socket.player.name = move.name;
		socket.player.color = move.color;
		socket.player.id = socket.id;
		//console.log(socket.id+" >> "+Object.keys(socket.rooms)+"\n\n");

		if (socket.player.msg != undefined && (new Date()).getTime() - socket.player.msg.time > 5000) socket.player.msg = undefined;

		socket.broadcast.to(socket.room).emit('update player',socket.player);
		
		socket.emit('update player',socket.player);
	});

	socket.on('join room', function (id) {
		if (socket.room != undefined) socket.leave(socket.room);
		socket.broadcast.to(socket.room).emit('update player',{id:socket.id,dead:true});

		socket.room = rooms[id].room;
		console.log("\n{");
		socket.join(rooms[id].room);console.log(rooms[id].room);
		socket.join(rooms[id].room);console.log(socket.rooms);
		socket.rooms[""+socket.room+""] = socket.room;
		console.log("}\n");
		io.emit('player chat',{id:socket.id,content:Object.keys(socket.rooms),time:(new Date()).getTime()})

		socket.emit('update map', rooms[id]);

		socket.broadcast.to(socket.room).emit('update player', socket.player);
	})
	socket.on('get players', function (){
		try
		{
			plrs = io.sockets.sockets;
			plrKeys = Object.keys(plrs);
			console.log(plrKeys);
			for (var x = 0; x < plrKeys.length; x++){
				if (plrs[plrKeys[x]].rooms[socket.room]) socket.emit('update player',plrs[plrKeys[x]].player);
			}
		}
		catch(e)
		{
			console.log(e);
		}
	})
});
