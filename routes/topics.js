const express = require('express');
const uuid = require('uuid').v4;
const router = express();
const User = require('../models/users');
const Topic = require('../models/topics');
const {cookieOptions,cookieMap, cookieLogin, cookieCheck} = require('../cookies.js');
const {getDistance,decodeGeoLoc} = require('../distance');

router.get('/:id',async (req,res)=>{
    let topic = await Topic.findOne({url: req.params.id})
    let posts = [];
    let prefs = {};
    if (req.cookies.user && cookieCheck(req.cookies.user)) {
        let user = await User.findById();
        let userTopic = user.topics.filter(t=> t.url == topic.url)[0];
        prefs = userTopic ? userTopic.prefs : user.universalPrefs;
        if (req.cookies.geoLocation) prefs.location = req.cookies.geoLocation;
        else if (user.lastLocation) prefs.location = decodeGeoLoc(user.lastLocation);
    } else
        prefs = {theme: "light"}
    for (let post of topic.posts) {
        let p = await Post.findById(post);
        let pDist = getDistance(prefs.location,post.geoLocation);
        if (prefs.location && pDist >= prefs.postViewDistance.min && pDist <= prefs.postViewDistance.max) posts.push(p);
    }
    res.cookie('location','topic').cookie('topic',topic.url).render('topic',{topic,posts,theme:prefs.theme})
})
router.route('/:id/preferences')
    .get((req,res)=>{
        if (!req.cookies.user || !cookieCheck(req.cookies.user)) return res.redirect('/');
        User.findById(req.cookies.user.split(';')[0]).then(user=>{
            let userTopic = user.topics.filter(t=> t.url == req.params.id)[0];
            let prefs = userTopic ? userTopic.prefs : user.universalPrefs;
            res.render('partials/editPrefs',{url: '/topics/' + req.params.id, css: '../../sliders.css', prefs})
        })
    })
    .post((req,res)=>{
        console.log(req.body);
        if (!req.cookies.user || !cookieCheck(req.cookies.user)) return res.redirect('/');
        res.end()
    })

router.post('/create',(req,res)=>{
    if (!req.cookies.user || !cookieCheck(req.cookies.user)) return res.status(403).send("Must be logged in")
    if (!req.body || !req.body.url) return res.status(403)
    let user = req.cookies.user.split(';')[0]
    Topic.findOne({url: req.body.url}).then(t=>{
        if (t) return res.status(403).send("Already exists")
        let key = uuid();
        let topic = new Topic({
            url: req.body.url,
            admin: [{user, key}],
            users: [user],
            adult: !!req.body.adult
        })
        topic.save()
        User.findOne({username: user}).then(u=>{
            u.topics.push(req.body.url);
            u.adminOf.push({topic: req.body.url, key});
            u.save();
        })
        res.status(200).send('http://localhost:3002/topics/' + req.body.url)
    })
})

module.exports = router;