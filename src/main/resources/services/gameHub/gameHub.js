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
            data: {},
            subProtocols: ["game"]
        }
    };
}

function createPin(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function handleEvent(event) {

    if (event.type == 'open') {
        sendToClient(getId(event), {action: 'Connected'});
    }

    if (event.type == 'message') {
        handleMessage(event);
    }

    if (event.type == 'close') {
        leave(event);
    }
}

function handleMessage(event) {

    var message = JSON.parse(event.message);
    if (message.action == 'join') {
        return join(event, message);
    }

    return forwardEvent(event, message);

}

function join(event, message) {
    var role = message.role;
    var sessionId = getId(event);
    var pin, nick;

    if (role == 'master') {
        if (!message.pin) {
            pin = createPin(10000, 99999);
            log.info("New pin for session '%s': %s", sessionId, pin);
            if (!addMaster(pin, sessionId)) {
                return;
            }
            webSocketLib.addToGroup(pin, sessionId);
        }
        sendToClient(sessionId, {action: 'joinAck', pin: pin});

    } else if (role == 'player') {
        pin = message.pin;
        nick = message.nick;
        if (!masters[pin]) {
            log.info('Wrong pin: ' + pin); // TODO
            return;
        }

        webSocketLib.addToGroup(pin, sessionId);
        sendToClient(sessionId, {action: 'joinAck', pin: pin, nick: nick});
    }

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
    webSocketLib.send(getId(event), "Left");
}

function forwardEvent(event, message) {
    webSocketLib.sendToGroup(getPin(event), message);
}

function sendToClient(sessionId, message) {
    var msg = JSON.stringify(message);
    webSocketLib.send(sessionId, msg);
}

function getId(event) {
    return event.session.id;
}

function getPin(event) {
    return event.data.pin;
}

exports.webSocketEvent = handleEvent;

exports.get = handleGet;

