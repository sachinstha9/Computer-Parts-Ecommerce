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
      document.getElementById("content").innerHTML = html;

      if (page === "dashboard") {
        clickProfile();
        dashboardViewAllOrders();
        clickShipping();
        clickWishlist();
        clickSettings();
        
        // Pass "dashboard" to render recent 3 items in a row layout
        renderWishlist("dashboard"); 
      } else if (page === "profile") {
        clickOrders();
      } else if (page === "wishlist") {
        
        // Pass "full" to render all items in the full card grid layout
        renderWishlist("full"); 
      }
    });
}

// Global entry point handling checks
const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);
const inner_page = urlParams.get("inner_page");

if (inner_page === "profile") { 
  loadPage("profile");
} else if (inner_page === "orders") { 
  loadPage("orders");
} else if (inner_page === "wishlist") {
  loadPage("wishlist");
} else if (inner_page === "settings") { 
  loadPage("settings");
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
// ==========================================
// --- UNIFIED WISHLIST RENDERING ENGINE ---
// ==========================================
async function renderWishlist(viewType = "dashboard") {
  const isDash = viewType === "dashboard";

  // 1. Assign target containers contextually based on active view type
  const container = isDash 
    ? document.querySelector(".dash-wishlist-items") 
    : document.getElementById("inner-page-wishlist-box");

  if (!container) return;
  container.innerHTML = "";

  // 2. Natively handle dashboard count text if applicable
  if (isDash) {
    const dashWishlistCountVal = document.querySelector(".dash-wishlist-count-val");
    if (dashWishlistCountVal) {
      dashWishlistCountVal.textContent = wishlist ? wishlist.length : 0;
    }
  }

  // 3. Handle empty states gracefully for both separate layouts
  if (!wishlist || wishlist.length === 0) {
    container.innerHTML = isDash 
      ? `<p class="dash-empty-msg">No items in your wishlist.</p>`
      : `<div class="full-wishlist-empty">
          <p>Your wishlist is currently empty.</p>
          <a href="/" class="wishlist-shop-btn">Continue Shopping</a>
         </div>`;
    return;
  }

  // 4. Filter array length constraint: Recent 3 items for dashboard, all for full page
  const itemsToRender = isDash ? wishlist.slice(-3).reverse() : wishlist;

  // 5. Build full view grid wrapper if rendering the standalone child page
  let appendTarget = container;
  if (!isDash) {
    const wishlistGrid = document.createElement("div");
    wishlistGrid.classList.add("wishlist-page-grid");
    container.appendChild(wishlistGrid);
    appendTarget = wishlistGrid;
  }

  // 6. Process item iteration loop execution cleanly
  for (const item of itemsToRender) {
    if (!item) continue;

    let productDetails = item;

    if (user.loggedIn) {
      try {
        productDetails = await getProductDetails(item);
        if (!productDetails) continue;
      } catch (err) {
        console.error(`Error resolving wishlist data parameters for ID ${item}:`, err);
        continue;
      }
    }

    const displayPrice = productDetails.price 
      ? (productDetails.price.toString().startsWith('$') ? productDetails.price : `$${productDetails.price}`) 
      : "$0.00";
    const displayImg = (productDetails.image && productDetails.image[0]) || "/images/placeholder.png";
    const displayTitle = productDetails.title || "Unknown Product";
    const productId = productDetails.id || item;

    // 7. Inject specific template blocks depending on the rendering flag context
    const element = document.createElement("div");
    
    if (isDash) {
      element.classList.add("dash-wishlist-row");
      element.innerHTML = `
        <div class="dash-wishlist-media">
          <img src="${displayImg}" alt="${displayTitle}">
          <div class="dash-wishlist-details">
            <a href="/productview/${productId}" class="dash-wishlist-title">${displayTitle}</a>
            <strong class="dash-wishlist-price">${displayPrice}</strong>
          </div>
        </div>
        <button class="dash-wishlist-remove-btn" title="Remove Item">×</button>
      `;
    } else {
      element.classList.add("wishlist-page-card");
      element.innerHTML = `
        <button class="wishlist-card-delete-btn" title="Remove Item">×</button>
        <div class="wishlist-card-img-holder">
          <img src="${displayImg}" alt="${displayTitle}">
        </div>
        <div class="wishlist-card-body">
          <h3 class="wishlist-card-title">${displayTitle}</h3>
          <span class="wishlist-card-price">${displayPrice}</span>
          <a href="/productview/${productId}" class="wishlist-card-view-link">View Details</a>
        </div>
      `;
    }

    appendTarget.appendChild(element);

    // 8. Unified Delete Action Listener Mapping
    const deleteBtn = element.querySelector(isDash ? ".dash-wishlist-remove-btn" : ".wishlist-card-delete-btn");
    deleteBtn.addEventListener("click", async (e) => {
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

      // Sync all header components
      updateWishlistCount();
      await showWishlistPreview();
      
      // Recursive call automatically maintains the current view state framework smoothly
      await renderWishlist(viewType);
    });
  }
}