// ==========================================
// --- IMPORTS & CORE SESSION INITIALIZATION ---
// ==========================================
import { wishlist, updateWishlistCount, showWishlistPreview } from "./header.js";
import getProductDetails from "./get-product-details.js";
import getUser from "./get-user.js";

// Initialize authenticated user state globally for this module
const user = (await getUser()) || {};

// ==========================================
// --- SIDEBAR NAVIGATION INTERFACES ---
// ==========================================
const sidebar = document.querySelector(".sidebar");
const sidebarToggler = document.querySelector(".sidebar-toggler");
const menuToggler = document.querySelector(".menu-toggler");

let collapsedSidebarHeight = "56px"; 
let fullSidebarHeight = "calc(100vh - 32px)"; 

if (sidebarToggler && sidebar) {
  sidebarToggler.addEventListener("click", () => {
    sidebar.classList.toggle("collapsed");
  });
}

const toggleMenu = (isMenuActive) => {
  if (!sidebar || !menuToggler) return;
  sidebar.style.height = isMenuActive
    ? `${sidebar.scrollHeight}px`
    : collapsedSidebarHeight;
  menuToggler.querySelector("span").innerText = isMenuActive ? "close" : "menu";
};

if (menuToggler) {
  menuToggler.addEventListener("click", () => {
    toggleMenu(sidebar.classList.toggle("menu-active"));
  });
}

window.addEventListener("resize", () => {
  if (!sidebar) return;
  if (window.innerWidth >= 1024) {
    sidebar.style.height = fullSidebarHeight;
  } else {
    sidebar.classList.remove("collapsed");
    sidebar.style.height = "auto";
    toggleMenu(sidebar.classList.contains("menu-active"));
  }
});

// ==========================================
// --- DYNAMIC ROUTING & PAGE LOADER ---
// ==========================================
function loadPage(page) {
  fetch(`/profile/${page}`)
    .then((response) => response.text())
    .then((html) => {
      // Inject the incoming sub-page markup segment
      document.getElementById("content").innerHTML = html;

      // Conditional initialization based on active structural context
      if (page === "dashboard") {
        clickProfile();
        dashboardViewAllOrders();
        clickShipping();
        clickWishlist();
        clickSettings();
        // Triggers beautifully now that elements exist inside the DOM tree
        renderDashboardWishlist(); 
      } else if (page === "profile") {
        if (typeof clickOrders === "function") clickOrders();
      } else if (page === "wishlist") {
        if (typeof loadItems === "function") loadItems();
      }
    })
    .catch(err => console.error(`Error streaming page layout fragment: ${page}`, err));
}

// Global entry point handling checks
const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);
const inner_page = urlParams.get("inner_page");

if (inner_page === "wishlist") {
  loadPage("wishlist");
} else if (inner_page === "profile") { 
  loadPage("profile");
} else {
  loadPage("dashboard");
}

// ==========================================
// --- DASHBOARD INTER-LINK EVENT BINDERS ---
// ==========================================
function clickProfile() {
  document.getElementById("view_profile")?.addEventListener("click", (e) => {
    e.preventDefault();
    loadPage("profile");
  });
}

function dashboardViewAllOrders() {
  document.getElementById("view-all-orders")?.addEventListener("click", (e) => {
    e.preventDefault();
    loadPage("orders");
  });
}

function clickShipping() {
  document.getElementById("view_shipping")?.addEventListener("click", (e) => {
    e.preventDefault();
    loadPage("profile");
  });
}

function clickWishlist() {
  document.getElementById("view_wishlist")?.addEventListener("click", (e) => {
    e.preventDefault();
    loadPage("wishlist");
  });
}

function clickSettings() {
  document.getElementById("view_settings")?.addEventListener("click", (e) => {
    e.preventDefault();
    loadPage("settings");
  });
}


// ==========================================
// --- ASYNC DASHBOARD WISHLIST RENDERING ---
// ==========================================
async function renderDashboardWishlist() {
  // FIX: Element query selectors run contextually inside execution frame loop
  const dashWishlistContainer = document.querySelector(".dash-wishlist-items");
  const dashWishlistCountVal = document.querySelector(".dash-wishlist-count-val");

  if (!dashWishlistContainer) return;
  dashWishlistContainer.innerHTML = "";

  // Synchronize count visual displays natively
  if (dashWishlistCountVal) {
    dashWishlistCountVal.textContent = wishlist ? wishlist.length : 0;
  }

  if (!wishlist || wishlist.length === 0) {
    dashWishlistContainer.innerHTML = `<p class="dash-empty-msg">No items in your wishlist.</p>`;
    return;
  }

  // Preview only the 3 most recent entries
  const recentWishlistItems = wishlist.slice(-3).reverse();

  for (const item of recentWishlistItems) {
    if (!item) continue;

    let productDetails = item;

    if (user.loggedIn) {
      try {
        productDetails = await getProductDetails(item);
        if (!productDetails) continue;
      } catch (err) {
        console.error(`Error resolving dashboard wishlist item details for ID ${item}:`, err);
        continue;
      }
    }

    const displayPrice = productDetails.price 
      ? (productDetails.price.toString().startsWith('$') ? productDetails.price : `$${productDetails.price}`) 
      : "$0.00";
    const displayImg = (productDetails.image && productDetails.image[0]) || "/images/placeholder.png";
    const displayTitle = productDetails.title || "Unknown Product";
    const productId = productDetails.id || item;

    const row = document.createElement("div");
    row.classList.add("dash-wishlist-row");
    row.innerHTML = `
      <div class="dash-wishlist-media">
        <img src="${displayImg}" alt="${displayTitle}">
        <div class="dash-wishlist-details">
          <a href="/productview/${productId}" class="dash-wishlist-title">${displayTitle}</a>
          <strong class="dash-wishlist-price">${displayPrice}</strong>
        </div>
      </div>
      <button class="dash-wishlist-remove-btn" title="Remove Item">×</button>
    `;

    dashWishlistContainer.appendChild(row);

    const removeBtn = row.querySelector(".dash-wishlist-remove-btn");
    removeBtn.addEventListener("click", async (e) => {
      e.stopPropagation();

      const globalIndex = wishlist.indexOf(item);
      if (globalIndex === -1) return;

      if (!user.loggedIn) {
        wishlist.splice(globalIndex, 1);
        localStorage.setItem("wishlist", JSON.stringify(wishlist));
      } else {
        const response = await fetch("/remove_wishlist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: productId }),
        }).catch(err => console.error(err));

        if (response && response.ok) {
          wishlist.splice(globalIndex, 1);
        }
      }

      // Re-trigger global structural counts and panel refreshes smoothly
      updateWishlistCount();
      await showWishlistPreview();
      await renderDashboardWishlist();
    });
  }
}