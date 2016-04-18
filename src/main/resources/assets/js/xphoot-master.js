var role = 'master';
var ws = new WebSocket(xphoot_data.wsUrl, ['game']);
var players = {};

ws.onopen = function (event) {

    sendJoin(role);

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
    ws.send(JSON.stringify(data));
};

var sendJoin = function (role) {
    var req = {
        action: 'join',
        role: role
    };
    send(req);
};

wsResponseHandlers.joinAck = function (data) {
    $('#pin').text(data.pin);
};

wsResponseHandlers.playerJoined = function (data) {
    players[data.nick] = {nick: data.nick};
    $('#players').append('<li>' + data.nick + '</li>');
};
