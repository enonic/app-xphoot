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

wsResponseHandlers.joinAck = function (data) {
    gamePin = data.pin;

    $('#pin').text(data.pin);
    $('#message').text(data.nick + ' joined the game');
};

$('#sendJoin').on('click', function (e) {
    e.preventDefault();
    var nick = $('#nick').val();
    var pin = $('#pin').val();
    sendJoin(role, nick, pin);
});
