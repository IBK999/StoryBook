const express = require('express')
const path = require('path')
const mongoose = require('mongoose')
const dotenv = require('dotenv')
const morgan = require('morgan')
const exphbs = require('express-handlebars')
const methodOveride = require('method-override')
const passport = require('passport')
const session = require('express-session')
const MongoStore = require('connect-mongo')
const connectDB = require('./config/db')

// Load config
dotenv.config({ path: "./config/config.env" })

// Passport Config
require('./config/passport')(passport)

connectDB()

const app = express()

// Body Parser
app.use(express.urlencoded({ extended: false }))
app.use(express.json())

// Method Overide
app.use(methodOveride(function(req, res) {
    if (req.body && typeof req.body === 'object' && '_method' in req.body) {
        // look in urlencoded POST bodies and delete it
        let method = req.body._method
        delete req.body._method
        return method
    }
}))

// Logging
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'))
}

// HandleBars Helpers
const { formatDate, truncate, scriptTags, editIcon, select } = require('./helpers/hbs')

// HandleBars
app.engine('.hbs', exphbs.engine({
    helpers: {
        formatDate,
        truncate,
        scriptTags,
        editIcon,
        select,
    },
    defaultLayout: 'main',
    extname: '.hbs'
}))
app.set('view engine', '.hbs')

// Session Middleware
app.use(
    session({
        secret: "keyboard cat",
        resave: false,
        saveUninitialized: false,
        store: MongoStore.create({ mongoUrl: process.env.MONGO_URI })
    }))

// Passport Middleware
app.use(passport.initialize())
app.use(passport.session())

// Set global variable
app.use(function(req, res, next) {
    res.locals.user = req.user || null
    next()
})

// Static
app.use(express.static(path.join(__dirname, 'public')))


// Routes
app.use('/', require('./routes/index'))
app.use('/auth', require('./routes/auth'))
app.use('/stories', require('./routes/stories'))


const port = process.env.PORT || 3000


app.listen(port, () => {
    console.log(`Server running in ${process.env.NODE_ENV} on port: ${port}`)
})