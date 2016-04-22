var role = 'master';
var ws = new WebSocket(xphoot_data.wsUrl, ['game']);
var imageService = xphoot_data.imageServiceUrl;
var players = {}, playerCount = 0;
var game, pin;

var JOIN_GAME_TIME = 30;
var QUESTION_TRANSITION_TIME = 10;
var SHOW_SCORE_TIME = 7;

var currentQuestNum = 0;
var answers = {};
var joinTimerId;
var initialTimerOffset = 754;
var timerPos = 1;
var progressBar;

var wsResponseHandlers = {};

$(function () {
    loadGames();
    $('#joinTimer').on('click', function () {
        clearInterval(joinTimerId);
        sendQuestBegin();
    });

    progressBar = new ProgressBar.Line('#progressbar', {
        strokeWidth: 1.5,
        easing: 'easeInOut',
        duration: QUESTION_TRANSITION_TIME * 1000,
        color: '#b22222',
        trailColor: 'lightgoldenrodyellow',
        trailWidth: 0,
        svgStyle: {width: '100%', height: '100%'},
        from: {color: '#51a8fa'},
        to: {color: '#b22222'},
        step: function (state, bar) {
            bar.path.setAttribute('stroke', state.color);
        }
    });

    addDummyPlayers();
});

// WS - EVENTS

ws.onopen = function (event) {
};

ws.onmessage = function (event) {
    // console.log("Yay, a message for me: " + event.data);
    var data = JSON.parse(event.data);
    var action = data.action;

    var handler = wsResponseHandlers[action];
    if (handler) {
        handler(data);
    }
};


// HANDLERS

var handleJoined = function (data) {
    displayJoinPanel(data);
    joinTimerId = startActionTimer(JOIN_GAME_TIME, sendQuestBegin, showTimer);
};

var handlePlayerJoined = function (nick) {
    players[nick] = {nick: nick};
    playerCount++;
    $('#players').append('<li>' + nick + '</li>');

    $('#joinPlayersTitle').text(playerCount + " Player" + (playerCount > 1 ? "s" : "") + " joined");
};

var handleShowQuestions = function (question) {
    displayQuestionPanel(question);
    startActionTimer(QUESTION_TRANSITION_TIME, sendQuestEnd);
};

var handlePlayerAnswer = function (data) {
    var player = data.nick;

    if (game.questions[currentQuestNum].answer == data.answer) {
        answers[player] = (answers[player] || 0) + calculateScore(data.timeUsed);
    }
};

var handleQuestEnded = function (data) {
    displayCorrectAnswer(getQuestion(currentQuestNum));
    currentQuestNum++;

    if (isMoreQuestions()) {
        startActionTimer(SHOW_SCORE_TIME, sendShowScores);
    } else {
        startActionTimer(SHOW_SCORE_TIME, sendQuizEnd);
    }
};

var handleShowScores = function () {
    displayScoreBoard();
    startActionTimer(SHOW_SCORE_TIME, sendQuestBegin);
};

var handleQuizEnd = function () {
    displayScoreBoard();
    saveResults();
};

// END HANDLERS


// DISPLAY

function displayJoinPanel(data) {
    game = data.game;
    pin = data.pin;

    getAllPanels().hide();
    $('#joinPanel').show();

    $('#pin').text(data.pin);

    showInitTimer(JOIN_GAME_TIME);
    $('.scoresHeaderText').text('Scoreboard');
}

function displayQuestionPanel(question) {
    getAllPanels().hide();
    $('#questionPanel').show();

    $('#questionText').text(question.question);

    if (question.image) {
        setImage(question.image, $('#questionImage'));
    }

    displayAnswerGrid(question);

    progressBar.set(0.0);
    progressBar.animate(1.0);
}

function displayAnswerGrid(question) {

    var answerGrid = $('#answer-grid');
    answerGrid.removeClass("answer-grid-2");
    answerGrid.removeClass("answer-grid-3");
    answerGrid.removeClass("answer-grid-4");
    answerGrid.addClass(getLayoutClass(question));

    if (!question.red) {
        $('#answerRed').hide();
    } else {
        $('#answerRed').show();
    }

    if (!question.blue) {
        $('#answerBlue').hide();
    } else {
        $('#answerBlue').show();
    }

    if (!question.green) {
        $('#answerGreen').hide();
    } else {
        $('#answerGreen').show();
    }

    if (!question.yellow) {
        $('#answerYellow').hide();
    } else {
        $('#answerYellow').show();
    }

    $('#answerRed span').text(question.red);
    $('#answerBlue span').text(question.blue);
    $('#answerGreen span').text(question.green);
    $('#answerYellow span').text(question.yellow);

    $('#answerRed,#answerBlue,#answerGreen,#answerYellow').fadeTo('fast', 1);
}

function getLayoutClass(question) {
    var layout = 2;

    if (question.green) {
        if (question.yellow) {
            layout = 4;
        } else {
            layout = 3;
        }
    }
    return "answer-grid-" + layout;
}

var setImage = function (imageId, component) {

    jQuery.ajax({
        url: imageService,
        data: {
            imageId: imageId
        },
        success: function (result) {
            var url = result.url;
            component.attr('src', url);
            component.show();
        }
    });
};

