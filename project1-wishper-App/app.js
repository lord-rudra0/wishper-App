import express from "express"
import bodyParser from "body-parser";
import mongoose from "mongoose"
import session from "express-session"
import passport from "passport";
import passportLocalMongoose from "passport-local-mongoose"
// import LocalStrategy from 'passport-local';
import passportLocal from "passport-local";
import findOrCreate from "mongoose-findorcreate"

import { Strategy as GoogleStrategy } from 'passport-google-oauth20';


// import bcrypt, { hash } from "bcrypt"
// import md5 from "md5";
// import encrypt from 'mongoose-encryption'
import 'dotenv/config'
import e from "express";

// dotenv.config()

// let secret = process.env.SECRET;
// console.log(secret);

const port = 3000;
// const saltRounds = 10;

const mongoURI = process.env.mongoURI

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: true,
    // cookie: { secure: true }
}))


app.use(passport.initialize());
app.use(passport.session());


passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
},
    function (accessToken, refreshToken, profile, cb) {
        console.log(profile)
        User.findOrCreate({ googleId: profile.id }, function (err, user) {

            return cb(err, user);
        });
    }
));

app.get("/", function (req, res) {
    res.render("home");
});

app.get("/register", function (req, res) {
    res.render("register");
});

app.get('/auth/google',
    passport.authenticate('google', { scope: ['profile'] }));


app.get("/submit", function (req, res) {
    if (req.isAuthenticated()) { res.render("submit"); }
    else {
        res.redirect("/login")
    }

});
app.post("/submit", async function (req, res) {
    const reqsubmit = req.body.secret;  // Get the secret from the request
    console.log("Received secret:", reqsubmit);  // Log the received secret

    if (!req.isAuthenticated()) {
        console.log("User not authenticated");
        return res.redirect("/login");  // Redirect to login if user is not authenticated
    }

    try {
        // Ensure user is authenticated and has a valid ID
        const foundUser = await User.findById(req.user.id);

        if (!foundUser) {
            console.log("User not found with ID:", req.user.id);
            return res.status(404).send("User not found.");
        }

        // Set the secret for the found user
        foundUser.secret = reqsubmit;

        // Save the user with the updated secret
        await foundUser.save();
        console.log("Secret saved successfully for user:", req.user.id);
        console.log(req.user)

        res.redirect("/secrets");  // Redirect to /secrets
    } catch (err) {
        console.log("Error saving secret:", err);
        res.status(500).send("Internal server error.");
    }
});


app.get('/auth/google/secrets',
    passport.authenticate('google', { failureRedirect: '/login' }),
    function (req, res) {
        // Successful authentication, redirect home.
        res.redirect('/secrets');
    });



app.get("/secrets", async function (req, res) {
    try {
        const foundUsers = await User.find({ "secret": { $ne: null } });

        if (foundUsers) {
            res.render("secrets", { userWithSecrets: foundUsers });
        } else {
            console.log("No users with secrets found");
            res.render("secrets", { userWithSecrets: [] });
        }
    } catch (err) {
        console.log(err);
        res.status(500).send("Error retrieving secrets.");
    }
});


app.post("/register", async function (req, res) {
    const email = req.body.username;
    const password = req.body.password;

    User.register({ username: email }, password, function (err, User) {
        if (err) {
            console.log("errror in user", err)
        }
        else {
            console.log("User registered successfully:", User); // Debugging log
            passport.authenticate("local")(req, res, function () {
                console.log("Authentication successful, redirecting..."); // Debugging log
                res.redirect("/secrets");
            })

        }

    })
});


app.post('/login',
    function (req, res, next) {
        console.log("Login attempt received...");
        console.log("Username:", req.body.username);  // Log the username
        console.log("Password:", req.body.password);  // Log the password

        passport.authenticate('local', function (err, user, info) {
            if (err) {
                console.log("Error during authentication:", err);
                return next(err);
            }

            if (!user) {
                console.log("Authentication failed:", info);
                return res.redirect('/login');
            }

            console.log("Authentication successful for user:", user.username); // Log username of authenticated user

            req.logIn(user, function (err) {
                if (err) {
                    console.log("Error during login:", err);
                    return next(err);
                }

                console.log("User successfully logged in. Session ID:", req.sessionID); // Log session info
                res.redirect('/secrets');
            });
        })(req, res, next);
    });


