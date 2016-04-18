var role = 'master';
var ws = new WebSocket(xphoot_data.wsUrl, ['game']);
var players = {};
var game, pin;

$(function () {
    loadGames();
});

ws.onopen = function (event) {

    //

};

var wsResponseHandlers = {};

ws.onmessage = function (event) {
    //console.log("Yay, a message for me: " + event.data);
    var data = JSON.parse(event.data);
    var action = data.action;

    var handler = wsResponseHandlers[action];
    if (handler) {
        handler(data);
    }

};

var send = function (data) {
    if (!data.pin && pin) {
        data.pin = pin;
    }
    ws.send(JSON.stringify(data));
};

var sendJoin = function (role, gameId) {
    var req = {
        action: 'join',
        role: role,
        gameId: gameId
    };
    send(req);
};

var sendQuestBegin = function (questionNumber) {
    var question = getQuestion(questionNumber);
    showQuestion(question);

    delete question['answer'];
    var req = {
        action: 'questBegin',
        question: getQuestion(questionNumber)
    };
    send(req);
};

wsResponseHandlers.joinAck = function (data) {
    game = data.game;
    pin = data.pin;
    console.log('Game: ', game);
    $('#selectPanel').hide();
    $('#joinPanel').show();
    $('#pin').text(data.pin);
    $('#gameName').text(game.name);

    startCountDown(10);
};

wsResponseHandlers.playerJoined = function (data) {
    players[data.nick] = {nick: data.nick};
    $('#players').append('<li>' + data.nick + '</li>');
};

var loadGames = function () {
    var games = xphoot_data.games, l = games.length, i;
    var gameSelect = $('#games');

    gameSelect.append($("<option></option>").attr("value", '').text('--- Select a quizz ---'));
    for (i = 0; i < l; i++) {
        gameSelect.append($("<option></option>").attr("value", games[i].id).text(games[i].name));
    }

    gameSelect.on('change', function (e) {
        e.preventDefault();
        var gameId = this.value;
        if (gameId) {
            sendJoin(role, gameId);
        }
    });
};


var startCountDown = function (duration) {
    var timer = duration;
    showTimer(duration);

    var timerId = setInterval(function () {
        showTimer(timer);
        if (--timer < 0) {
            clearInterval(timerId);

            sendQuestBegin(0);
        }
    }, 1000);
};

var showTimer = function (duration) {
    var timer = duration, minutes, seconds;
    minutes = parseInt(timer / 60, 10);
    seconds = parseInt(timer % 60, 10);

    minutes = minutes < 10 ? "0" + minutes : minutes;
    seconds = seconds < 10 ? "0" + seconds : seconds;

    $('#timeLeft').text(minutes + ":" + seconds);
};

var getQuestion = function (questionNumber) {
    return game.questions[questionNumber];
};

var showQuestion = function (question) {
    $('#questionPanel').show();
    $('#joinPanel').hide();
    $('#questionText').text(question.question);

    console.log(question);
};
