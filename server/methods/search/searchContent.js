Meteor.methods({
  "searchContent": function(searchterm, searchType) {
    check(searchterm, String);
    check(searchType, String);

    var type, result;

    if (searchType === "Music" || searchType === "Albums" || searchType === "Artists") {
        type = 'music';
    } else if (searchType === "TV Shows") {
        type = 'tv';
    } else {
        type = 'movie';
    }

    if (type === "tv") {

      try {
        result = Meteor.call("tvmaze", searchterm, type);

      } catch (error) {
        logger.error("tvmaze Error -> " + error.message);
        return [];

      }

    } else if (type === "movie") {

      try {
        result = Meteor.call("TMDBSearch", searchterm, type);
        var tmp = result.link;
        result.link = "https://image.tmdb.org/t/p/w184" + tmp;

      } catch (error) {
        logger.error("TMDBSearch Error -> " + error.message);
        return [];

      }
    } else if (type === 'music') {
      try {
        result = MusicBrainz.searchGroupedRelease(searchterm);
      } catch (error) {
        logger.error("Headphones Error -> " + error.message);
        return [];

      }
    }

    return result;
  },

  "searchOptions": function () {
    var options = [];

    if (Settings.find({}).fetch()[0].searchOptionsMOVIES) {
      options.push("Movies");
    }

    if (Settings.find({}).fetch()[0].searchOptionsTV) {
      options.push("TV Shows");
    }

    if (Settings.find({}).fetch()[0].searchOptionsMUSIC) {
      options.push("Albums");
    }

    return options;
  }
});
