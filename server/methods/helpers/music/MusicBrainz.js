MusicBrainz = {

  query: function(type, id, params, timeout) {
    if ( ! timeout) {
      timeout = 5000;
    }

    if ( ! id) {
      id = '';
    }

    if ( ! params) {
      params = {};
    }

    params.fmt = 'json';

    try {
      var url = 'http://musicbrainz.org/ws/2/' + type + '/' + id;
      var result = HTTP.get(url, {
      headers: {
        "User-Agent": "PlexRequests/1.0"
      },
      params: params,
      timeout: timeout
      });
      return JSON.parse(result.content);
    } catch (error) {
      console.log('MusicBrainz error: ', error);
    }
  },

  searchGroupedRelease: function(query, timeout) {
    var results = [];
    var result = this.query('release-group', undefined, { query: query }, timeout);
    if (result && result['release-groups']) {
      result['release-groups'].forEach(function(group, index) {
        results.push({
          "id": group.id,
          "title": group.title,
          "artist": group['artist-credit'][0].artist.name,
          "artist_id": group['artist-credit'][0].artist.id,
          "album_id": group.releases[0].id,
          "link": 'https://musicbrainz.org/release-group/' + group.id,
          "media_type": 'music',
          "index": index,
          "format": group['primary-type']
        });
      }, this);
    }
    return results;
  },

  getRelease: function(id, timeout) {
    var result = this.query('release', id, { inc: 'media+discids+artist-credits' }, timeout);
    return result;
  },

  getReleaseGroup: function(id, timeout) {
    var result = this.query('release-group', id, { inc: 'artists+releases+media' }, timeout);
    return result;
  },
};

Meteor.methods({
  searchMBReleaseGroup:function(query) {
  return MusicBrainz.searchGroupedRelease(query);
  }
});