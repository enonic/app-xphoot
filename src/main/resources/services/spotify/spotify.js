var portalLib = require('/lib/xp/portal');
var httpClient = require('/lib/xp/http-client');
var cacheLib = require('/lib/xp/cache');

var trackIdCache = cacheLib.newCache({
    size: 100
});

var searchQueriesCache = cacheLib.newCache({
    size: 100,
    expire: 60 * 10
});

var authTokenCache = cacheLib.newCache({
    size: 1,
    expire: 3600
});

function handleGet(req) {
    var authToken = getSpotifyToken();

    var params = req.params;
    var ids;
    try {
        ids = JSON.parse(params.ids) || []
    } catch (e) {
        ids = [];
    }
    if (!authToken) {
        if (ids.length === 0) {
            return {
                contentType: 'application/json',
                body: {
                    count: 0,
                    total: 0,
                    hits: []
                }
            };
        } else {
            return {
                contentType: 'application/json',
                body: getSpotifyNotConfiguredResponse(ids)
            }
        }
    }

    var tracks;
    if (ids.length > 0) {
        tracks = getTracks(ids, authToken);
    } else {
        tracks = searchTracks(params.query, params.start || 0, params.count || 10, authToken);
    }

    return {
        contentType: 'application/json',
        body: tracks
    }
}

exports.get = handleGet;

function getSpotifyNotConfiguredResponse(ids) {
    return {
        count: ids.length,
        total: ids.length,
        hits: ids.map(function (id) {
            return {
                id: id,
                displayName: 'Spotify track not available.',
                description: 'Set up Spotify integration in the Site configuration.',
                iconUrl: defaultIcon()
            };
        })
    };
}

function getTracks(ids, authToken) {
    var tracks = [];

    for (var i = 0; i < ids.length; i++) {
        var id = ids[i];

        var track = trackIdCache.get(id, function () {
            var spotifyResponse = fetchSpotifyTrackById(id, authToken);
            return spotifyResponse ? parseTrackResults(spotifyResponse) : null;
        });

        if (track) {
            tracks.push(track);
        }
    }

    return {
        count: tracks.length,
        total: tracks.length,
        hits: tracks
    };
}

function searchTracks(text, start, count, authToken) {
    text = (text || '').trim();
    if (!text) {
        return {
            count: 0,
            total: 0,
            hits: []
        };
    }

    return searchQueriesCache.get(searchKey(text, start, count), function () {
        var spotifyResponse = searchSpotifyTracks(text, start, count, authToken);
        return parseSearchResults(spotifyResponse);
    });
}

function searchKey(text, start, count) {
    return start + '-' + count + '-' + text;
}

function fetchSpotifyTrackById(id, authToken) {
    log.info('Fetching Spotify tack by id: ' + id);
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

function searchSpotifyTracks(text, start, count, authToken) {
    if (!text) {
        return noTracks();
    }

    log.info('Querying Spotify: ' + start + ' + ' + count + ' "' + text + '"');
    try {
        if (text.length > 1) {
            text += '*';
        }
        var response = httpClient.request({
            url: 'https://api.spotify.com/v1/search',
            method: 'GET',
            contentType: 'application/json',
            connectTimeout: 5000,
            readTimeout: 10000,
            params: {
                'q': text,
                'type': 'track,artist',
                'limit': count,
                'offset': start
            },
            headers: {
                'Authorization': 'Bearer ' + authToken
            }
        });

        if (response.status === 200) {
            return JSON.parse(response.body);
        }

    } catch (e) {
        log.error('Could not search for spotify tracks: ', e);
    }

    return noTracks();
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

function noTracks() {
    return {
        "tracks": {
            "items": [],
            "total": 0
        }
    };
}

function parseSearchResults(resp) {
    var options = [];
    var tracks = resp.tracks.items, i, option, track;
    for (i = 0; i < tracks.length; i++) {
        track = tracks[i];
        option = trackIdCache.get(track.id, function () {
            return parseTrack(track);
        });
        options.push(option);
    }

    return {
        count: resp.tracks.items.length,
        total: resp.tracks.total,
        hits: options
    };
}

function parseTrackResults(resp) {
    var tracks = resp.tracks;
    if (tracks && tracks.length === 0) {
        return null;
    }
    return parseTrack(tracks[0]);
}

function parseTrack(spotifyTrack) {
    var option = {};
    option.id = spotifyTrack.id;
    option.displayName = spotifyTrack.name;

    var artist = spotifyTrack.artists && spotifyTrack.artists.length > 0 ? spotifyTrack.artists[0].name : '';
    var album = spotifyTrack.album && spotifyTrack.album.name ? spotifyTrack.album.name : '';
    option.description = artist + (album ? ' - ' + album : '');
    if (spotifyTrack.preview_url) {
        option.description = '\u266B ' + option.description;
    }

    if (spotifyTrack.album && spotifyTrack.album.images && spotifyTrack.album.images.length > 0) {
        option.iconUrl = spotifyTrack.album.images[0].url;
    } else {
        option.iconUrl = defaultIcon();
    }

    return option;
}

function defaultIcon() {
    return portalLib.assetUrl({path: 'img/Spotify_logo_without_text.svg'});
}