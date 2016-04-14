var webSocketLib = require('/lib/xp/websocket');

var masters = {};

function handleGet(req) {

    if (!req.webSocket) {
        return {
            status: 404
        };
    }

    return {
        webSocket: {
            data: {
                pin: req.params.pin,
                role: req.params.role
            },
            subProtocols: ["game"]
        }
    };
}

function handleEvent(event) {

    if (event.type == 'open') {
        webSocketLib.send(event.session.id, 'Connected');
    }

    if (event.type == 'message') {
        handleMessage(event);
    }

    if (event.type == 'close') {
        // Do something on close
    }

};

function handleMessage(event) {

    var pin = getPin(event);
    var role = event.data.role;

    if (!pin || !role) {
        log.info("Missing data role and/or pin")
        return false;
    }

    var message = JSON.parse(event.message);

    if (message.action == 'join') {
        join(event, message);
    }

    if (message.action == 'leave') {
        leave(event, message);
    }

}

function join(event, message) {

    var nick = message.nick;

    if (!nick) {
        return false;
    }

    var role = event.data.role;
    var pin = getPin(event);
    var id = getId(event);

    if (role == 'master') {
        if (!addMaster(pin, id)) {
            return false;
        }
    }
    webSocketLib.addToGroup(pin, id);
    webSocketLib.send(event.session.id, "Joined");
    return true;
}

function addMaster(pin, sessionId) {

    if (masters.hasOwnProperty(pin)) {
        log.info("Master already joined [" + masters[pin] + "]");
        return false;
    }

    masters[pin] = sessionId;
    return true;
}

function leave(event) {

    var id = getId(event);
    var pin = getPin(event);

    if (masters.hasOwnProperty(pin) && masters[pin] == id) {
        delete masters[pin]
    }

    webSocketLib.removeFromGroup(pin, id);
    webSocketLib.send(event.session.id, "Left");
}

function getId(event) {
    return event.session.id;
}

function getPin(event) {
    return event.data.pin;
}


exports.webSocketEvent = handleEvent;

exports.get = handleGet;

