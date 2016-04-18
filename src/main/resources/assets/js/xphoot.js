console.log('xphoot!');
var role = $('#role').val();
var ws = new WebSocket(xphoot_data.wsUrl, ['game']);

ws.onopen = function (event) {

    sendJoin(role);

};

ws.onmessage = function (event) {
    var data = event.data;
    var type = data.type;
    console.log("Yay, a message for me: " + data);
};

var send = function (data) {
    ws.send(JSON.stringify(data));
};

var sendJoin = function (role, nick) {
    var req = {
        type: 'join',
        role: role,
        nick: nick || ""
    };
    send(req);
};

$('#sendJoinPlayer').on('click', function (e) {
    e.preventDefault();
    var nick = $('input[name="nick"').val();
    sendJoin(role, nick);
});