var portalLib = require('/lib/xp/portal'); // Import the portal functions
var thymeleaf = require('/lib/xp/thymeleaf'); // Import the Thymeleaf rendering function

// Handle the GET request
exports.get = function (req) {

    // Get the current site for this page
    var site = portalLib.getSite();

    var masterUrl = portalLib.pageUrl({
        path: site._path + '/master'
    });

    var playerUrl = portalLib.pageUrl({
        path: site._path + '/player'
    });

    // Prepare the model that will be passed to the view
    var model = {
        masterUrl: masterUrl,
        playerUrl: playerUrl
    };

    // Specify the view file to use
    var view = resolve('default.html');

    // Render the dynamic HTML with values from the model
    var body = thymeleaf.render(view, model);

    // Return the response object
    return {
        body: body
    }
};