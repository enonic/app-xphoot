var thymeleafLib = require('/lib/xp/thymeleaf');
var portalLib = require('/lib/xp/portal');

exports.get = function (req) {
    var view = resolve('master.html');
    var site = portalLib.getSite();
    var url = portalLib.pageUrl({path: site._path + '/player', type: 'absolute'});
    url = url.substring(url.indexOf('://') + 3);
    var params = {
        joinUrl: url
    };

    var body = thymeleafLib.render(view, params);

    return {
        contentType: 'text/html',
        body: body
    };
};