var displayCorrectAnswer = function (question) {
    var answer = question.answer;
    if (answer === 'red') {
        $('#answerBlue,#answerGreen,#answerYellow').animate({opacity: 0.2});
    } else if (answer === 'blue') {
        $('#answerRed,#answerGreen,#answerYellow').animate({opacity: 0.2});
    } else if (answer === 'green') {
        $('#answerRed,#answerBlue,#answerYellow').animate({opacity: 0.2});
    } else if (answer === 'yellow') {
        $('#answerRed,#answerBlue,#answerGreen').animate({opacity: 0.2});
    }
};

function displayScoreBoard() {
    if (!isMoreQuestions()) {
        $('.scoresHeaderText').text('Final Scoreboard');
    }

    $('#questionPanel').hide();
    $('#scoresPanel').show();

    var playersEl = $('#scoresPlayers > ul');
    playersEl.find('li').remove();

    var sortedPlayers = [];
    for (var player in answers) {
        if (answers.hasOwnProperty(player)) {
            sortedPlayers.push({player: player, score: answers[player]});
        }
    }
    sortedPlayers.sort(function (a, b) {
        return b.score - a.score;
    });

    var first = true;
    sortedPlayers.forEach(function (p) {
        var playerEl = $('<span>').text(p.player);
        var playerScoreEl = $('<span>').text(p.score).addClass('scoreValue');
        var li = $('<li>').append(playerEl).append(playerScoreEl).toggleClass('scoreWinner', first);
        first = false;
        playersEl.append(li);
    });
}

// DISPLAY END


// SEND EVENTS

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

var sendQuestBegin = function () {
    var question = getQuestion(currentQuestNum);
    // delete question['answer'];
    var req = {
        action: 'questBegin',
        question: question
    };
    send(req);
};


var sendQuestEnd = function () {
    var question = getQuestion(currentQuestNum);
    progressBar.set(0.0);
    var req = {
        action: 'questEnd',
        correctAnswer: question.answer
    };
    send(req);
};

var sendShowScores = function () {
    var data = {
        action: 'showScores'
    };
    send(data);
};

function sendQuizEnd() {
    var req = {
        action: 'quizEnd',
        scores: answers
    };
    send(req);
}

// UTILS

function getAllPanels() {
    return $('#scoresPanel,#questionPanel,#joinPanel,#selectPanel');
}

var saveResults = function () {
    var playerScores = [];
    for (var player in answers) {
        if (answers.hasOwnProperty(player)) {
            playerScores.push({nick: player, score: answers[player]});
        }
    }

    var data = {
        description: game.name,
        game: game.id,
        players: playerScores
    };

    $.ajax({
        url: xphoot_data.saveGameUrl,
        type: "POST",
        processData: false,
        contentType: 'application/json',
        data: JSON.stringify(data)
    });
};


var startActionTimer = function (duration, action, onTick) {
    var tick = duration;

    var timerId = setInterval(function () {
        tick--;
        if (onTick && tick > 0) {
            onTick(duration, tick);
        }
        if (tick == 0) {
            clearInterval(timerId);
            action();
        }
    }, 1000);
    return timerId;
};

var loadGames = function () {
    var games = xphoot_data.games, l = games.length, i;
    var gameSelect = $('#games');

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

var showInitTimer = function (duration) {
    $('.circle_animation').css('stroke-dashoffset', initialTimerOffset - (timerPos * (initialTimerOffset / duration)));
    $('#timeLeft').text(duration);
    timerPos++;
};

var showTimer = function (duration, left) {
    $('.circle_animation').css('stroke-dashoffset', initialTimerOffset - (timerPos * (initialTimerOffset / duration)));
    var leftStr = left < 10 ? "0" + left : left;
    $('#timeLeft').text(leftStr);
    timerPos++;
};

var getQuestion = function (questionNumber) {
    return game.questions[questionNumber];
};


var isMoreQuestions = function () {
    return game.questions.length > currentQuestNum;
};

var calculateScore = function (timeUsed) {
    var questionTime = QUESTION_TRANSITION_TIME * 1000;
    var timeLeft = questionTime - timeUsed;

    return Math.floor(((timeLeft / questionTime) * 5000) + 3000);
};


var addDummyPlayers = function () {
    var dummies = ['odadoda3000', 'rmy666', 'myklebust', 'aro123'];
    dummies.forEach(function (nick) {
        setTimeout(function () {
            handlePlayerJoined(nick);
            answers[nick] = Math.floor((Math.random() * 3000) + 2000);
        }, Math.random() * (8000));
    })
};

// UTILS ENDED


// EVENT HANDLERS

wsResponseHandlers.joinAck = function (data) {
    handleJoined(data);
};

wsResponseHandlers.playerJoined = function (data) {
    handlePlayerJoined(data.nick);
};

wsResponseHandlers.questBegin = function (data) {
    handleShowQuestions(data.question);
};

wsResponseHandlers.playerAnswer = function (data) {
    handlePlayerAnswer(data);
};

wsResponseHandlers.questEnd = function (data) {
    handleQuestEnded(data);
};

wsResponseHandlers.showScores = function (data) {
    handleShowScores();
};

wsResponseHandlers.quizEnd = function (data) {
    handleQuizEnd();
};
