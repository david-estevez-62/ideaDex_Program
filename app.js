

var express = require('express');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var _=require('underscore');
var mongoose = require('mongoose');

var session = require('express-session');
var flash = require('connect-flash');
var passport = require('passport');
var passportConfig = require('./config/passport');
var User = require('./models/users.js');

var indexController = require('./controllers/index.js');
var adminController = require('./controllers/admin');
var usersController = require('./controllers/users');
var postController = require('./controllers/post');


mongoose.connect(process.env.MONGOLAB_URI || 'mongodb://localhost/ideanote');

var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));

var app = express();
app.set('view engine', 'jade');
app.set('views', __dirname + '/views/');
app.use(express.static(__dirname + '/public'));
app.use(bodyParser.urlencoded({extended: false}));
require('./models/seeds/acctsSeed.js');
app.use(require('express-session')({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: false
}));

app.use(cookieParser());
app.use(flash());

app.use(passport.initialize());

app.use(passport.session());




// Our get request for viewing the login page
app.get('/login', adminController.login);

// Post received from submitting the login form
app.post('/login', adminController.processLogin);

// Post received from submitting the signup form
app.post('/signup', adminController.processSignup);

// Any requests to log out can be handled at this url
app.get('/logout', adminController.logout);

// ***** IMPORTANT ***** //
// By including this middleware (defined in our config/passport.js module.exports),
// We can prevent unauthorized access to any route handler defined after this call
// to .use()
app.get('/', indexController.index);
app.get('/createacct', function (req, res) {
  res.render('createacct');
});





app.use(passportConfig.isLoggedIn);
// app.use(passportConfig.ensureAuthenticated);



// app.get('/:username/home', function(req,res){
//  res.render('home', {user: req.user})
// })
// app.get('/home', function (req, res) {
//   res.render('home', {user: req.user});
// });
// Passing in ideas in res.render allows use to have access to ideas in jade
app.get('/:username/home', function (req, res) {
  var posts = req.user.posts.reverse();

  res.render('home', {
    user: req.user,
    posts: posts
  });
});
app.post('/ideaPosted', usersController.AddPost);


app.post('/ideaRemoved', usersController.RemovePost)


app.post('/upvote', postController.Upvote);
app.post('/downvote', postController.Downvote);

app.post('/favorite', usersController.Favorite);

// app.get('/users/:userid', readController.getByUser);
// // If already following dont have follow button other have follow btn
// app.get('/users/:userid/:otheruserid', readController.getByUser)





// app.get('/:id/edit', function (req, res) {
//   var id = user._id;
//   res.redirect('/'+id+'/edit');
// });
app.get('/:username/edit', function (req, res) {
  res.render('edit', {user: req.user});
});
//res.redirect('/guest-portal');




app.get('/:username/search', function (req, res) {
  res.render('search', {user: req.user});
});
app.post('/:username/search', function (req, res) {
 
  // User.findOne({'username':username}, function(err, user){
  User.find({username: new RegExp(req.body.search, 'i')}, function (err, user) {
    
    if (err) return handleErr(err);
        

        var matches =_.filter(user, function(obj){
          return obj.username !== req.params.username
        })
        console.log(matches)

      res.render('search', {userlist: matches, user: req.user});
    })
   
    // res.('/search')
});





app.get('/user/:me/:username', function (req, res) {
  var isFollowing = req.user.following.indexOf(req.params.username);


      User.find({username: req.params.username}, function (err, data) {
        if (err) {
          res.send(err);
        }

          var allPosts= data[0].posts.reverse()
        //   console.log(allPosts)
        //   console.log(data[0].posts)

        // console.log(allPosts)

        var publicPosts=_.filter(allPosts, function(obj){
          return obj.privacy === false
        })
        console.log(publicPosts)

        res.render('searchProfile', {
          user: req.params,
          isFollowing: isFollowing,
          publicPosts: publicPosts
        });

    });
});
app.post('/follow', usersController.FollowUser);


  // User.find({following: req.params.username}, function (err, user) {
  //     if (err) res.send(err);

  //     var following = following.indexOf(req.params.username)

  //     // map over array of friends to see if friends with hyperlink username that was clicked on 
  //     //////////////////////////////////////////////////////////////////
  //     // if friends prefix with friend (i.e username/friend/username)//
  //     // if not friends yet (i.e. username/username)                //
  //     ///////////////////////////////////////////////////////////////

  //     console.log(following);
  //     res.render('searchProfile', {user: req.body});


app.get('/:username/discover', function (req, res) {
  var posts = req.user.discover.reverse();

    res.render('discover', {
      user: req.user,
      posts: posts
    })
});

app.get('/:username/favorites', function (req, res) {

  User.find({username: req.user.username}, function (err, data) {
    if (err) {
      res.send(err);
    }

    var favorites = req.user.favorites.reverse();

      res.render('favorites', {
        user: req.user,
        favorites: favorites
      })
  });

});
app.get('/:username/notifications', function (req, res) {
  
  User.find({username: req.user.username}, function (err, data) {
    if (err) {
      res.send(err);
    }

      var counter = data[0].notifications.length

      var notifications = data[0].notifications.reverse();

      res.render('notifications', {
        user: req.user,
        // notifications will include followers and favorited posts
        notifications:notifications
      })
  });

  

});
app.get('/:username/changeUsername', function (req, res) {
  res.render('changeUsername', {user: req.user});
});
app.post('/changeUsername', usersController.ChngUsername);




app.get('/:username/changePassword', function (req, res) {
  res.render('changePassword', {user: req.user});
});
app.post('/changePassword', usersController.ChngPassword);



app.post('/uploadProfilepic', function(req, res){

    User.findOne({username: req.user.username}, function (err, data) {
      if (err) return handleErr(err);

      data.imageUrl = req.body.imageUrl || "/img/gravatar.jpg"
      var par = req.body.imageUrl
      console.log(par)
      data.save(function(err, user) {
        console.log('ji')
        if(err) return handleErr(err);
        res.send(user);
        // res.redirect('/'+username+'/edit');
      });
      
    });

})


// Use heroku's port if it is specified.
// Otherwise use our own local port.
// var port = process.env.PORT || 6591;
// var server = app.listen(port, function(){})
var server = app.listen(process.env.PORT || 6591, function () {
  console.log('Express server listening on port ' + server.address().port);
});
