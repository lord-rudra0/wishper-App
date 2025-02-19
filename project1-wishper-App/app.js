import express from "express"
import bodyParser from "body-parser";
import mongoose from "mongoose"
const port = 5000;

const mongoURI = "mongodb://localhost:27017/userDB";


const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));


app.get("/", function (req, res) {
    res.render("home");
});

app.get("/register", function (req, res) {
    res.render("register");
});

app.post("/register", async function (req, res) {
    try {
        const newUser = new User({
            email: req.body.username,
            password: req.body.password,
        });
        await newUser.save()
        res.render("secrets")
    } catch (err) {
        console.log(err);
    }
});

app.post("/login", async function (req, res) {
    try {
        const email = req.body.username;
        const password = req.body.password;

        const foundUser = await User.findOne({
            email: email,
            password: password
        });
        if (foundUser) {
            res.render("secrets");
        }
        else {
            console.log("invalid")
        }
    } catch (err) {
        console.log(err)
    }


}
);




app.get("/login", function (req, res) {
    res.render("login");
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
    email: String,
    password: String
})

const User = mongoose.model("User", userScema)


app.listen(port, function () {
    console.log(`running on ${port}`)
})