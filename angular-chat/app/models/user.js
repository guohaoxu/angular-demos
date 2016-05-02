var mongoose = require('mongoose'),
    settings = require('../settings.js'),
    async = require("async")

mongoose.connect(settings.dbUrl)

var userSchema = new mongoose.Schema({
    email: String,
    name: String,
    avatarUrl: {
        type: String,
        default: "/imgs/tx.jpg"
    },
    online: Boolean
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
userSchema.statics.online = function (_userId, cb) {
    this.findOneAndUpdate({
        _id: _userId
    }, {
        online: true
    }, null, cb)
}
userSchema.statics.offline = function (_userId, cb) {
    this.findOneAndUpdate({
        _id: _userId
    }, {
        online: false
    }, null, cb)
}

var User = mongoose.model('User', userSchema)

module.exports = User