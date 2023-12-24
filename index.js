const express = require('express')
const app = express()
const methodOverride = require('method-override')
const session = require('express-session')
const sessionConfig = {
    name:'sessionId',
    secret:'MessiGoat',
    resave:false,
    saveUninitialized:false,
    cookie:{
        httpOnly:true
    }
}
const passport = require('passport')
const localStrategy = require('passport-local')
const {Creater} = require('./models/football')
const router = require('./routs/router')
const flash = require('connect-flash')
const mongoSanitize = require('express-mongo-sanitize')
const { Cookie } = require('express-session')
const { PlayerSchema } = require('./JoiSchemas')
const helmet = require('helmet')

app.use(express.urlencoded({extended:true}))
app.set('view engine','ejs')
app.use(methodOverride('_method'))
app.use(express.static('public'))
app.use(session(sessionConfig))
app.use(passport.initialize())
app.use(passport.session())
app.use(flash())
app.use('/',router)
app.use(mongoSanitize())
app.use(helmet({contenSecurityPolicy:false}))


passport.use(new localStrategy(Creater.authenticate()))
passport.serializeUser(Creater.serializeUser())
passport.deserializeUser(Creater.deserializeUser())



app.listen(3000,()=>{
    console.log('Listening on port 3000')
})