const fs = require("fs");

class Article {
    getSingleArticle(request, response, next, fileName) {
        fs.exists(fileName, function(exists) {
            let obj = {articles:[]};
            if (exists) {
                const data = fs.readFileSync(fileName,"utf-8");
                const json = JSON.parse(data);
                for (let i = 0; i < json.articles.length; i++) {
                    if (request.params.article  == json.articles[i].id) {
                        obj.articles = [...obj.articles, json.articles[i]];
                    }
                }
                response.send(obj);
                next();
            } else {
                response.send(obj);
                next();
            }
        });
    }

    // get ALL articles (not efficient, should limit to n)
    // also article body in its entirety, should limit in
    // all cases but the latest (done client side, but should
    // be done here)
    getAllArticles(response, fileName) {
        fs.exists(fileName, function(exists) {
            if (exists) {
                const data = fs.readFileSync(fileName,"utf-8");
                response.send(data);
            } else {
                let obj = {articles:[]};
                response.send(obj);
            }
        });
    }

    writeArticle(request, fileName) {
        let content = request.body;
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
}

module.exports = Article;