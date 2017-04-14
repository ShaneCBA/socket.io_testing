// index.js

var app = require('express')();
var server = require('http').Server(app);
var io = require('socket.io')(server);

server.listen(3000);

app.get('/', function (req, res) {
	res.sendFile(__dirname + '/index.html');
});

io.on('connection', function (socket) {
	console.log('User connected');
	socket.on('disconnect', function () {
		console.log('User disconnect');
	});
	socket.on('chat message', function (msg) {
		io.emit('chat message', msg);
		console.log('[MSG] :: '+msg);
	});
});
