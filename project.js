const fs = require("fs"); // file system
const http = require("http"); // server
const express = require("express"); // express
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

// page links
app.get("/", (request, response) => {
    response.sendFile(__dirname +  "/index.html");
});

app.get("/blog", (request, response) => {
    response.sendFile(__dirname + "/blog.html");
});

app.get("/blog/create", (request, response) => {
    response.sendFile(__dirname + "/newblog.html");
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
    writeToComments(req.body, "comments.json");
    res.redirect("/blog");
}

// write content sent by user to fileName
// if the file does not exist, just write
// if it does exist, append to existing data
function writeToComments(content, fileName) {
    let obj = {posts:[]};
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

function register(req, res) {
    registerUser(req.body, "db.json");
    res.redirect("/");

}

// no check for uniqueness in user names
function registerUser(content, fileName) {
    let registeredUser = {user: []};
    const plaintextPassword = content.pw;
    fs.exists(fileName, function(exists) {
        if (exists) {
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
                                console.log(err);
                            }
                        });
                    }
                });
            });
        } else {
            bcrypt.hash(plaintextPassword, saltRounds)
            .then(hash => {
                content.pw = hash;
                registeredUser.user = [content];
                let json = JSON.stringify(registeredUser);
                fs.writeFile(fileName, json, "utf-8", function(err) {
                    if (err) {
                        console.log(err);
                    }
                });
            });
        }
    })
}

app.post("/login", checkAuth);

async function checkAuth(req, res) {
    await compareData(req.body, "db.json", res);
}

function compareData(content, fileName, response) {
    const registeredUser = {user: []};
    const plaintextPassword = content.pw;
    let hashedPassword = "";
    fs.exists(fileName, function(exists) {
        if (exists) {
            const data = fs.readFileSync(fileName, "utf-8");
            const json = JSON.parse(data);
            // makes no check whatsoever for unique user names
            // stops at first match
            for (let i = 0; i < json.user.length; i++) {
                if (content.user == json.user[i].user) {
                    hashedPassword = json.user[i].pw;
                    break;
                }
            }

            bcrypt.compare(plaintextPassword, hashedPassword)
            .then(res => {
                let check = {result: ""};
                check.result = res;
                let strCheck = JSON.stringify(check);
                response.send(strCheck);
            })
            .catch(err => {
                console.log(err);
            })
        } else {
            return false;
        }
    });
}

// create server that is listening to a set port (above)
http.createServer(app).listen(port, () => {
    console.log(`Listening to port ${port}.`);
});
