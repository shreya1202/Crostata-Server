var express = require('express');
var router = express.Router();
var jwt = require('jsonwebtoken');
var config = require('config');

const tokenSecret = config.secret;

var logger = require('../utils/logger');

module.exports = function check(req, res, next) {
  var token = req.headers.authorization.split(" ")[1];
  if (token.length > 0) {
    jwt.verify(token, tokenSecret, function(err, result) {
      if (err) {
        logger.error('Middleware:token -- Token is invalid');
        res.json({
          success: false
        });
      } else {
        /*res.json({
          success: true
        });*/
        logger.info('Middleware:token -- Token valid. Going to next handler.');
        next();
      }
    });
  } else {
    logger.error('Middleware:token -- No token present in the request');
    res.json({
      success: false
    });
  }
};