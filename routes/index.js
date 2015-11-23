var express = require('express');
var passport = require('passport');
var router = express.Router();
var SlackApi = require('../models/SlackApi');
var db = require('../db');

//------------ Homepage ------------//

router.get('/', function(req, res, next) {
  res.render('index');
});


//------------ Authentication ------------//

router.get('/auth/slack', passport.authenticate('slack'));

router.get('/auth/slack/callback', passport.authenticate('slack', {failureRedirect: '/'}), function(req, res) {
  res.redirect('/');
});

router.get('/logout', function(req, res) {
  req.logout();
  res.redirect('/');
});


//------------ Admin Settings ------------//

// simple admin view to dictate which users are participating
router.get('/settings', function(req, res) {
  var userCollection = db.get('users');
  userCollection.find({}, function(err, users){
    if (users) {
      res.render('settings', {users: users});
    } else {
      res.json(err);
    }
  });
});

// updating above settings
// TODO: there is maybe a better way than two updates
router.post('/settings', function(req, res) {
  var userCollection = db.get('users');
  var participants = req.body.users;

  // set the yesses
  userCollection.update(
    {slackId: {$in: participants}},
    {$set: {participating: true}},
    {multi: true}
  );

  // set the nos
  userCollection.update(
    {slackId: {$nin: participants}},
    {$set: {participating: false}},
    {multi: true}
  );

  res.redirect('/settings');
});

// populate DB with Slack users
router.get('/fetch-users', function(req, res) {
  var userCollection = db.get('users');
  var slack = new SlackApi(req.user.accessToken);
  slack.getUsers(function(err, users) {
    if (users) {
      users.forEach(function(user, index) {
        // http://stackoverflow.com/questions/16358857/mongodb-atomic-findorcreate-findone-insert-if-nonexistent-but-do-not-update
        userCollection.findAndModify(
          { slackId: user.id },
          {
            $set: {
              name: user.name,
              real_name: user.real_name,
              profilePic: user.profile.image_512
            },
            $setOnInsert: { // only set these for new records
              slackId: user.id,
              participating: true,
              optedOut: false
            }
          },
          {
            new: true,   // return new doc if one is upserted
            upsert: true // insert the document if it does not exist
          }
        );
      });
      res.send('users updated.');
    } else {
      res.json(err);
    }
  });
});

// list user JSON, for debugging only
router.get('/users', function(req, res) {
  var userCollection = db.get('users');
  userCollection.find({}, function(err, users){
    res.json(users);
  });
});


module.exports = router;
