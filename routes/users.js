const express = require('express');
const fs = require('fs');
const fileUpload = require('express-fileupload');
const uuid = require('uuid').v4;
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const router = express();
const distance = require('../distance');
const User = require('../models/users');
const {cookieOptions,cookieMap, cookieLogin, cookieCheck} = require('../cookies.js');

var transporter, email;
nodemailer.createTestAccount().then(acct=>{
    console.log(acct)
    email = acct.user;
    transporter = nodemailer.createTransport({
        host: "smtp.ethereal.email",
        port: 587,
        secure: false, // true for 465, false for other ports
        auth: {
          user: acct.user, // generated ethereal user
          pass: acct.pass, // generated ethereal password
        }
    })
    console.log("transporter ready!")
})
router.use(fileUpload())
router.route('/signup')
    .get((req,res)=>{
        res.render('signup')
    })
    .post(async (req,res)=>{
    if (!req.body.email || !req.body.password) return res.status(403).send("Need email and password!")
    let password = await bcrypt.hash(req.body.password,10)
    checkEmail(req.body.email).then(onList=>{
        if (!onList) return res.status(403).send("Not on the list!")
        if (req.body.username) {
            User.findOne({username: req.body.username}).then(u=>{
                if (u) return res.status(403).send("User already exists!")
                else {
                    let user = new User({username: req.body.username, password,
                        email: req.body.email, firstName: req.body.firstName || "",
                        lastName: req.body.lastName || "", verificationCode: uuid()})
                    user.save();
                    transporter.sendMail({
                        from: email,
                        to: user.email,
                        subject: "Verify your email for Interess",
                        html: `
                        <p>Click <a href="http://localhost:3002/users/verifyEmail?user=${user.username}&key=${user.verificationCode}">here</a> to verify your email</p>
                        `
                    }).then(()=>{
                        console.log("email sent from " + email)
                    })
                    return res.status(200).cookie("user",cookieLogin(user._id)).redirect('/') //todo: redirect to page to verify email
                }
            })
        } else return res.status(403).send("Need username!")
    })
})
router.post('/resendVerificationEmail',(req,res)=>{
    if (req.body.email) User.find({email: req.body.email}).then(user =>{
        console.log(req.body.email,user)
        transporter.sendMail({
            from: email,
            to: user.email || req.body.email,
            subject: "Verify your email for Interess",
            html: `
            <p>Click <a href="http://localhost:3002/users/verifyEmail?user=${user.username}&key=${user.verificationCode}">here</a> to verify your email</p>
            `
        }).then((mail)=>{
            console.log(mail)
        })
        return res.status(200).redirect('/')
    })
})
router.route('/verifyEmail')
    .get((req,res)=>{
        if (req.query.user && req.query.key) {
            User.find({username: req.query.user, verificationCode: req.query.key}).then(user=>{
                if (!user) return res.status(403)
                user.verifiedEmail = true;
                res.status(200).send("Success!")
            })
        }
        res.render('verifyEmail')
    })
    .post((req,res)=>{
        if (!req.body.user || !req.body.key) return res.status(403).errored("Need user and key")
        User.find({username: req.body.user, verificationCode: req.body.key}).then(user=>{
            if (!user) return res.status(403)
            user.verifiedEmail = true;
            res.status(200).render('message',{message: "Success!"}) //todo: change to ejs
        })
    })
router.route('/verifyAge')
    .get((req,res)=>{
        res.render('verifyAge')
    })
    .post((req,res)=>{
        if (!req.cookies.user || !cookieCheck(req.cookies.user)) return res.status(403)
        if (!req.files || req.files.length < 2) return res.status(403)
        res.render('message',{message: "Your files have been uploaded! It may take a couple days to verify you."})
    })


