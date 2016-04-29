var mongoose = require('mongoose'),
    settings = require('../settings.js'),
    async = require("async")

mongoose.connect(settings.dbUrl)

var userSchema = new mongoose.Schema({
    email: String,
    name: String,
    avatarUrl: String
})

//Instance methods
userSchema.methods.speak = function () {
    console.log(this.name)
}

//Statics methods
userSchema.statics.findUserById = function (_userId, cb) {
    this.findOne({
        _id: _userId
    }, cb)
}
userSchema.statics.findUserByEmail = function (email, cb) {
    this.findOne({
        email: email
    }, cb)
}

var User = mongoose.model('User', userSchema)

module.exports = User