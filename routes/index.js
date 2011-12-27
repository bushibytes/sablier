
/*
 * GET home page.
 */
var openid = require('openid');
var user;
var Activity = require('../models/activity.js');
var extensions = [new openid.UserInterface(), 
                  new openid.SimpleRegistration(
                      {
                        "nickname" : true, 
                        "email" : true, 
                        "fullname" : true,
                        "dob" : true, 
                        "gender" : true, 
                        "postcode" : true,
                        "country" : true, 
                        "language" : true, 
                        "timezone" : true
                      }),
                  new openid.AttributeExchange(
                      {
                        "http://axschema.org/contact/email": "required",
                        "http://axschema.org/namePerson/first": "required",
                        "http://axschema.org/namePerson/last": "required"
                      })];
var relyingParty = new openid.RelyingParty(
    'http://localhost:3000/activity', // Verification URL (yours)
    null, // Realm (optional, specifies realm for OpenID authentication)
    false, // Use stateless verification
    false, // Strict mode
    extensions); // List of extensions to enable and include

exports.index = function(req, res){
  res.render('login', { title: 'Please identify yourself' });
};

exports.activity = function(req, res){
  relyingParty.verifyAssertion(req, function(error, result){
    if(error){
      console.log('auth failed activity, error:'+JSON.stringify(error));
      res.render('login', {title: 'Authentication Failed'});
    } else {
      user = result;
      console.log('auth achieved activity, result:'+JSON.stringify(result));
      res.render('activity', {title:'Add Activity'});
    }
  });
};

exports.listActivities = function(req,res){
   if(!user){
    console.log('auth failed list activities, error:'+JSON.stringify(error));
    res.render('login', {title: 'Authentication Failed'});
  } else {
    console.log('auth list activities achieved, result:'+JSON.stringify(user));
    Activity.find({user:user.email},function(err, activities){
      res.send(activities);
    });
  }
};

exports.authenticate = function(req,res){
  var identifier = req.query['openid_identifier'];
  relyingParty.authenticate(identifier, false, function(error, authUrl){
    if(error){
      res.writeHead(200);
      res.end('Authentication failed');
    } else if (!authUrl){
      res.writeHead(200)
    } else {
      res.writeHead(302, { Location: authUrl });
      res.end();
    }
  });
};

exports.addActivity = function(req,res){
  //Parse string
    if(!user){
      console.log('add activity auth failed, error:'+JSON.stringify(error));
      res.render('login', {title: 'Authentication Failed'});
    } else {
      console.log('add activity auth achieved, result:'+JSON.stringify(user));
      //Parse out the tags
      var tagpat = /#(\w+)/g;
      var tagMatches = req.body.activity.match(tagpat);

      var timespent = 0;

      //Locate time hints
      var hourspat = /(\d) hour[s]?/;
      var timeMatches = req.body.activity.match(hourspat);
      var time = 0;

      if(timeMatches != null){
        time+=timeMatches[1];
      }

      new Activity({activity: req.body.activity, user:user.email, tags: tagMatches, hours:time}).save();
      res.send("ok");
    }
};