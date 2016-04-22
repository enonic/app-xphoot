var portalLib = require('/lib/xp/portal');

function handleGet(req) {

    log.info("ImageService get: %s", req.params);

    log.info("Query: " + req.params.imageId);

    var url = portalLib.imageUrl({
        id: req.params.imageId,
        scale: 'width(1024)'
    });

    log.info("imageUrl result: %s", url);

    var body = {
        message: "This is the respons MTF!",
        url: url
    };

    return {
        contentType: 'application/json',
        body: body
    }

}

exports.get = handleGet;