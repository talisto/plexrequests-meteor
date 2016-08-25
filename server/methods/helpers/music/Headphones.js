Headphones = {
  url: 'http://192.168.0.1',
  port: 8181,
  api: '',
  directory: '',

  query: function(cmd, params, timeout) {
    if ( ! timeout) {
      timeout = 90000;
    }
    var url = this.url + ':' + this.port
      + this.directory
      + '/api?apikey=' + this.api
      + '&cmd=' + cmd;
    try {
      var result = HTTP.get(url, { params: params, timeout: timeout });
      if (result.content == 'Incorrect API key') {
        return false;
      }
      if (result.content == 'OK') {
        return true;
      }
      return JSON.parse(result.content);
    } catch (error) {
      logger.error("Headphones query error: ", error);
      throw error;
    }
  },

  getVersion: function() {
    var result = this.query('getVersion');
    if (result.current_version) {
      return result.current_version;
    }
    logger.error("Headphones version not set");
  },

  searchAlbum: function(query) {
    // artist, album
    if (query.includes(',')) {
      str = query;
      query = str.substr(str.indexOf(',')+1) + ':' + str.substr(0,str.indexOf(','));
    // artist:album
    } else if (query.includes(':')) {
      // do nothing
    // artist:*
    } else {
      query = query + ':*';
    }

    var result = this.query('findAlbum', {
      name: query,
      limit: 10
    });
    if (result) {
      var results = [];
      result.forEach(function(album, index) {
        try {
          artResult = CoverArt.getlargeForAlbumId(album.albumid);
          if (artResult && artResult.images[0].thumbnails.small) {
            art = artResult.images[0].thumbnails.small;
          } else {
            art = '';
          }
        } catch (error) {
          logger.error(error);
          art = '';
        }

        results.push({
          "id": album.albumid,
          "title": album.title,
          "artist": album.uniquename,
          "release_date": album.date,
          "poster_path": art,
          "link": album.albumurl,
          "media_type": 'music',
          "index": index,
          "format": album.formats,
          "tracks": album.tracks
        });
      }, this);
      return results;
    }
  },

  getArtist: function(id) {
    logger.info('Getting artist ' + id + ' from Headphones');
    var result = this.query('getArtist', { id: id });
    if ( ! result || ! result.albums || result.albums.length === 0) {
      return false;
    }
  },

  addArtist: function(id) {
    logger.info('Adding artist ' + id + ' to Headphones');
    return this.query('addArtist', { id: id });
  },

  getAlbum: function(id) {
    logger.info('Getting album ' + id + ' from Headphones');
    var result = this.query('getAlbum', { id: id });
    if ( ! result || ! result.album || result.album.length === 0) {
      return false;
    }
    return result;
  },

  addAlbum: function(id) {
    logger.info('Adding album ' + id + ' to Headphones');
    return this.query('addAlbum', { id: id });
  },

  queueAlbum: function(id, artist_id) {
    var Album = this.getAlbum(id);
    // if album exists, we can queue it
    if (Album.album && Album.album.length > 0) {
      return this.query('queueAlbum', { id: id });
    // otherwise we need the artist ID to add the artist first
    } else if (artist_id) {
      var artist = this.getArtist(artist_id);
      // if the artist exists, we can try to add the album
      if (artist.albums && artist.albums.length > 0) {
        if (this.addAlbum(id)) {
          return this.query('queueAlbum', { id: id });
        }
        logger.error('Failed adding album to Headphones');
        return false;
      }
      // otherwise we can try to add the artist, then add the album
      if (this.addArtist(artist_id)) {
        Album = this.getAlbum(id);
        if (Album.album && Album.album.length > 0) {
          return this.query('queueAlbum', { id: id });
        } else {
          logger.error('Failed adding album to Headphones');
          return false;
        }
      }
      logger.error('Failed adding artist to Headphones');
      return false;
    }
    logger.error('Album does not exist in Headphones, but no artist_id specified.  Giving up..');
  }
};
