var express = require('express');
var passport = require('passport');
var router = express.Router();
var SlackApi = require('../models/SlackApi');
var db = require('../db');
var isAuthenticated = require('../isAuthenticated');
var _  = require('lodash');

//------------ Homepage ------------//

router.get('/', function(req, res, next) {
  var bodyClass = req.user ? 'authed' : 'not-authed';
  res.render('index', {
    bodyClass: bodyClass,
    message: req.flash('error')
  });
});

//------------ Authentication ------------//

router.get('/auth/slack', passport.authenticate('slack'));

router.get('/auth/slack/callback', passport.authenticate('slack', {
    failureRedirect: '/',
    failureFlash : true
  }), function(req, res) {
  res.redirect('/');
});

router.get('/logout', function(req, res) {
  req.logout();
  res.redirect('/');
});

//------------ Making decisions ------------//

router.get('/accept', isAuthenticated, function(req, res) {
  if (req.user.givingTo) { res.redirect('/'); }

  var userCollection = db.get('users');

  userCollection.findAndModify({
    query: { _id: req.user._id },
    update: { $set: { optedIn: true } }
  },
  function(err, user) {
    if (err) console.log(err);

    res.render('accept');
  });
});

router.get('/assign', isAuthenticated, function(req, res) {
  if (req.user.givingTo) { res.redirect('/'); }

  var userCollection = db.get('users');
  var receiverId;

  var query = {
    slackId: {
      $nin: [req.user.slackId, 'U02KAN7ND'] // neither themselves nor Calvin
    },
    receivingFrom: { $exists: false }, // haven't already been assigned
    participating: true, // haven't been disabled by admin
    optedOut: false // haven't opted out
  }

  // get all users matching query
  userCollection.find(query, function(err, availableUsers) {
    if (err) console.log(err);

    if (availableUsers.length) {
      // Kate Booton wants to cheat
      if (req.user.slackId === 'U08SQAUDC') {
        receiverId = 'U02KAN7ND';
      } else {
        var receiverId = _.sample(availableUsers).slackId;
      }

      // update current user
      userCollection.findAndModify({
        query: {_id: req.user._id},
        update: {$set: {givingTo: receiverId}}
      },
      function(err, user) {
        if (err) console.log(err);

        // fetch their assigned user
        userCollection.findAndModify({
          query: { slackId: receiverId },
          update: {$set: { receivingFrom: req.user.slackId}}
        },
        function(err, givingTo) {
          res.render('giving-to', {givingTo: givingTo});
        });
      });
    } else {
      res.render('alone');
    }

    });
});

router.get('/decline', isAuthenticated, function(req, res) {
  var userCollection = db.get('users');

  // opt out the current user
  userCollection.findAndModify({
    query: { _id: req.user._id },
    update: { $set: {
      optedOut: true,
      participating: false
    } }
  },
  function(err, decliningUser) {
    if (err) console.log(err);

    // has someone already been assigned this user?
    if (decliningUser.receivingFrom) {
      receivingFrom = decliningUser.receivingFrom;

      // update them so they're no long associated
      userCollection.update(
        { _id: decliningUser._id },
        { $unset: {receivingFrom: ""} },
        function(err) {
          if (err) console.log(err);
        }
      );

      // and re-update the user who was meant to give them a gift,
      userCollection.findAndModify(
        { slackId: receivingFrom},
        { $unset: {givingTo: ""}},
        function(err, orphanedUser) {
          if (err) console.log(err);

          // notify them that the other person declined
          var slackApi = new SlackApi(orphanedUser.accessToken);
          slackApi.sendDeclineMsg(orphanedUser, req.user, function(resp) {
            console.log('decline message sent.');
            res.render('decline');
          });
        }
      );
    } else {
      res.render('decline');
    }
  });
});

module.exports = router;
