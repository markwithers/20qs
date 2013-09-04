var questions = questions || {};

questions.game = function() {
	var game = {};
	var role = '';
	var name = '';
	
	var socket = io.connect('http://localhost:3232');
	
	var setupSocketEvents = function(){
		socket.on('start', function (data) {
			game = data.game;
			$('#game').fadeIn();
			$('#chat').fadeIn();
			$('.minor-info').fadeIn();
			
			if (role == '') {		
				if (data.game.guesser == name) {
					role = 'guesser';
					if (game.state !='pending') {
						$('#question-container').fadeIn();
					}
					else {
						setStatus(data.game);
					}
				} 
				else if (data.game.answerer == name) {
					role = 'answerer';
					if (!data.game.answer) {
						$('#answer-container').fadeIn();
					}
				} 
				else {
					role = 'spectator';
				}
				
				for (var q in data.game.questions) {
					var question = data.game.questions[q];
					addQuestion(question);
				}
			} 
			else {
				var opponent = data.game.guesser;
				if (data.game.guesser == name) {
					opponent = data.game.answerer;
				}
			}
			
			$('#game-id').html(game.id);
			
			var playerList = [];
			if (game.answerer) {
				playerList.push(game.answerer);
			}
			if (game.guesser) {
				playerList.push(game.guesser);
			}
			
			$('#players').html(playerList.join(', '));

			setStatus(game);
		});
		
		socket.on('question', function (data) {		
			addQuestion(data);
			$('html,body').scrollTop(100000000000000000);
			setStatus(data.game);
		});
		
		socket.on('yes', function (data) {
			var item = $('li[data-id="' + data.id + '"]');
			item.addClass('answer-yes');
			item.children('button').remove();
			setStatus(data.game);
		});
		
		socket.on('no', function (data) {
			var item = $('li[data-id="' + data.id + '"]');
			item.addClass('answer-no');
			item.children('button').remove();
			setStatus(data.game);
		});
		
		socket.on('correct', function (data) {
			var item = $('li[data-id="' + data.id + '"]');
		
			item.addClass('answer-correct');
			item.html(item.html() + ' - The Guesser has won!!! The answer was ' + data.game.answer);
			
			item.children('button').remove();
		});
		
		socket.on('lose', function (data) {
			var li = $('<li>');
			if (role == 'answerer') {
				li.html('You Win!!!!');
			}
			else {
				li.html('You Lose!!!! The answer was ' + data.game.answer);
			}
			
			$('#question-list').append(li);
		});
		
		socket.on('game-list', function (data) {
			$('#game-list').html('');

			for (var g in data.games){
				var game = data.games[g];
				
				var role = 'Guesser';
				if (game.answerer) {
					role = 'Answerer';
				}
				
				var li = $('<li>').html('<span class="creator">' + game.creator + '</span>  ' + role + ' ');
				
				if (name == game.guesser || name == game.answerer) {
					var join = $('<button>').html('Rejoin').addClass('rejoin').data('id', game.id);
					li.append(join);
				}
				else if (!game.guesser || !game.answerer) {
					var join = $('<button>').html('Join').addClass('join').data('id', game.id);
					li.append(join);
				}
				else {
					var watch = $('<button>').html('Watch').addClass('watch').data('id', game.id);
					li.append(watch);
				}
			
				$('#game-list').append(li);
			}
		});
		
		socket.on('ready', function(data) {
			if (role == 'guesser') {
				$('#question-container').fadeIn();
			}
		});
		
		socket.on('chat', function(data) {
			var li = $('<li>').html('<span>' + data.name + '</span>' + data.message);
			$('#chat ul').append(li);
			$("#chat ul").scrollTop($("#chat ul")[0].scrollHeight);
		});
	};

	var setupUIEvents = function() {
		$('#create-game-guesser').click(function() {
			socket.emit('create', { name: name, role: 'Guesser' });
			
			$('#lobby').hide();
		});
		
		$('#create-game-answerer').click(function() {
			socket.emit('create', { name: name, role: 'Answerer' });
			
			$('#lobby').hide();
		});

		$('#ask').click(function() {
			socket.emit('ask', { text: $('#question').val(), id: game.id });
			$('#question').val('');
		});
		
		$('ol').on('click', '.yes', function() {
			socket.emit('answer', { id: game.id, yes: true });
		});
		
		$('ol').on('click', '.no', function() {
			socket.emit('answer', { id: game.id });
		});
		
		$('ol').on('click', '.correct', function() {
			socket.emit('answer', { id: game.id, correct: true });
		});
		
		$('#lobby').on('click', '.join', function() {
			$('#lobby').hide();
						
			var id = $(this).data('id');
			socket.emit('join', { name: name, id: id });
		});
		
		$('#lobby').on('click', '.rejoin', function() {
			$('#lobby').hide();
						
			var id = $(this).data('id');
			socket.emit('rejoin', { name: name, id: id });
		});
		
		$('#lobby').on('click', '.watch', function() {
			$('#lobby').hide();
						
			var id = $(this).data('id');
			socket.emit('rejoin', { name: name, id: id });
		});
		
		$('#question').keydown(function (e) {
			if (e.keyCode == 13) {
				$('#ask').click();
			}
		});
		
		$('#name').keydown(function (e) {
			if (e.keyCode == 13) {
				$('#login-button').click();
			}
		});
		
		$('#chat-message').keydown(function (e) {
			if (e.keyCode == 13) {
				$('#chat-button').click();
			}
		});
			
		$('#answer-button').click(function() {
			$('#answer-container').hide();
			var answer = $('#answer').val();
			
			socket.emit('submit-answer', { id: game.id, answer: answer });
		});
		
		$('#login-button').click(function() {
			name = $('#name').val();
			
			$('#login').hide();
			$('#lobby').fadeIn();
			$('#logged-in').html('Logged in as ' + name);
			
			localStorage.name = name;
			
			socket.emit('info');
		});
		
		$('#chat-button').click(function() {
			var message = $('#chat-message').val();
			$('#chat-message').val('');
			$('#chat-message').focus();
			
			socket.emit('chat-send', { id: game.id, name: name, message: message });
		});
	};

	function addQuestion(question) {
		var li = $('<li>').html(question.text).attr('data-id', question.id);
		
		if (role == 'answerer' && !question.answer) {
			var yes = $('<button>').html('Yes').data('id', question.id).addClass('yes');
			var no = $('<button>').html('No').data('id', question.id).addClass('no');
			var correct = $('<button>').html('Correct').data('id', question.id).addClass('correct');
		
			li.append('<br/>').append(yes).append(no).append(correct);
		}
		
		if (question.answer == 'no') {
			li.addClass('answer-no');
		}
		else if (question.answer == 'yes') {
			li.addClass('answer-yes');
		}
		
		$('#question-list').append(li);
	}

	function setStatus(game) {
		if (role == 'guesser') {
			if (game.state == 'pending'){
				$('#status').html('Waiting for the answer to be set');
			}
			else if (game.state == 'ask') {
				$('#status').html('Make a guess!');
			}
			else {
				$('#status').html('Waiting for the answer');
			}	
		}

		if (role == 'answerer') {
			if (game.state == 'pending'){
				$('#status').html('');
			}
			else if (game.state == 'ask') {
				$('#status').html('Waiting for a question');
			}
			else {
				$('#status').html('Give an answer!');
			}	
		}
		
	}

	var start = function() {
		setupUIEvents();
		setupSocketEvents();

		if (localStorage.name) {
			name = localStorage.name;
			
			$('#login').hide();
			$('#lobby').fadeIn();
			$('#logged-in').html('Logged in as ' + name);
			
			socket.emit('info');
		}		
	};

	var exports = {};
	exports.start = start;

	return exports;
}();