var role = 'master';
var ws = new WebSocket(xphoot_data.wsUrl, ['game']);
var players = {};
var game;

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

wsResponseHandlers.joinAck = function (data) {
    game = data.game;
    console.log('Game: ', game);
    $('#selectPanel').hide();
    $('#joinPanel').show();
    $('#pin').text(data.pin);
    $('#gameName').text(game.name);
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