//curl -X POST --data "{\"username\": \"user\"}" -H "Content-Type: application/json" http://localhost:3002/users/signup
router.post('/login',(req,res)=>{
    if (req.body.username && req.body.password) {
        User.findOne({$or: [{username: req.body.username}, {email: req.body.username}]}).then(user=>{
            if (!user) return res.status(403).send("User does not exist!");
            bcrypt.compare(req.body.password,user.password).then(correct=>{
                if (!correct) {
                    if (req.body.password == user.password) encodePassword(user); //can delete safely
                    else return res.status(403).send("Wrong password!")
                }
                if (req.cookies.geoLocation) {
                    let geoLoc = JSON.parse(req.cookies.geoLocation);
                    console.log(geoLoc)
                    user.lastLocation = distance.encodeGeoLoc(geoLoc);
                    user.save()
                }
                res.status(200).cookie("user",cookieLogin(user._id)).redirect('/')
                return
            })
        })
    } else res.status(403).send("Need more info!")
    console.log(req.body)
})

router.route('/preferences')
    .get((req,res)=>{
        //todo: get actual user preferences
        res.render('partials/editPrefs',{url: "/users", css: "../sliders.css",prefs: {postViewDistanceMin: 0, postViewDistanceMax: 5000}})
    })

async function encodePassword(user) {
    let hash = await bcrypt.hash(user.password,10);
    user.password = hash;
    user.save();
}
async function encodeEmails(){
    let json = JSON.parse(fs.readFileSync('./acceptedEmails.json').toString())
    let emails = []
    for (let email of json) {
        let hash = await bcrypt.hash(email,10)
        emails.push(hash)
    }
    fs.writeFileSync('./acceptedEmails.json',JSON.stringify(emails))
}
async function addAcceptedEmails(...emails) {
    let json = JSON.parse(fs.readFileSync('./acceptedEmails.json').toString())
    for (let email of emails) {
        let hash = await bcrypt.hash(email,10)
        json.push(hash)
    }
    fs.writeFileSync('./acceptedEmails.json',JSON.stringify(json));
}
async function checkEmail(userEmail){
    let json = JSON.parse(fs.readFileSync('./acceptedEmails.json').toString())
    for (let email of json) {
        let matches = await bcrypt.compare(userEmail,email)
        if (matches) return true;
    }
    return false;
}

router.post('/logout',(req,res)=>{
    res.clearCookie("user").cookie("location","home").redirect('/')
})

router.route('/swipe')
    .get(async (req,res)=>{
        if (!req.cookies.user || !cookieCheck(req.cookies.user)) return res.status(403).send("Not logged in!");
        let user = await User.findById(req.cookies.user.split(';')[0]);
        let geoLocation = req.cookies.geoLocation || distance.decodeGeoLoc(user.lastLocation);
        if (!geoLocation) return res.status(403).send("Location disabled.")
        let potentialMatches = [];
        User.find({username: {$ne: user.username}, 'matches.user': {$ne: user._id}}).then(users=>{ //check to make sure this actually works lol
            for (let u of users) {
                if (!u.lastLocation || !u.lastLocation.latitude || !u.lastLocation.longitude) continue;
                let userDistance = distance.getDistance(geoLocation,u.lastLocation);
                if (userDistance <= user.matchPrefs.maxDistance) {
                    potentialMatches.push({u,userDistance});
                    console.log(potentialMatches)
                }
                else console.log(userDistance,user.matchPrefs)
            }
            if (potentialMatches.length < 1) return res.send("Failed to find potential matches");
        let match = potentialMatches[Math.floor(Math.random()*potentialMatches.length)];
        let matchDistance = match.distance < 1000 ? "Less than 1 km" : `About ${Math.round(match.userDistance/1000)} km`;
        let censoredMatch = {username: match.u.username, firstName: match.u.firstName, distance: matchDistance, id: match.u._id} // add pictures
        res.render('partials/swipe',{user: censoredMatch});
        })
        
    })
    .post(async (req,res)=>{
        if (!req.cookies.user || !cookieCheck(req.cookies.user)) return res.status(403).send("Not logged in!");
        if (!req.body || !req.body.user || !req.body.interest) return res.status(403).send("Need more info");
        let userId = req.cookies.user.split(';')[0];
        let user = await User.findById(userId);
        let match = await User.findById(req.body.user);
        console.log(req.body.interest)//json format, not string!!!
        res.json(req.body.interest)
    })

//addAcceptedEmails('testing@example.com','testing2@example.com')

module.exports = router;