const mongoose = require('mongoose');

const PostSchema = new mongoose.Schema({
    user: mongoose.ObjectId,
    title: String,
    body: String,
    location: {
        locType: {
            type: String,
            enum: ["topic","user","post"]
        },
        locId: mongoose.ObjectId
    },
    geoLoc: {
        latitude: String,
        longitude: String,
    },
    comments: {
        type: Array,
        default: [mongoose.ObjectId]
    },
    adult: {
        type: Boolean,
        default: false
    },
    showOnProfile: {
        type: Boolean,
        default: true
    }
},{timestamps:true})
//PostSchema.index({geoLocation: '2dsphere'})

module.exports = Post = mongoose.model('posts',PostSchema);