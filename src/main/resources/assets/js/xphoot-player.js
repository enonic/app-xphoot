var role = 'player';
var gamePin;
var ws = new WebSocket(xphoot_data.wsUrl, ['game']);

var nick;

var startTime;

ws.onopen = function (event) {
    // TODO check connected
    $('#joinPanel').show();
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
    if (!data.nick && nick) {
        data.nick = nick;
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


var sendPlayerAnswer = function (answer, timeUsed) {

    console.log("Timeused", timeUsed);

    var req = {
        action: 'playerAnswer',
        answer: answer,
        timeUsed: timeUsed
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
    var timeUsed = new Date().getTime() - startTime;
    e.preventDefault();
    sendPlayerAnswer(answer, timeUsed);
    $('#questStartPanel').hide();
    $('#questSubmitPanel').show();
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


function getLayoutClass(data) {
    var layout = 2;

    if (data.question.green) {
        if (data.question.yellow) {
            layout = 4;
        } else {
            layout = 3;
        }
    }
    return "answer-grid-" + layout;
}

function layOutAnswerGrid(data) {
    var answerGrid = $('#answer-grid');
    answerGrid.removeClass("answer-grid-2");
    answerGrid.removeClass("answer-grid-3");
    answerGrid.removeClass("answer-grid-4");
    answerGrid.addClass(getLayoutClass(data));


    if (!data.question.red) {
        $('#answerRed').hide();
    } else {
        $('#answerRed').show();
    }

    if (!data.question.blue) {
        $('#answerBlue').hide();
    } else {
        $('#answerBlue').show();
    }

    if (!data.question.green) {
        $('#answerGreen').hide();
    } else {
        $('#answerGreen').show();
    }

    if (!data.question.yellow) {
        $('#answerYellow').hide();
    } else {
        $('#answerYellow').show();
    }
}

wsResponseHandlers.joinAck = function (data) {

    if (data.error) {
        $('#message').text('Not able to join the game: ' + data.error);
    } else {
        gamePin = data.pin;
        $('#pin').text(data.pin);
        $('#message').text(data.nick + ' joined the game');
        nick = data.nick;
        $('#readyNick').text(data.nick);
        $('#joinPanel').hide();
        $('#readyPanel').show();
    }
};

wsResponseHandlers.questBegin = function (data) {

    layOutAnswerGrid(data);

    $('#readyPanel').hide();
    $('#questEndPanel').hide();
    $('#questStartPanel').show();

    startTime = new Date().getTime();
};

wsResponseHandlers.questEnd = function (data) {
    $('#questEndPanel').text("Quest Ended event");
    $('#questEndPanel').show();
};
