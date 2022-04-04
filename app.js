// initializing 
require('dotenv').config()
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const md5 = require("md5");
const { Collection } = require("mongodb");


const app = express();

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({extended: true}));

app.use(express.static("public"));

// connecting mongoose and database name
mongoose.connect("mongodb://localhost:27017/userDB");

// Schema 
const userSchema = new mongoose.Schema ({
    email: String,
    password: String
});

// creating model and specifying Collection
const User = new mongoose.model("User", userSchema);


// routes
app.get("/", function(req, res){
    res.render("home");
});

app.get("/login", function(req, res){
    res.render("login");
});

app.get("/register", function(req, res){
    res.render("register");
});

// register route
app.post("/register", function(req, res){
    const newUser = new User({
        email: req.body.username,
        password: md5 (req.body.password)
    });
    newUser.save(function(err){
        if(err){
            console.log(err);
        } else {
            res.render("secrets")
        }
    });
});

// login route
app.post("/login", function(req, res){
    const username = req.body.username;
    const password = md5 (req.body.password);

    User.findOne({email: username}, function(err, foundUser){
        if(err){
            console.log(err);
        }else {
            if(foundUser){
                if(foundUser.password === password){
                    res.render("secrets");
                }
            }
        }
    });
});


app.listen(3000, function(){
    console.log("Server started in Port number 3000");
});




