var express = require('express');
var passport = require('passport');
var router = express.Router();
var SlackApi = require('../models/SlackApi');
var db = require('../db');

var userCollection = db.get('users');

/**
 * list all users in DB, for debugging
 */
router.get('/list', function(req, res) {
  userCollection.find({}, function(err, users){
    res.json(users);
  });
})

/**
 * assign a santa person to a person
 */
router.get('/assign', function(req, res) {

  var query = {
    slackId: { $ne: req.user.slackId }, // not themselves
    givingTo: { $exists: false }, // haven't already been assigned
    participating: true, // haven't been disabled by admin
    optedOut: false // haven't opted out
  }

  userCollection.findOne(query, function(err, user) {
    if (err) console.log(err);

    userCollection.findAndModify({
      query: { _id: req.user._id },
      update: { $set: { givingTo: user.slackId } }
    },
    function(err, user) {
      if (err) console.log(err);
      if (user.length === 0) console.log('something went wrong');

      req.login(user, function(err) {
        if (err) return next(err)

        console.log('user assigned');
        res.redirect('/');
      });
    });
  });
});


/**
 * unassign a santa person from a person
 * (dev only)
 */
router.get('/unassign', function(req, res) {

  userCollection.findAndModify({
    query: { _id: req.user._id },
    update: { $unset: { givingTo: "" } }
  },
  function(err, user) {
    if (err) console.log(err);
    if (user.length === 0) console.log('something went wrong');

    req.login(user, function(err) {
      if (err) return next(err)
      console.log('user unassigned');
      res.redirect('/');
    });
  });
});

module.exports = router;
