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
        sendToClient(event.session.id, {action: 'Connected'});
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
        var role = message.role;

        if (role == 'master') {
            var pin = getPinFromSession(event.session.id);
            if (!pin && role == 'master' && !message.pin) {
                pin = createPin(10000, 99999);
                log.info("New pin for session '%s': %s", event.session.id, pin);
                addMaster(pin, event.session.id);
            }
            sendToClient(event.session.id, {action: 'joinAck', pin: pin});
        }
    }

    if (!verifyRequiredParams(event)) {
        return false;
    }

    if (message.action == 'join') {
        return join(event, message);
    }

    return forwardEvent(event, message);

}

function verifyRequiredParams(event) {
    var pin = getPin(event);
    var role = event.data.role;

    if (!pin || !role) {
        log.info("Missing data role and/or pin")
        return false;
    }

    return true;
}

function join(event, message) {


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

function getPinFromSession(sessionId) {
    log.info("%s", masters);
    for (var pin in masters) {
        if (masters[pin] === sessionId) {
            return pin;
        }
    }
    return undefined;
}

exports.webSocketEvent = handleEvent;

exports.get = handleGet;

