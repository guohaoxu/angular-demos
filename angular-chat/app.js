var express = require('express'),

    path = require('path'),
    util = require('util'),

    bodyParser = require('body-parser'),
    cookieParser = require('cookie-parser'),
    session = require('express-session'),

    methodOverride = require('method-override'),
    compression = require('compression'),

    errorHandler = require('errorHandler'),
    logger = require('morgan'),

    favicon = require('serve-favicon'),
    settings = require('./app/settings'),
    routes = require('./app/routes/index.js'),

    app = express(),
    http = require('http').Server(app),
    io = require('socket.io')(http),

    MongoStore = require('connect-mongo')(session),
    sessionStore = new MongoStore({
        url: settings.dbUrl
    }),

    User = require('./app/models/user.js'),
    Message = require('./app/models/message.js'),
    Room = require('./app/models/room.js')

app.set('port', process.env.PORT || 3000)
//app.set('views', path.join(__dirname, 'app/views'))
//app.set('view engine', 'ejs')

app.use(methodOverride())
app.use(bodyParser.urlencoded({
    extended: false
}))
app.use(bodyParser.json())
app.use(cookieParser())
app.use(session({
    secret: settings.cookieSecret,
    cookie: {
        maxAge: 1000 * 60 * 30
    },
    resave: true,
    saveUninitialized: false,
    store: sessionStore
}))
app.use(compression())
//app.use(favicon(path.join(__dirname, 'public/images/favicon.ico')))
app.use(express.static(path.join(__dirname, 'public')))

if ('development' === app.get('env')) {
    app.use(logger('dev'))
    app.use(errorHandler())
}

//app.get('/', function (req, res) {
//    res.sendFile(path.join(__dirname + '/public/chat.html'))
//})
routes(app)

app.get("*", function (req, res) {
    res.sendFile(path.join(__dirname + '/public/chat.html'))
})

http.listen(app.get('port'), function () {
    console.log('Server is running on ' + app.set('port'))
})

var messages = []
io.on('connection', function (socket) {
    var SYSTEM = {
        name: 'SYSTEM',
        avatarUrl: '/imgs/tx.jpg'
    }
//    socket.on("getRoom", function (_roomId) {
//        socket.user = user
//        User.online(user._id, function (err, user) {
//            if (err) {
//                socket.emit('error', {
//                    msg: err
//                })
//            } else {
//                socket.broadcast.emit('online', user)
//                socket.broadcast.emit('messageAdded', {
//                    content: user.name + '进入了聊天室',
//                    creator: SYSTEM,
//                    createAt: new Date()
//                })
//            }
//            User.getOnlineUsers(function (err, users) {
//                if (err) {
//                    socket.emit('error', {
//                        msg: err
//                    })
//                } else {
//                    Message.read(function (err, messages) {
//                        if (err) {
//                            socket.emit('error', {
//                                msg: err
//                            })
//                        } else {
//                            socket.emit('roomData', {
//                                users: users,
//                                messages: messages
//                            })
//                        }
//                    })
//                }
//            })
//        })
//    })


    socket.on('getRooms', function () {
        var _usersLen = []
        Room.read(function (err, rooms) {
            if (err) {
                socket.emit('error', {
                    msg: err
                })
            } else {
                if (rooms.length === 0) {
                    return socket.emit('roomsData', {
                        rooms: rooms,
                        usersLen: _usersLen
                    })
                }
                var len = 0
                rooms.forEach(function (room) {
                    User.find({
                        _roomId: room._id
                    }, function (err, users) {
                        _usersLen.push(users.length)
                        len++
                        if (len === rooms.length) {
                            socket.emit('roomsData', {
                                rooms: rooms,
                                usersLen: _usersLen
                            })
                        }
                    })
                })
            }
        })
    })
    socket.on('createRoom', function (room) {
        var newRoom = new Room(room)
        newRoom.save(function (err, room) {
            if (err) {
                socket.emit('error', {
                    msg: err
                })
            } else {
                io.emit('roomAdded', room)
            }
        })
    })
    socket.on('joinRoom', function (join) {
        User.joinRoom(join, function (err, user) {
            if (err) {
                socket.emit('error', {
                    msg: err
                })
            } else {
                socket.join(join.room._id)
                console.log(util.inspect(join))
                socket.broadcast.in(join.room._id).emit('joinRoom', join)
                socket.broadcast.in(join.room._id).emit('messageAdded', {
                    content: join.user.name + '进入了聊天室',
                    creator: SYSTEM,
                    createAt: new Date()
                })
                socket.emit('joinRoom.' + join.user._id, join)
                socket.emit('joinRoom', join)
            }
        })
    })
    socket.on('getCurRoom', function (data) {
        var _users = [],
            _messages = []
        Room.findById(data.roomId, function (err, room) {
            if (err) {
                socket.emit('error', {
                    msg: err
                })
            } else {
                User.find({
                    _roomId: room._id
                }, function (err, users) {
                    if (err) return
                    _users = users
                    Message.find({
                        _roomId: room._id
                    }, function (err, messages) {
                        if (err) return
                        _messages = messages
                        socket.emit('curRoomData', {
                            room: room,
                            users: _users,
                            messages: _messages
                        })
                    })
                })
            }
        })
    })

    socket.on('createMessage', function (data) {
        var newMessage = new Message({
            content: data.content,
            creator: data.creator,
            _roomId: data._roomId
        })
        newMessage.save(function (err, message) {
            if (err) {
                socket.emit('error', {
                    msg: err
                })
            } else {
                socket.in(message._roomId).broadcast.emit('messageAdded', message)
                socket.emit('messageAdded', message)
            }
        })
    })


    socket.on('disconnect', function () {
        if (!socket.user) {
            return
        }
        User.offline(socket.user._id, function (err, user) {
            if (err) {
                socket.emit('error', {
                    msg: err
                })
            } else {
                socket.broadcast.emit('offline', user)
                socket.broadcast.emit('messageAdded', {
                    content: user.name + '离开了聊天室',
                    creator: SYSTEM,
                    createAt: new Date()
                })
            }
        })
    })
    socket.on('error', function (msg) {
        console.log('cao...')
    })

})