// app.post('/login',
//     passport.authenticate('local', { failureRedirect: '/login' }),
//     function (req, res) {
//         res.redirect('/secrets');
//     });


// app.post('/login',
//     passport.authenticate('local', { failureRedirect: '/login' }),
//     function (req, res) {
//         res.redirect('');
//     });

// app.post("/login", async function (req, res) {
//     const user = new User({
//         email: req.body.username,
//         password: req.body.password
//     });

//     req.logIn(user, function (err) {
//         if (err) {
//             console.log("errror in user", err)
//         }
//         else {
//             console.log("User registered successfully:", User); // Debugging log
//             passport.authenticate("local")(req, res, function () {
//                 console.log("Authentication successful, redirecting..."); // Debugging log
//                 res.redirect("/secrets");
//             })
//         }
//     })


// });

// app.post("/register", async function (req, res) {


//     try {
//         const hash = await bcrypt.hash(req.body.password, saltRounds)
//         const newUser = new User({
//             email: req.body.username,
//             password: hash
//         });

//         await newUser.save()
//         res.render("secrets")
//     }
//     catch (err) {
//         console.log(err);
//     }
// });
//     try {
//         const newUser = new User({
//             email: req.body.username,
//             // password: md5(req.body.password),
//             bcrypt.hash(myPlaintextPassword, saltRounds, function (err, hash) {
//                 // Store hash in your password DB.
//             });

//         });
//         await newUser.save()
//         res.render("secrets")
//     } catch (err) {
//         console.log(err);
//     }
// });


// 
// app.post("/login", async function (req, res) {
//     try {
//         const email = req.body.username;
//         // const password = md5(req.body.password);
//         const enteredPassword = req.body.password;

//         const foundUser = await User.findOne({
//             email: email,
//         });
//         console.log(foundUser.password)
//         // const isValid = await bcrypt.compare(enteredPassword, foundUser.password)

//         console.log("Entered password:", enteredPassword);
//         console.log("founduser password", foundUser.password);

//         console.log(foundUser); // Add this line to log the found user
//         if (foundUser) {
//             if (isValid) {
//                 res.render("secrets");
//             } else {
//                 console.log("Invalid password");
//                 res.send("Invalid password.");
//             }
//         }
//         else {
//             console.log("invalid")
//         }
//     } catch (err) {
//         console.log(err)
//     }
// });


app.get("/login", function (req, res) {
    res.render("login");
});


app.get('/logout', function (req, res, next) {
    req.logout(function (err) {
        if (err) { return next(err); }
        res.redirect('/secrets');
    });
});




async function connectDB() {
    try {
        await mongoose.connect(mongoURI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log("MongoDB connected successfully ");
    } catch (error) {
        console.error("MongoDB connection error:", error);
        process.exit(1);
    }
}


connectDB();


const userScema = new mongoose.Schema({
    username: String,
    password: String,
    googleId: String,
    secret: String
})


// userScema.plugin(encrypt, { secret: secret, encryptedFields: ["password"] });
userScema.plugin(passportLocalMongoose);
userScema.plugin(findOrCreate)

const User = mongoose.model("User", userScema)
// passport.use(User.createStrategy);
passport.use(new passportLocal.Strategy(User.authenticate()));

// used to serialize the user for the session
passport.serializeUser(function (user, done) {
    done(null, user.id);
    // where is this user.id going? Are we supposed to access this anywhere?
});

// used to deserialize the user
passport.deserializeUser(async function (id, done) {
    try {
        const user = await User.findById(id); // Use async/await
        done(null, user);
    } catch (err) {
        done(err);
    }
});



app.listen(port, function () {
    console.log(`running on ${port}`)
})