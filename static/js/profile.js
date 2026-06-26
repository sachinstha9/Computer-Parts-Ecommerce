import {
  wishlist,
  updateWishlistCount,
  showWishlistPreview,
} from "./header.js";
import getProductDetails from "./get-product-details.js";
import getUser from "./get-user.js";

// get user data global for this page
const user = (await getUser()) || {};

// sidebar open close logic
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

// load different page inside profile without refresh
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

        // render the widgets
        renderDashboardOrders();
        renderWishlist("dashboard");
      } else if (page === "profile") {
        // setup form save
        initializeProfileFormHandler();
      } else if (page === "wishlist") {
        // show all item in grid layout
        renderWishlist("full");
      } else if (page == "orders") {
        renderFullOrdersPage();
      }
    });
}

// check url to see what page to load first
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

// button clicks to change page
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

// render wishlist items
async function renderWishlist(viewType = "dashboard") {
  const isDash = viewType === "dashboard";

  // get correct box for wishlist
  const container = isDash
    ? document.querySelector(".dash-wishlist-items")
    : document.getElementById("inner-page-wishlist-box");

  if (!container) return;
  container.innerHTML = "";

  // update count text
  if (isDash) {
    const dashWishlistCountVal = document.querySelector(
      ".dash-wishlist-count-val",
    );
    if (dashWishlistCountVal) {
      dashWishlistCountVal.textContent = wishlist ? wishlist.length : 0;
    }
  }

  // show empty text if no item
  if (!wishlist || wishlist.length === 0) {
    container.innerHTML = isDash
      ? `<p class="dash-empty-msg">No items in your wishlist.</p>`
      : `<div class="full-wishlist-empty">
          <p>Your wishlist is currently empty.</p>
          <a href="/" class="wishlist-shop-btn">Continue Shopping</a>
         </div>`;
    return;
  }

  // only show 3 item for dashboard
  const itemsToRender = isDash ? wishlist.slice(-3).reverse() : wishlist;

  // make wrapper if it full page
  let appendTarget = container;
  if (!isDash) {
    const wishlistGrid = document.createElement("div");
    wishlistGrid.classList.add("wishlist-page-grid");
    container.appendChild(wishlistGrid);
    appendTarget = wishlistGrid;
  }

  for (const item of itemsToRender) {
    if (!item) continue;

    let productDetails = item;

    if (user.loggedIn) {
      try {
        productDetails = await getProductDetails(item);
        if (!productDetails) continue;
      } catch (err) {
        console.error(`error loading item ${item}:`, err);
        continue;
      }
    }

    const displayPrice = productDetails.price
      ? productDetails.price.toString().startsWith("$")
        ? productDetails.price
        : `$${productDetails.price}`
      : "$0.00";
    const displayImg =
      (productDetails.image && productDetails.image[0]) ||
      "/images/placeholder.png";
    const displayTitle = productDetails.title || "Unknown Product";
    const productId = productDetails.id || item;

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

    // delete item button logic
    const deleteBtn = element.querySelector(
      isDash ? ".dash-wishlist-remove-btn" : ".wishlist-card-delete-btn",
    );
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
        }).catch((err) => console.error(err));

        if (response && response.ok) {
          wishlist.splice(globalIndex, 1);
        }
      }

      // update header counts
      updateWishlistCount();
      await showWishlistPreview();

      // reload list again
      await renderWishlist(viewType);
    });
  }
}

function initializeProfileFormHandler() {
  const form = document.getElementById("editable-profile-form");
  const feedback = document.getElementById("form-feedback-msg");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    feedback.textContent = "Processing updates...";
    feedback.className = "";

    const formData = new FormData(form);
    const dataPayload = Object.fromEntries(formData.entries());

    // checking form inputs
    const currentPass = dataPayload.current_password;
    const newPass = dataPayload.new_password;
    const confirmPass = dataPayload.confirm_password;

    // if user try to change pass
    if (newPass || confirmPass || currentPass) {
      if (!currentPass) {
        feedback.textContent =
          "× Current password is required to verify changes.";
        feedback.className = "error";
        return;
      }
      if (newPass !== confirmPass) {
        feedback.textContent = "× New password fields do not match.";
        feedback.className = "error";
        return;
      }
      if (newPass.length < 6) {
        feedback.textContent = "× New password must be at least 6 characters.";
        feedback.className = "error";
        return;
      }
    }

    // send data to backend
    try {
      const response = await fetch("/update_profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dataPayload),
      });

      const responseData = await response.json().catch(() => ({}));

      if (response.ok) {
        feedback.textContent = "✓ Account details synchronized successfully!";
        feedback.className = "success";

        // clear input after success
        form.querySelector("#current_password").value = "";
        form.querySelector("#new_password").value = "";
        form.querySelector("#confirm_password").value = "";
      } else {
        feedback.textContent =
          responseData.message || "× Verification failed. Check parameters.";
        feedback.className = "error";
      }
    } catch (err) {
      console.error("error submitting:", err);
      feedback.textContent = "× Connection lost. Try again.";
      feedback.className = "error";
    }
  });
}

