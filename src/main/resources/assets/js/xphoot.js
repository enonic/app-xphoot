console.log('xphoot!');

var ws = new WebSocket(xphoot_data.wsUrl, ['game']);

ws.onopen = function (event) {

    var joinMsg = {
        nick: 'fisk',
        action: "join"
    };

    var join = ws.send(JSON.stringify(joinMsg));

};

ws.onmessage = function (event) {
    console.log("Yay, a message for me: " + event.data);
};