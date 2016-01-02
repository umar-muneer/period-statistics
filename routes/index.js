var express = require('express');
var router = express.Router();
var Promise = require('bluebird')
var eventHandlers = require('../eventHandlers');
var plotly = require('plotly');
var _ = require('lodash');
var fs = require('fs');

/* GET home page. */
router.get('/', function(req, res) {
  res.render('index', { title: 'github was here, well atleast it should have been !!!' });
});

router.post('/githooks/push', function(req,res) {
  eventHandlers.handlePushEvent(req.body);
  res.end();
});

router.post('/githooks/pullrequest', function(req,res) {
  eventHandlers.handlePullRequestEvent(req.body);
  res.status(200).end();
});


var createCharts = function(statistics) {
  var chart = plotly(process.env.PLOTLY_USERNAME, process.env.PLOTLY_APIKEY);
  var imgOpts = {
    format: 'png',
    width: 1000,
    height: 500
  };

  var _create = function(figure, chartName) {
    return new Promise(function(resolve, reject) {
      chart.getImage(figure, imgOpts, function (error, imageStream) {
        if (error) {
          reject();
          return console.log (error);
        };
        var fileStream = fs.createWriteStream(chartName);
        imageStream.pipe(fileStream);
        resolve(chartName);
      });
    });
  };
  var _commitsChart = function() {
    var data = {
      x: _.pluck(statistics, 'author'),
      y: _.pluck(statistics, 'noOfCommits'),
      type: 'bar'
    };
    var figure = ['data', [data]];
    return _create(figure, 'commits.png');
  };

  var _pullRequestsChart = function() {
    var data = {
      x: _.pluck(statistics, 'author'),
      y: _.pluck(_.pluck(statistics, 'pullRequest') , 'opened'),
      type: 'bar'
    };
    var figure = ['data', [data]];
    return _create(figure, 'pullrequests.png');
  };

  var _filesChangedChart = function() {
    var data = {
      x: _.pluck(statistics, 'author'),
      y: _.pluck(statistics , 'noOfFilesChanged'),
      type: 'bar'
    };
    var figure = ['data', [data]];
    return _create(figure, 'fileschanged.png');
  };

  var _netLinesChart = function() {
    var data = {
      x: _.pluck(statistics, 'author'),
      y: _.pluck(statistics , 'netChanges'),
      type: 'bar'
    };
    var figure = ['data', [data]];
    return _create(figure, 'netlines.png');
  };

  var _linesAddedChart = function() {
    var data = {
      x: _.pluck(statistics, 'author'),
      y: _.pluck(statistics , 'noOfAdditions'),
      type: 'bar'
    };
    var figure = ['data', [data]];
    return _create(figure, 'additions.png');
  };

  var _linesDeletedChart = function() {
    var data = {
      x: _.pluck(statistics, 'author'),
      y: _.pluck(statistics , 'noOfDeletions'),
      type: 'bar'
    };
    var figure = ['data', [data]];
    return _create(figure, 'deletions.png');
  };

  return Promise.all([_commitsChart(), _pullRequestsChart(), _netLinesChart(), _linesAddedChart(), _linesDeletedChart(), _filesChangedChart()]);
};

router.get('/statistics', function(req,res) {
  return App.models.statistics.calculate({
    fromDate: req.query.fromDate,
    toDate: req.query.toDate
  }).then(function(result){
    res.json(result);
  }).catch(function(error) {
    res.status(500).json(error.stack ? error.stack : error);
  });
});

module.exports = router;
