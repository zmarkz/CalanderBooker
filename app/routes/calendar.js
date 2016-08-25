var Slot = require("../models/slot");
var moment = require("moment");
var gcal = require("google-calendar");
var User = require("../models/user");

var google = require('googleapis');
var calendar = google.calendar('v3');
var googleAuth = require('google-auth-library');
var auth = new googleAuth();
module.exports = function(router) {

    //make changes for synchronous saving

    router.post('/createTeacherSlot', function(req, res) {

        var startDateTime = moment(req.body.startDateTime);
        var endDateTime = moment(req.body.endDateTime);
        // console.log("startDateTime - " + startDateTime + " endDateTime - " + endDateTime);
        var diff = (endDateTime - startDateTime) / 3600000;
        var duplicateSlotFound = false;
        var errorInFetchingSlots = false;
        var allSlotsaved = false;
        var slotList = new Array();
        var startDateTimeArray = new Array();
        var allSlotsAdded = false;
        for (var i = 0; i < (diff); i++) {

            console.log("start date time - " + startDateTime);
            startDateTimeArray.push(startDateTime + 0);
            // process.nextTick(function(){
            Slot.findOne({
                startDateTime: startDateTime + 0,
                endDateTime: startDateTime + 3600000
            }, function(err, slots) {

                console.log("slots found - " + JSON.stringify(slots));
                if (err) {

                    console.log(err);
                    res.send(err);
                }
                if (slots) {
                    duplicateSlotFound = true;
                    res.send({
                        success: false,
                        message: "You have already booked slot periods."
                    })
                }
                else {
                    console.log("pushing in slotlist");
                    slotList.push(slot);
                    if (allSlotsAdded && !duplicateSlotFound && !allSlotsaved) {
                        var slotFromSlotList;
                        console.log("slotList - " + JSON.stringify(startDateTimeArray));
                        console.log("startDateTimeArray.length - "+startDateTimeArray.length);
                        for (var i = 0; i < startDateTimeArray.length; i++) {
                            var slot = new Slot({
                                id: req.user.google.id,
                                startDateTime: startDateTimeArray[i],
                                endDateTime: startDateTimeArray[i] + 3600000,
                                studentName: '',
                                studentEmail: '',
                                title: 'open'
                            });

                            // slotFromSlotList = slotList[i];
                            slot.save(function(err, slot) {
                                if (err) {
                                    console.log(err);
                                    res.send(err);

                                }
                                else {
                                    console.log("slot saved - " + JSON.stringify(slot));

                                }
                            });
                            if(i== startDateTimeArray.length -1){
                                allSlotsaved = true;
                            }
                        }
                    }
                }
            });
            // });

            startDateTime += 3600000;
            if (i == (diff - 1)) {
                allSlotsAdded = true;
            }

        }
        if (!duplicateSlotFound || !errorInFetchingSlots) {

            res.send({
                success: true,
                message: "slots created"
            })
        }

    });

    router.get('/link', function(req, res) {
        var link = "http://test-zmarkz.c9users.io/pub/homepage#public/" + req.user.google.id;
        res.send({
            success: true,
            data: link
        })
    });

    router.get('/teacherCalendar', function(req, res) {
        console.log(JSON.stringify(req.user));
        User.findOne({
            'google.id': req.user.google.id
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
                    id: req.user.google.id
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

    router.get('/*', function(req, res) {
        res.redirect('../profile');
    })
}
