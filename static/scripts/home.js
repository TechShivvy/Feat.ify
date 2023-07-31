const searchForm = document.getElementById("searchForm");
const searchInput = document.getElementById("searchInput");
const errorMessageElement = document.getElementById("errorMessage");
const searchResultsElement = document.getElementById("searchResults");
const serverResponseElement = document.getElementById("serverResponse");
const playlistContainer = document.getElementById("playlistContainer");

//everything starts to slide down parallely with sligt delay
// function showSections() {
//   // Use jQuery's when() to start all animations simultaneously with different delays
//   $.when(
//     $('#menuBar').slideDown({ duration: 500, start: 100 }),
//     $('.top-section').slideDown({ duration: 500, start: 200 }),
//     $('.middle-section').slideDown({ duration: 500, start: 300}),
//     $('.bottom-section').slideDown({ duration: 500, start: 400 })
//   ).done(function () {
//     // After all sections slide down, show the main content
//     $('.container').fadeIn(500);
//   });
// }

//everything slides down after the prev
function showSections() {
  $("#menuBar").slideDown(500, function () {
    $(".top-section").slideDown(500, function () {
      $(".waving-hand").fadeIn(500,()=>{
      $(".middle-section").slideDown(500, function () {
        $(".carousel-inner").fadeIn(500,()=>{
        $(".bottom-section").slideDown(500, function () {
          // $(".container").fadeIn(500);
        });
      });
    });
  });
});
});
}

// function showMenuBar() {
//   $('#menuBar').css('transform', 'translateY(0)'); // Slide the menu bar down
//   $('.container').css('padding', '50px');
// }

// function showSections() {
//   $('.top-section').slideDown(500, function () {
//     $('.middle-section').slideDown(500, function () {
//       $('.bottom-section').slideDown(500, function () {
//         // After the top section slides in, show the main content
//         $('.container').fadeIn(500, function () {
//           // After the main content fades in, show the menu bar
//           showMenuBar();
//         });
//       });
//     });
//   });
// }

function showMainContent() {
  // Fade out the loading text first
  $("#loadingText").css("animation", "fade-out 1s forwards");
  $(".loader rect").css("animation", "fade-out 1s forwards");
  $("#loadingScreen").slideUp(1000, showSections);
}

// Code to execute when the page is fully loaded
$(document).ready(function () {
  // Hide the main content and sections initially
  $(".top-section, .middle-section, .bottom-section").hide();
  // Simulate a loading delay of 2.5 seconds
  setTimeout(showMainContent, 1800);
});

function displayServerResponse(message, status) {
  serverResponseElement.textContent = message;
  serverResponseElement.classList.remove("ok", "error");
  serverResponseElement.classList.add(status);
}

searchForm.addEventListener("submit", async function (event) {
  event.preventDefault();
  const searchInputValue = searchInput.value;
  if (searchInputValue === "") {
    errorMessageElement.textContent = "Please enter an artist name.";
    return;
  } else {
    errorMessageElement.textContent = "";
    const data = { name: searchInputValue };
    const jsonData = JSON.stringify(data);

    try {
      const response = await fetch("/get_songs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: jsonData,
        // mode: "no-cors",
      });
      //   console.log("response: ", response);
      if (response.ok) {
        const responseData = await response.json();
        if (responseData.status === "ok") {
          // Open the authorization URL in a new window
          console.log("/get_songs success");
          console.log("Authorization URL opened");
          displayServerResponse(
            `Songs Extracted and ${responseData.message}`,
            "ok"
          );
          window.open(responseData.auth_url, "_blank");
        } else if (responseData.status === "error") {
          console.error("/get_songs failed:", responseData.error_message);
          console.error(responseData.message); // Additional error message from the server
          displayServerResponse(responseData.message, "error");
        } else {
          console.error("Unexpected response:", responseData);
          displayServerResponse("Request failed: " + response.status, "error");
        }
      } else {
        console.error("Request failed:", response.status);
        displayServerResponse("Request failed: " + response.status, "error");
      }
    } catch (error) {
      console.error("Error occurred:", error);
      displayServerResponse("Error occurred: " + error, "error");
    }
  }
});

