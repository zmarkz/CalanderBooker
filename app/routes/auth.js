
module.exports = function(router, passport) {

	router.get('/', function(req, res) {
		res.render('index.ejs');
	});

	router.get('/login', function(req, res) {
		res.render('login.ejs', {
			message: req.flash('loginMessage')
		});
	});
	router.post('/login', passport.authenticate('local-login', {
		successRedirect: '/profile',
		failureRedirect: '/auth/login',
		failureFlash: true
	}));

	router.get('/signup', function(req, res) {
		res.render('signup.ejs', {
			message: req.flash('signupMessage')
		});
	});


	router.post('/signup', passport.authenticate('local-signup', {
		successRedirect: '/profile',
		failureRedirect: '/auth/signup',
		failureFlash: true
	}));

	router.get('/google', passport.authenticate('google', {
		scope: ['profile', 'email', 'https://www.googleapis.com/auth/calendar'],
		accessType: 'offline',
		approval_prompt: 'force'
	}));

	router.get('/google/callback',
		passport.authenticate('google', {
			successRedirect: '/profile',
			failureRedirect: '/'
		}));

	router.get('/connect/google', passport.authorize('google', {
		scope: ['profile', 'email', 'https://www.googleapis.com/auth/calendar'],
		accessType: 'offline',
		approval_prompt: 'force'
	}));

	router.get('/connect/local', function(req, res) {
		res.render('connect-local.ejs', {
			message: req.flash('signupMessage')
		});
	});

	router.post('/connect/local', passport.authenticate('local-signup', {
		successRedirect: '/profile',
		failureRedirect: '/auth/connect/local',
		failureFlash: true
	}));


	router.get('/unlink/local', function(req, res) {
		var user = req.user;

		user.local.username = null;
		user.local.password = null;

		user.save(function(err) {
			if (err)
				throw err;
			res.redirect('/profile');
		});

	});

	router.get('/unlink/google', function(req, res) {
		var user = req.user;
		user.google.accessToken = null;
		user.save(function(err) {
			if (err)
				throw err;
			res.redirect('/profile');
		});
	});

	router.get('/logout', function(req, res) {
		req.logout();
		res.redirect('/');
	})

};