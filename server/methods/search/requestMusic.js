Meteor.methods({
  "requestMusic": function(request) {
    check(request, Object);

    var settings = Settings.find().fetch()[0];

    request.notification_type = "request";
    request.media_type = "Music";

    // Check user request limit
    var date = Date.now() - 6.048e8;
    var weeklyLimit = Settings.find({}).fetch()[0].musicWeeklyLimit;
    var userRequestTotal = Music.find({user:request.user, createdAt: {"$gte": date} }).fetch().length;

    var record = {
      title: request.title,
      id: request.id,
      artist: request.artist,
      artist_id: request.artist_id,
      country: request.country,
      format: request.format,
      url: request.link,
      poster_path: '',
      user: request.user,
      downloaded: false,
      approval_status: 1
    };

    var release;
    if (request.album_id) {
      release = MusicBrainz.getRelease(request.album_id);
      if (release && release.releases && release.releases.length > 0) {
        console.log('MusicBrainz release:', release.releases[0]);
        record.released = release.date;
        record.status = release.status;
        record.tracks = release.tracks;
      }
    }

    var poster_path = CoverArt.largeForReleaseGroupId(request.id);
    if (poster_path) {
      record.poster_path = poster_path;
    }

    if (weeklyLimit !== 0
      && (userRequestTotal >= weeklyLimit)
      && !(Meteor.user())
      //Check if user has override permission
      && (!settings.plexAuthenticationENABLED || !Permissions.find({permUSER: request.user}).fetch()[0].permLIMIT)) {
        return "limit";
    }

    // Check if it already exists in Headphones
    if (settings.headphonesENABLED) {
      try {
        var album = Headphones.getAlbum(request.id);
        if (album && album.album && album.album.length > 0 && album.album[0].Status == 'Downloaded') {
          record.downloaded = true;
          record.approval_status = 1;
          try {
            Music.insert(record);

            return 'exists';

          } catch (error) {
            logger.error(error.message);
            return false;
          }
        }
      } catch (error) {
        logger.error("Error checking Headphones:", error.message);
        return false;
      }
    }

    //If approval needed and user does not have override permission
    if (settings.musicApproval
      //Check if user has override permission
      && (!settings.plexAuthenticationENABLED || !Permissions.find({permUSER: request.user}).fetch()[0].permAPPROVAL)) {

        // Approval required
        // Add to DB but not CP
        record.downloaded = false;
        record.approval_status = 0;

        try {
          Music.insert(record);
        } catch (error) {
          logger.error(error.message);
          return false;
        }

        Meteor.call("sendNotifications", request);
        return true;
    } else {
      // No approval required
      record.downloaded = false;
      record.approval_status = 1;

      if (settings.headphonesENABLED) {

        var added = false;
        try {
          added = Headphones.queueAlbum(request.id, request.artist_id);
          console.log(added);
        } catch (error) {
          logger.error("Error adding to Headphones:", error.message);
          return false;
        }

        if (added) {
          try {
            Music.insert(record);
          } catch (error) {
            logger.error(error.message);
            return false;
          }
          Meteor.call("sendNotifications", request);
          return true;
        } else {
          return false;
        }
      } else {
        try {
          Music.insert(record);
          Meteor.call("sendNotifications", request);
          return true;
        } catch (error) {
          logger.error(error.message);
          return false;
        }
      }
    }
  }
});
