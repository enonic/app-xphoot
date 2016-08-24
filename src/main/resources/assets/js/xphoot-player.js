var role = 'player';
var gamePin;
var ws, connected, keepAliveIntervalId;
var playerNick, sessionId;

var startTime;

var currentQuestion;
var currentAnswer;

$(function () {
    wsConnect();

    setTimeout(function () {
        $('#pin').focus();
    });

    $('#pin,#nick').keypress(function (e) {
        if (e.which == 13) {
            var nick = $('#nick').val();
            var pin = $('#pin').val();
            sendJoin(role, nick, pin);
            return;
        }
        $('#pin').removeClass('invalid');
    });
});


$('#sendJoin').on('click', function (e) {
    e.preventDefault();
    var nick = $('#nick').val();
    var pin = $('#pin').val();
    sendJoin(role, nick, pin);
});


// WS-STUFF

function wsConnect() {
    ws = new WebSocket(xphoot_data.wsUrl, ['game']);
    ws.onopen = onWsOpen;
    ws.onclose = onWsClose;
    ws.onmessage = onWsMessage;
}

function onWsOpen() {
    if (playerNick) {
        sendJoin(role, playerNick, gamePin, sessionId); // reconnect
    } else {
        $('#joinPanel').show();
    }

    keepAliveIntervalId = setInterval(function () {
        if (connected) {
            this.ws.send('{"action":"KeepAlive"}');
        }
    }, 30 * 1000);
    connected = true;
}

function onWsClose() {
    clearInterval(keepAliveIntervalId);
    connected = false;

    setTimeout(wsConnect, 2000); // attempt to reconnect
}

var wsResponseHandlers = {};

function onWsMessage(event) {
    //console.log("Yay, a message for me: " + event.data);
    var data = JSON.parse(event.data);
    var action = data.action;

    var handler = wsResponseHandlers[action];
    if (handler) {
        handler(data);
    }
}

// WS END

// HANDLERS


function handleJoined(data) {
    if (data.error) {
        // $('#message').text('Not able to join the game: ' + data.error);
        if (data.errorType == 'wrongPin') {
            $('#pin').focus().addClass('invalid');
        } else if (data.errorType == 'wrongNick') {
            $('#nick').focus().addClass('invalid');
        }
    } else {
        var isReconnect = !!sessionId;
        gamePin = data.pin;
        sessionId = data.sessionId;
        playerNick = data.nick;
        if (isReconnect) {
            return;
        }
        $('#pin').text(data.pin);
        $('#message').text(data.nick + ' joined the game');
        $('#readyNick').text(data.nick);
        $('#joinPanel').hide();
        $('#readyPanel').show();
    }
}

function handleQuestionBegin(data) {
    currentAnswer = null;
    currentQuestion = data.question;

    layOutAnswerGrid($('#answer-grid'));

    getAllPanels().not($('#questStartPanel')).hide();
    $('#questStartPanel').show();

    $('#answerRed,#answerBlue,#answerGreen,#answerYellow').fadeTo('fast', 1);

    $('#answerRed').on("click", {color: 'red', target: $('#answerRed')}, handlePlayerAnswered);
    $('#answerBlue').on("click", {color: 'blue', target: $('#answerBlue')}, handlePlayerAnswered);
    $('#answerGreen').on("click", {color: 'green', target: $('#answerGreen')}, handlePlayerAnswered);
    $('#answerYellow').on("click", {color: 'yellow', target: $('#answerYellow')}, handlePlayerAnswered);

    startTime = new Date().getTime();
}

function handlePlayerAnswered(e) {
    var timeUsed = new Date().getTime() - startTime;
    currentAnswer = e.data.color;
    sendPlayerAnswer(e.data.color, timeUsed);
    disableAnswers();
    highlightPlayerAnswer(e.data.target);
}

function handleQuestionEnded(data) {

    getAllPanels().hide();

    if (currentAnswer == data.correctAnswer) {
        $('#correctAnswerPanel').show();
    } else {
        $('#wrongAnswerPanel').show();
    }
}

function handleQuizEnd(answers) {

    var sortedPlayers = [];
    for (var player in answers) {
        if (answers.hasOwnProperty(player)) {
            sortedPlayers.push({player: player, score: answers[player]});
        }
    }
    sortedPlayers.sort(function (a, b) {
        return b.score - a.score;
    });

    var place = 1;
    sortedPlayers.forEach(function (p) {
        if (p.player == playerNick) {

            if (place == 1) {
                $('#playerPos').text("You Won!");
            } else if (place == 2) {
                $('#playerPos').text("Second place!");
            } else if (place == 3) {
                $('#playerPos').text("Third place!");
            } else {
                $('#playerPos').text(place + "th place");
            }
        }
        place++;
    });

    getAllPanels().hide();
    $('#quizEndPanel').show();
}

// HANDLERS END


// SEND

var send = function (data) {
    if (!data.pin && gamePin) {
        data.pin = gamePin;
    }
    if (!data.nick && playerNick) {
        data.nick = playerNick;
    }
    ws.send(JSON.stringify(data));
};

var sendJoin = function (role, nick, pin, sessionId) {
    nick = nick ? nick.trim() : '';
    pin = pin ? pin.trim() : '';
    if (!pin || !nick) {
        return;
    }
    var req = {
        action: 'join',
        role: role,
        nick: nick,
        pin: pin,
        reconnectId: sessionId
    };
    send(req);
};

var sendPlayerAnswer = function (answer, timeUsed) {
    var req = {
        action: 'playerAnswer',
        answer: answer,
        timeUsed: timeUsed
    };
    send(req);
};

// DISPLAY

function highlightPlayerAnswer(target) {
    $('#answerRed,#answerBlue,#answerGreen,#answerYellow').not(target).fadeTo('fast', 0.2);
}

function disableAnswers() {
    $('#answerRed,#answerBlue,#answerGreen,#answerYellow').off("click");
}

function getLayoutClass() {
    var layout = 2;

    if (currentQuestion.green) {
        if (currentQuestion.yellow) {
            layout = 4;
        } else {
            layout = 3;
        }
    }
    return "answer-grid-" + layout;
}

function layOutAnswerGrid(element) {
    var answerGrid = element;
    answerGrid.removeClass("answer-grid-2");
    answerGrid.removeClass("answer-grid-3");
    answerGrid.removeClass("answer-grid-4");
    answerGrid.addClass(getLayoutClass());

    if (!currentQuestion.red) {
        $('#answerRed').hide();
    } else {
        $('#answerRed').show();
    }

    if (!currentQuestion.blue) {
        $('#answerBlue').hide();
    } else {
        $('#answerBlue').show();
    }

    if (!currentQuestion.green) {
        $('#answerGreen').hide();
    } else {
        $('#answerGreen').show();
    }

    if (!currentQuestion.yellow) {
        $('#answerYellow').hide();
    } else {
        $('#answerYellow').show();
    }
}

// UTILS


function getAllPanels() {
    return $('#joinPanel,#readyPanel,#questStartPanel,#correctAnswerPanel,#wrongAnswerPanel,#quizEndPanel');
}

// EVENT HANDLER

wsResponseHandlers.joinAck = function (data) {
    handleJoined(data);
};

wsResponseHandlers.questBegin = function (data) {
    handleQuestionBegin(data);
};

wsResponseHandlers.questEnd = function (data) {
    handleQuestionEnded(data);
};

wsResponseHandlers.quizEnd = function (data) {
    handleQuizEnd(data.scores);
};

