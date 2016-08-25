  var express = require('express')
  var app = express(); //express();
  var mongoose = require('mongoose');
  var bodyParser = require('body-parser');
  var cookieParser = require("cookie-parser");
  var passport = require("passport");
  var LocalStrategy = require('passport-local').Strategy;
  var path = require('path');

  var uri = "mongodb://" + "mark" + ":" + "Welcome1" + "@ds049864.mongolab.com:49864/hack";

  var allowCrossDomain = function(req, res, next) {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
      res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization,x-access-token');

      next();
  };
  
  //test

  app.use(allowCrossDomain);

  mongoose.connect(uri);

  var cookieParser = require('cookie-parser');
  var session = require('express-session');
  var MongoStore = require('connect-mongo')(session);
  var morgan = require('morgan');
  var bodyParser = require('body-parser');
  var passport = require('passport');
  var flash = require('connect-flash');

  require('./config/passport')(passport);

  app.use(morgan('dev'));
  app.use(cookieParser());
  app.use(bodyParser.urlencoded({
      extended: false
  }));
  app.use(session({
      secret: 'anystringoftext',
      saveUninitialized: true,
      resave: true,
      store: new MongoStore({
          mongooseConnection: mongoose.connection,
          ttl: 1 * 60 * 60
      })
  })); //setting 1 hour of session


  app.use(passport.initialize());
  app.use(passport.session()); // persistent login sessions
  app.use(flash()); // connect-flash for flash messages stored in session


  app.use(bodyParser.json())
  app.set('view engine', 'ejs');


  app.use('/static', express.static('client'));

    //api for public access
  var pub = express.Router();
  require('./app/routes/pub.js')(pub);
  app.use('/pub', pub);

    //api for calendar app access
  var calendar = express.Router();
  require('./app/routes/calendar.js')(calendar);
  app.use('/calendar', calendar);

    //api for authentications
  var auth = express.Router();
  require('./app/routes/auth.js')(auth, passport);
  app.use('/auth', auth);

    //for secure routes
  var secure = express.Router();
  require('./app/routes/secure.js')(secure, passport);
  app.use('/', secure);



  app.listen(8080, function() {
      console.log("server has started listening on port 8080");
  });