# Node version
* [x] likes, matches, etc
    * [ ]
* [ ] feed based on likes, maybe let it just be based on matches too? (maybe make a way to post to matches only)
* [ ] update everywhere that has a String where it should have an ObjectId
    * [x] change user cookie to user ID rather than username
* [ ] update everywhere it signs in "test" and shouldn't
* [x] post comments
* [ ] delete posts/comments
* [ ] edit profile
* [x] location
    * [x] cookies
    * [x] calculate distance
    * [x] user prefs for how far they can see posts (general)
    * [x] fix how coords are saved in the database
        * [x] change so they're looked up like that too
    * [ ] user default location?
* [ ] user prefs (home and topic)
    * [ ] actually update prefs
        * [ ] send current prefs data to pref page
    * [ ] theme (all)
    * [x] max distance to see posts (per topic, default same as home)
        * [ ] show between min distance and max distance
    * [ ] who can see posts
        * [ ] based on location
    * [ ] who can like
        * [ ] based on location (in case, e.g., my preferences for who can see my posts on interessDev are worldwide, but I only want to match with ppl within 10 km)
        * [ ] based on gender (distinguish b/w romantic, platonic, etc)
* [ ] email verification
    * [ ] fix email
    * [ ] buy emails for this
* [ ] id verification??? find a service for this prolly
    * [ ] send in pictures of ID
    * [ ] store securely so that only employees verifying them can see
        * [ ] encrypt bitmap?
        * [ ] save to database or cdn
        * [ ] decrypt only if logged into an admin account
* [x] swipe route that renders swipe.ejs with profile information
    * [ ] algorithm to find potential matches
        * [x] start with distance
        * [ ] add optional profile parameters
            * [ ] optional if visible on bio?
    * [ ] save match info when swiped
    * [x] check that it actually works

# Rust version