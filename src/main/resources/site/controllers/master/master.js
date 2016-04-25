var thymeleafLib = require('/lib/xp/thymeleaf');
var portalLib = require('/lib/xp/portal');

exports.get = function (req) {
    var view = resolve('master.html');
    var siteConfig = portalLib.getSiteConfig();
    var url;

    if (siteConfig.playerUrl) {
        url = siteConfig.playerUrl;
    } else {
        url = portalLib.pageUrl({path: portalLib.getSite()._path + '/player', type: 'absolute'});
    }
    url = url.indexOf('://') > 0 ? url.substring(url.indexOf('://') + 3) : url;
    var params = {
        joinUrl: url
    };

    var body = thymeleafLib.render(view, params);

    return {
        contentType: 'text/html',
        body: body
    };
};
