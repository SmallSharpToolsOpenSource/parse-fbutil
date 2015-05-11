/* global global */
/// <reference path="../cloud/fbutil.js" />

var config = require('../config/global.json');

var Parse = require("parse-cloud").Parse;
global.Parse = Parse;

// var appKey = "production";
var appKey = config.applications._default.link;
var app = config.applications[appKey];
var applicationId = app.applicationId;
var jsKey = app.javascriptKey;
var masterKey = app.masterKey;

Parse.initialize(applicationId, jsKey, masterKey);
