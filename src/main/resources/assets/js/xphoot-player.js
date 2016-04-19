var role = 'player';
var gamePin;
var ws = new WebSocket(xphoot_data.wsUrl, ['game']);

ws.onopen = function (event) {
    // TODO check connected
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

var send = function (data) {
    if (!data.pin && gamePin) {
        data.pin = gamePin;
    }
    ws.send(JSON.stringify(data));
};

var sendJoin = function (role, nick, pin) {
    var req = {
        action: 'join',
        role: role,
        nick: nick,
        pin: pin
    };
    send(req);
};


var sendPlayerAnswer = function (answer, score) {
    var req = {
        action: 'playerAnswer',
        answer: answer,
        score: score
    };
    send(req);
};

$('#sendJoin').on('click', function (e) {
    e.preventDefault();
    var nick = $('#nick').val();
    var pin = $('#pin').val();
    sendJoin(role, nick, pin);
});

function sendAnswer(e, answer) {
    e.preventDefault();
    sendPlayerAnswer(answer, calculateScore());
    $('#questStartPanel').hide();
    $('#questEndPanel').show();
}

function calculateScore() {
    return 4321;
}

$('#answerRed').on('click', function (e) {
    sendAnswer(e, 'red');
});

$('#answerBlue').on('click', function (e) {
    sendAnswer(e, 'blue');
});

$('#answerGreen').on('click', function (e) {
    sendAnswer(e, 'green');
});

$('#answerYellow').on('click', function (e) {
    sendAnswer(e, 'yellow');
});

wsResponseHandlers.joinAck = function (data) {
    if (data.error) {
        $('#message').text('Not able to join the game: ' + data.error);
    } else {
        gamePin = data.pin;
        $('#pin').text(data.pin);
        $('#message').text(data.nick + ' joined the game');

        $('#readyNick').text(data.nick);
        $('#joinPanel').hide();
        $('#readyPanel').show();
    }
};

wsResponseHandlers.questBegin = function (data) {

    var questPanel = $('#questStartPanel');

    $('#answerRed').text(data.question.red);
    $('#answerBlue').text(data.question.blue);
    $('#answerGreen').text(data.question.green);
    $('#answerYellow').text(data.question.yellow);

    $('#readyPanel').hide();
    $('#questEndPanel').hide();
    questPanel.show();
};
