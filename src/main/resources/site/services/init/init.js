var portalLib = require('/lib/xp/portal');

exports.get = function (req) {
    var data = {
        wsUrl: portalLib.serviceUrl({service: 'game_ws_service'})
    };

    return {
        contentType: 'text/html',
        body: "var xphoot_data = " + JSON.stringify(data, null, 2) + ";"
    }
};
