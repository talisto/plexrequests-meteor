Meteor.methods({
  "approveRequest": function(request) {
    check(request, Object);
    var settings = Settings.find().fetch()[0];

    // If not logged in return without doing anything
    if (!Meteor.user()) {
      return false;
    }

    var status;

    if (request.imdb) {
      // First confirm it doesn't exist already
      try {
        if (settings.couchPotatoENABLED) {
          var checkCP = CouchPotato.mediaGet(request.imdb);
          status = checkCP.status == "done";
          if (checkCP.status !== "false" && checkCP !== false) {
            try {
              Movies.update(request._id, {$set: {approval_status: 1, downloaded: status}});
              return true;
            } catch (error) {
              logger.error(error.message);
              return false;
            }
          }
        }
      } catch (error) {
        logger.error("Error checking Couch Potato:", error.message);
        return false;
      }

      // Doesn't exist so try to add
      if (settings.couchPotatoENABLED) {
        try {
          if (CouchPotato.movieAdd(request.imdb)) {
            Movies.update(request._id, {$set: {approval_status: 1}});
            return true;
          } else {
            return false;
          }
        } catch (error) {
          logger.error("Error adding to Couch Potato:", error.message);
          return false;
        }
      } else {
        Movies.update(request._id, {$set: {approval_status: 1}});
        return true;
      }

    } else if (request.tvdb) {
      if (settings.sickRageENABLED) {
        // First confirm it doesn't exist already
        try {
          if (settings.sickRageENABLED) {
            var checkSickRage = SickRage.checkShow(request.tvdb);
            if (checkSickRage) {
              status = SickRage.statsShow(request.tvdb);
              try {
                TV.update(request._id, {$set: {approval_status: 1, status: status}});
                return true;
              } catch (error) {
                logger.error(error.message);
                return false;
              }
            }
          }
        } catch (error) {
          logger.error("Error checking SickRage:", error.message);
          return false;
        }

        // Doesn't exist so try to add
        try {
          var episodes = (request.episodes === true) ? 1 : 0;
          if (SickRage.addShow(request.tvdb, episodes)) {
            TV.update(request._id, {$set: {approval_status: 1}});
            return true;
          } else {
            logger.error("Error adding to SickRage");
            return false;
          }
        } catch (e) {
          logger.error("Error adding to SickRage:", error.message);
          return false;
        }
      } else if (settings.sonarrENABLED) {
        // First confirm it doesn't exist already
        try {
          if (settings.sonarrENABLED) {
            var checkSonarr = Sonarr.seriesGet(request.tvdb);

            if (checkSonarr) {
              status = Sonarr.seriesStats(request.tvdb);
              try {
                TV.update(request._id, {$set: {approval_status: 1, status: status}});
                return true;
              } catch (error) {
                logger.error(error.message);
                return false;
              }
            }
          }
        } catch (error) {
          logger.error("Error checking Sonarr:", error.message);
          return false;
        }

        var qualityProfileId = settings.sonarrQUALITYPROFILEID;
        var seasonFolder = settings.sonarrSEASONFOLDERS;
        var rootFolderPath = settings.sonarrROOTFOLDERPATH;
        try {
          if (Sonarr.seriesPost(request.tvdb,request.title, qualityProfileId, seasonFolder, rootFolderPath, request.episodes)) {
            TV.update(request._id, {$set: {approval_status: 1}});
            return true;
          } else {
            return false;
          }
        } catch (error) {
          logger.error("Error adding to Sonarr:", error.message);
          return false;
        }
      } else {
        TV.update(request._id, {$set: {approval_status: 1}});
        return true;
      }
    } else {
      if (settings.headphonesENABLED) {
        var album = Headphones.getAlbum(request.id);
        if ( ! album) {
          try {

            // headphones may take a very long time to queue the album if the artist doesn't exist,
            // so we're going to queue it as a background task so that we can return a response to the user
            // right away.  The task will start in 5 seconds.

            SyncedCron.add({
                name: "queue headphones album " + request.id,
                schedule: function(parser) {
                  var t = new Date();
                  t.setSeconds(t.getSeconds() + 5);
                  return parser.recur().on(t).fullDate();
                },
                job: function() {
                  var result = Headphones.queueAlbum(request.id, request.artist_id);
                  if (result) {
                    logger.info('Queued album ' + id + ' in Headphones');
                    return true;
                  } else {
                    logger.error('Error queuing album ' + id + 'in Headphones');
                    return false;
                  }
                }
            });
          } catch (error) {
            logger.error("Error adding to Headphones:", error.message);
          }
        }
      }

      Music.update(request._id, {$set: {approval_status: 1}});
      return true;
    }
  },
  "denyRequest": function(docID, reason) {
    // If not logged in return without doing anything
    if (!Meteor.user()) {
      return false;
    }

    //Set default reason
    if(reason === ""){
      reason = "This request has been denied";
    }

    //Check if movie
    if(Movies.findOne({_id: docID}) !== undefined) {
      try {
        //Update db
        Movies.update(docID, {$set: {approval_status: 2, denied_reason: reason}});
        return true;

      } catch (error) {
        logger.error("Error denying Movie", error.message);
        return false;
      }
    }
    else if (TV.findOne({_id: docID}) !== undefined) {
      try {
        //Update db
        TV.update(docID, {$set: {approval_status: 2, denied_reason: reason}});
        return true;

      } catch (error) {
        logger.error("Error denying TV show", error.message);
        return false;
      }
    } else {
      try {
        //Update db
        Music.update(docID, {$set: {approval_status: 2, denied_reason: reason}});
        return true;

      } catch (error) {
        logger.error("Error denying album", error.message);
        return false;
      }
    }
  }
});
