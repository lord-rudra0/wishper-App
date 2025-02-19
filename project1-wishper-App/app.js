import express from "express"
import bodyParser from "body-parser";
const port = 5000;


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


app.get("/login", function (req, res) {
    res.render("login");
});





app.listen(port, function () {
    console.log(`running on ${port}`)
})