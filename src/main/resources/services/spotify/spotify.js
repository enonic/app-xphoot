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

function handleGet(req) {

    var params = req.params;
    var ids;
    try {
        ids = JSON.parse(params.ids) || []
    } catch (e) {
        ids = [];
    }

    var tracks;
    if (ids.length > 0) {
        tracks = getTracks(ids);
    } else {
        tracks = searchTracks(params.query, params.start || 0, params.count || 10);
    }

    return {
        contentType: 'application/json',
        body: tracks
    }
}

exports.get = handleGet;

function getTracks(ids) {
    var tracks = [];

    for (var i = 0; i < ids.length; i++) {
        var id = ids[i];

        var track = trackIdCache.get(id, function () {
            var spotifyResponse = fetchSpotifyTrackById(id);
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

function searchTracks(text, start, count) {
    text = (text || '').trim();
    if (!text) {
        return {
            count: 0,
            total: 0,
            hits: []
        };
    }

    return searchQueriesCache.get(searchKey(text, start, count), function () {
        var spotifyResponse = searchSpotifyTracks(text, start, count);
        return parseSearchResults(spotifyResponse);
    });
}

function searchKey(text, start, count) {
    return start + '-' + count + '-' + text;
}

function fetchSpotifyTrackById(id) {
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

function searchSpotifyTracks(text, start, count) {
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