// ================= CATEGORY FILTER =================

// Get all category buttons
const categoryButtons =
document.querySelectorAll(".category-filter");

// Get all products
const productCards =
document.querySelectorAll(".product-card");


// Category filtering
categoryButtons.forEach(button => {

    button.addEventListener("click", () => {

        // Remove active state
        categoryButtons.forEach(btn => {

            btn.classList.remove("active");

        });

        // Add active state
        button.classList.add("active");

        const selectedCategory =
        button.dataset.filter;

        productCards.forEach(card => {

            const productCategory =
            card.dataset.category;

            if (
                selectedCategory === "all"
            ) {

                card.classList.remove("hidden");

            }

            else if (
                selectedCategory === productCategory
            ) {

                card.classList.remove("hidden");

            }

            else {

                card.classList.add("hidden");

            }

        });

    });

});


// ================= CART SYSTEM =================

// Load cart
let cart =
JSON.parse(
    localStorage.getItem("cart")
)
|| [];


// Navbar cart number
const cartCount =
document.querySelector(".cart-count");


// Add buttons
const addButtons =
document.querySelectorAll(".add-button");


// Cart dropdown
const cartIcon =
document.querySelector(".cart-icon");

const cartDropdown =
document.querySelector(".cart-dropdown");

const cartItemsBox =
document.querySelector(".cart-items");


// Update cart count
function updateCartCount() {

    if (cartCount) {

        cartCount.textContent =
        cart.length;

    }

}


// Save cart
function saveCart() {

    localStorage.setItem(
        "cart",
        JSON.stringify(cart)
    );

}


// Render cart preview
function showCartPreview() {

    cartItemsBox.innerHTML = "";

    if (cart.length === 0) {

        cartItemsBox.innerHTML = `
            <p class="empty-cart-message">
                Your cart is empty.
            </p>
        `;

        return;
    }

    cart.forEach((item, index) => {

        const cartItem = document.createElement("div");

        cartItem.classList.add("cart-preview-item");

        cartItem.innerHTML = `
            <img src="${item.image}" alt="${item.name}">

            <div class="cart-preview-info">
                <p>${item.name}</p>
                <strong>${item.price}</strong>
                <small>Qty: ${item.quantity}</small>
            </div>

            <button class="remove-cart-item" data-index="${index}">
                ×
            </button>
        `;

        cartItemsBox.appendChild(cartItem);

    });

    const removeButtons = document.querySelectorAll(".remove-cart-item");

    removeButtons.forEach(button => {

        button.addEventListener("click", () => {

            const itemIndex = button.dataset.index;

            cart.splice(itemIndex, 1);

            saveCart();
            updateCartCount();
            showCartPreview();

        });

    });

}


// Toggle cart dropdown
cartIcon.addEventListener(
"click",
() => {

    cartDropdown.classList.toggle(
        "open"
    );

});


// Add product to cart
addButtons.forEach(button => {

    button.addEventListener("click", () => {

        const card =
        button.closest(".product-card");

        const productName =
        card
        .querySelector(".product-info p")
        .textContent;

        const productPrice =
        card
        .querySelector(".product-info strong")
        .textContent;

        const productImage =
        card
        .querySelector("img")
        .getAttribute("src");


        const existingProduct =
        cart.find(item =>
            item.name === productName
        );


        if (existingProduct) {

            existingProduct.quantity++;

        }

        else {

            cart.push({

                name: productName,

                price: productPrice,

                image: productImage,

                quantity: 1

            });

        }


        saveCart();

        updateCartCount();

        showCartPreview();


        button.textContent =
        "Added ✓";

        setTimeout(() => {

            button.textContent =
            "Add to Cart";

        }, 800);

    });

});


// ================= SEARCH SYSTEM =================

const searchInput =
document.querySelector(
".product-search"
);


searchInput.addEventListener(
"input",
() => {

    const searchTerm =
    searchInput.value
    .toLowerCase()
    .trim();

    productCards.forEach(card => {

        const productName =
        card
        .querySelector(".product-info p")
        .textContent
        .toLowerCase();

        if (

            productName.includes(
                searchTerm
            )

        ) {

            card.classList.remove(
                "hidden"
            );

        }

        else {

            card.classList.add(
                "hidden"
            );

        }

    });

});


// ================= PAGE LOAD =================

updateCartCount();

showCartPreview();