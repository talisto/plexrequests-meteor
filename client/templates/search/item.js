Template.item.helpers({
  'first': function () {
    return this.index === 0;
  },
  'posterExists' : function () {
    return this.poster_path !== "";
  },
  'isTV' : function () {
    return this.media_type === "tv";
  },
  'isMovie' : function () {
    return this.media_type === "movie";
  },
  'isMusic' : function () {
    return this.media_type === "music";
  },
  'isRequested' : function () {
    var doc;
    if (this.media_type === "tv") {
      doc = TV.findOne({id: this.id});
      if (!doc) {
        return false;
      } else if (doc.status.downloaded > 0) {
        return "Downloaded";
      } else {
        return "Requested";
      }
    }
    else if (this.media_type === "movie") {
      doc = Movies.findOne({id: this.id});
      if (!doc) {
        return false;
      } else if (doc.downloaded) {
        return "Downloaded";
      } else {
        return "Requested";
      }
    }
    else if (this.media_type === "music") {
      doc = Music.findOne({id: this.id});
      if (!doc) {
        return false;
      } else if (doc.downloaded) {
        return "Downloaded";
      } else {
        return "Requested";
      }
    }
  },
  'albumThumb': function() {
    return Template.instance().asyncAlbumThumb.get();
  }
});

Template.item.created = function () {
    var self = this;
    self.asyncAlbumThumb = new ReactiveVar("");
    Meteor.call('getThumbForReleaseGroup', this.data.id, function (err, result) {
        if (result) {
            self.asyncAlbumThumb.set(result);
        }
    });
};