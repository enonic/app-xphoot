var contentLib = require('/lib/xp/content');
var contextLib = require('/lib/xp/context');
var portalLib = require('/lib/xp/portal');

exports.post = function handlePost(req) {
    var data = JSON.parse(req.body);

    var gameContent = contentLib.get({
        key: data.game
    });
    if (!gameContent) {
        return {
            body: 'Game not found',
            status: 404
        }
    }

    var resultData = {
        description: data.description,
        game: data.game,
        players: data.players
    };

    var publishedGameResult = contextLib.run({
        branch: 'draft'
    }, function () {
        var createdContent = createContent(resultData);
        return publishContent(createdContent);
    });

    log.info('Game results saved: %s', publishedGameResult);

    return {
        body: {},
        contentType: 'application/json'
    }
};

function createContent(resultData) {
    var site = portalLib.getSite();

    return contentLib.create({
        parentPath: site._path + '/results',
        displayName: resultData.description,
        contentType: app.name + ':gameResult',
        data: resultData
    });
}

function publishContent(gameResultContent) {
    return contentLib.publish({
        keys: [gameResultContent._path],
        sourceBranch: 'draft',
        targetBranch: 'master',
        includeChildren: false,
        includeDependencies: true
    });
}