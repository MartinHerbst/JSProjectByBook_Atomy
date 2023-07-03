var Game = function() {
	this._players = [];
	this._currentPlayer = 0;
	this._draw = new Draw();
	this._board = null;
}



while(isNaN(Game.SIZE) || Game.SIZE > 12 || Game.SIZE < 5) {
	Game.SIZE = prompt("Please enter a number from 5 to 12 describing the game size:", "");
	Game.SIZE = parseInt(Game.SIZE, 10);
}

Game.isOver = function(score) {
	return (Math.max.apply(Math, score) == this.SIZE*this.SIZE);
}

Game.prototype.start = function(players) {
	this._players = players;

	this._board = new Board(players, this._draw);
	this._board.onTurnDone = this._turnDone.bind(this);

	this._askPlayer();
}

Game.prototype.canContinue = function() {
	return !!localStorage.getItem("atoms");
}

Game.prototype.save = function() {
	var data = {
		board: this._board.getState(),
		currentPlayer: this._currentPlayer,
		players: []
	};

	for (var i=0; i<this._players.length; i++) {
		data.players.push(this._players[i].getState());
	}

	var json = JSON.stringify(data);
	localStorage.setItem("atoms", json);
}

Game.prototype.load = function() {
	var json = localStorage.getItem("atoms");

	try {
		var data = JSON.parse(json);
	} catch (e) {
		alert("Badly formatted game data");
	}

	for (var i=0; i<data.players.length; i++) {
		this._players.push(Player.fromState(data.players[i]));
	}

	this._board = new Board(this._players, this._draw);
	this._board.onTurnDone = this._turnDone.bind(this);
	this._board.setState(data.board);

	this._currentPlayer = data.currentPlayer;

	this._updateScores();
	this._askPlayer();
}

Game.prototype._askPlayer = function() {
	var player = this._players[this._currentPlayer];
	player.play(this._board, this._draw, this._playerDone.bind(this));
}

Game.prototype._playerDone = function(xy) {
	var player = this._players[this._currentPlayer];
	var existing = this._board.getPlayer(xy);

	if (!existing || existing == player) {
		this._board.addAtom(xy, player);
	} else {
		this._askPlayer();
	}
}

Game.prototype.findNextPlayer = function() {
	var nextPlayer = 1;
	var totalScore = 0;
	for (var k=0; k<this._players.length; k++) {
		var player = this._players[k];
		var score = this._board.getScoreFor(player);
		totalScore += score;
	}
	for(var j=0; j<this._players.length; j++) {
		var playerScore = this._board.getScoreFor(this._players[(this._currentPlayer + nextPlayer) % this._players.length]);
		if(playerScore == 0 && totalScore == Game.SIZE*Game.SIZE) {
			nextPlayer++;
		} else {
			break;
		}
	}
	return nextPlayer;
}

Game.prototype._turnDone = function() {
	var scores = this._updateScores();

	if (Game.isOver(scores)) { /* Game Over! */
		localStorage.removeItem("atoms");
		ableToStart();

		alert("Player " + this._currentPlayer+1 + " wins!");
		location.reload();
		return;
	}

	var nextPlayer = this.findNextPlayer();	
	this._currentPlayer = (this._currentPlayer+nextPlayer) % this._players.length;
	this.save();

	this._askPlayer();
}

Game.prototype._updateScores = function() {
	var scores = [];

	for (var i=0; i<this._players.length; i++) {
		var player = this._players[i];
		var score = this._board.getScoreFor(player);
		player.setScore(score);
		scores.push(score);
	}

	return scores;
}