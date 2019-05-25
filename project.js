const fs = require("fs"); // file system
const http = require("http"); // server
const express = require("express"); // express
const session = require("express-session");
const bodyParser = require("body-parser"); // used by express, middleware
const bcrypt = require("bcrypt");

// bcrypt stuff
const saltRounds = 10;

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
    secret: "secret", // secret string used to encrypt the cookie
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
})

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
function updateComments(req, res) {
    writeToComments(req.body, "comments.json", req);
    res.redirect("/blog");
}

// write content sent by user to fileName
// if the file does not exist, just write
// if it does exist, append to existing data
function writeToComments(content, fileName, request) {
    let obj = {posts:[]};
    if (!request.session.name) {
        content.name = content.name + " (not registered)";
    }
    fs.exists(fileName, function(exists) {
        if (exists) {
            fs.readFile(fileName, "utf-8", function(err, data) {
                if (err) {
                    console.log(err);
                } else {
                    obj = JSON.parse(data);
                    obj.posts = [...obj.posts, content];
                    let json = JSON.stringify(obj);
                    fs.writeFile(fileName, json, "utf-8", function(err) {
                        if (err) {
                            console.log(err);
                        }
                    });
                }
            })
        } else {
            obj.posts = [...obj.posts, content];
            let json = JSON.stringify(obj);
            fs.writeFile(fileName, json, "utf-8", function(err) {
                if (err) {
                    console.log(err);
                }
            });
        }
    });
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
app.get("/comments/:article", (req, res, next) => {
    fs.exists("comments.json", function(exists) {
        let obj = {posts:[]};
        if (exists) {
            const data = fs.readFileSync("comments.json","utf-8");
            const json = JSON.parse(data);
            for(let i = 0; i < json.posts.length; i++) {
                if (req.params.article == json.posts[i].article) {
                    obj.posts = [...obj.posts, json.posts[i]];
                }
            }
            res.send(obj);
            next();
        } else {
            res.send(obj);
            next();
        }
    })
})

// the next three functions are involved in article (blog post) creation
app.post("/blog/create", updateArticles);

function updateArticles(req, res) {
    writeToArticles(req.body, "articles.json");
    res.redirect("/blog");
}

function writeToArticles(content, fileName) {
    let obj = {articles:[]};
    content.id = new Date();
    fs.exists(fileName, function(exists) {
        if (exists) {
            fs.readFile(fileName, "utf-8", function(err, data) {
                if (err) {
                    console.log(err);
                } else {
                    obj = JSON.parse(data);
                    obj.articles = [...obj.articles, content];
                    let json = JSON.stringify(obj);
                    fs.writeFile(fileName, json, "utf-8", function(err) {
                        if (err) {
                            console.log(err);
                        }
                    });
                }
            })
        } else {
            obj.articles = [...obj.articles, content];
            let json = JSON.stringify(obj);
            fs.writeFile(fileName, json, "utf-8", function(err) {
                if (err) {
                    console.log(err);
                }
            });
        }
    });
}

// get ALL articles (not efficient, should limit to n)
// also article body in its entirety, should limit in
// all cases but the latest (done client side, but should
// be done here)
app.get("/articles",(req,res) => {
    fs.exists("articles.json", function(exists) {
        if (exists) {
            const data = fs.readFileSync("articles.json","utf-8");
            res.send(data);
        } else {
            let obj = {articles:[]};
            res.send(obj);
        }
    });
});

// get a specific article
app.get("/articles/:article", (req, res, next) => {
    fs.exists("articles.json", function(exists) {
        let obj = {articles:[]};
        if (exists) {
            const data = fs.readFileSync("articles.json","utf-8");
            const json = JSON.parse(data);
            for (let i = 0; i < json.articles.length; i++) {
                if (req.params.article  == json.articles[i].id) {
                    obj.articles = [...obj.articles, json.articles[i]];
                }
            }
            res.send(obj);
            next();
        } else {
            res.send(obj);
            next();
        }
    });
});

app.post("/register", register);

async function register(req, res) {
    await registerUser(req.body, "db.json", res);
}

// only registration with unique user names allowed
function registerUser(content, fileName, response) {
    let registeredUser = {user: []};

    const plaintextPassword = content.pw;
    // id combines user name and unix timestamp
    // although unique user name does the same thing (being unique)
    content.id = content.name + Math.floor(Date.now() / 1000);
    // since only user name and password are required, country may
    // be left at default selection
    content.country.name == "Select your country" ? content.country.name = "" : content.country.name;

    let regStatus = {result: ""};

    fs.exists(fileName, function(exists) {
        if (exists) {
            fs.readFile(fileName, "utf-8", function(err, data) {
                if (err) {
                    regStatus.result = false;
                     response.send(regStatus);
                }
                let searchData = JSON.parse(data);
                let searchUser = false;

                for (let i = 0; i < searchData.user.length; i++) {
                    if (searchData.user[i].name == content.name) {
                        searchUser = true;
                        break;
                    }
                }
                if (searchUser) {
                    regStatus.result = false;
                    regStatus.name = "";
                    regStatus.found = true;
                    response.send(regStatus);
                } else {
                    bcrypt.hash(plaintextPassword, saltRounds)
                    .then(function(hash) {
                        content.pw = hash;
                        fs.readFile(fileName, "utf-8", function(err, data) {
                            if (err) {
                                console.log(err);
                            } else {
                                registeredUser = JSON.parse(data);
                                registeredUser.user = [...registeredUser.user, content];
                                let json = JSON.stringify(registeredUser);
                                fs.writeFile(fileName, json, "utf-8", function(err) {
                                    if (err) {
                                        regStatus.result = false;
                                        response.send(regStatus);
                                    } else {
                                        regStatus.result = true;
                                        response.send(regStatus);
                                    }
                                });
                            }
                        });
                    });
                }
            });
        } else {
            bcrypt.hash(plaintextPassword, saltRounds)
            .then(hash => {
                content.pw = hash;
                registeredUser.user = [content];
                let json = JSON.stringify(registeredUser);
                fs.writeFile(fileName, json, "utf-8", function(err) {
                    if (err) {
                        regStatus.result = false;
                        response.send(regStatus);
                    } else {
                        regStatus.result = true;
                        response.send(regStatus);
                    }
                });
            });
        }
    })
}

app.post("/login", checkAuth);

async function checkAuth(req, res) {
    await compareData(req.body, "db.json", req, res);
}

function compareData(content, fileName, request, response) {
    const plaintextPassword = content.pw;
    let hashedPassword = "";
    let check = {};
    fs.exists(fileName, function(exists) {
        if (exists) {
            const data = fs.readFileSync(fileName, "utf-8");
            const json = JSON.parse(data);

            // makes no check whatsoever for unique user names
            // stops at first match
            for (let i = 0; i < json.user.length; i++) {
                if (content.user == json.user[i].name) {
                    request.session.name = json.user[i].name;
                    hashedPassword = json.user[i].pw;
                    break;
                }
            }

            bcrypt.compare(plaintextPassword, hashedPassword)
            .then(res => {
                check.result = res;
                if (res) {
                    check.name = request.session.name;
                } else {
                    check.name = "";
                }
                response.send(check);
            })
            .catch(err => {
                console.log(err);
            })
        } else {
            check.result = false;
            check.name = "";
            response.send(check);
        }
    });
}

app.get("/logout", (request, response) => {
    request.session.destroy(err => {
        if (err) {
            response.redirect("/");
        } else {
            request.session = null;
            response.clearCookie('connect.sid', {
                path: "/",
                secure: false,
                httpOnly: true
            })
            .send({result: false, name: ""});
        }
    });
});

// create server that is listening to a set port (above)
http.createServer(app).listen(port, () => {
    console.log(`Listening to port ${port}.`);
});