// render order in dashboard
function renderDashboardOrders() {
  const ordersContainer = document.getElementById(
    "dash-recent-orders-container",
  );
  if (!ordersContainer) return;

  ordersContainer.innerHTML = "";

  // get order from user string
  let rawOrders = user["orders"] || [];
  let ordersArr =
    typeof rawOrders === "string" ? JSON.parse(rawOrders || "[]") : rawOrders;

  if (!ordersArr || ordersArr.length === 0) {
    ordersContainer.innerHTML = `<p class="dash-empty-msg">No previous orders yet.</p>`;
    return;
  }

  // grab up to 3 for recent
  const recentOrders = ordersArr.slice(-3).reverse();

  recentOrders.forEach((order, idx) => {
    // use idx so id dont crash
    const transId = order.transaction_id
      ? order.transaction_id
      : `ORDER-${idx}`;
    const orderDate = order.date ? order.date.split(" ")[0] : "N/A";
    const totalPaid = order.total_paid
      ? parseFloat(order.total_paid).toFixed(2)
      : "0.00";
    const statusText = order.status || "Paid";
    const isDelivered = order.delivered === "1";

    const row = document.createElement("div");
    row.classList.add("order-row");
    row.setAttribute("data-row-index", idx);

    row.innerHTML = `
      <span class="order-id">#${transId}</span>
      <span class="order-date">${orderDate}</span>
      <span class="order-total">$${totalPaid}</span>
      <span class="status-badge ${isDelivered ? "status-delivered" : "status-paid"}">
        ${isDelivered ? "Delivered" : statusText}
      </span>
    `;

    ordersContainer.appendChild(row);
  });
}

// render all order on full page
function renderFullOrdersPage() {
  const container = document.getElementById("full-orders-container");
  if (!container) return;

  container.innerHTML = "";

  let rawOrders = user["orders"] || [];
  let ordersArr =
    typeof rawOrders === "string" ? JSON.parse(rawOrders || "[]") : rawOrders;

  // if no orders found
  if (!ordersArr || ordersArr.length === 0) {
    container.innerHTML = `
      <div class="full-orders-empty">
        <p>You haven't placed any orders yet.</p>
        <a href="/" class="orders-shop-btn">Start Shopping</a>
      </div>`;
    return;
  }

  // render all of them
  const allOrders = ordersArr.slice().reverse();

  const ordersGrid = document.createElement("div");
  ordersGrid.classList.add("orders-page-grid");

  allOrders.forEach((order, index) => {
    const transId = order.transaction_id
      ? order.transaction_id
      : `ORDER-${index}`;
    const shortTransId = transId.substring(0, 12);
    const orderDate = order.date ? order.date : "N/A";
    const totalPaid = order.total_paid
      ? parseFloat(order.total_paid).toFixed(2)
      : "0.00";
    const statusText = order.status || "Paid";
    const isDelivered = order.delivered === "1";

    // item counts for display
    const itemCount = order.items ? order.items.length : 0;
    const itemText = itemCount === 1 ? "1 Item" : `${itemCount} Items`;

    const card = document.createElement("div");
    card.classList.add("order-page-card");

    card.innerHTML = `
      <div class="order-card-body">
        <div class="order-card-info">
          <h3 class="order-card-title">Order #${shortTransId}</h3>
          <span class="order-card-date">${orderDate} • ${itemText}</span>
        </div>
        
        <div class="order-card-status">
          <span class="status-badge ${isDelivered ? "status-delivered" : "status-paid"}">
            ${isDelivered ? "Delivered" : statusText}
          </span>
        </div>
        
        <div class="order-card-price">$${totalPaid}</div>
        
      </div>
    `;
    ordersGrid.appendChild(card);
  });

  container.appendChild(ordersGrid);
}
