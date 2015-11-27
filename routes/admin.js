var express = require('express');
var passport = require('passport');
var router = express.Router();
var SlackApi = require('../models/SlackApi');
var db = require('../db');
var isAuthenticated = require('../isAuthenticated');
var _ = require('lodash');

/**
 * Simple admin view to administer who's allowed to participate
 */
router.get('/', isAuthenticated, function(req, res) {
  var userCollection = db.get('users');
  userCollection.find({}, function(err, users){
    if (users) {
      res.render('admin', {teamMembers: users});
    } else {
      res.json(err);
    }
  });
});

/**
 * updating above settings
 * TODO: there is maybe a better way than two updates, maybe not
 */
router.post('/update', isAuthenticated, function(req, res) {
  var userCollection = db.get('users');
  var participants = req.body.users;

  participants = _.isArray(participants) ? participants : [participants];

  // set the yesses
  userCollection.update(
    {slackId: {$in: participants}},
    {$set: {participating: true}},
    {multi: true},
    function(err) {
      if (err) console.log(err);
    }
  );

  // set the nos
  userCollection.update(
    {slackId: {$nin: participants}},
    {$set: {participating: false}},
    {multi: true},
    function(err) {
      if (err) console.log(err);
    }
  );

  res.redirect('/admin');
});

router.get('/reset', isAuthenticated, function(req, res) {
  var userCollection = db.get('users');

  // set the yesses
  userCollection.update(
    {},
    {
      $unset: {
        receivingFrom: "",
        givingTo: ""
      },
    },
    {multi: true},
    function(err, users) {
      if (err) console.log(err);
      res.send('users reset.');
    }
  );
});

/**
 * populate DB with Slack users
 */
router.get('/fetch-users', isAuthenticated, function(req, res) {
  var userCollection = db.get('users');
  var slack = new SlackApi(req.user.accessToken);
  slack.getUsers(function(err, users) {
    if (users) {
      users.forEach(function(user, index) {

        if (user.is_bot) return;

        var firstName = user.profile.first_name ? user.profile.first_name : user.name;
        var fullName  = user.profile.first_name ? user.profile.real_name  : user.name;

        // properties that are safe to be updated/overwritten
        var setOnUpdate = {
          first_name: firstName,
          full_name: fullName,
          profilePic: user.profile.image_512
        }

        // properties only to be applied for new entries
        var setOnInsert = {
          slackId: user.id,
          participating: true,
          optedOut: false,
          fetched: true
        }

        userCollection.findAndModify(
          { slackId: user.id },
          {
            $set: setOnUpdate,
            $setOnInsert: setOnInsert
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

module.exports = router;
