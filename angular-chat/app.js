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
        maxAge: 1000 * 60 * 10
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
        name: 'SYSTEM'
    }
    socket.on("getRoom", function (user) {
        socket.user = user
        User.online(user._id, function (err, user) {
            if (err) {
                socket.emit('error', {
                    msg: err
                })
            } else {
                socket.broadcast.emit('online', user)
                socket.broadcast.emit('messageAdded', {
                    content: user.name + '进入了聊天室',
                    creator: SYSTEM,
                    createAt: new Date()
                })
            }
            User.getOnlineUsers(function (err, users) {
                if (err) {
                    socket.emit('error', {
                        msg: err
                    })
                } else {
                    Message.read(function (err, messages) {
                        if (err) {
                            socket.emit('error', {
                                msg: err
                            })
                        } else {
                            socket.emit('roomData', {
                                users: users,
                                messages: messages
                            })
                        }
                    })

                }
            })
        })
    })
    socket.on('createMessage', function (message) {
        var newMessage = new Message({
            content: message.content,
            creator: message.creator
        })
        newMessage.save(function (err, message) {
            if (err) {
                socket.emit('error', {
                    msg: err
                })
            } else {
                io.emit('messageAdded', message)
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
    socket.on('getAllRooms', function () {
        Room.read(function (err, rooms) {
            if (err) {
                socket.emit('error', {
                    msg: err
                })
            } else {
                socket.emit('roomsData', rooms)
            }
        })
    })

    socket.on('error', function (msg) {
        console.log('cao...')
    })

})







