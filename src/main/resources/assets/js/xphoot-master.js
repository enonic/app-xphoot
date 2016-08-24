var role = 'master';
var ws, connected, keepAliveIntervalId;
var mediaService = xphoot_data.mediaServiceUrl;
var players = {}, playerCount = 0;
var game, pin, gameAudioElement;
var questionAudioPlaying = false;
var QUESTION_TRANSITION_TIME = 20;
var SHOW_SCORE_TIME = 7;
var currentQuestNum = 0;
var playerScores = {};
var playerAnswered = {};
var currentAnswers = {
    blue: 0,
    red: 0,
    green: 0,
    yellow: 0
};
var progressBar;
var spotifyUrl = "https://api.spotify.com/v1/tracks/";

var wsResponseHandlers = {};

$(function () {
    wsConnect();
    loadGames();
    $('#joinStart').on('click', function () {
        if (playerCount > 0) {
            handleQuizBegin();
        }
    });
    $('#selectPanelLogo img').on('click', function () {
        if (document.fullscreenEnabled || document.webkitFullscreenEnabled || document.mozFullScreenEnabled ||
            document.msFullscreenEnabled) {
            var el = document.body;
            if (el.requestFullscreen) {
                el.requestFullscreen();
            } else if (el.mozRequestFullScreen) {
                el.mozRequestFullScreen();
            } else if (el.webkitRequestFullscreen) {
                el.webkitRequestFullscreen();
            } else if (el.msRequestFullscreen) {
                el.msRequestFullscreen();
            }
        }
    });
    var answerCount = $('.answerCount');
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

});

// WS - EVENTS

function wsConnect() {
    ws = new WebSocket(xphoot_data.wsUrl, ['game']);
    ws.onopen = onWsOpen;
    ws.onclose = onWsClose;
    ws.onmessage = onWsMessage;
}

