const cryptoJS = require('crypto-js');
const geolib = require('geolib');

function decodeGeoLoc(encoded) {
    if (!encoded.latitude || !encoded.longitude) return console.error("Need latitude and longitude");
    let latitude = parseFloat(cryptoJS.AES.decrypt(encoded.latitude,process.env.GEO_ENCRYPT).toString(cryptoJS.enc.Utf8));
    let longitude = parseFloat(cryptoJS.AES.decrypt(encoded.longitude,process.env.GEO_ENCRYPT).toString(cryptoJS.enc.Utf8));
    //console.log("Latitude: ", cryptoJS.AES.decrypt(encoded.latitude,process.env.GEO_ENCRYPT).toString(cryptoJS.enc.Utf8),latitude)
    //console.log("Longitude: ", cryptoJS.AES.decrypt(encoded.longitude,process.env.GEO_ENCRYPT).toString(cryptoJS.enc.Utf8),longitude)
    return {latitude,longitude};
}
function encodeGeoLoc(geoLoc) {
    if (!geoLoc.latitude || !geoLoc.longitude) return console.error("Need latitude and longitude");
    let latitude = cryptoJS.AES.encrypt(geoLoc.latitude.toString(),process.env.GEO_ENCRYPT).toString();
    //console.log("Latitude: ",geoLoc.latitude,latitude)
    let longitude = cryptoJS.AES.encrypt(geoLoc.longitude.toString(),process.env.GEO_ENCRYPT).toString();
    //console.log("Longitude: ",geoLoc.longitude,longitude)
    return {latitude,longitude};
}
function getDistance(json, encoded) {
    let loc1;
    try { loc1 = JSON.parse(json) } catch { loc1 = json }
    return geolib.getDistance(loc1,decodeGeoLoc(encoded))
}
function getDistanceBothEncoded(loc1,loc2) {
    return geolib.getDistance(decodeGeoLoc(loc1),decodeGeoLoc(loc2));
}
module.exports = {decodeGeoLoc,encodeGeoLoc,getDistance}