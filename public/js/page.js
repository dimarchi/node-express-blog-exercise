document.addEventListener("DOMContentLoaded", () => {

   console.log("DOM loaded.");

   const loginForm = document.querySelector(".login");
   const loginLink = document.querySelector(".login-link");
   const logoutButton = document.querySelector("#logoutbutton");
   const revealButton = document.querySelector("#revealbutton");
   const registerButton = document.querySelector("#registerbutton");
   const fieldset = document.querySelector("#reg");

   // closing the form when clicked outside the form
   // or something other than the link that displays the form
   document.addEventListener("mouseup", (event) => {
      let elem = event.target.nodeName.toLowerCase();

      switch(elem) {
         case "form":
            break;
         case "input":
            break;
         case "button":
            break;
         case "select":
            break;
         case "fieldset":
            break;
         case "legend":
            break;
         default:
            loginForm.classList.add("hideform");
            fieldset.classList.remove("shown");
            fieldset.classList.add("hidden");
      }
   });

   loginLink.addEventListener("click", (event) => {
      event.preventDefault();
      if (loginForm.classList.contains("hideform")) {
         loginForm.classList.remove("hideform"); 
      }
      if (fieldset.classList.contains("shown"))  {
         fieldset.classList.remove("shown");
         fieldset.classList.add("hidden");
      }
   });

   const userNameElem = document.querySelector("#user");
   const passwordElem = document.querySelector("#pw");
   const firstNameElem = document.querySelector("#first");
   const lastNameElem = document.querySelector("#last");
   const emailElem = document.querySelector("#email");
   const streetElem = document.querySelector("#street");
   const postcodeElem = document.querySelector("#postcode");
   const cityElem = document.querySelector("#city");
   const countryElem = document.querySelector("#country");

   loginForm.addEventListener("submit", (event) => {
      event.preventDefault();
      loginForm.classList.add("hideform");

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
      loginForm.classList.add("hideform");

      return new Promise ((resolve, reject) => {
         const userName = userNameElem.value.trim();
         const password = passwordElem.value.trim();
         const firstName = firstNameElem.value.trim();
         const lastName = lastNameElem.value.trim();
         const emailAddr = emailElem.value.trim();
         const streetAddr = streetElem.value.trim();
         const postcodeAddr = postcodeElem.value.trim();
         const cityAddr = cityElem.value.trim();
         const countryAddr = countryElem.options[countryElem.selectedIndex].value;
         const countryName = countryElem.options[countryElem.selectedIndex].text;
      
         let data = {
            name: userName,
            pw: password,
            first: firstName,
            last: lastName,
            email: emailAddr,
            street: streetAddr,
            postcode: postcodeAddr,
            city: cityAddr,
            country: 
            {
               numeric: countryAddr,
               name: countryName
            }
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
            response.json().then(data => {
               resolve(data);
               if (data.result == true) {
                  alert("Registration was successful.");
               } else {
                  if (data.found == true) {
                     alert("User name already taken. Registration cancelled.");
                  } else {
                     alert("Registration failed.");
                  }
               }
            })
         })
         .catch(error => {
            reject(error);
         })
      });
   })

   revealButton.addEventListener("click", (event) => {
      event.preventDefault();
      if (fieldset.classList.contains("shown")) {
         fieldset.classList.replace("shown", "hidden");
      } else {
         fieldset.classList.replace("hidden", "shown");
      }

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
