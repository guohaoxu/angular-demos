var User = require('../models/user.js'),
    path = require('path')

module.exports = function (app) {

    app.get('/api/validate', function (req, res) {
        var _userId = req.session._userId
        if (_userId) {
            User.findUserById(_userId, function (err, user) {
                if (err) {
                    res.json({
                        code: 0,
                        msg: err
                    })
                } else {
                    res.json({
                        code: 1,
                        msg: user
                    })
                }
            })
        } else {
            res.json({
                code: 0,
                msg: err
            })
        }
    })

    app.post('/api/login', function (req, res) {
        var email = req.body.email
        if (email) {
            User.findUserByEmail(email, function (err, user) {
                if (err) {
                    res.json(500, {
                        msg: err
                    })
                } else {
                    if (user) {
                        req.session._userId = user._id
                        User.online(user._id, function (err, user) {
                            if (err) {
                                res.json(500, {
                                    msg: err
                                })
                            } else {
                                res.json(user)
                            }
                        })
                    } else {
                        var newUser = new User({
                            email: email,
                            name: email.split('@')[0],
                            online: true
                        })
                        newUser.save(function (err, user) {
                            req.session._userId = user._id
                            res.json(user)
                        })
                    }

                }
            })
        } else {
            res.json(403)
        }
    })

    app.get('/api/logout', function (req, res) {
        _userId = req.session._userId
        User.offline(_userId, function (err, user) {
            if (err) {
                res.json(500, {
                    msg: err
                })
            } else {
                req.session._userId = null
                res.json(401)
            }
        })

    })

}

