var express = require('express');
var passport = require('passport');
var session = require('express-session');
var passportSteam = require('passport-steam');
var request = require('request');
const axios = require('axios');
var cors = require('cors')
const { response } = require('express');
var SteamStrategy = passportSteam.Strategy;
var app = express();

var port = process.env.PORT || 3080;
var userID = -1;
var userName = "";

app.use(cors())

// For solving Cors error when using ngrox tunnel -- seems not work
// app.use(function(req, res, next) {
//     res.header("Access-Control-Allow-Origin", "*"); 
//     res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
//     next();
// });

// Required to get data from user for sessions
passport.serializeUser((user, done) => {
    done(null, user);
});

passport.deserializeUser((user, done) => {
    done(null, user);
});

// Initiate Strategy
passport.use(new SteamStrategy({
        //returnURL: 'http://ec2-54-197-97-107.compute-1.amazonaws.com:' + port + '/api/auth/steam/return',
        //realm: 'http://ec2-54-197-97-107.compute-1.amazonaws.com:' + port + '/',
        returnURL: 'http://localhost:' + port + '/api/auth/steam/return',
        realm: 'http://localhost:' + port + '/',
        //returnURL: 'https://game-sothis-backend.herokuapp.com/api/auth/steam/return',
        //realm: 'https://game-sothis-backend.herokuapp.com/',
        apiKey: 'E3ECE458BA26350EAF264840A63BF51E'
    }, function (identifier, profile, done) {
        process.nextTick(function () {
            profile.identifier = identifier;
            return done(null, profile);
        });
    }
));

app.use(session({
    secret: 'Whatever_You_Want',
    saveUninitialized: true,
    resave: false,
    cookie: {
        maxAge: 3600000
    }
}))

app.use(passport.initialize());

app.use(passport.session());

// Spin up the server
app.listen(port, () => {
    console.log('Listening, port ' + port);
});

// Routes
app.get("/", (req, res) => {
    //res.send("Hello");
    console.log(req.user);
    res.send(req.user == null ? 'not logged in' : 'hello ' + req.user.displayName).end();
});
    
app.get('/adduser', (req, res) => {
    userID = req.user['_json']['steamid'];
    userName = req.user['displayName']

    //Redirect back to front end
    res.writeHead(302, {
        Location: 'http://localhost:3000'
        //Location: "https://gamesothis.web.app"
    });

    res.end(); 
});

app.get('/user', function(req, res) { 
    async function getData(){
        //TODO add exception handing here 
        if(userID == -1) return {};

        const fullURL = 'https://gamesothis.herokuapp.com/user/' + userID;
        const res = await axios.get(fullURL);
        
        //const res = await axios.get('https://gamesothis.herokuapp.com/user/76561198345197403')
        const data = res.data;
        //console.log(data);
        return data;
    }

    getData().then(data => {
            res.status(200).send(data);
        }
    );
    
    //-------------------This also works------------------------------------------------------------------
    // request('https://gamesothis.herokuapp.com/user/76561198345197403', function(error, response, body){
    //     if(!error && response.statusCode == 200){
    //         console.log(body)
    //     }
    // });
});

app.get('/logout', function(req, res) { 
    userID = -1;
    // req.logout();
    // res.redirect('/user');
    req.logout(function(err) {
        if (err) { return next(err); }
        res.redirect('http://localhost:3000');
    });
});

app.get('/api/auth/steam', passport.authenticate('steam', {failureRedirect: '/'}), function (req, res) {
    //var redirectionUrl = req.session.redirectionUrl || '/';
    //res.redirect(redirectionUrl);

    res.redirect('/adduser')
    //res.redirect('/')
});

app.get('/api/auth/steam/return', passport.authenticate('steam', {failureRedirect: '/'}), function (req, res) {
    //var redirectionUrl = req.session.redirectionUrl || '/';
    //res.redirect(redirectionUrl);

    res.redirect('/adduser')
    //res.redirect('/')
});
   