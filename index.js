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



io.on('connection', function (socket) {
	console.log('User connected');
	users[socket.id] = {};
	io.emit('update players',users);

	socket.on('disconnect', function () {
		io.emit('update player',{id:socket.id,dead:true});
		delete users[socket.id];
		console.log('User disconnect');
	});
	socket.on('chat message', function (message) {
		console.log('[MSG] :: '+message);
		var sockets = io.of('/').connected;
		for (var sck in sockets){
			console.log(sockets[sck]["name"]);
		}

		users[socket.id].msg = {content:message,time:(new Date()).getTime()};
		io.emit('update players',users);
	});

	socket.on('get player', function (id) {
		socket.send(users[id].msg);

		io.clients(function (err, clients) {
			console.log(clients);
		});
	});
	socket.on('move player', function (move) {
		socket["nyeh"] = "test";
		users[socket.id].y = move.y;
		users[socket.id].x = move.x;
		users[socket.id].name = move.name;
		socket["name"] = move.name;
		users[socket.id].color = move.color;
		users[socket.id].id = socket.id;
		if (users[socket.id].msg != undefined && (new Date()).getTime() - users[socket.id].msg.time > 5000) users[socket.id].msg = undefined;
		io.emit('update player',users[socket.id]);
	});
});
