var User = require('../models/user.js'),
    path = require('path')

module.exports = function (app) {

    app.get('/', function (req, res) {
        res.sendFile(path.join(__dirname + '../../../public/chat.html'))
    })

    app.get('/api/validate', function (req, res) {
        var _userId = req.session._userId
        if (_userId) {
            User.findUserById(_userId, function (err, user) {
                if (err) {
                    res.json(401, {
                        msg: err
                    })
                } else {
                    res.join(user)
                }
            })
        } else {
            res.json(401, null)
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
                    req.session._userId = user._id
                    res.json(user)
                }
            })
        } else {
            res.json(403)
        }
    })

    app.get('/api/logout', function (req, res) {
        req.session._userId = null
        res.json(401)
    })

}

