/* global Parse */

/// <reference path="fbutil.js" />

var fbutil = require('cloud/fbutil.js');

Parse.Cloud.define("becomeFacebookUser", function (request, response) {
    var accessToken = request.params.accessToken;

    fbutil.becomeFacebookUser(accessToken).then(function (result) {
        response.success(result);
    }, function (error) {
            response.error(error);
        });
});
