// initializing
require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");

const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const findOrCreate = require("mongoose-findorcreate");

const { Collection } = require("mongodb");

const app = express();

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.static("public"));

// setting a session
app.use(
  session({
    secret: "Fullstack",
    resave: false,
    saveUninitialized: false,
  })
);

// initializing passport
app.use(passport.initialize());
app.use(passport.session());

// connecting mongoose and database name
mongoose.connect("mongodb://localhost:27017/userDB");

// Schema
const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  googleId: String,
  secret: String
});

userSchema.plugin(passportLocalMongoose);

userSchema.plugin(findOrCreate);

// creating model and specifying Collection
const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());

// passport.serializeUser(User.serializeUser());
// passport.deserializeUser(User.deserializeUser());

// used to serialize the user for the session
passport.serializeUser(function(user, done) {
  done(null, user.id); 
 // where is this user.id going? Are we supposed to access this anywhere?
});

// used to deserialize the user
passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
      done(err, user);
  });
});

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.CLIENT_ID,
      clientSecret: process.env.CLIENT_SECRET,
      callbackURL: "http://localhost:3000/auth/google/secrets",
    },
    function (accessToken, refreshToken, profile, cb) {
      console.log(profile)
      User.findOrCreate({ googleId: profile.id }, function (err, user) {
        return cb(err, user);
      });
    }
  )
);

// routes
app.get("/", function (req, res) {
  res.render("home");
});

app.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile"] })
);

app.get(
  "/auth/google/secrets",
  passport.authenticate("google", { failureRedirect: "/login" }),
  function (req, res) {
    // Successful authentication, redirect to secrets
    res.redirect("/secrets");
  }
);

app.get("/login", function (req, res) {
  res.render("login");
});

app.get("/register", function (req, res) {
  res.render("register");
});

// app.get("/secrets", function (req, res) {
//   if (req.isAuthenticated()) {
//     res.render("secrets");
//   } else {
//     res.redirect("/login");
//   }
// });

app.get("/secrets", function (req, res) {
 User.find({"secret": {$ne: null}}, function(err, foundUsers){
   if(err){
     console.log(err);
   }else{
     if(foundUsers){
       res.render("secrets", {usersWithSecrets: foundUsers});
     }
   }
 });
});

app.get("/submit", function(req, res){
  if (req.isAuthenticated()) {
    res.render("submit");
  } else {
    res.redirect("/login");
  }
});

app.post("/submit", function(req, res){
  const submittedSecret = req.body.secret;
  // console.log(req.user.id);

  User.findById(req.user.id, function(err, foundUser){
    if(err){
      console.log(err);
    }else {
      if(foundUser){
        foundUser.secret = submittedSecret;
        foundUser.save(function(){
          res.redirect("/secrets");
        });
      }
    }
  });
});

app.get("/logout", function (req, res) {
  req.logout();
  res.redirect("/");
});

// register route
app.post("/register", function (req, res) {
  User.register(
    { username: req.body.username },
    req.body.password,
    function (err, user) {
      if (err) {
        console.log(err);
        res.redirect("/register");
      } else {
        passport.authenticate("local")(req, res, function () {
          res.redirect("/secrets");
        });
      }
    }
  );
});

// login route
app.post("/login", function (req, res) {
  const user = new User({
    username: req.body.username,
    password: req.body.password,
  });
  //this method come from passport
  req.login(user, function (err) {
    if (err) {
      console.log(err);
    } else {
      passport.authenticate("local")(req, res, function () {
        res.redirect("/secrets");
      });
    }
  });
});

app.listen(3000, function () {
  console.log("Server started in Port number 3000");
});


