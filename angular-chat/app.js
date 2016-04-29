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

    Message = require('./app/models/user.js')


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
        maxAge: 1000 * 60 * 60 * 24 * 30
    },
    resave: false,
    saveUninitialized: true
}))
app.use(compression())
//app.use(favicon(path.join(__dirname, 'public/images/favicon.ico')))
app.use(express.static(path.join(__dirname, 'public')))

if ('development' === app.get('env')) {
    app.use(logger('dev'))
    app.use(errorHandler())
}

routes(app)

app.get("*", function (req, res) {
    res.sendFile(path.join(__dirname + '/public/chat.html'))
})

http.listen(app.get('port'), function () {
    console.log('Server is running on ' + app.set('port'))
})

var messages = []
io.on('connection', function (socket) {
    socket.on('getAllMessages', function () {
        socket.emit('allMessages', messages)
    })
    socket.on('createMessage', function (message) {
        messages.push(message)
        socket.emit('messageAdded', message)
    })
})
