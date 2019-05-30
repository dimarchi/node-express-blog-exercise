const fs = require("fs");
const express = require("express");
const session = require("express-session");
const bcrypt = require("bcrypt");

class User {
    getUser(request, response, fileName) {
        let singleUser = request.params.user;
        let obj = {user: []};
        const file = fileName;
        fs.exists(file, function(exists) {
            if (exists) {
                fs.readFile(file, "utf-8", function(err, data) {
                    if (err) {
                        console.log("user ", err);
                    }
                    
                    const json = JSON.parse(data);
                    for (let i = 0; i < json.user.length; i++) {
                        if (json.user[i].name == singleUser) {
                            obj.user = [...obj.user, json.user[i]];
                            break;
                        }
                    }
                response.render("pages/user.ejs", {logged: request.session.name, user: obj});
                });
            }
        });
    }

    // only registration with unique user names allowed
    registerUser(request, response, fileName) {
        let content = request.body;
        let registeredUser = {user: []};

        // bcrypt stuff
        const saltRounds = 10;

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
        });
    }

    login(request, response, fileName) {
        const content = request.body;
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

    logout(request, response) {
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
    }
}

module.exports = User;