var thymeleafLib = require('/lib/thymeleaf');
var portalLib = require('/lib/xp/portal');

var view = resolve('master.html');

exports.get = function (req) {
    var siteConfig = portalLib.getSiteConfig();
    var url;

    if (siteConfig.playerUrl) {
        url = siteConfig.playerUrl;
    } else {
        url = portalLib.pageUrl({path: portalLib.getSite()._path, type: 'absolute'});
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
