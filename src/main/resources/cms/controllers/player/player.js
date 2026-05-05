var thymeleafLib = require('/lib/thymeleaf');

var view = resolve('player.html');

exports.get = function (req) {
    var params = {};

    var body = thymeleafLib.render(view, params);

    return {
        contentType: 'text/html',
        body: body
    };
};
