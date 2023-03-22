const uuid = require('uuid').v4;
const cookieOptions = {
    sameSite:'strict',
    path: '/',
    //expires: 'session',// new Date(new Date().getTime() + 60000),
    httpOnly: true
}
const cookieMap = {}
function cookieLogin(user) {
    let id = uuid();
    cookieMap[user] = id;
    return user + ";" + id;
}
function cookieCheck(user) {
    return (cookieMap[user.split(';')[0]] == user.split(';')[1])
}

module.exports = {cookieOptions,cookieMap, cookieLogin, cookieCheck}