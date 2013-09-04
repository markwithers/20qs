var _ = require('underscore');
var express = require('express');
var app = express();

var server = app.listen(process.env.PORT || 3333);

app.configure(function() {
    app.use(express.bodyParser())
    app.use(express.methodOverride())
    app.use(express.cookieParser())
    app.use(express.static(__dirname + '/public'))
    app.use(app.router)
})

var io = require('socket.io').listen(3232);

var id = 1;
var games = [];

io.sockets.on('connection', function (socket) {
	
	socket.on('info', function() {
		var openGames =_.filter(games, function(game) { 
			return !game.finished;
		});
	
		io.sockets.emit('game-list', { games: openGames });
	});
	
	socket.on('create', function (data) {
		var game = {
			id: id,
			questions: [],
			state: 'pending',
			creator: data.name,
			finished: false
		};
		
		if (data.role == 'Guesser'){
			game.guesser = data.name;
		}
		else if (data.role == 'Answerer'){
			game.answerer = data.name;
		}
				
		games.push(game);
	
		var openGames =_.filter(games, function(game) { 
			return !game.finished;
		});

		socket.join(game.id);
		io.sockets.in(game.id).emit('start', { game: game });
		io.sockets.emit('game-list', { games: openGames });
		
		id++;
	});
	
	socket.on('join', function (data) {
		var game = getGame(data.id);
		
		if (game.answerer) {
			game.guesser = data.name;
		}
		else { 
			game.answerer = data.name;
		}
		
		socket.join(game.id);
		io.sockets.in(game.id).emit('start', { game: game });
	});
	
	socket.on('watch', function (data) {
		var game = getGame(data.id);
				
		socket.join(game.id);
		io.sockets.in(game.id).emit('start', { game: game });
	});
	
	socket.on('rejoin', function (data) {
		var game = getGame(data.id);
		
		socket.join(game.id);
		io.sockets.in(game.id).emit('start', { game: game });
	});
	
	socket.on('submit-answer', function(data) {
		var game = getGame(data.id);
		
		game.answer = data.answer;
		game.state = 'ask';
		
		io.sockets.in(game.id).emit('ready', { game: game });
	});
	
	socket.on('ask', function (data) {	
		var game = getGame(data.id);
		if (game.state != 'ask' || game.finished) {
			return;
		}
		
		if (!game.answerer || !game.guesser){
			return;
		}
	
		var question = { id: game.questions.length + 1, text: data.text };
		game.questions.push(question);
		game.state = 'answer';
	
		io.sockets.in(game.id).emit('question', { text: data.text, id: question.id, game: game });
	});
	
	socket.on('answer', function (data) {
		var game = getGame(data.id);
		if (game.state != 'answer' || game.finished) {
			return;
		}
		
		game.state = 'ask';
		
		var question = _.last(game.questions);
		if (question.id == 20 && !data.correct) {
			question.answer = 'lose';
			game.finished = true;
			io.sockets.in(game.id).emit('lose', { id: question.id, game: game });
		}
		else if (data.correct) {
			question.answer = 'correct';
			game.finished = true;
			io.sockets.in(game.id).emit('correct', { id: question.id, game: game });
		}
		else if (data.yes) {
			question.answer = 'yes';
			io.sockets.in(game.id).emit('yes', { id: question.id, game: game });
		}
		else {
			question.answer = 'no';
			io.sockets.in(game.id).emit('no', { id: question.id, game: game });
		}
	});
	
	
	socket.on('chat-send', function (data) {
		var game = getGame(data.id);
	
		io.sockets.in(game.id).emit('chat', { name: data.name, message: data.message });
	});
});

function getGame(id){
	return _.findWhere(games, { id: id });
}