// Add a new event listener to handle the response after authorization
window.addEventListener("message", function (event) {
  if (
    event.origin === window.location.origin &&
    event.data === "Authorization Successful"
  ) {
    // Authorization was successful, proceed to get the tracks
    getTracks();
  }
});

async function getTracks() {
  //Clear
  playlistContainer.innerHTML = "";

  // Disable all other elements on the page
  const disableDiv = document.createElement("div");
  disableDiv.style.position = "fixed";
  disableDiv.style.top = "0";
  disableDiv.style.left = "0";
  disableDiv.style.width = "100%";
  disableDiv.style.height = "100%";
  disableDiv.style.backgroundColor = "rgba(0, 0, 0, 0.5)"; // Semi-transparent black
  disableDiv.style.zIndex = "9999"; // Make sure it's on top of other elements
  document.body.appendChild(disableDiv);

  const overlay = document.createElement("div");
  overlay.classList.add("overlay2");
  overlay.textContent = "Getting tracks";
  document.body.appendChild(overlay);

  const messages = [
    "Fetching tracks",
    `${searchInput.value} has a lot of features`,
    `Taking a bit longer to process ${searchInput.value}`,
    `${searchInput.value} is an awesome artist`,
    `Hang on! ${searchInput.value}'s tracks are almost here`,
    `We appreciate your patience with ${searchInput.value}`,
  ];

  let messageIndex = 1;
  let dotsCount = 0;

  const displayDots = () => {
    const dots = [".", "..", "..."];
    overlay.textContent = `${messages[messageIndex]}${dots[dotsCount]}`;
    dotsCount = (dotsCount + 1) % dots.length;
  };

  const displayRandomMessage = () => {
    displayDots();
    messageIndex = (messageIndex + 1) % messages.length;
  };

  // Call displayRandomMessage immediately
  displayDots();
  // Call displayRandomMessage every 7 seconds (7000 milliseconds)
  const messageInterval = setInterval(displayRandomMessage, 6000);
  // Call displayDots every 1 second
  const dotsInterval = setInterval(displayDots, 1000);
  disableScroll();
  try {
    console.log("Sending request to /get_tracks...");
    const response = await fetch("/get_tracks");
    console.log("Response received from /get_tracks:", response);
    clearInterval(messageInterval);
    clearInterval(dotsInterval);
    if (response.ok) {
      console.log("Response is OK");
      const responseData = await response.json();
      if (responseData.status === "ok") {
        overlay.textContent = "Creating playlist, pls wait...";
        setTimeout(function() {
          overlay.textContent = responseData.message;
          addPlaylistIframe(responseData.playlist_id, "352");
        }, 10000);
      }else if (responseData.status === "partial") {
        overlay.textContent = "Creating playlist, pls wait...";
        setTimeout(function() {
          overlay.textContent = responseData.message;
          addErrorElement("Some tracks failed to add.");
          addPlaylistIframe(responseData.playlist_id, "352");
        }, 10000);
      } else if (responseData.status === "error") {
        overlay.textContent = responseData.message;
        addErrorElement(responseData.message);
      } else {
        overlay.textContent = "Unexpected response from the server.";
        addErrorElement("Unexpected response from the server.");
      }
    } else {
      console.error("Request failed:", response.status);
      overlay.textContent = "Request failed: " + response.status;
      addErrorElement("Request failed: " + response.status);
    }
  } catch (error) {
    console.error("Error occurred:", error);

    overlay.textContent = "Error occurred: " + error;
    const errorElement = document.createElement("div");
    errorElement.classList.add("text-danger");
    errorElement.innerHTML = overlay.textContent;
    playlistContainer.appendChild(errorElement);
  } finally {
    // Remove the overlay after a short delay
    setTimeout(() => {
      overlay.remove();
      disableDiv.remove();
      enableScroll();
    }, 10000);
  }
}
function addErrorElement(message) {
  overlay.textContent = message;
  const errorElement = document.createElement("div");
  errorElement.classList.add("text-danger");
  errorElement.innerHTML = message;
  playlistContainer.appendChild(errorElement);
}
function addPlaylistIframe(playlistId, height) {
  const playlistURL = `https://open.spotify.com/embed/playlist/${playlistId}?utm_source=generator`;
  const playlistIframe = document.createElement("iframe");
  playlistIframe.src = playlistURL;
  playlistIframe.width = "100%";
  playlistIframe.height = height;
  playlistIframe.frameBorder = "0";
  playlistIframe.allowFullscreen = true;
  playlistIframe.allow =
    "autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture";
  playlistIframe.loading = "lazy";
  playlistIframe.style.borderRadius = "12px";
  playlistContainer.appendChild(playlistIframe);
}

