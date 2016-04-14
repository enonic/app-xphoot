var thymeleafLib = require('/lib/xp/thymeleaf');

exports.get = function (req) {
    var view = resolve('player.html');
    var params = {};

    var body = thymeleafLib.render(view, params);

    return {
        contentType: 'text/html',
        body: body
    };
};
