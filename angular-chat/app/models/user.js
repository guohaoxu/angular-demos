var mongoose = require('mongoose'),
    settings = require('../settings.js'),
    async = require("async"),
    ObjectId = mongoose.Schema.ObjectId

mongoose.connect(settings.dbUrl)

var userSchema = new mongoose.Schema({
    email: String,
    name: String,
    avatarUrl: {
        type: String,
        default: "/imgs/tx.jpg"
    },
    _roomId: ObjectId,
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
    }, cb)
}
userSchema.statics.offline = function (_userId, cb) {
    this.findOneAndUpdate({
        _id: _userId
    }, {
        online: false
    }, cb)
}
userSchema.statics.getOnlineUsers = function (cb) {
    this.find({
        online: true
    }, cb)
}
userSchema.statics.joinRoom = function (join, cb) {
    this.findOneAndUpdate({
        _id: join.user._id
    }, {
        online: true,
        _roomId: join.room._id
    }, cb)
}
userSchema.statics.leaveRoom = function (data, cb) {
    this.findOneAndUpdate({
        _id: data.serId
    }, {
        _roomId: null
    }, cb)
}

var User = mongoose.model('User', userSchema)

module.exports = User