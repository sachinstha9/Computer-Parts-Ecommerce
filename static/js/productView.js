import {
  updateCartCount,
  showCartPreview,
  saveCart,
  cart,
  wishlist,
  saveWishlist,
  updateWishlistCount,
  showWishlistPreview,
} from "./header.js";
import getUser from "./get-user.js";

let user = (await getUser()) || {};
let currentUrl = window.location.href;
let productId = currentUrl.split("/");
const btnAddToCart = document.querySelector("#add-to-cart");

const wishListAddButton = document.querySelector(
  "#product-view-title-wrapper button",
);
const wishListAddButtonIcon = document.querySelector(
  "#product-view-title-wrapper button i",
);

const productName = document.querySelector("#product-view-title").textContent;
const productPrice = document.querySelector("#product-view-price").textContent;
const productImage = document.querySelector("#product-view-img-src");
const productImageSrc = productImage.src;

// Add to Cart
btnAddToCart.addEventListener("click", () => {
  const existingProduct = cart.find((item) => item.name === productName);
  let currentUrl = window.location.href;
  let productId = currentUrl.split("/");

  if (existingProduct) {
    existingProduct.quantity++;
  } else {
    cart.push({
      id: productId[productId.length - 1],
      name: productName,
      price: productPrice,
      image: productImageSrc,
      quantity: 1,
    });
  }

  saveCart();
  updateCartCount();
  showCartPreview();

  btnAddToCart.innerHTML =
    '<i class="fa fa-check" aria-hidden="true"></i> Added to Cart';
  btnAddToCart.disabled = true;

  setTimeout(() => {
    btnAddToCart.innerHTML =
      '<i class="fa fa-shopping-cart" aria-hidden="true"></i> Add to Cart';
    btnAddToCart.disabled = false;
  }, 800);
});

if (!user["loggedIn"]) {
  const existingProduct = wishlist.find((item) => item.title === productName);  

  if (existingProduct) {
    wishListAddButtonIcon.classList.remove("fa-heart-o");
    wishListAddButtonIcon.classList.add("fa-heart");
    wishListAddButtonIcon.classList.add("add-red");
  }
} else {
  let userWishlist = user["wishlist"];

  if (userWishlist.includes(productId[productId.length - 1])) {
    wishListAddButtonIcon.classList.remove("fa-heart-o");
    wishListAddButtonIcon.classList.add("fa-heart");
    wishListAddButtonIcon.classList.add("add-red");
  }
}

// Add / Remove Wishlist
wishListAddButton.addEventListener("click", async () => {
  user = (await getUser()) || {};
  const prodId = productId[productId.length - 1]; // Cache the product ID

  if (wishListAddButtonIcon.classList.contains("fa-heart-o")) {
    // --- ADD TO WISHLIST ---
    wishListAddButtonIcon.classList.remove("fa-heart-o");
    wishListAddButtonIcon.classList.add("fa-heart");
    wishListAddButtonIcon.classList.add("add-red");

    if (!user["loggedIn"]) {
      // Logged Out: Save full object to localStorage
      const existingProduct = wishlist.find((item) => item.title === productName);

      if (!existingProduct) {
        wishlist.push({
          id: prodId,
          title: productName,
          price: productPrice,
          image: [productImageSrc],
        });
      }
      saveWishlist(); // Only sync localStorage when logged out
    } else {
      // Logged In: Push string ID to local array and sync with DB
      if (!wishlist.includes(prodId)) {
        wishlist.push(prodId); 
        
        fetch("/add_wishlist", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ id: prodId }),
        }).then((response) => response.text());
      }
    }

  } else {
    // --- REMOVE FROM WISHLIST ---
    wishListAddButtonIcon.classList.remove("fa-heart");
    wishListAddButtonIcon.classList.remove("add-red");
    wishListAddButtonIcon.classList.add("fa-heart-o");

    if (!user["loggedIn"]) {
      // Logged Out: Remove object from localStorage
      const index = wishlist.findIndex((product) => product.title === productName);

      if (index !== -1) {
        wishlist.splice(index, 1);
      }
      saveWishlist(); // Only sync localStorage when logged out
    } else {
      // Logged In: Remove string ID from local array and sync with DB
      if (wishlist.includes(prodId)) {
        const index = wishlist.indexOf(prodId);
        if (index !== -1) {
          wishlist.splice(index, 1);
        }

        fetch("/remove_wishlist", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ id: prodId }),
        }).then((response) => response.text());
      }
    }
  }

  // --- ALWAYS UPDATE THE UI IMMEDIATELY ---
  updateWishlistCount();
  await showWishlistPreview(); // Await since header fetching is async for logged-in users
});

let productViewChoicesOptions = document.querySelectorAll(
  ".product-view-choices-option label",
);

function getRadioValues() {
  const selectedChoices = {};
  document.querySelectorAll('input[type="radio"]:checked').forEach((input) => {
    selectedChoices[input.name] = input.value;
  });

  return selectedChoices;
}
document.querySelectorAll('input[type="radio"]').forEach((radio) => {
  radio.addEventListener("change", () => {
    const selectedChoices = getRadioValues();

    const params = new URLSearchParams();

    for (const [key, value] of Object.entries(selectedChoices)) {
      params.append(key, value);
    }

    const url = `${window.location.pathname}?${params.toString()}`;

    window.location.href = url;
  });
});
