const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true
    },
    password: String,
    firstName: String,
    lastName: String,
    email: String,
    blocked: {
        type: [mongoose.ObjectId],
        default: []
    },
    topics: {
        type: [{url: String, prefs: { //change url to "ref" and objectId???
            theme: {type: String, default: "default"},
            postViewDistance: {min: Number, max: Number}, postShowDistance: {min: Number, max: Number}
        }}]
    },
    adminOf: {
        type: [{topic: String, key: String}], //maybe change topic to objectId???
        default: []
    },
    matches: {
        type: [{user: mongoose.ObjectId, interest: {type: [String], enum: ["platonic","romantic","sexual"]}, reciprocated: {type: [String], enum: ["platonic","romantic","sexual"], default: []}}],
        default: []
    },
    bio: {
        type: String,
        default: ""
    },
    verificationCode: String,
    verifiedEmail: {
        type: Boolean,
        default: false
    },
    verifiedAge: {
        type: Boolean,
        default: false
    },
    notifsRead: {
        type: Number,
        default: Date.now
    },
    universalPrefs: {
        type: {theme: String, postViewDistance: {min: Number, max: Number}, postShowDistance: {min: Number, max: Number}},
        default: {theme: "light", postViewDistance: {min: 0, max: 21000000}, postShowDistance: {min: 0, max: 21000000}}
    },
    matchPrefs: {
        type: {maxDistance: Number},
        default: {maxDistance: 50000}
    },
    lastLocation: {
        latitude: String,
        longitude: String
    }
},{timestamps:true});

module.exports = User = mongoose.model('users',UserSchema);