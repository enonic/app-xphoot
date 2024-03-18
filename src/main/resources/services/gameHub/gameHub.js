var webSocketLib = require('/lib/xp/websocket');
var contentLib = require('/lib/xp/content');
var contextLib = require('/lib/xp/context');

var masters = {};
var players = {};

var branch = "draft";
var repositoryId = 'com.enonic.cms.xphoot'

function handleGet(req) {
    if (!req.webSocket) {
        return {
            status: 404
        };
    }

    branch = req.branch;

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
        join(event, message);
        return;
    }

    if (message.action == 'playerAnswer') {
        playerAnswer(event, message);
        return;
    }

    return forwardEvent(message);
}

function playerAnswer(event, message) {
    var sessionId = getId(event);

    var pin = message.pin;

    if (!masters.hasOwnProperty(pin)) {
        sendToClient(sessionId, {action: 'answerAck', error: 'not able to submit to game with pin [' + message.pin + ']'});
        return;
    }

    sendToClient(masters[pin], message);
}

function join(event, message) {
    var role = message.role;
    var sessionId = getId(event);
    var pin, nick, gameId, game, oldSessionId, player;

    if (role == 'master') {
        gameId = message.gameId;
        if (!message.pin) {
            pin = createPin(10000, 99999);
        } else { // reconnecting
            pin = message.pin;
        }
        addMaster(pin, sessionId);
        webSocketLib.addToGroup(pin, sessionId);

        game = fetchGame(gameId);
        sendToClient(sessionId, {action: 'joinAck', pin: pin, game: game});

    } else if (role == 'player') {
        pin = message.pin;
        nick = message.nick;
        oldSessionId = message.reconnectId;

        if (!masters[pin]) {
            sendToClient(sessionId, {action: 'joinAck', error: 'Game with pin [' + pin + '] not found', errorType: 'wrongPin'});
            return;
        }

        if (oldSessionId) {
            // reconnect
            player = getPlayer(oldSessionId);
            if (player) {
                delete players[oldSessionId];
                addPlayer(pin, sessionId, nick);
                webSocketLib.addToGroup(pin, sessionId);
                sendToClient(sessionId, {action: 'joinAck', pin: pin, nick: nick, sessionId: sessionId});
            }
        } else {
            // new player
            if (isNickInUse(pin, nick)) {
                sendToClient(sessionId, {
                    action: 'joinAck',
                    error: "The nick '" + nick + "' is already in use for this game", errorType: 'wrongNick'
                });
                return;
            }

            addPlayer(pin, sessionId, nick);
            webSocketLib.addToGroup(pin, sessionId);
            sendToClient(sessionId, {action: 'joinAck', pin: pin, nick: nick, sessionId: sessionId});
            sendToClient(masters[pin], {action: 'playerJoined', pin: pin, nick: nick});
        }

    }

    return;
}

function addMaster(pin, sessionId) {
    masters[pin] = sessionId;
}

function addPlayer(pin, sessionId, nick) {
    players[sessionId] = {pin: pin, nick: nick};
}

function getPlayer(sessionId) {
    return players[sessionId];
}

function getMasterPin(sessionId) {
    for (var pin in masters) {
        if (masters[pin] == sessionId) {
            return pin;
        }
    }
    return undefined;
}

function isNickInUse(pin, nick) {
    var player;
    for (var sessionId in players) {
        player = players[sessionId];
        if (player.pin === pin && player.nick === nick) {
            return true;
        }
    }
    return false;
}

function leave(event) {
    var id = getId(event);
    var pin = getMasterPin(id);
    if (pin) {
        delete masters[pin];
        webSocketLib.removeFromGroup(pin, id);
        webSocketLib.send(getId(event), "Left");
    }
}

function forwardEvent(message) {
    webSocketLib.sendToGroup(message.pin, JSON.stringify(message));
}

function sendToClient(sessionId, message) {
    var msg = JSON.stringify(message);
    webSocketLib.send(sessionId, msg);
}

function getId(event) {
    return event.session.id;
}

function fetchGame(id) {
    var content = contextLib.run({
        repository: repositoryId,
        branch: branch,
        principals: ["role:system.admin"]
    }, () => {
        return contentLib.get({key: id});
    })

    return {
        name: content.displayName,
        id: content._id,
        questions: [].concat(content.data.questions)
    }
}

exports.webSocketEvent = handleEvent;

exports.get = handleGet;
