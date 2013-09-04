game = {
	id: 1,
	questionGuy: 'Mark',
	answerGuy: 'Rich',
	questions: [
		{ Id: 1, text: 'Are you a boy?', answer: 'Yes' }
	]
}

/* Joining API */

Create(yourName, yourRole) {
	creates a game
	redirect you to game screen
}

Join(yourName, gameId) {
	joins the game, as the free role
	redirect you to game screen
}

ReJoin(yourName, gameId) {
	redirect you to game screen
	show all exisitng questions
}

Spectate(yourName, gameId){
	redirect you to game screen
}

/* Game API */

Question(text, gameId){

}

Answer(gameId, questionId, answer){

}