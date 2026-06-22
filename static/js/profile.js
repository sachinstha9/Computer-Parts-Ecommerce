const sidebar = document.querySelector(".sidebar");
const sidebarToggler = document.querySelector(".sidebar-toggler");
const menuToggler = document.querySelector(".menu-toggler");
// Ensure these heights match the CSS sidebar height values
let collapsedSidebarHeight = "56px"; // Height in mobile view (collapsed)
let fullSidebarHeight = "calc(100vh - 32px)"; // Height in larger screen
// Toggle sidebar's collapsed state
sidebarToggler.addEventListener("click", () => {
  sidebar.classList.toggle("collapsed");
});
// Update sidebar height and menu toggle text
const toggleMenu = (isMenuActive) => {
  sidebar.style.height = isMenuActive
    ? `${sidebar.scrollHeight}px`
    : collapsedSidebarHeight;
  menuToggler.querySelector("span").innerText = isMenuActive ? "close" : "menu";
};
// Toggle menu-active class and adjust height
menuToggler.addEventListener("click", () => {
  toggleMenu(sidebar.classList.toggle("menu-active"));
});
// (Optional code): Adjust sidebar height on window resize
window.addEventListener("resize", () => {
  if (window.innerWidth >= 1024) {
    sidebar.style.height = fullSidebarHeight;
  } else {
    sidebar.classList.remove("collapsed");
    sidebar.style.height = "auto";
    toggleMenu(sidebar.classList.contains("menu-active"));
  }
});

// Function to load the pages onto profile.html from
// The 'profile-pages' folder in templates.

function loadPage(page) {
  fetch(`/profile/${page}`)
    .then((response) => response.text())
    .then((html) => {
      document.getElementById("content").innerHTML = html;

      if (page == "dashboard") {
        clickProfile();
        dashboardViewAllOrders();
        clickShipping();
        clickWishlist();
        clickSettings();
      } else if (page == "profile") {
        clickOrders();
      }
    });
}

// Checks what button is clicked, and what it should display
// These 'pages' will be viewed as a part of the initial 'profile' page
// and will be displayed in the remaining space in the middle of the screen
// leaving the sidenav at the side where it belongs.

loadPage("dashboard");

document.querySelector("#dashboard-btn").addEventListener("click", () => {
  // Display Dashboard
  loadPage("dashboard");
});

document.querySelector("#orders-btn").addEventListener("click", () => {
  // Display Orders
  loadPage("orders");
});

document.querySelector("#profile-btn").addEventListener("click", () => {
  // Display Profile
  loadPage("profile");
});

document.querySelector("#wishlist-btn").addEventListener("click", () => {
  // Display Wishlist
  loadPage("wishlist");
});

document.querySelector("#settings-btn").addEventListener("click", () => {
  // Display Settings
  loadPage("settings");
});

function dashboardLoadProfile() {
  document.getElementById("view_profile").addEventListener("click", () => {
    loadPage("profile");
  });
}

function clickProfile() {
  document.getElementById("view_profile").addEventListener("click", () => {
    loadPage("profile");
  });
}

function dashboardViewAllOrders() {
  document.getElementById("view-all-orders").addEventListener("click", () => {
    loadPage("orders");
  });
}

function clickShipping() {
  document.getElementById("view_shipping").addEventListener("click", () => {
    loadPage("profile");
  });
}

function clickWishlist() {
  document.getElementById("view_wishlist").addEventListener("click", () => {
    loadPage("wishlist");
  });
}

function clickSettings() {
  document.getElementById("view_settings").addEventListener("click", () => {
    loadPage("settings");
  });
}