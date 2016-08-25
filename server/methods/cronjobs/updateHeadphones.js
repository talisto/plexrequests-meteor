Meteor.methods({
  'updateHeadphones' : function () {
    if (!(Settings.find({}).fetch()[0].headphonesENABLED)) {
      return false;
    }

    var albums = Music.find({approved: true});

    albums.forEach(function (record) {
        var album = Headphones.getAlbum(record.id);
        var status;
        if (album.album[0].Status == 'Downloaded') {
            status = true;
        } else {
            status = false;
        }
        if (status) {
            Music.update(record, {$set: {status: status}});
        }
    });

    return true;
  }
});
