document.addEventListener("DOMContentLoaded", () => {

   console.log("DOM loaded.");
 
   // form and button elements
   const form = document.querySelector("#commentform");
   const submitButton = document.querySelector("#submitbutton");
   const resetButton = document.querySelector("#resetbutton");

   // elements for error messages
   const commenterError = document.querySelector("#nameerror");
   const commentError = document.querySelector("#posterror");
   const emailError = document.querySelector("#emailerror");
 
   // sending form data to server (and then loading comments)
   // customised form data, without it this would be simpler
   submitButton.addEventListener("click", (event) => {
      event.preventDefault();

       // get the user data
      const userCommenter = document.querySelector("#commenter").value.trim();
      const userComment = document.querySelector("#comment").value.trim();
      const userEmail = document.querySelector("#commemail").value.trim();
      const articleID = document.querySelector("#articleid").value.trim();

      let data = {
         name : userCommenter,
         email: userEmail,
         comment: userComment,
         article: articleID
      };
 
       fetch("/blog", {
         method: "POST",
         body: JSON.stringify(data),
         headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
         }
      })
      .then(response => {
          
      })
      .then(json => {
         // load comments again after posting
         loadComments();
         resetFormStuff();
      })
      .catch(error => {
         console.log(error);
      })
   });

   resetButton.addEventListener("click", () => {
      resetFormStuff();
   });

   const resetFormStuff = () => {
      // reset form to empty the fields
      form.reset();
      // reset error fields in case of errors
      commenterError.innerHTML = "&nbsp;";
      commentError.innerHTML = "&nbsp;";
      emailError.innerHTML = "&nbsp;";
   }

   // from https://stackoverflow.com/questions/5454235/shorten-string-without-cutting-words-in-javascript
   const shorten = (str, maxLen, separator = " ") => {
      if (str.length <= maxLen) return str;
      return str.substr(0, str.lastIndexOf(separator, maxLen));
   }

   // can be done with templating
   const loadArticles = () => {
      fetch("/articles")
      .then(data => data.json())
      .then(data => {
         const latestArticleParent = document.querySelector(".blog-entry");
         const otherArticles = document.querySelector(".other-entries");
         let articleID = document.querySelector("#articleid");

         const latestHeading = document.createElement("h2");
         const latestBody = document.createElement("p");

         while (latestArticleParent.children.length) {
             latestArticleParent.removeChild(latestArticleParent.lastChild);
         }

         while (otherArticles.children.length > 1) {
             otherArticles.removeChild(otherArticles.lastChild);
         }

          // latest blog post
          const latestArticle = data.articles.length - 1;
         if (latestArticle < 0) {
               latestHeading.innerHTML = "No blog entries"
               latestBody.innerHTML = "Please create a blog post.";
               latestArticleParent.append(latestHeading);
               latestArticleParent.append(latestBody);

               form.className = "noarticles";
               articleID.value = "";
         } else {
               latestHeading.innerHTML = data.articles[latestArticle].heading.trim();
               let artBody = data.articles[latestArticle].body.trim();

               let paragraphs = artBody.split(/\r?\n/);
               
               for (let i = 0; i < paragraphs.length; i++) {
                  let paragraph = document.createElement("p");
                  let paragraphText = document.createTextNode(paragraphs[i].trim());
                  paragraph.append(paragraphText);

                  latestBody.append(paragraph);
               }

               latestArticleParent.append(latestHeading);
               latestArticleParent.append(latestBody);

               // comments need this value
               articleID.value = data.articles[latestArticle].id;

               // without this the comments do not clear and if there were some
               // you could mistake them as comments of the latest blog entry
               loadComments();
         }

          // older blog posts
         if (latestArticle <= 0) {
             return;
         } else {
            // limit the number of blogs shown
            let count = 5; // zero based, so 5 means 6
            // actually should be latestArticle - 1 to disregard the latest
            // blog post
            for (let i = latestArticle; i >= 0; i--) {
               let article = document.createElement("article");

               if (i == latestArticle) {
                  article.setAttribute("title", "The latest blog post");
               }

               let olderHeading = document.createElement("h4");
               let olderBody = document.createElement("p");

               let headingText = document.createTextNode(data.articles[i].heading.trim());
               olderHeading.append(headingText);
               article.append(olderHeading);

               let artBody = data.articles[i].body.trim();
               artBody = shorten(artBody, 100); // should be done for heading, too...
               artBody += " ...";

               let paragraphs = artBody.split(/\r?\n/);

               
               for (let j = 0; j < paragraphs.length; j++) {
                  let paragraph = document.createElement("p");
                  let paragraphText = document.createTextNode(paragraphs[j].trim());
                  paragraph.append(paragraphText);

                  article.append(paragraph);
               }

               article.setAttribute("data-article-id", data.articles[i].id);
               otherArticles.append(article);

               article.addEventListener("click", getArticle);

               if (count == 0) {
                  return;
               } else {
                  count--;
               }
            }
         }
      });
  }

  const getArticle = (event) => {
     let article = event.target.getAttribute("data-article-id");
     if (article === null) {
        article = event.target.parentNode.getAttribute("data-article-id");
     }

     fetch(`/articles/${article}`)
     .then(data => data.json())
     .then(data => {
         const articleParent = document.querySelector(".blog-entry");
         const articleID = document.querySelector("#articleid");

         // equal to articleParent.innerHTML = "";
         while (articleParent.children.length) {
            articleParent.removeChild(articleParent.lastChild);
         }

         let articleHeading = document.createElement("h2");
         let articleHeadingBody = document.createTextNode(data.articles[0].heading.trim());
         articleHeading.append(articleHeadingBody);

         articleParent.append(articleHeading);

         let artBody = data.articles[0].body.trim();

         let paragraphs = artBody.split(/\r?\n/);
    
         for (let j = 0; j < paragraphs.length; j++) {
            let paragraph = document.createElement("p");
            let paragraphText = document.createTextNode(paragraphs[j].trim());
            paragraph.append(paragraphText);

           articleParent.append(paragraph);
        }

        // comments need this value
        articleID.value = data.articles[0].id;
        // loading selected article's comments
        loadComments();
     })
     .catch(error => {
         console.log(error);
     });
  }

   // function to load (article specific) comments
   const loadComments = () => {
      const articleID = document.querySelector("#articleid").value.trim();
      fetch(`/comments/${articleID}`)
      .then(data => data.json())
      .then(data => {
         // parent element of comments
         const commentParent = document.querySelector(".comments");
         // loop through all child elements (comments) and remove everything but the
         // first child (h3 element)
         while (commentParent.children.length > 1) {
            commentParent.removeChild(commentParent.lastChild);
         }

         // insert comments
         // can be done with templating, as well
         for (let i = 0; i < data.posts.length; i++) {
            let commentDiv = document.createElement("div");
            commentDiv.innerHTML = "<h4>" + data.posts[i].name.trim() + "</h4>";
            if (data.posts[i].email) {
               commentDiv.innerHTML += " (" + data.posts[i].email.trim() + ")";
            }

            let commentBody = data.posts[i].comment.trim();

            let paragraphs = commentBody.split(/\r?\n/);

            for (let j = 0; j < paragraphs.length; j++) {
               let paragraph = document.createElement("p");
               let paragraphText = document.createTextNode(paragraphs[j].trim());
               paragraph.append(paragraphText);

               commentDiv.append(paragraph);
            }
            commentParent.append(commentDiv);
         }
      });
   }
   
   // load articles and comments after page loads
   loadArticles();
   loadComments();
 });
