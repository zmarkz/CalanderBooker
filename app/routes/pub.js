var Slot = require("../models/slot");
var moment = require("moment");
var gcal = require("google-calendar");
var googleAuth = require('google-auth-library');
var googleAuthData = require("../../config/googleAuthData");
var google = require('googleapis');
var User = require("../models/user");
var auth = new googleAuth();
var calendar = google.calendar('v3');
module.exports = function(router) {
    router.get('/homepage', function(req, res) {
        res.render('homepage', {
            user: ''
        });
    })

    router.get('/teacherCalendar', function(req, res) {
        User.findOne({
            'google.id': req.query.id
        }, function(err, user) {
            if (err) {
                res.send(err);
            }
            if (!user) {
                res.json({
                    success: false,
                    message: 'teacher is not registered'
                });
            }
            else {
                Slot.find({
                    id: req.query.id
                }, function(err, slots) {
                    if (err) {
                        res.send(err)
                    }
                    else {
                        res.json({
                            success: true,
                            data: {
                                slots: slots
                            }
                        })
                    }
                })
            }
        })
    });

    router.post('/createEvent', function(req, res) {
        User.findOne({
            'google.id': req.body.id
        }, function(err, user) {
            if (err) {
                res.send(err)
            }
            if (!user) {
                res.send({
                    message: "No user found with this name"
                })
            }
            else {
                var oauth2ClientDummy = new auth.OAuth2(googleAuthData.googleAuth.clientID,
                    googleAuthData.googleAuth.clientSecret, googleAuthData.googleAuth.callbackURL);
                
                var refreshToken = '';
                if(user.google.accessToken){
                    refreshToken = user.google.refreshToken;
                }
                var token = {
                    
                    "expiry_date": true,
                    "access_token" : null,
                    "refresh_token": refreshToken
                }

                oauth2ClientDummy.credentials = token;

                //post event

                var event = {
                    'summary': 'Booked by' + req.body.studentName,
                    // 'location': '800 Howard St., San Francisco, CA 94103',
                    'description': 'Booked by ' + user.google.name,
                    'start': {
                        'dateTime': req.body.startDateTime,
                        // 'timeZone': 'Indian Standard Time',
                    },
                    'end': {
                        'dateTime': req.body.endDateTime,
                        // 'timeZone': 'Indian Standard Time',
                    },
                    'attendees': [{
                        'email': req.body.studentEmail,
                        'displayName': req.body.studentName

                    }],
                    'reminders': {
                        'useDefault': false,
                        'overrides': [{
                            'method': 'email',
                            'minutes': 24 * 60
                        }, {
                            'method': 'popup',
                            'minutes': 10
                        }, ],
                    },
                };

                calendar.events.insert({
                    auth: oauth2ClientDummy,
                    calendarId: 'primary',
                    resource: event,
                }, function(err, event) {
                    if (err) {
                        res.send({
                            success : false,
                            message : err.toJSON
                        })
                    }
                    else {
                        if (event) {

                            var startDateTime = moment(req.body.startDateTime);
                            Slot.find({
                                'id': req.body.id,
                            }, function(err, slots) {
                                if (err) {
                                    res.send({
                                        success:false,
                                        message:err.toJSON
                                    })
                                }
                                else {
                                    if (!slots) {
                                        res.send({
                                            message:"slot not found"
                                        })
                                    }
                                    else {
                                        slots.forEach(function(slot) {
                                            if (slot.startDateTime == startDateTime) {
                                                slot.title = "booked";
                                                slot.studentName = req.body.studentName;
                                                slot.studentEmail = req.body.studentEmail;
                                                slot.save();
                                                
                                            }
                                        })
                                        res.send({
                                                    success: true,
                                                    message: "slot booked"
                                                })
                                    }
                                }
                            })
                        }
                    }
                });
            }
        });
    });



    router.get('/calendarEvent', function(req, res) {
        User.findOne({
            'local.username': req.query.username
        }, function(err, user) {
            if (err) {
                res.send(err)
            }
            if (!user) {
                res.send({
                    message: "No user found with this name"
                })
            }
            else {
                var oauth2ClientDummy = new auth.OAuth2('639369589925-p2dqi6o7ejhblic98v86a599n7nanj3f.apps.googleusercontent.com',
                    'OZy_PP_KDyH8YDtZwVhcsnFn', 'https://test-zmarkz.c9users.io/calendar/calenderAuthCallback');
                var token = {
                    "access_token": user.google.accessToken,
                    "refresh_token": user.google.refreshToken
                }

                oauth2ClientDummy.credentials = token;
                //get event
                calendar.events.list({
                    auth: oauth2ClientDummy,
                    calendarId: 'primary',
                    timeMin: (new Date()).toISOString(),
                    maxResults: 10,
                    singleEvents: true,
                    orderBy: 'startTime'
                }, function(err, response) {
                    if (err) {
                        console.log('The API returned an error: ' + err);
                        res.send({
                            message: err.toJSON
                        })
                        return;
                    }
                    var events = response.items;
                    res.send({
                        data: events
                    })
                });
            }
        });
    });

    router.route('/*', function(req, res) {
        res.redirect('../auth');
    })

}
