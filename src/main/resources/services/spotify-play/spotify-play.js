var portalLib = require('/lib/xp/portal');
var httpClient = require('/lib/xp/http-client');
var cacheLib = require('/lib/xp/cache');

var authTokenCache = cacheLib.newCache({
    size: 1,
    expire: 3600
});

exports.get = function (req) {
    var trackId = req.params.trackId;
    if (!trackId) {
        return {
            status: 401
        };
    }

    var authToken = getSpotifyToken();
    if (!authToken) {
        return {
            status: 401
        };
    }

    var trackResp = fetchSpotifyTrackById(trackId, authToken);
    log.info(JSON.stringify(trackResp, null,2));
    var track = trackResp && trackResp.tracks && trackResp.tracks[0];

    return {
        status: 200,
        contentType: 'application/json',
        body: {
            url: track ? track.preview_url : null
        }
    }
};

function fetchSpotifyTrackById(id, authToken) {
    try {
        var response = httpClient.request({
            url: 'https://api.spotify.com/v1/tracks/',
            method: 'GET',
            contentType: 'application/json',
            connectTimeout: 5000,
            readTimeout: 10000,
            params: {
                'ids': id
            },
            headers: {
                'Authorization': 'Bearer ' + authToken
            }
        });

        if (response.status === 200) {
            return JSON.parse(response.body);
        }

    } catch (e) {
        log.error('Could not retrieve spotify track', e);
    }

    return null;
}

function getSpotifyToken() {
    var result = authTokenCache.get('token', function () {
        var siteConfig = portalLib.getSiteConfig() || {};

        var clientId = siteConfig.spotifyClientId;
        var clientSecret = siteConfig.spotifyClientSecret;

        if (clientId && clientSecret) {
            return requestSpotifyToken(clientId, clientSecret) || false;
        }

        log.warning('Spotify integration not configured for this site.');
        return false;
    });

    if (!result) {
        authTokenCache.clear();
    }
    return result;
}

function requestSpotifyToken(clientId, clientSecret) {
    try {
        var response = httpClient.request({
            url: 'https://accounts.spotify.com/api/token',
            method: 'POST',
            contentType: 'application/x-www-form-urlencoded',
            headers: {
                'Accept': 'application/json'
            },
            connectTimeout: 5000,
            readTimeout: 10000,
            auth: {
                user: clientId,
                password: clientSecret
            },
            body: 'grant_type=client_credentials'
        });

        if (response.status === 200) {
            var tokenResponse = JSON.parse(response.body);
            return tokenResponse && tokenResponse.access_token;
        }
    } catch (e) {
        log.error('Could not obtain spotify token: ', e);
    }
    return null;
}
