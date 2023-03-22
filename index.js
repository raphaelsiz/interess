const express = require('express')
const cors = require('cors')
const mongoose = require('mongoose')
const cookieParser = require('cookie-parser');
const session = require('express-session');
require('dotenv').config()
const app = express();
const {cookieOptions,cookieMap, cookieLogin, cookieCheck} = require('./cookies.js');
const User = require('./models/users');

var whitelist = ['http://localhost:3000',process.env.DEV_IP,process.env.CLIENT_IP];
var corsOptions = {
    origin: whitelist, credentials: true, methods: ['GET','POST']
  }
mongoose.connect(process.env.MDB_URI,
        { useNewUrlParser: true, useUnifiedTopology: true }).then(()=>{
            app.listen(3002,()=>{console.log("listening at 3002")})
        }).catch(err=>{
            console.log(err)
        })

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({extended: true}))
app.use(cookieParser(process.env.SESS_SEC));
app.use(express.static('public'))
app.use(session({
    secret: process.env.SESS_SEC,
    resave: false,
    cookie: { secure: false },
    saveUninitialized: true,
    name: "the void"
}))
app.set('view engine','ejs')

const routers = {
    users: require('./routes/users.js'),
    posts: require('./routes/posts.js'),
    topics: require('./routes/topics.js')
}
for (let route in routers) app.use('/' + route, routers[route])
app.post('/test',(req,res)=>{
    res.json(req.body)
})
app.get('/test',(req,res)=>{
    res.send('working!')
})
/*app.get('/swipe',(req,res)=>{
    res.render('partials/swipe')
})*/

app.get('/',(req,res)=>{
    if (!req.cookies.user || !cookieCheck(req.cookies.user)) return res.render('login');
    User.findById(req.cookies.user.split(';')[0]).then(user=>{
        res.cookie('location','home').render('home',{user,prefs: {theme: 'light'}})
        //todo: make prefs an actual thing rather than hardcoded lol (perhaps just in the user profile, although there are for sure things that will have to be kept out of this object that will be in the database)
    })
})