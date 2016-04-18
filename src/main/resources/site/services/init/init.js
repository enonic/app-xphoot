var portalLib = require('/lib/xp/portal');

exports.get = function (req) {
    var wsUrl = portalLib.serviceUrl({service: 'gameHub', type: 'absolute'});
    wsUrl = 'ws' + wsUrl.substring(wsUrl.indexOf(':'));
    var data = {
        wsUrl: wsUrl
    };

    return {
        contentType: 'application/javascript',
        body: "var xphoot_data = " + JSON.stringify(data, null, 2) + ";"
    }
};
