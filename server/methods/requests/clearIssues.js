Meteor.methods({
	"clearIssues": function(request) {
		check(request, Object);

		if (request.imdb) {
			try {
				Movies.update(request._id, {$set: {issues: [] }});
				return true;
			} catch (error) {
				logger.error("Clearing issue error -> " + error.message);
				return false;
			}
		} else if (request.tvdb) {
			try {
				TV.update(request._id, {$set: {issues: [] }});
				return true;
			} catch (error) {
				logger.error("Clearing issue error -> " + error.message);
				return false;
			}
		} else if (request.artist) {
			try {
				Music.update(request._id, {$set: {issues: [] }});
				return true;
			} catch (error) {
				logger.error("Clearing issue error -> " + error.message);
				return false;
			}
		}
	}
});
