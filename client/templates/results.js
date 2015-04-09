Template.home.events({
    "submit #mresults": function (event) {
        Session.set('searchingresults', true);
        Session.set('mresultsloaded', false);

        var movie = document.querySelector('input[name="movie"]:checked').nextSibling.innerHTML;
        var id = document.querySelector('input[name="movie"]:checked').id;

        if (Movies.findOne({imdb: id}) === undefined) {
            Meteor.call('searchCP', id, movie, function (err, data) {
                if (err) {
                    console.log(err);
                } else if ((data === "active") || (data ==="added")) {
                    Session.set('searchingresults', false);
                    Session.set('movieadded', true);
                    Meteor.call('pushBullet', movie);
                } else if (data === "downloaded") {
                    Session.set('searchingresults', false);
                    Session.set('moviedownloaded', true);
                } else {
                    Session.set('searchingresults', false);
                    window.alert("There was a problem adding the movie, please try again!");                   
                    console.log("CP enabled, but having trouble communicating with CP...");
                }
            });
            return false;
        } else {
            if (Movies.findOne({imdb: id}).downloaded === true) {
                Session.set('searchingresults', false);
                Session.set('moviedownloaded', true);
                return false;
            } else {                
                Session.set('searchingresults', false);
                Session.set('movieexists', true);
                return false;
            }
        return false;
        }
    }
});
