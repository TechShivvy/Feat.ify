document.addEventListener("DOMContentLoaded", () => {
  sessionStorage.setItem("currentPage", "form");
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
  const username = document.getElementById("username").value.trim();
  console.log(username);
  const email = document.getElementById("femail").value.trim();
  console.log(email);
  const age = document.getElementById("fage").value.trim();
  console.log(age);

  // Create a JSON object with the form data
  const formData = {
    username: username,
    email: email,
    age: age,
  };

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
      console.log(data);
      fadeWelcome();
    })
    .catch((error) => {
      console.error("Error submitting form:", error);
    });
}

function fadeWelcome() {
  const welcomeMessage = document.querySelector(".c-welcome");
  const skipfucks = document.querySelector(".SkipShit");
  welcomeMessage.classList.add("fadeOut");
  skipfucks.classList.add("fadeOut");
  setTimeout(function () {
    // Hide the welcome message and skipWelcome elements after the delay
    welcomeMessage.style.display = "none";
    skipfucks.style.display = "none";

    // Redirect to index.html after the animation is complete
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
    window.location.href = "home";
  }, 1000);
}

function reloadPageOnBack() {
  // Check if the current page identifier in sessionStorage matches 'form'
  const currentPage = sessionStorage.getItem("currentPage");
  if (currentPage !== "form") {
    // If it doesn't match, reload the page to start fresh
    sessionStorage.removeItem("currentPage");
    window.location.reload();
  }
}

window.onpageshow = reloadPageOnBack;
