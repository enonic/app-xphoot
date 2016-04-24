var portalLib = require('/lib/xp/portal');
var contentLib = require('/lib/xp/content');

exports.get = function (req) {

    var saveGameUrl = portalLib.serviceUrl({service: 'saveGame'});
    var wsUrl = portalLib.serviceUrl({service: 'gameHub', type: 'absolute'});
    var imageServiceUrl = portalLib.serviceUrl({service: 'imageService', type: 'absolute'});

    wsUrl = 'ws' + wsUrl.substring(wsUrl.indexOf(':'));
    var data = {
        wsUrl: wsUrl,
        saveGameUrl: saveGameUrl,
        games: getGames(),
        imageServiceUrl: imageServiceUrl
    };

    return {
        contentType: 'application/javascript',
        body: "var xphoot_data = " + JSON.stringify(data, null, 2) + ";"
    }
};

function getGames() {
    var result = contentLib.query({
        start: 0,
        count: 1000,
        sort: "modifiedTime DESC",
        contentTypes: [
            app.name + ":game"
        ]
    });

//    log.info('Games: %s', JSON.stringify(result, null, 4));

    var games = [], i, game, results = result.hits, res;
    for (i = 0; i < results.length; i++) {
        res = results[i];
        game = {};
        game.id = res._id;
        game.name = res.displayName;
        game.questions = res.data.questions.length;
        game.musicUrl = res.data.soundtrack ? portalLib.attachmentUrl({id: res.data.soundtrack}) : '';
        games.push(game);
    }

    return games;
}