/* global Parse */

(function () {
    var isInitialized = false;
    var FacebookUserClass; // defined during initialization

    var getErrorHandler = function (promise) {
        var fn = function (error) {
            promise.reject(error);
        };

        return fn;
    };

    var getDateWithAddedSeconds = function (seconds) {
        var date = new Date();
        date.setSeconds(date.getSeconds() + seconds);

        return date;
    };

    var FB = {
        config : {},
        initialize: function (facebookClassName, appId, appAccessToken) {
            if (!appId || !appId.length) {
                // unable to initialize
                return;
            }
            else if (!appAccessToken || !appAccessToken.length) {
                // unable to initialize
                return;
            }

            if (!isInitialized) {
                facebookClassName = facebookClassName != undefined ? facebookClassName : "FacebookUserProfile";
                FacebookUserClass = Parse.Object.extend(facebookClassName);
                
                FB.config.appId = appId;
                FB.config.appAccessToken = appAccessToken;
                
                isInitialized = true;
            }
        },
        getFacebookTestUser : function() {
            if (!isInitialized) {
                return Parse.Promise.error("Module is not initialized");
            }
            
            var url = "https://graph.facebook.com/" + FB.config.appId + "/accounts/test-users";
            var params = { permissions : "email,user_friends", installed: true, access_token: FB.config.appAccessToken };
            
            var promise = new Parse.Promise();
            var handleError = getErrorHandler(promise);
            
            Parse.Cloud.httpRequest({ method: "POST", url: url, params: params }).then(function (httpResponse) {
                var json = JSON.parse(httpResponse.text);
                promise.resolve(json);
            }, handleError);

            return promise;
        },
        deleteFacebookTestUser : function(testUser) {
            if (!isInitialized) {
                return Parse.Promise.error("Module is not initialized");
            }
            else if (!testUser) {
                return Parse.Promise.error("Required parameter is missing: testUser");
            }
            
            var url = "https://graph.facebook.com/" + testUser.id;
            var params = { access_token: FB.config.appAccessToken };
            
            var promise = new Parse.Promise();
            var handleError = getErrorHandler(promise);
            
            Parse.Cloud.httpRequest({ method: "DELETE", url: url, params: params }).then(function (httpResponse) {
                var json = JSON.parse(httpResponse.text);
                promise.resolve(json);
            }, handleError);

            return promise;
        },
        getFacebookProfile: function (accessToken) {
            if (!isInitialized) {
                return Parse.Promise.error("Module is not initialized");
            }
            else if (!accessToken) {
                return Parse.Promise.error("Required parameter is missing: accessToken");
            }

            var url = "https://graph.facebook.com/me?access_token=" + accessToken;

            var promise = new Parse.Promise();
            var handleError = getErrorHandler(promise);

            Parse.Cloud.httpRequest({ url: url }).then(function (httpResponse) {
                var json = JSON.parse(httpResponse.text);
                promise.resolve(json);
            }, handleError);

            return promise;
        },
        getFacebookAccessTokenInfo: function (accessToken) {
            if (!isInitialized) {
                return Parse.Promise.error("Module is not initialized");
            }
            else if (!accessToken) {
                return Parse.Promise.error("Required parameter is missing: accessToken");
            }

            var url = "https://graph.facebook.com/oauth/access_token_info?access_token=" + accessToken;

            var promise = new Parse.Promise();
            var handleError = getErrorHandler(promise);

            Parse.Cloud.httpRequest({ url: url }).then(function (httpResponse) {
                var json = JSON.parse(httpResponse.text);

                var seconds = json['expires_in'];
                json.expiration = getDateWithAddedSeconds(seconds);

                promise.resolve(json);
            }, handleError);

            return promise;
        },
        findFacebookUser: function (profile) {
            if (!profile) {
                return Parse.Promise.error("Required parameter is missing: profile");
            }
            else if (!profile.id) {
                return Parse.Promise.error("Required value is missing: profile.id");
            }

            var promise = new Parse.Promise();
            var handleError = getErrorHandler(promise);

            var facebookId = profile.id;

            var query = new Parse.Query(FacebookUserClass);
            query.equalTo("facebookId", facebookId);
            query.include("user");

            query.first().then(function (fbUser) {
                var user;
                if (fbUser !== undefined) {
                    user = fbUser.get("user");
                }
                promise.resolve(user);
            }, handleError);

            return promise;
        },
        storeFacebookCredentials: function (user, profile, info) {
            if (!isInitialized) {
                return Parse.Promise.error("Module is not initialized");
            }
            else if (!user) {
                return Parse.Promise.error("Required parameter is missing: user");
            }
            else if (!profile) {
                return Parse.Promise.error("Required parameter is missing: profile");
            }
            else if (!info) {
                return Parse.Promise.error("Required parameter is missing: info");
            }

            var promise = new Parse.Promise();
            var handleError = getErrorHandler(promise);

            var facebookId = profile.id;

            var query = new Parse.Query(FacebookUserClass);
            query.equalTo("user", user);
            query.equalTo("facebookId", facebookId);
            query.first().then(function (fbUser) {
                if (fbUser === undefined) {
                    fbUser = new FacebookUserClass();
                }

                fbUser.set("user", user);
                fbUser.set("facebookId", facebookId);
                fbUser.set("name", profile.name);
                fbUser.set("accessToken", info.access_token);
                fbUser.set("expiration", getDateWithAddedSeconds(info.expires_in));
                fbUser.set("profile", profile);
                fbUser.set("accessTokenInfo", info);

                // acl to be read/write only by the user (access token must be protected)
                fbUser.setACL(new Parse.ACL(user));
                
                return fbUser.save();
            }).then(function (result) {
                promise.resolve(result);
            }, handleError);

            return promise;
        },
        deleteFacebookCredentialsAndTestUser: function (user) {
            if (!isInitialized) {
                return Parse.Promise.error("Module is not initialized");
            }
            else if (!user) {
                return Parse.Promise.error("Required parameter is missing: user");
            }
            
            var promise = new Parse.Promise();
            var handleError = getErrorHandler(promise);
            
            var query = new Parse.Query(FacebookUserClass);
            query.equalTo("user", user);
            query.each(function(item) {
                return item.destroy();
            }).then(function() {
                Parse.Cloud.useMasterKey();
                return user.destroy();
            }, handleError);
            
            return promise;
        },
        becomeFacebookUser: function (accessToken) {
            if (!isInitialized) {
                return Parse.Promise.error("Module is not initialized");
            }
            else if (!accessToken) {
                return Parse.Promise.error("Required parameter is missing: accessToken");
            }

            var promise = new Parse.Promise();
            var handleError = getErrorHandler(promise);

            var user, profile, info;

            // verify the access token and get the user's FB ID
            FB.getFacebookProfile(accessToken).then(function (result) {
                profile = result;
                // fetch info onto the access token (expiration)
                return FB.getFacebookAccessTokenInfo(accessToken);
            }).then(function (result) {
                info = result;
                // find the user which matches this FB user
                return FB.findFacebookUser(profile);
            }).then(function (result) {
                user = result;
                if (!user) {
                    user = Parse.User.current();
                }

                return Parse.Promise.as(user);
            }).then(function (result) {
                user = result;
                // store the FB credentials with this user
                return FB.storeFacebookCredentials(user, profile, info);
            }).then(function (result) {
                // return the session token for this user
                Parse.Cloud.useMasterKey();
                var sessionToken = user.getSessionToken();
                promise.resolve({ "userId" : user.id,  "sessionToken": sessionToken });
            }, handleError);

            return promise;
        }
    };

    module.exports = FB;
} ());
