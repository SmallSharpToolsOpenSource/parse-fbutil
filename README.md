# parse-fbutil

Facebook Utility for Parse

### Setup

 * Run `npm install` in the node folder
 * Update config/global.json with real values for a Parse app
 * Copy node/runtests.sh.sample to node/runtests.sh and update with real values
 * Run node/runtests.sh to test fbutil.js

For a real Parse application only the file fbutil.js is needed. It
should be placed in the cloud folder and should be initialized
as shown in the test script. The example in `main.js` shows how
`fbutil.js` is used to populate an object in Parse with credentials
for a Facebook user which is then associated to a Parse identity.
The `become` feature for Parse is used to change the identity of
a client user to match an identity on the backend. For a Facebook
login process it is sometimes necessary to become the user so
that the Parse identity can be paired with a Facebook identity
so that existing data for that user is accessible.

### Local Parse Cloud Code

This module is set up to be testable locally. The module `parse-cloud`
is leveraged to allow for some backend functionality to work while
REST communications and other code run locally. Making the module
testable locally helps to speed up development and to automatically
check the code base during development.

Environment variables are used with the test scripts. The module
itself simply takes parameters to initialize the module. These
values can be stored in any way. These values could even be
stored in global.json and made to work with the configured app.

### License

MIT

### Credits
Brennan Stehling - @smallsharptools

### Feedback

Please use the GitHub issues system to submit questions, concerns
or even pull requests with changes.
