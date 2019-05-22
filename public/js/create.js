document.addEventListener("DOMContentLoaded", () => {

    console.log("DOM loaded.");

    const form = document.querySelector("#newblog");
    const submitButton = document.querySelector("#id");
    const resetButton = document.querySelector("#newresetbutton");

    const blogHeading = document.querySelector("#heading").value.trim();
    const blogBody = document.querySelector("#body").value.trim();

    const headingError = document.querySelector("#headingerror");
    const bodyError = document.querySelector("#bodyerror");

    submitButton.addEventListener("submit", (event) => {

        event.preventDefault();

        let formData = new FormData(form);
        formData.delete("newbutton");

        fetch("/blog/create", {
            method: "POST",
            body: formData
        })
        .then(response => {
            
        })
        .then(json => {
            // catch
            
        })
        .catch(error => {
            console.log(error);
        })
    });
})