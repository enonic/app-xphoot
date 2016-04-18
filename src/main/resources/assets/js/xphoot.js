console.log('xphoot!');
var role = $('#role').val();
var ws = new WebSocket(xphoot_data.wsUrl, ['game']);

ws.onopen = function (event) {

    sendOpen(role);

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

var sendOpen = function (role) {
    var req = {
        action: 'open',
        role: role
    };
    send(req);
};

wsResponseHandlers.masterJoinAck = function (data) {
    $('#pin').text(data.pin);
};
