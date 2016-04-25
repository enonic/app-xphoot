var portalLib = require('/lib/xp/portal');

function handleGet(req) {

    log.info("ImageService get: %s", req.params);

    var url;

    if (req.params.imageId) {

        url = portalLib.imageUrl({
            id: req.params.imageId,
            scale: 'width(1024)'
        });
    } else if (req.params.audioId) {

        url = portalLib.attachmentUrl({
            id: req.params.audioId,
            download: false
        });
    }

    var body = {
        url: url
    };

    return {
        contentType: 'application/json',
        body: body
    }
}

exports.get = handleGet;