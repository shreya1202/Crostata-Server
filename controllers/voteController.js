/*jshint loopfunc: true */
'use strict';

const express = require('express');
const path = require('path');
const logger = require('../utils/logger');
const bcrypt = require('bcrypt');
const multer = require('multer');
const fs = require('fs');
const util = require('util');
const sharp = require('sharp');
const mongoose = require('mongoose');

var shortid = require('shortid');
var moment = require('moment');

const Post = require('../models/post');
const Vote = require('../models/vote');
const Comment = require('../models/comment');
const Subject = require('../models/subject');

var config = require('config');

exports.addVote = function(req, res) {
  var newVote = new Vote({
    birthId: req.body.birthId,
    postId: req.body.postId,
    value: req.body.value
  });
  Vote.findOneAndUpdate({
    birthId: newVote.birthId,
    postId: newVote.postId
  }, {
    value: newVote.value
  }).then((vote) => {
    if (vote != null) {
      updateVoteTotals(newVote.postId).then((voteTotal) => {
        logger.debug('routes:opinion:submitVote:findOneAndUpdate:' +
          'updateVoteTotals -- birthId ' +
          newVote.birthId + ' postId ' + newVote.postId);
        voteSuccess(res, voteTotal);
      }, (reject) => {
        logger.debug('routes:opinion:submitVote:findOneAndRemove:' +
          'updateVoteTotals -- ' + reject);
        voteFailure(res, 500);
      });
    } else {
      newVote.save().then((vote) => {
        updateVoteTotals(newVote.postId).then((voteTotal) => {
          logger.debug('routes:opinion:submitVote:findOneAndUpdate:' +
            'save:updateVoteTotals -- birthId ' +
            newVote.birthId + ' postId ' + newVote.postId);
          voteSuccess(res, voteTotal);
        }, (reject) => {
          logger.debug('routes:opinion:submitVote:findOneAndRemove:' +
            'save:updateVoteTotals -- ' + reject);
          voteFailure(res, 500);
        });
      }, (err) => {
        logger.debug('routes:opinion:submitVote:findOneAndRemove:' +
          'save -- ' + err);
        voteFailure(res, 500);
      });
    }
  }, (err) => {
    logger.debug('routes:opinion:submitVote:findOneAndUpdate -- ' + err);
    voteFailure(res, 500);
  });
};

exports.deleteVote = function(req, res) {
  Vote.findOneAndRemove({
    birthId: req.query.birthId,
    postId: req.query.postId
  }).then((vote) => {
    updateVoteTotals(req.query.postId).then((voteTotal) => {
      logger.debug('routes:opinion:deletevote:findOneAndRemove -- birthId ' +
        req.query.birthId + ' postId ' + req.query.postId);
      voteSuccess(res, voteTotal);
    });
  }, (err) => {
    logger.debug('routes:opinion:deletevote:findOneAndRemove -- ' + err);
    voteFailure(res, 500);
  });
};

exports.getVoteTotal = function(req, res) {
  Vote.find({
    postId: req.query.postId
  }).exec((err, votes) => {
    if (err) {
      logger.debug('routes:opinion:voteTotal:find -- ' + err);
      voteFailure(res, 500);
    } else {
      var total = 0;
      for (var x = 0; x < votes.length; x++) {
        total += votes[x].value;
      }
      logger.debug('routes:opinion:voteTotal:find -- postId ' + total);
      voteSuccess(res, total);
    }
  });
};

exports.getVotePerPost = function(req, res) {
  Vote.find({
    birthId: req.query.birthId,
    postId: req.query.postId
  }).then((vote) => {
    if (vote.length > 0) {
      //logger.debug(vote);
      logger.debug('routes:opinion:votePerPost:findOne -- ' +
        'postId ' + vote.value);
      voteSuccess(res, vote.value);
    } else {
      logger.debug('routes:opinion:votePerPost:findOne -- user didn\'t vote ');
      voteFailure(res, 400);
    }
  }, (err) => {
    logger.debug('routes:opinion:votePerPost:findOne -- ' + err);
    voteFailure(res, 500);
  });
};

var updateVoteTotals = postId => new Promise((resolve, reject) => {
  Vote.find({
    postId: postId
  }).then((votes) => {
    var totalUpVotes = 0;
    var totalDownVotes = 0;
    for (var x = 0; x < votes.length; x++) {
      if (votes[x].value === 1) {
        totalUpVotes++;
      } else {
        totalDownVotes++;
      }
    }
    Post.findOneAndUpdate({
      postId: postId
    }, {
      upVotes: totalUpVotes,
      downVotes: totalDownVotes
    }).then((post) => {
      logger.debug('routes:opinion:updateVoteTotals:find -- ' +
        'postId ' + totalUpVotes - totalDownVotes);
      resolve(totalUpVotes - totalDownVotes);
    }, (err) => {
      logger.debug('routes:opinion:updateVoteTotals:find -- ' + err);
      reject(err);
    });
  }, (err) => {
    logger.debug('routes:opinion:updateVoteTotals:find -- ' + err);
    reject(err);
  });
});




function voteSuccess(res, total) {
  res.status(200).json({
    success: true,
    total: total
  });
}

function voteFailure(res, resultCode) {
  res.status(resultCode).json({
    success: false,
    total: 0
  });
}