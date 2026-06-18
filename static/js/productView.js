import {
  updateCartCount,
  showCartPreview,
  saveCart,
  cart,
  wishlist,
  saveWishlist,
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
  const existingProduct = wishlist.find((item) => item.name === productName);

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

  if (wishListAddButtonIcon.classList.contains("fa-heart-o")) {
    // Add to wishlist
    wishListAddButtonIcon.classList.remove("fa-heart-o");
    wishListAddButtonIcon.classList.add("fa-heart");
    wishListAddButtonIcon.classList.add("add-red");

    if (!user["loggedIn"]) {
      const existingProduct = wishlist.find(
        (item) => item.name === productName,
      );

      if (!existingProduct) {
        wishlist.push({
          id: productId[productId.length - 1],
          name: productName,
          price: productPrice,
          image: productImageSrc,
        });
      }
    } else {
      let userWishlist = user["wishlist"];

      if (!userWishlist.includes(productId[productId.length - 1]))
        fetch("/add_wishlist", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id: productId[productId.length - 1],
          }),
        }).then((response) => response.text());
    }

    saveWishlist();
  } else {
    // Remove from wishlist
    wishListAddButtonIcon.classList.remove("fa-heart");
    wishListAddButtonIcon.classList.remove("add-red");
    wishListAddButtonIcon.classList.add("fa-heart-o");
    if (!user["loggedIn"]) {
      const index = wishlist.findIndex(
        (product) => product.name === productName,
      );

      if (index !== -1) {
        wishlist.splice(index, 1);
      }
    } else {
      let userWishlist = user["wishlist"];

      if (userWishlist.includes(productId[productId.length - 1]))
        fetch("/remove_wishlist", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id: productId[productId.length - 1],
          }),
        }).then((response) => response.text());
    }

    saveWishlist();
  }
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