function onWsOpen() {
    if (game) {
        sendJoin(role, game.id);
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

function onWsMessage(event) {
    var data = JSON.parse(event.data);
    var action = data.action;

    var handler = wsResponseHandlers[action];
    if (handler) {
        handler(data);
    }
}


// HANDLERS

var handleJoined = function (data) {
    if (!game) {
        displayJoinPanel(data);
    }
};

var handlePlayerJoined = function (nick) {
    players[nick] = {nick: nick};
    playerCount++;
    var newPlayer = $('<li>').text(nick);
    $('#players').append(newPlayer);
    newPlayer.addClass('fadeIn');

    $('#joinPlayersTitle').text(playerCount + " player" + (playerCount > 1 ? "s" : "") + " joined");
    $('#joinPlayersHeader').css('display', 'flex');

    $('#joinStart').text('Go!').addClass('start-ready');
};

var handleQuizBegin = function () {
    playGameMusic();
    sendQuestBegin();
};

var handleShowQuestions = function (question) {

    if (question.audio) {
        if (gameAudioElement) {
            stopElementAudio(gameAudioElement, 1000);
        }
        playQuestionAudio(question.audio);
    }

    displayQuestionPanel(question);
    currentAnswers.red = 0;
    currentAnswers.blue = 0;
    currentAnswers.yellow = 0;
    currentAnswers.green = 0;
    playerAnswered = {};
    startActionTimer(QUESTION_TRANSITION_TIME, sendQuestEnd);
};

var handlePlayerAnswer = function (data) {
    var player = data.nick;

    if (playerAnswered[player]) {
        // avoid double answers
        return;
    }
    if (game.questions[currentQuestNum].answer == data.answer) {
        playerScores[player] = (playerScores[player] || 0) + calculateScore(data.timeUsed);
    }
    currentAnswers[data.answer]++;
    playerAnswered[player] = true;
    $('.answerCount span').text(currentAnswers['red'] + currentAnswers['blue'] + currentAnswers['green'] + currentAnswers['yellow']);
};

var handleQuestEnded = function () {

    if (questionAudioPlaying) {
        questionAudioPlaying = false;
        stopElementAudio($('#questionAudio'), 2000);
        if (gameAudioElement) {
            startElementAudio(gameAudioElement, 2000);
        }
    }

    displayCorrectAnswer(getQuestion(currentQuestNum));
    showAnswersPie();
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
    stopGameMusic();
};

// END HANDLERS


// DISPLAY

function displayJoinPanel(data) {
    game = data.game;
    pin = data.pin;

    getAllPanels().hide();
    $('#joinPanel').show();

    $('#pin').text(data.pin);

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
    $('.pieContainer').hide();
    $('.answerCount').show().find('span').text('0');
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
        url: mediaService,
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
    for (var player in playerScores) {
        if (playerScores.hasOwnProperty(player)) {
            sortedPlayers.push({player: player, score: playerScores[player]});
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

var showAnswersPie = function () {
    var red = currentAnswers.red;
    var blue = currentAnswers.blue;
    var yellow = currentAnswers.yellow;
    var green = currentAnswers.green;

    var total = playerCount;
    if (total < (blue + red + yellow + green)) {
        total = (blue + red + yellow + green);
    }

    var noAnswer = total - (blue + red + yellow + green);

    var colors = [
        "#B22222", // red
        "#51a8fa", // blue
        "#6fc040", // green
        "#cdd422",  // yellow
        "grey"
    ];
    var data = [red, blue, green, yellow, noAnswer];
    var labels = ['Red', 'Blue', 'Green', 'Yellow', 'No answer'];

    $('#questionImage').hide();
    $('.pieID.legend,.pieID.pie').empty();
    $('.pieContainer').show();

    createPieLegend($('.pieID.legend'), colors, data, labels);
    createPie($('.pieID.pie'), colors, data);
};

var sliceSize = function (dataNum, dataTotal) {
    return (dataNum / dataTotal) * 360;
};

var addSlice = function (sliceSize, pieElement, offset, sliceID, color) {
    pieElement.append("<div class='slice " + sliceID + "'><span></span></div>");
    offset = offset - 1;
    var sizeRotation = -179 + sliceSize;
    $("." + sliceID).css({
        "transform": "rotate(" + offset + "deg) translate3d(0,0,0)"
    });
    $("." + sliceID + " span").css({
        "transform": "rotate(" + sizeRotation + "deg) translate3d(0,0,0)",
        "background-color": color
    });
};

var iterateSlices = function (sliceSize, pieElement, offset, dataCount, sliceCount, color) {
    var sliceID = "s" + dataCount + "-" + sliceCount;
    var maxSize = 179;
    if (sliceSize <= maxSize) {
        addSlice(sliceSize, pieElement, offset, sliceID, color);
    } else {
        addSlice(maxSize, pieElement, offset, sliceID, color);
        iterateSlices(sliceSize - maxSize, pieElement, offset + maxSize, dataCount, sliceCount + 1, color);
    }
};

var createPie = function (pieElement, colors, listData) {
    var listTotal = 0, i;
    for (i = 0; i < listData.length; i++) {
        listTotal += listData[i];
    }
    var offset = 0;
    for (i = 0; i < listData.length; i++) {
        var size = sliceSize(listData[i], listTotal);
        iterateSlices(size, pieElement, offset, i, 0, colors[i]);
        offset += size;
    }
};

var createPieLegend = function (dataElement, colors, data, labels) {
    var i, li, lis = [];
    dataElement.empty();
    for (i = 0; i < data.length; i++) {
        if (data[i] > 0) {
            li = $('<li/>').css("border-color", colors[i]);
            li.append($('<em/>').text(labels[i])).append($('<span/>').text(data[i]));
            lis.push(li);
        }
    }
    dataElement.append(lis);
};

// DISPLAY END


// AUDIO

function playQuestionAudio(audio) {
    if (audio.trackId) {
        playSpotifyTrack(audio.trackId);
    } else if (audio.audioId) {
        playLocalAudio(audio.audioId);
    }
    questionAudioPlaying = true;
}

playGameMusic = function () {
    var games = xphoot_data.games, l = games.length, i, musicUrl = '';
    for (i = 0; i < l; i++) {
        if (games[i].id === game.id) {
            musicUrl = games[i].musicUrl;
            break;
        }
    }

    if (!musicUrl) {
        return;
    }
    gameAudioElement = $('#gameAudio');
    gameAudioElement.attr("src", musicUrl);
    startElementAudio(gameAudioElement, 1500);
};

stopGameMusic = function () {
    if (!gameAudioElement) {
        return;
    }
    stopElementAudio(gameAudioElement, 5000);
};

function playSpotifyTrack(trackId) {
    jQuery.ajax({
        url: spotifyUrl + trackId,
        success: function (result) {
            playAudioUrl(result.preview_url);
        }
    });
}

function playLocalAudio(audioId) {
    jQuery.ajax({
        url: mediaService,
        data: {
            audioId: audioId
        },
        success: function (result) {
            playAudioUrl(result.url);
        }
    })
}

function playAudioUrl(url) {
    var audioElement = $('#questionAudio');
    audioElement.attr("src", url);
    startElementAudio(audioElement, 1500);
}

function startElementAudio(audioElement, fadeTime) {
    audioElement[0].volume = 0;
    audioElement.animate({volume: 1}, fadeTime);
    audioElement.trigger("play");
}

function stopElementAudio(audioElement, fadeTime) {
    audioElement.animate({volume: 0}, fadeTime, function () {
        audioElement.trigger("pause");
    });
}

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
    var question = jQuery.extend(true, {}, getQuestion(currentQuestNum));
    delete question['answer'];
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
        scores: playerScores
    };
    send(req);
}

// UTILS

function getAllPanels() {
    return $('#scoresPanel,#questionPanel,#joinPanel,#selectPanel');
}

var saveResults = function () {
    var finalPlayerScores = [];
    for (var player in playerScores) {
        if (playerScores.hasOwnProperty(player)) {
            finalPlayerScores.push({nick: player, score: playerScores[player]});
        }
    }

    var data = {
        description: game.name,
        game: game.id,
        players: finalPlayerScores
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
    var dummies = ['odadoda3000', 'rmy666', 'myklebust', 'aro123', 'gri', 'srs', 'jsi', 'mer', 'tsi'];
    dummies.forEach(function (nick) {
        setTimeout(function () {
            handlePlayerJoined(nick);
            playerScores[nick] = Math.floor((Math.random() * 3000) + 2000);
        }, (Math.random() * 8000));
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
