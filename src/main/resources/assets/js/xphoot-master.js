var role = 'master';
var ws = new WebSocket(xphoot_data.wsUrl, ['game']);
var players = {};
var game, pin;

var JOIN_GAME_TIME = 10;
var QUESTION_TRANSITION_TIME = 10;
var currentQuestNum = 0;
var answers = {};
var joinTimerId;
var initialTimerOffset = 440;
var timerPos = 1;
var progressBar;

$(function () {
    loadGames();
    $('#joinTimer').on('click', function () {
        clearInterval(joinTimerId);
        processNextQuestion();

        // color: '#FFEA82',
        // from: {color: '#FFEA82'},
        // to: {color: '#ED6A5A'},

        progressBar = new ProgressBar.Line('#progressbar', {
            strokeWidth: 1.5,
            easing: 'easeInOut',
            duration: QUESTION_TRANSITION_TIME*1000,
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
    });
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
        console.log("## All questions done, end quiz!", players);
        send({action: 'quizEnd'});

        $('#questionPanel,#joinPanel').hide();
        $('#resultsPanel').show();
    }
}
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
    showAnswer(getQuestion(currentQuestNum));
    progressBar.set(0.0);

    console.log("Send quest end");

    var req = {
        action: 'questEnd'
    };

    send(req);
};


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


function layOutAnswerGrid(question) {

    console.log("LayOutGrid: ", question);

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
        console.log("Hiding green!", $('#answerGreen'))
        $('#answerGreen').hide();
    } else {
        console.log("Showing green!")
        $('#answerGreen').show();
    }

    if (!question.yellow) {
        console.log("Hiding Yellow!!", $('#answerYellow'))
        $('#answerYellow').hide();
    } else {
        $('#answerYellow').show();
    }
}

var showQuestion = function (question) {

    $('#questionPanel').show();
    $('#joinPanel').hide();
    $('#questionText').text(question.question);

    $('#answerRed span').text(question.red);
    $('#answerBlue span').text(question.blue);
    $('#answerGreen span').text(question.green);
    $('#answerYellow span').text(question.yellow);

    $('#answerRed,#answerBlue,#answerGreen,#answerYellow').fadeTo('fast', 1);

    layOutAnswerGrid(question);

    progressBar.set(0.0);
    progressBar.animate(1.0);
    startActionTimer(QUESTION_TRANSITION_TIME, sendQuestEnd);
};

var showQuestResult = function (data) {
    // Show leaderboard

    for (var player in answers) {
        if (answers.hasOwnProperty(player)) {
            console.log("Score: " + player + " : " + answers[player]);
        }
    }
    console.log("Handle Show Quest Result");
    currentQuestNum++;
    startActionTimer(5, processNextQuestion);
};

var isMoreQuestions = function () {
    return game.questions.length > currentQuestNum;
};

var calculateScore = function (timeUsed) {
    return 10000 - timeUsed;
};

var showAnswer = function (question) {
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

wsResponseHandlers.joinAck = function (data) {
    game = data.game;
    pin = data.pin;
    console.log('Game: ', game);
    $('#selectPanel').hide();
    $('#joinPanel').show();
    $('#pin').text(data.pin);
    $('#gameName').text(game.name);

    showInitTimer(JOIN_GAME_TIME);
    joinTimerId = startActionTimer(JOIN_GAME_TIME, processNextQuestion, showTimer);
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