function fetchArtists(query) {
  if (query.length > 0) {
    fetch(`/search?query=${encodeURIComponent(query)}`)
      .then((response) => response.json())
      .then((data) => {
        var artists = data.artists;
        showSearchResults(artists);
      })
      .catch((error) => {
        console.error("Error occurred:", error);
      });
  } else {
    searchResultsElement.innerHTML = "";
  }
}

function showSearchResults(artists) {
  searchResultsElement.innerHTML = "";
  if (artists.length > 0) {
    var form = document.createElement("form");
    form.classList.add("list-group");
    artists.forEach(function (artist) {
      var item = document.createElement("button");
      item.classList.add("list-group-item");
      item.setAttribute("type", "button");
      item.setAttribute("name", "artist");
      item.value = artist;
      item.textContent = artist;
      item.addEventListener("click", function () {
        searchInput.value = artist;
        searchResultsElement.innerHTML = "";
      });
      form.appendChild(item);
    });
    searchResultsElement.appendChild(form);
  } else {
    searchResultsElement.innerHTML = "<p>No results found.</p>";
  }
}

searchInput.addEventListener("input", function () {
  var query = searchInput.value;
  fetchArtists(query);
});

searchInput.addEventListener("keydown", function (e) {
  var x = document.getElementById("searchResults");
  var items = x.querySelectorAll(".list-group-item");
  if (e.key === "ArrowDown") {
    e.preventDefault();
    var currentFocus = getCurrentFocusIndex();
    removeActive(items);
    currentFocus = (currentFocus + 1) % items.length;
    items[currentFocus].classList.add("active");
    ensureVisible(items[currentFocus]);
  } else if (e.key === "ArrowUp") {
    e.preventDefault();
    var currentFocus = getCurrentFocusIndex();
    removeActive(items);
    currentFocus = (currentFocus - 1 + items.length) % items.length;
    items[currentFocus].classList.add("active");
    ensureVisible(items[currentFocus]);
  } else if (e.key === "Enter") {
    e.preventDefault();
    var currentFocus = getCurrentFocusIndex();
    if (currentFocus > -1) {
      items[currentFocus].click();
    }
  }
});

function ensureVisible(item) {
  item.scrollIntoView({
    behavior: "smooth",
    block: "nearest",
    inline: "start",
  });
}

function getCurrentFocusIndex() {
  var x = document.getElementById("searchResults");
  var items = x.querySelectorAll(".list-group-item");
  for (var i = 0; i < items.length; i++) {
    if (items[i].classList.contains("active")) {
      return i;
    }
  }
  return -1;
}

function removeActive(x) {
  for (var i = 0; i < x.length; i++) {
    x[i].classList.remove("active");
  }
}
function disableScroll() {
  document.body.classList.add("disable-scroll");
}

// Function to remove the 'disable-scroll' class from the body
function enableScroll() {
  document.body.classList.remove("disable-scroll");
}