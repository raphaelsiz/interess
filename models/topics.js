const mongoose = require('mongoose');

const TopicSchema = new mongoose.Schema({
    url: { //not actual url, just the part after topics/ like r/theGoodPlace would have it in here as "theGoodPlace"
        type: String,
        required: true,
        unique: true
    },
    users: [mongoose.ObjectId],
    admin: [{user: mongoose.ObjectId, key: String}],
    posts: [mongoose.ObjectId],
    adult: {
        type: Boolean,
        default: false
    }
},{timestamps:true})

module.exports = Topic = mongoose.model('topics',TopicSchema);