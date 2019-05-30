const fs = require("fs"); // file system
const http = require("http"); // server
const express = require("express"); // express
const session = require("express-session");
const bodyParser = require("body-parser"); // used by express, middleware

// access User, Article, and Comment methods
const User = require("./public/js/User");
const user = new User();

const Article = require("./public/js/Article");
const article = new Article();

const Comment = require("./public/js/Comment");
const comment = new Comment();

// create express application
const app = express();
const route = express.Router(); // not currently used
// the port the server will be listening to
const port = 5000;

// needed for parsing form request (application/x-www-form-urlencoded)
app.use(bodyParser.urlencoded({extended: false}));

// use resources in the public folder
app.use(express.static(__dirname + "/public"));

// session init
app.use(session({
    name: "cookie", // cookie name
    resave: false,
    saveUninitialized: false,
    rolling: true,
    secret: "secret", // secret string used to encrypt the cookie (should be way more complicated)
    cookie: {
        secure: false, // true for https (default), or false for http
        maxAge: 1000 * 60 * 10, // cookie age in milliseconds, set for 10 mins
        sameSite: true
    }
}));

// start using ejs template engine
app.set("view engine", "ejs");

// page links
app.get("/", (request, response) => {
    // express way
    //response.sendFile(__dirname +  "/index.html");
    // ejs way
    response.render("pages/index", {logged: request.session.name});
});

app.get("/blog", (request, response) => {
    //response.sendFile(__dirname + "/blog.html");
    response.render("pages/blog", {logged: request.session.name});
});

app.get("/blog/create", (request, response) => {
    //response.sendFile(__dirname + "/newblog.html");
    response.render("pages/newblog", {logged: request.session.name});
});

app.get("/users/:user", (request, response) => {
    user.getUser(request, response, "db.json");
});

// needed for parsing json request (application/json)
// sent by public/js/blog.js customised form data
// otherwise the above form request would suffice
app.use(bodyParser.json());

// this and the following take care of
// reading and writing user comments
app.post("/blog", updateComments);

// redirect is important, otherwise stays
// in the POST mode
// WARNING: req.body (user fed data) NOT VALIDATED
function updateComments(request, response) {
    comment.writeComment(request, "comments.json");
    response.redirect("/blog");
}

// comments page does not actually exist, this call is only for the
// reason to get data from the file if it exists or in case it does
// not, return an empty object in the expected form (see loadComments
// in public/js/blog.js)
// NOT USED - here only as a reminder how this was done originally
app.get("/comments",(req,res) => {
    fs.exists("comments.json", function(exists) {
        if (exists) {
            const data = fs.readFileSync("comments.json","utf-8");
            res.send(data);
        } else {
            let obj = {posts:[]};
            res.send(obj);
        }
    });
});

// load only article specific comments
app.get("/comments/:article", (request, response, next) => {
    comment.getArticleComments(request, response, next, "comments.json");
});

// the next three functions are involved in article (blog post) creation
app.post("/blog/create", updateArticles);

// save an article
function updateArticles(request, response) {
    article.writeArticle(request, "articles.json");
    response.redirect("/blog");
}

// get all articles
app.get("/articles",(request, response) => {
    article.getAllArticles(response, "articles.json");
});

// get a specific article
app.get("/articles/:article", (request, response, next) => {
    article.getSingleArticle(request, response, next, "articles.json");
});

// user specific stuff
app.post("/register", register);

// register user
async function register(request, response) {
    await user.registerUser(request, response, "db.json");
}

// check login
app.post("/login", checkAuth);

async function checkAuth(request, response) {
    await user.login(request, response, "db.json");
}

// logout
app.get("/logout", (request, response) => {
    user.logout(request, response);
});

// create server that is listening to a set port (above)
http.createServer(app).listen(port, () => {
    console.log(`Listening to port ${port}.`);
});
