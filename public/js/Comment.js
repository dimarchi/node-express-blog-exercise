const fs = require("fs");

class Comment {
    getArticleComments(request, response, next, fileName) {
        fs.exists(fileName, function(exists) {
            let obj = {posts:[]};
            if (exists) {
                const data = fs.readFileSync(fileName, "utf-8");
                const json = JSON.parse(data);
                for(let i = 0; i < json.posts.length; i++) {
                    if (request.params.article == json.posts[i].article) {
                        obj.posts = [...obj.posts, json.posts[i]];
                    }
                }
                response.send(obj);
                next();
            } else {
                response.send(obj);
                next();
            }
        })
    }

    // write content sent by user to fileName
    // if the file does not exist, just write
    // if it does exist, append to existing data
    writeComment(request, fileName) {
        let content = request.body;
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
}

module.exports = Comment;