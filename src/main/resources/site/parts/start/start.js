var portalLib = require('/lib/xp/portal'); // Import the portal functions
var thymeleaf = require('/lib/xp/thymeleaf'); // Import the Thymeleaf rendering function

// Handle the GET request
exports.get = function (req) {


    var branch = req.branch;

    var masterUrl = portalLib.url({
        path: '/portal/' + branch + '/xphoot/master'
    });

    var playerUrl = portalLib.url({
        path: '/portal/' + branch + '/xphoot/player'
    });

    // Prepare the model object with the needed data from the content
    var model = {
        masterUrl: masterUrl,
        playerUrl: playerUrl
    };

    // Specify the view file to use
    var view = resolve('start.html');

    // Return the merged view and model in the response object
    return {
        body: thymeleaf.render(view, model)
    }
};