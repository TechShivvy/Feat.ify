function addTryBox() {
    const tryButton = document.querySelector(".try-button");
    const tryBox = tryButton.querySelector(".try-box");
    tryBox.style.display = "block";
  }

  function removeTryBox() {
    const tryButton = document.querySelector(".try-button");
    const tryBox = tryButton.querySelector(".try-box");
    tryBox.style.display = "none";
  }

  function fadeAndNavigate() {
    const mainContainer = document.getElementById("mainContainer");
    mainContainer.style.animation = "fadeOutContent 1s ease"; // Apply the fade-out animation

    setTimeout(() => {
      mainContainer.style.display = "none"; // Hide the main content after fade-out animation is complete
      window.location.href = "form"; // Navigate to 'form.html' after removing the main content
    }, 1000); // Wait for 1 second (same as fadeOutContent animation duration) before navigating
  }

  // Attach click event listener to the "Try" button
  const tryButton = document.querySelector(".try-button");
  tryButton.addEventListener("click", () => {
    addTryBox(); // Show the try box on click (if needed)
    fadeAndNavigate(); // Trigger the fade-out and navigation logic on click
  });

  // Simulate a loading delay and reveal the main content
  const loadingContainer = document.getElementById("loadingContainer");
  const mainContainer = document.getElementById("mainContainer");

  // Hide the loading screen after the initial delay
  setTimeout(() => {
    loadingContainer.style.animation = "fadeOutLoading 1s ease"; // Apply the fade-out animation to the loading screen

    setTimeout(() => {
      loadingContainer.style.display = "none"; // Hide the loading screen

      mainContainer.style.opacity = 1; // Show the main content
    }, 1000); // Wait for 1 second (same as fadeOutLoading animation duration) before hiding the loading screen
  }, 3000); // Show the loading screen for 3 seconds (adjust as needed)