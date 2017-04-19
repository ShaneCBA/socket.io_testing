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
	//Usefull !! 
	console.log('User connected');
	socket.player = {};
	
	socket.on('disconnect', function () {
		io.emit('update player',{id:socket.id,dead:true});
		console.log('User disconnect');
	});
	socket.on('chat message', function (message) {
		console.log('[MSG] :: '+message);

		io.emit('player chat', {id:socket.id,content:message});
	});

	socket.on('move player', function (move) {
		socket.player.y = move.y;
		socket.player.x = move.x;
		socket.player.name = move.name;
		socket.player.color = move.color;
		socket.player.id = socket.id;

		if (socket.player.msg != undefined && (new Date()).getTime() - socket.player.msg.time > 5000) socket.player.msg = undefined;
		socket.broadcast.emit('update player',socket.player);
	});
});
