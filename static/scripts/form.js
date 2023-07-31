document.addEventListener("DOMContentLoaded", () => {
  document
    .getElementById("submitButton")
    .addEventListener("click", function (event) {
      submitFormWithDelay();
    });
  document
    .getElementById("registrationForm")
    .addEventListener("submit", function (event) {
      event.preventDefault();
    });
});
async function submitFormWithDelay() {
  // Collect user input
  const username = document.getElementById("username").value.trim();
  console.log(username);
  const email = document.getElementById("femail").value.trim();
  console.log(email);
  const age = document.getElementById("fage").value.trim(); // Corrected to "fage"
  console.log(age);

  // Create a JSON object with the form data
  const formData = {
    username: username,
    email: email,
    age: age,
  };

  // Send the form data to the '/register' endpoint using fetch API
  await fetch("/register", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(formData),
  })
    .then((response) => response.json())
    .then((data) => {
      console.log("Form submitted!");
      console.log(data); // Print the response from the server
      fadeWelcome();
    })
    .catch((error) => {
      console.error("Error submitting form:", error);
    });
}

//   function submitFormWithDelay() {
//   const registrationForm = document.getElementById("registrationForm");
//   registrationForm.submit();
// }

// function submitFormWithDelay() {
//   const registrationForm = document.getElementById("registrationForm");

//   // Collect user input (if needed)
//   const username = document.getElementById("username").value;
//   const email = document.getElementById("femail").value;
//   const password = document.getElementById("fpass").value;

//   console.log(username);
//   console.log(email);
//   console.log(password);

//   // Replace this with your desired delay in milliseconds (e.g., 2000 for 2 seconds)
//   const delay = 2000;

//   // Add the delay using setTimeout
//   setTimeout(function () {
//     // Submit the form programmatically
//     registrationForm.submit();

//     window.location.href = "index.html";
//   }, delay);
// }

function fadeWelcome() {
  const welcomeMessage = document.querySelector(".c-welcome");
  welcomeMessage.classList.add("fadeOut");
  setTimeout(function () {
    // Hide the welcome message and skipWelcome elements after the delay
    welcomeMessage.style.display = "none";

    // // Redirect to index.html after the animation is complete
    window.location.href = "home";
  }, 2000); // Wait for 1 second (same as fadeOut animation duration) before hiding the elements and redirecting
}

function skipStep() {
  const formContainer = document.querySelector(".c-formContainer");
  const skipText = document.getElementById("skipText");
  const skipButton = document.getElementById("skipButton");
  formContainer.style.animation = "fadeOut 1s ease";
  skipText.style.animation = "fadeOut 1s ease";
  skipButton.style.animation = "fadeOut 1s ease";
  setTimeout(function () {
    formContainer.style.display = "none";
    skipText.style.display = "none";
    skipButton.style.display = "none";
    window.location.href = "home"; // Replace 'index.html' with the path to your desired HTML file
  }, 1000);
}
