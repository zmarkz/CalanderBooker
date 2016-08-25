var LocalStrategy = require("passport-local").Strategy;
var GoogleStrategy = require("passport-google-oauth").OAuth2Strategy;

var User = require("../app/models/user");
var configAuth = require("./googleAuthData");

module.exports = function(passport) {
	passport.serializeUser(function(user, done) {
		done(null, user.id);
	});

	passport.deserializeUser(function(id, done) {
		User.findById(id, function(err, user) {
			done(err, user);
		});
	});

	passport.use('local-signup', new LocalStrategy({
			usernameField: 'username',
			passwordField: 'password',
			passReqToCallback: true
		},
		function(req, username, password, done) {
			process.nextTick(function() {
				// console.log("here");
				// console.log("user - " + JSON.stringify(req.user));
				// console.log("username - " + username + "  password =" + password);
				User.findOne({
					'local.username': username
				}, function(err, user) {
					if (err)
						return done(err);
					if (user) {
						return done(null, false, req.flash('signupMessage', 'That username is already taken'));
					}
					if (!req.user) {
						var newUser = new User();
						newUser.local.username = username;
						newUser.local.password = newUser.generateHash(password);

						newUser.save(function(err) {
							if (err)
								throw err;
							return done(null, newUser);
						})
					}
					else {
						var user = req.user;
						user.local.username = username;
						user.local.password = user.generateHash(password);

						user.save(function(err) {
							if (err)
								throw err;
							return done(null, user);
						})
					}
				})

			});
		}));

	passport.use('local-login', new LocalStrategy({
			usernameField: 'username',
			passwordField: 'password',
			passReqToCallback: true
		},
		function(req, username, password, done) {
			process.nextTick(function() {
				User.findOne({
					'local.username': username
				}, function(err, user) {
					if (err)
						return done(err);
					if (!user)
						return done(null, false, req.flash('loginMessage', 'No User found'));
					if (!user.validPassword(password)) {
						return done(null, false, req.flash('loginMessage', 'invalid password'));
					}
					return done(null, user);

				});
			});
		}
	));


	passport.use(new GoogleStrategy({
			clientID: configAuth.googleAuth.clientID,
			clientSecret: configAuth.googleAuth.clientSecret,
			callbackURL: configAuth.googleAuth.callbackURL,
			passReqToCallback: true
		},
		function(req, accessToken, refreshToken, profile, done) {
			process.nextTick(function() {
				if (!req.user) {
					User.findOne({
						'google.id': profile.id
					}, function(err, user) {
						if (err)
							return done(err);
						if (user) {
							if (!user.google.refreshToken) {
								user.google.accessToken = accessToken;
								user.google.refreshToken = refreshToken;
								user.google.name = profile.displayName;
								user.google.email = profile.emails[0].value;
								user.save(function(err) {
									if (err)
										throw err;
								});
							}
							return done(null, user);
						}
						else {
							var newUser = new User();
							newUser.google.id = profile.id;
							newUser.google.accessToken = accessToken;
							newUser.google.refreshToken = refreshToken;
							newUser.google.name = profile.displayName;
							newUser.google.email = profile.emails[0].value;

							newUser.save(function(err) {
								if (err)
									throw err;
								return done(null, newUser);
							})
						}
					});
				}
				else {
					var user = req.user;

					User.findOne({
						'google.id': profile.id
					}, function(err, foundUser) {
						if (err)
							return done(err)
						if (foundUser) {
							//user exists and logged into google account but do not have google data
							if(!user.google.refreshToken){
							user.google.refreshToken = foundUser.google.refreshToken;	
							}
							if(!user.google.id){
								user.google.id = foundUser.google.id;
							}
							user.google.accessToken = accessToken;
							if(!user.google.name){
								user.google.name = foundUser.google.name;
							}
							if(!user.google.email){
								user.google.email = foundUser.google.email;
							}
						}
						else {
							user.google.id = profile.id;
							user.google.refreshToken = refreshToken;
							user.google.accessToken = accessToken;
							user.google.name = profile.displayName;
							user.google.email = profile.emails[0].value;
						}

						user.save(function(err) {
							if (err)
								throw err;
							return done(null, user);
						})

					});
				}

			});
		}

	));

}