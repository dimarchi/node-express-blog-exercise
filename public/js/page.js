document.addEventListener("DOMContentLoaded", () => {

   console.log("DOM loaded.");

   const loginForm = document.querySelector(".login");
   const loginLink = document.querySelector(".login-link");
   const logoutButton = document.querySelector("#logoutbutton");
   const registerButton = document.querySelector("#registerbutton");

   loginLink.addEventListener("click", (event) => {
      event.preventDefault();
      loginForm.classList.contains("hideform") ? loginForm.classList.remove("hideform") : loginForm.classList.add("hideform");
   });

   const userNameElem = document.querySelector("#user");
   const passwordElem = document.querySelector("#pw");

   loginForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const userName = userNameElem.value.trim();
      const password = passwordElem.value.trim();
   
      let data = {
         user: userName,
         pw: password
      }
      checkLogin(data);

      return false;
   });

   // checks whether such user is registered and
   // responds accordingly, should do something else, as well?
   const checkLogin = (userData) => {
      return new Promise((resolve, reject) => {
         fetch("/login", {
            method: "POST",
            body: JSON.stringify(userData),
            headers: {
               'Accept': 'application/json',
               'Content-Type': 'application/json'
            }
         })
         .then(response => {
            response.json().then(data => {
               loginForm.classList.add("hideform");
               resolve(data);
               if (data.result == true) {
                  alert("Login successful.");
               } else {
                  alert("Login failed.");
               }
            })
         })
         .catch((err) => {
            reject(err);
         })
      })
   }

   logoutButton.addEventListener("click", (event) => {
      event.preventDefault();

      fetch("/logout")
      .then(response => {
         response.json().then(data => {
            loginForm.classList.add("hideform");
            if (data.result == false) {
               alert("You have been logged out.");
            } else {
               alert("Error!");
            }
         })
      })
      .catch(error => {
         console.log(error);
      })
   })
 
   // basically just enters the data to file, does nothing else
   // no reaction whether it succeeded in it or not
   // (should follow the above example, at the very least)
   registerButton.addEventListener("click", (event) => {
      event.preventDefault();
      const userName = userNameElem.value.trim();
      const password = passwordElem.value.trim();
   
      let data = {
         user: userName,
         pw: password
      }

      fetch("/register", {
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
         loginForm.classList.add("hideform");
         
      })
      .catch(error => {
         console.log(error);
      })
   })

   // https://www.quirksmode.org/js/cookies.html
   // cookie set, get, delete...modified, for future use
   const setCookie = (name, value, hours) => {
      let expires = "";
      if (hours) {
        let date = new Date();
        date.setTime(date.getTime() + (hours * 60 * 60 * 1000));
        expires = "; expires=" + date.toUTCString();
      }
      document.cookie = name + "=" + (value || "") + expires + "; path=/";
   }
    
   const getCookie = (name) => {
      let nameEQ = name + "=";
      let ca = document.cookie.split(';');
      for (let i = 0; i < ca.length; i++) {
         let c = ca[i];
         while (c.charAt(0) == ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length);
      }
      return null;
    }
   
   const eraseCookie = (name) => {
      createCookie(name,"",-1);
   }
});
