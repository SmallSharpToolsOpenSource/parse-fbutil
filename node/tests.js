/// <reference path="../typings/node/node.d.ts"/>
/// <reference path="../cloud/fbutil.js" />

var Parse = require("parse-cloud").Parse;
global.Parse = Parse;

var config = require('../config/global.json');

// var appKey = "production";
var appKey = config.applications._default.link;
var app = config.applications[appKey];
var applicationId = app.applicationId;
var jsKey = app.javascriptKey;
var masterKey = app.masterKey;

Parse.initialize(applicationId, jsKey, masterKey);

var test = require("tap").test;
var uuid = require('node-uuid');

// Create an app profile on Facebook
// http://developers.facebook.com/
// User Graph Explorer to get the App Access Token
// https://developers.facebook.com/tools/explorer/

var facebookAppId = process.env.FACEBOOK_APP_ID;
var appAccessToken = process.env.FACEBOOK_APP_ACCESS_TOKEN;

test("Get Facebook Test User", function (t) {
	var fbutil = require("../cloud/fbutil");
	fbutil.initialize("FacebookTestUserProfile", facebookAppId, appAccessToken);

	var testUser;

	fbutil.getFacebookTestUser().then(function (result) {
		testUser = result;
		t.ok(testUser != null, "test user was created");
		return fbutil.deleteFacebookTestUser(result);
	}).then(function (result) {
		t.ok(result && result.success, "test user deleted successfully");
		t.end();
	}, function (error) {
			t.fail(error);
			t.end();
		});
});

test("Get Facebook Profile", function (t) {
	var fbutil = require("../cloud/fbutil");
	fbutil.initialize("FacebookTestUserProfile", facebookAppId, appAccessToken);

	var testUser, accessToken;

	fbutil.getFacebookTestUser().then(function (result) {
		testUser = result;
		accessToken = testUser["access_token"];
		return fbutil.getFacebookProfile(accessToken);
	}).then(function (result) {
		t.ok(result && result.id && result.name, "fetched facebook profile");
		return fbutil.deleteFacebookTestUser(testUser);
	}).then(function () {
		t.end();
	}, function (error) {
			t.fail(error);
			t.end();
		});
});

test("Get Facebook Access Token Info", function (t) {
	var fbutil = require("../cloud/fbutil");
	fbutil.initialize("FacebookTestUserProfile", facebookAppId, appAccessToken);

	var testUser, accessToken;

	fbutil.getFacebookTestUser().then(function (result) {
		testUser = result;
		accessToken = testUser["access_token"];
		return fbutil.getFacebookAccessTokenInfo(accessToken);
	}).then(function (result) {
		t.ok(result && result.access_token && result.expires_in, "fetched access token info");
		return fbutil.deleteFacebookTestUser(testUser);
	}).then(function () {
		t.end();
	}, function (error) {
			t.fail(error);
			t.end();
		});
});

test("Store User with Facebook Credentials", function (t) {
	var fbutil = require("../cloud/fbutil");
	fbutil.initialize("FacebookTestUserProfile", facebookAppId, appAccessToken);

	var handleError = function (error) {
		console.log(error);
		t.fail(error);
		t.end();
	};

	var testUser, accessToken, user, profile, info;

	fbutil.getFacebookTestUser().then(function (result) {
		testUser = result;
		accessToken = testUser["access_token"];
		return fbutil.getFacebookProfile(accessToken);
	}).then(function (result) {
		console.log("fetched profile");
		profile = result;
		return fbutil.getFacebookAccessTokenInfo(accessToken);
	}).then(function (result) {
		console.log("fetched info");
		info = result;
		return fbutil.findFacebookUser(profile);
	}).then(function (result) {
		user = result;

		if (!user) {
			// create an anonymous user in Parse
			user = new Parse.User();
			var guid = uuid.v4();
			user.set("authData", { "anonymous": { "id": guid } });
			return user.save();
		}
		else {
			return Parse.Promise.as(user);
		}
	}).then(function (result) {
		console.log("paired identities");
		user = result;
		return fbutil.storeFacebookCredentials(user, profile, info);
	}).then(function (result) {
		console.log("stored credentials");
		t.ok(result && result.id, "stored credentials successfully");

		return fbutil.deleteFacebookTestUser(testUser);
	}).then(function () {
		fbutil.deleteFacebookCredentialsAndTestUser(user);
	}).then(function () {
		t.end();
	}, handleError);
});
