# Galact

Galact is a computer hardware e-commerce website we built using Flask. You can browse products like laptops, PC parts and peripherals, add them to your cart or wishlist, make an account, and check out using PayPal. There's also an admin side for adding new products.

This was a group project for our course. It was made by Sachin Shrestha, Will Hunt and Rehan Ahmed.

## What it does

- Browse and search through products
- Product pages with images, specs and details
- User signup, login and profiles
- Shopping cart and wishlist
- Checkout with PayPal
- Admin page to add new products
- Product images are uploaded and hosted on Cloudinary

## Built with

- Python / Flask
- SQLite for the database
- HTML, CSS and JavaScript for the frontend
- Cloudinary for image hosting
- PayPal API for payments

## Running it locally

First install the requirements:

```
pip install -r requirements.txt
```

The project uses a `.env` file for the Cloudinary and PayPal keys. We know you're not supposed to put secrets in a public repo, but since this is just for an assignment we've left the `.env` in so it actually runs.

Then start the app:

```
python app.py
```

It runs at `http://localhost:5000`.

## Notes

The database file (`computer-ecommerce.db`) is already included so there's some data to work with. The `database.sql` file has the schema if you want to set it up fresh.
