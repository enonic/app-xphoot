var role = 'master';
var ws = new WebSocket(xphoot_data.wsUrl, ['game']);
var players = {};
var game, pin;

var currentQuestNum = 0;

var answers = {};

$(function () {
    loadGames();
});

ws.onopen = function (event) {

    //

};

var wsResponseHandlers = {};

ws.onmessage = function (event) {
    console.log("Yay, a message for me: " + event.data);
    var data = JSON.parse(event.data);
    var action = data.action;

    var handler = wsResponseHandlers[action];
    if (handler) {
        handler(data);
    }
};

var loadGames = function () {
    var games = xphoot_data.games, l = games.length, i;
    var gameSelect = $('#games');

    gameSelect.append($("<option></option>").attr("value", '').text('- select a game -'));
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

function processNextQuestion() {
    if (isMoreQuestions()) {
        sendQuestBegin(currentQuestNum);
    } else {
        console.log("## All questions done, end quiz!");
        send({action: 'quizEnd'});
    }
}
var startActionTimer = function (duration, action) {
    var timer = duration;
    showTimer(duration);

    var timerId = setInterval(function () {
        showTimer(timer);
        if (--timer < 0) {
            clearInterval(timerId);
            action();
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
    // delete question['answer'];
    var req = {
        action: 'questBegin',
        question: question
    };
    send(req);
};

var sendQuestEnd = function () {

    console.log("Send quest end");

    var req = {
        action: 'questEnd'
    };

    send(req);
};

var showQuestion = function (question) {
    $('#questionPanel').show();
    $('#joinPanel').hide();
    $('#questionText').text(question.question);

    startActionTimer(10, sendQuestEnd)
};

var showQuestResult = function (data) {
    // Show leaderboard

    for (var player in answers) {
        if (answers.hasOwnProperty(player)) {
            console.log("Score: " + player + " : " + answers[player]);
        }
    }
    console.log("Handle Show Quest Result")
    currentQuestNum++;
    startActionTimer(5, processNextQuestion);
};

var isMoreQuestions = function () {
    return game.questions.length > currentQuestNum;
};

var calculateScore = function (timeUsed) {
    return 10000 - timeUsed;
};

wsResponseHandlers.joinAck = function (data) {
    game = data.game;
    pin = data.pin;
    console.log('Game: ', game);
    $('#selectPanel').hide();
    $('#joinPanel').show();
    $('#pin').text(data.pin);
    $('#gameName').text(game.name);

    startActionTimer(10, processNextQuestion);
};

wsResponseHandlers.playerJoined = function (data) {
    players[data.nick] = {nick: data.nick};
    $('#players').append('<li>' + data.nick + '</li>');
};

wsResponseHandlers.questBegin = function (data) {
    showQuestion(data.question);
};

wsResponseHandlers.questEnd = function (data) {
    showQuestResult(data);
};

wsResponseHandlers.playerAnswer = function (data) {

    var player = data.nick;

    if (game.questions[currentQuestNum].answer == data.answer) {
        answers[player] = (answers[player] || 0) + calculateScore(data.timeUsed);
    }
};