var mongoose = require('mongoose'),
    settings = require('../settings.js'),
    async = require("async"),
    ObjectId = mongoose.Schema.ObjectId

//mongoose.connect(settings.dbUrl)

var messSchema = new mongoose.Schema({
    content: String,
    creator: {
        _id: ObjectId,
        email: String,
        name: String,
        avatarUrl: String
    },
    createAt: {
        type: Date,
        default: Date.now
    }
})

//Instance methods
messSchema.methods.speak = function () {
    console.log(this.name)
}

//Statics methods
messSchema.statics.read = function (cb) {
    this.find({}, null, {
        sort: {
            'createAt': -1
        },
        limit: 20
    }, cb)
}

var Message = mongoose.model('Message', messSchema)

module.exports = Message