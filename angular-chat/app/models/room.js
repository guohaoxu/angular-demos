var mongoose = require('mongoose'),
    settings = require('../settings.js')

//mongoose.connect(settings.dbUrl)

var roomSchema = new mongoose.Schema({
    name: String,
    createAt: {
        type: Date,
        dafault: Date.now
    }
})

//Instance methods
//roomSchema.methods.speak = function () {
//    console.log(this.name)
//}

//Statics methods
roomSchema.statics.read = function (cb) {
    this.find({}, cb)
}

var Room = mongoose.model('Room', roomSchema)

module.exports = Room