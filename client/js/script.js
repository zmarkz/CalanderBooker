$(function() {

    var Slot = Backbone.Model.extend({
        defaults: {
            title: null,
            start: null,
            end: null,
            teacherName: null
        }
    });
    var SlotCollection = Backbone.Collection.extend({
        model: Slot,
    });
    var selectedStartTime = '';
    var selectedEndTime = '';
    var bookedStatus = '';
    var selectedStudentname = '';
    var selectedStudentEmail = '';
    $('#slotModel').modal({
        show: false
    });
    $('#slotModel').on('hidden.bs.modal', function() {
        $('#slot').empty();
    });

    $('#errorModel').modal({
        show: false
    });
    $('#errorModel').on('hidden.bs.modal', function() {
        $('#error').empty();
    });

    //calendar view
    App = Backbone.View.extend({
        initialize: function() {
            this.model = new Slot();
        },
        render: function() {
            $('#calendar').fullCalendar({
                // theme: true,
                header: {
                    left: 'prev,next today',
                    center: 'title',
                    right: 'month,basicWeek,basicDay',
                    ignoreTimezone: false
                },
                selectable: true,
                selectHelper: true,
                editable: true,
                ignoreTimezone: false,
                eventClick: function(model) {

                    selectedStartTime = model.start;
                    selectedEndTime = model.end;
                    bookedStatus = model.title;
                    $(this).css('background-color', '#6AD400');
                    if (bookedStatus == "booked") {
                        selectedStudentname = model.studentName;
                        selectedStudentEmail = model.studentEmail;
                        var temp = _.template('<p>Student name : <%= name %> </br>Student email :<%= email %>  </p>');
                        $('#slot').append(temp({
                            name: selectedStudentname,
                            email: selectedStudentEmail
                        }));
                        $('#slotModel').modal('show');
                    }
                }
            });
            $('#calendar').fullCalendar("addEventSource", this.collection.toJSON());
        }
    });

    //Backbone router
    var AppRouter = Backbone.Router.extend({
        routes: {
            "public/:id": "public",
            "*defaults": "defaultRoute"
        }
    });

    var app_router = new AppRouter;

    //__________________________ public page ______________________________

    app_router.on('route:public', function(id) {

        renderCal(id);

        $('#main').append($('#slotAdded').html());
        $('#bookSlot').click(function() {
            if (bookedStatus == 'booked') {

                errorDialog("Please pick a proper slot.");
            }
            else {
                if (selectedStartTime == '' || selectedEndTime == '') {

                    errorDialog("please select a slot.");
                }
                else {
                    var studentName = $('#studentName').val();
                    var studentEmail = $('#studentEmail').val();
                    if (!isEmail(studentEmail)) {

                        errorDialog("Please enter valid email address");
                    }
                    else {
                        if (studentName == '' || studentEmail == '') {

                            errorDialog("Please fill student data.");
                        }
                        else {
                            var startDateTime1 = moment(selectedStartTime).format();
                            var endDateTime1 = moment(selectedEndTime).format();
                            var studentTime = Backbone.Model.extend({
                                url: 'https://test-zmarkz.c9users.io/pub/createEvent'
                            });
                            var studentBlockTime = new studentTime();
                            studentBlockTime.set({
                                id: id,
                                startDateTime: startDateTime1,
                                endDateTime: endDateTime1,
                                studentName: studentName,
                                studentEmail: studentEmail
                            });
                            $('#bookSlot').prop('disabled', true);
                            studentBlockTime.save(null, {
                                success: function(model, response) {
                                    if (response.success) {
                                        bookedStatus = 'booked';
                                        renderCal(id);
                                        $('#bookSlot').prop('disabled', false);

                                        // location.reload();
                                    }
                                    else {
                                        errorDialog("Teacher has not authorized his/her calendar for booking yet.");
                                    }

                                },
                                error: function(model, response) {

                                },
                                type: 'POST'
                            });
                        }
                    }
                }
            }
        });


    });

    function renderCal(id) {
        var id = id;
        var TeacherSlots = Backbone.Model.extend({
            url: 'https://test-zmarkz.c9users.io/pub/teacherCalendar',
            defaults: {
                id: ''
            }
        });

        var teacherSlots = new TeacherSlots();
        var calData = new Array();
        teacherSlots.fetch({
            data: {
                id: id
            },
            error: function(model, response) {
                errorDialog(JSON.stringify(response.message))
            },
            success: function(data, response) {
                if (!response.success) {
                    errorDialog(JSON.stringify(response.message))
                }
                else {
                    //create slots for calendar view
                    var slots = response.data.slots;
                    var calendarData;
                    for (var i = 0; i < slots.length; i++) {
                        var startTime = moment(slots[i].startDateTime).format();
                        var endTime = moment(slots[i].endDateTime).format();
                        calData.push({
                            start: startTime,
                            end: endTime,
                            title: slots[i].title,
                            studentName: slots[i].studentName,
                            studentEmail: slots[i].studentEmail
                        });
                    }
                    $('#calendar').fullCalendar("removeEvents");
                    var myCollection = new SlotCollection(calData);
                    new App({
                        collection: myCollection
                    }).render();
                }
            }
        });
    }

    //________________________________end of public page___________________________

    //____________________________Homepage__________________________________________

    var bookedSlots;
    app_router.on('route:defaultRoute', function() {


        getCalData();


        var SlotView = Backbone.View.extend({
            initialize: function() {
                this.render();
            },

            render: function() {
                $("#main").append($("#slotTemplate").html());
            },

            remove: function() {
                $("#slotTemplate").remove();
            }
        });

        var slotView = new SlotView();
        $('#datepair .time').timepicker({
            'showDuration': true,
            'timeFormat': 'H:i:s',
            'step': 60
        });

        $('#datepair .date').datepicker({
            'format': 'yyyy-mm-dd',
            'autoclose': true
        });

        $('#datepair').datepair();

        $('#generateLink').click(function() {
            if ($('#link a').length < 1) {
                var temp = _.template('<p><a href="<%= link %>" target="_blank"><%= link %></a> </p>');
                var Link = Backbone.Model.extend({
                    url: 'https://test-zmarkz.c9users.io/calendar/link'
                })
                var link = new Link();
                link.fetch({
                    success: function(err, response) {
                        if (response) {
                            $('#link').append(temp({
                                link: response.data
                            }));
                        }
                    }
                })
            }


        });
        $('#bookSlot').click(function() {

            if ($('#date').val() == '' || $('#startTime').val() == '' || $('#endTime').val() == '') {
                errorDialog("Please give proper slot.");
            }
            else {
                var newStartDateTime = $('#date').val() + "T" + $('#startTime').val();
                var newEndDatetime = $('#date').val() + "T" + $('#endTime').val();
                var startDateTime = moment(newStartDateTime);
                var endDateTime = moment(newEndDatetime);
                //start
                var today = moment();
                var week = moment().add(7, 'days');
                if (startDateTime >= endDateTime) {

                    errorDialog("Please put valid start time and end time.");
                }
                else {
                    if ((startDateTime < today || startDateTime > week) || (endDateTime < today || endDateTime > week)) {

                        errorDialog("Please open slots within one week.");
                    }
                    else {



                        var foundDuplicateSlots = 0;

                        console.log("startDateTime - " + startDateTime + "endDateTime - " + endDateTime);
                        for (var i = 0; i < bookedSlots.length; i++) {
                            console.log("bookedSlots[" + i + "].startDateTime - " + bookedSlots[i].startDateTime + " bookedSlots[" + i + "].endDateTime - " + bookedSlots[i].endDateTime);
                            if ((bookedSlots[i].endDateTime > startDateTime && bookedSlots[i].endDateTime < endDateTime) || (bookedSlots[i].startDateTime > startDateTime && bookedSlots[i].startDateTime < endDateTime) || ((bookedSlots[i].startDateTime == startDateTime) )) {

                                errorDialog("You have already booked slots in specified time period.");
                                foundDuplicateSlots = 1;
                                break;
                            }
                        }
                        if (foundDuplicateSlots == 0) {
                            var DateModel = Backbone.Model.extend({
                                defaults: {},
                                url: 'https://test-zmarkz.c9users.io/calendar/createTeacherSlot'
                            })

                            var dateModel = new DateModel();
                            dateModel.set({
                                startDateTime: moment(startDateTime).format(),
                                endDateTime: moment(endDateTime).format()
                            });
                            $('#bookSlot').prop('disabled', true);
                            dateModel.save(null, {
                                success: function(model, response) {
                                    var temp = _.template("<p>Slot opened on <%= date %>");
                                    getCalData();

                                    $('#bookSlot').prop('disabled', false);
                                },
                                error: function(model, response) {
                                    errorDialog(response.message)
                                },
                                type: 'POST'

                            });
                        }
                    }
                }
            }

        });



    });

    function getCalData() {
        var calData = new Array();
        var TeacherSlots = Backbone.Model.extend({
            url: 'https://test-zmarkz.c9users.io/calendar/teacherCalendar',
        });

        var teacherSlots = new TeacherSlots();
        teacherSlots.fetch({
            success: function(err, response) {
                if (response) {
                    bookedSlots = response.data.slots;
                    var slots = response.data.slots;
                    var calendarData;
                    for (var i = 0; i < slots.length; i++) {
                        var startTime = moment(slots[i].startDateTime).format();
                        var endTime = moment(slots[i].endDateTime).format();
                        calData.push({
                            start: startTime,
                            end: endTime,
                            title: slots[i].title,
                            studentName: slots[i].studentName,
                            studentEmail: slots[i].studentEmail
                        });
                    }



                    $('#calendar').fullCalendar("removeEvents");
                    var myCollection = new SlotCollection(calData);
                    new App({
                        collection: myCollection
                    }).render();
                }
            }
        });

    }

    //____________________________end of homepage___________________________________

    Backbone.history.start();

    function isEmail(email) {
        var regex = /^([a-zA-Z0-9_.+-])+\@(([a-zA-Z0-9-])+\.)+([a-zA-Z0-9]{2,4})+$/;
        return regex.test(email);
    }

    function errorDialog(err) {
        var temp = _.template('<p><%= err %> </p>');
        $('#error').append(temp({
            err: err
        }));
        $('#errorModel').modal('show');
    }

});