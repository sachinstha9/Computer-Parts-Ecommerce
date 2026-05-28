from flask import Flask, render_template, request, redirect
import sqlite3
import json

app = Flask(__name__)


def product_formatter(products):
    formatted_products = []

    for product in products:
        formatted_products.append({
            "id": product[0],
            "title": product[1],
            "description": product[2],
            "img_sources": json.loads(product[3]),
            "tags": product[4].split(","),
            "price": product[5],
            "specifications": json.loads(product[6]),
            "availability": product[7],
            "in_banner": product[8],
            "company": product[9],
            "main_category": product[10],
        })

    return formatted_products


def create_cart_table():
    conn = sqlite3.connect("computer-ecommerce.db")
    c = conn.cursor()

    c.execute("""
        CREATE TABLE IF NOT EXISTS cart (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            product_id INTEGER NOT NULL,
            quantity INTEGER DEFAULT 1
        )
    """)

    conn.commit()
    conn.close()


def get_cart_count():
    create_cart_table()

    conn = sqlite3.connect("computer-ecommerce.db")
    c = conn.cursor()

    c.execute("SELECT SUM(quantity) FROM cart")
    cart_count = c.fetchone()[0]

    conn.close()

    if cart_count is None:
        return 0

    return cart_count


@app.route("/")
def index():
    conn = sqlite3.connect("computer-ecommerce.db")
    c = conn.cursor()

    c.execute("SELECT * FROM products WHERE in_banner = ?", (1,))
    in_banner_products = c.fetchall()

    c.execute("SELECT * FROM products WHERE tags LIKE '%laptop%' AND tags LIKE '%gaming%'")
    gaming_laptops = c.fetchall()

    c.execute("SELECT * FROM products WHERE tags LIKE '%headphone%'")
    headphones = c.fetchall()

    c.execute("SELECT * FROM products WHERE tags LIKE '%desktop%' AND tags LIKE '%gaming%'")
    gaming_desktops = c.fetchall()

    conn.close()

    in_banner_products = product_formatter(in_banner_products)
    gaming_laptops = product_formatter(gaming_laptops)
    headphones = product_formatter(headphones)
    gaming_desktops = product_formatter(gaming_desktops)

    display_sections = {
        "gaming_laptops": {
            "title": "Gaming Laptops",
            "products": gaming_laptops
        },
        "headphones": {
            "title": "Headphones",
            "products": headphones
        },
        "gaming_desktops": {
            "title": "Gaming Desktops",
            "products": gaming_desktops
        },
    }

    return render_template(
        "index.html",
        in_banner_products=in_banner_products,
        display_sections=display_sections,
        cart_count=get_cart_count()
    )


@app.route("/products")
def products():
    tags = request.args.getlist("tags")
    or_tags = request.args.getlist("or_tags")

    conn = sqlite3.connect("computer-ecommerce.db")
    c = conn.cursor()

    if not tags and not or_tags:
        c.execute("SELECT * FROM products")
    else:
        sql_parts = []
        sql_values = []

        for tag in tags:
            sql_parts.append("tags LIKE ?")
            sql_values.append(f"%{tag}%")

        if or_tags:
            or_parts = []

            for tag in or_tags:
                or_parts.append("tags LIKE ?")
                sql_values.append(f"%{tag}%")

            sql_parts.append("(" + " OR ".join(or_parts) + ")")

        sql_query = "SELECT * FROM products WHERE " + " AND ".join(sql_parts)
        c.execute(sql_query, sql_values)

    filtered_products = c.fetchall()
    conn.close()

    filtered_products = product_formatter(filtered_products)

    return render_template(
        "products.html",
        filtered_products=filtered_products,
        cart_count=get_cart_count()
    )


@app.route("/add-to-cart/<int:product_id>", methods=["POST"])
def add_to_cart(product_id):
    create_cart_table()

    conn = sqlite3.connect("computer-ecommerce.db")
    c = conn.cursor()

    c.execute("SELECT * FROM cart WHERE product_id = ?", (product_id,))
    existing_item = c.fetchone()

    if existing_item:
        c.execute(
            "UPDATE cart SET quantity = quantity + 1 WHERE product_id = ?",
            (product_id,)
        )
    else:
        c.execute(
            "INSERT INTO cart (product_id, quantity) VALUES (?, ?)",
            (product_id, 1)
        )

    conn.commit()
    conn.close()

    return redirect("/products")


@app.route("/remove-from-cart/<int:product_id>", methods=["POST"])
def remove_from_cart(product_id):
    create_cart_table()

    conn = sqlite3.connect("computer-ecommerce.db")
    c = conn.cursor()

    c.execute("DELETE FROM cart WHERE product_id = ?", (product_id,))

    conn.commit()
    conn.close()

    return redirect("/shopping-cart")


@app.route('/shopping-cart')
def shopping_cart():
    return render_template("shoppingbag.html")


if __name__ == "__main__":
    app.run(debug=True)