const express = require('express');
const distance = require('../distance')
const router = express();
const {cookieOptions,cookieMap, cookieLogin, cookieCheck} = require('../cookies.js');
const User = require('../models/users');
const Topic = require('../models/topics');
const Post = require('../models/posts');
const posts = require('../models/posts');


router.post('/new',(req,res)=>{
    if (!req.cookies.user || !cookieCheck(req.cookies.user)) {
        console.log(req.cookies)
        return res.status(403).send("Not logged in!")
    }
    if (!req.body.title && !req.body.body) return res.status(403).send("Please include post text")
    let user = req.cookies.user.split(';')[0];
        let post = new Post({user,title: req.body.title || "", body: req.body.body || "", adult: !!req.body.adult, showOnProfile: !req.body.hideFromProfile})
        if (req.cookies.geoLocation) {
            let geoLoc = JSON.parse(req.cookies.geoLocation);
            post.geoLoc = distance.encodeGeoLoc(geoLoc);
            User.findById(user).then(doc=>{
                doc.lastLocation = {latitude,longitude};
                doc.save();
            })
        }
        if (req.cookies.location == "topic") Topic.findOne({url: req.cookies.topic}).then(t=>{
            if (t) {
                post.location = {locType: 'topic', locId: t._id}
                post.save().then(p=>{
                    t.posts.push(p._id);
                    t.save();
                    return res.status(200).redirect('back');
                })
            }
        })
        else {
            //ik there's a return statement but apparently this caused a ParallelSaveError
            post.location = {locType: 'user', locId: user}
            post.save()
            res.status(200).redirect('back')
        }
        
    
})
router.get('/nearme',(req,res)=>{
    if (!req.cookies.user || !cookieCheck(req.cookies.user)) {
        console.log(req.cookies)
        return res.cookie("user",cookieLogin("test")).status(403).send("Not logged in!")
    }
    if (!req.cookies.geoLocation) return res.status(403).send("Location disabled!")
    /*Post.find({geoLocation:{$near: {$maxDistance: 5000, $geometry: {type: "Point",coordinates: JSON.parse(req.cookies.geoLocation)}}}}).then(docs=>{
        res.json(docs);
        //todo: render a page instead of sending json data
    })*/
    Post.find({}).then(docs=>{
        let posts = [];
        let maxDistance = 5000;
        let minDistance = 0;
        //do the same for general feed and topic feed but have max distance and min distance set to user prefs
        for (let post of docs) {
            let postDistance = distance.getDistance(req.cookies.geoLocation,post.geoLoc)
            if (postDistance <= maxDistance && postDistance >= minDistance) posts.push(post)
        }
        res.json(posts)
    })
    //todo: change $maxDistance to user pref
})
router.get('/post/:id',(req,res)=>{
    Post.findById(req.params.id).then(async post=>{
        let comments = []
        for (let id of post.comments) {
            let comment = await Post.findById(id);
            comments.push(comment);
        }
        post.comments = comments
        switch (post.location.locType) {
            case "post":
                post.location.op = await Post.findById(post.location.locId);
                break;
            case "topic":
                post.location.topic = await Topic.findById(post.location.locId);
                break;
        }
        //DO NOT POST.SAVE()!!!!!
        res.render('partials/post',{post})
    })
})

router.post('/comment/:postId',(req,res)=>{
    if (!req.cookies.user || !cookieCheck(req.cookies.user))
        return res.status(403).send("Not logged in!");
    let user = req.cookies.user.split(';')[0];
    if (!req.body.comment || !req.params.postId) return res.end();
    Post.findById(req.params.postId).then(post=>{
        let adult = post.adult ? true : req.body.adult || false;
        let comment = new Post({user, title: "",body: req.body.comment,adult, location: {locType: "post", locId: post.user}, showOnProfile: false})
        comment.save();
        post.comments.push(comment._id);
        post.save();
        res.status(200).redirect(`/posts/post/${post._id}`);
    })
})

//should be done with this but keeping it just in case:
/*router.get('/addpostlocs',(req,res)=>{

    Post.find({'geoLocation.latitude': {$exists: false}, 'geoLocation.coordinates': {$exists: true}}).then(docs=>{
        for (let doc of docs) {
            console.log(doc.geoLocation)
            let latitude = cryptoJS.AES.encrypt(doc.geoLocation.coordinates[1].toString(), process.env.GEO_ENCRYPT);
            let longitude = cryptoJS.AES.encrypt(doc.geoLocation.coordinates[0].toString(), process.env.GEO_ENCRYPT);
            doc.geoLocation = {latitude, longitude}
            doc.save()
        }
        res.end();
    })
})*/
module.exports = router;