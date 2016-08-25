CoverArt = {

    forReleaseGroupId: function(id, timeout) {
        if ( ! timeout) {
            timeout = 5000;
        }

        try {
          var url = 'http://coverartarchive.org/release-group/' + id;
          var result = HTTP.get(url, { timeout: timeout });
          if (result && result.statusCode == "200") {
              return JSON.parse(result.content);
          }
        } catch (error) {
            // ignore
        }
        return false;
    },
    largeForReleaseGroupId: function(id) {
        var result = this.forReleaseGroupId(id);
        if (result && result.images && result.images.length > 0) {
            for (var i = 0, len = result.images.length; i < len; i++) {
                if (result.images[i].front && result.images[i].thumbnails.large) {
                    return result.images[i].thumbnails.large;
                }
            }
        }
        return false;
    }
};

Meteor.methods({
  getThumbForReleaseGroup:function(id) {
    if (! id) {
        return false;
    }
    return CoverArt.largeForReleaseGroupId(id);
  }
});