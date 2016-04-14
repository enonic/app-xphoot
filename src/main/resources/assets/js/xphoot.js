console.log('xphoot!');

var ws = new WebSocket(xphoot_data.wsUrl);

ws.onopen = function (event) {
    console.log('Socket open');
    ws.send("Hello");
};

ws.onmessage = function (event) {
    console.log(event.data);
};