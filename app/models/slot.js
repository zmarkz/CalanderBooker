var mongoose = require('mongoose');


var Slot = mongoose.Schema({
    id: {
        type : String,
        required : true
    },
    startDateTime : Number,
    endDateTime:Number,
    studentName :String,
    studentEmail : String,
    title : String
   
});

var Slot = mongoose.model('Slot',Slot);
module.exports = Slot;