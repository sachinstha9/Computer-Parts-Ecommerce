# Imports
from flask import Flask, render_template, request, redirect, abort, session
import sqlite3
import json
import cloudinary
import cloudinary.uploader
import os
from urllib.parse import unquote
import re
import datetime
from datetime import datetime, timedelta

# Application Setup
app = Flask(__name__)
app.secret_key = "galact_secret_key" # required for login

# cloudinary setup
cloudinary.config(
    cloud_name=os.getenv("CLOUD_NAME"),
    api_key=os.getenv("API_KEY"),
    api_secret=os.getenv("API_SECRET")
)

# Product Formatting Function
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
            "choices": json.loads(product[10]),
            "discount": product[11],
            "arrival_date": product[12],
            "discountPrice": None
        })

    return formatted_products

# Shopping Cart Database Functions
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

# Calculates the total quantity of products currently stored
# in the shopping cart.
# The value returned is displayed in the website header.
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

# Home Page Route
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

# Product Catalogue Route
@app.route("/products")
def products():
    tags = request.args.getlist("tags")
    or_tags = request.args.getlist("or_tags")

    conn = sqlite3.connect("computer-ecommerce.db")
    c = conn.cursor()

    target_date = datetime.now() - timedelta(days=30)

    if not tags and not or_tags:
        c.execute("SELECT * FROM products")
        filtered_products = [
            product 
            for product in c.fetchall() 
            if datetime.strptime(product[11], "%Y-%m-%d") >= target_date
            ]
    elif tags == ["special"]:
        pass
        # c.execute("SELECT * FROM products")
        # f_products = []
        # for product in c.fetchall():
        #     if product[11] == "" or product[11] is None:
        #         continue

        #     itemPrice = float(product[5])
        #     discount = float(product[11])

        #     discountedPrice = itemPrice - (itemPrice * (discount / 100))

        #     product["discountPrice"] = discountedPrice

        #     f_products.append(product)

        # filtered_products = f_products

    elif tags == ["new_arrival"]:
        c.execute("SELECT * FROM products")
        f_products = []
        for product in c.fetchall():
            if product[12] == "" or product[12] is None:
                continue
            arrival_date = datetime.strptime(product[12], "%Y-%m-%d")

            f_products.append(product) if arrival_date >= target_date else None

        filtered_products = f_products
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


    filtered_products = product_formatter(filtered_products)

    return render_template(
        "products.html",
        filtered_products=filtered_products,
        cart_count=get_cart_count()
    )



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

# User Login Route
@app.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        username = request.form["username"]
        password = request.form["password"]

        conn = sqlite3.connect("computer-ecommerce.db")
        c = conn.cursor()

        c.execute(
            "SELECT * FROM customers WHERE username = ? AND password = ?",
            (username, password)
        )

        customer = c.fetchone()
        conn.close()

        if customer:
            session["customer_id"] = customer[0]
            session["username"] = customer[1]
            return redirect("/")

        return render_template(
            "login.html",
            error="Invalid username or password",
            cart_count=get_cart_count()
        )

    return render_template("login.html", cart_count=get_cart_count())

# User Registration Route
@app.route("/signup", methods=["GET", "POST"])
def signup():
    if request.method == "POST":
        username = request.form["username"]
        email = request.form["email"]
        password = request.form["password"]
        confirm_password = request.form["confirm_password"]

        if password != confirm_password:
            return render_template(
                "signup.html",
                error="Passwords do not match",
                cart_count=get_cart_count()
            )

        conn = sqlite3.connect("computer-ecommerce.db")
        c = conn.cursor()

        try:
            c.execute("""
                INSERT INTO customers (
                    username,
                    password,
                    email,
                    cart,
                    wishlist,
                    previous_orders,
                    current_orders
                )
                VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (
                username,
                password,
                email,
                "[]",
                "[]",
                "[]",
                "[]"
            ))

            conn.commit()

        except sqlite3.IntegrityError:
            conn.close()
            return render_template(
                "signup.html",
                error="Username or email already exists",
                cart_count=get_cart_count()
            )

        conn.close()
        return redirect("/login")

    return render_template("signup.html", cart_count=get_cart_count())

@app.route("/logout")
def logout():
    session.clear()
    return redirect("/login")

@app.route('/admin')
def admin():
    return render_template("admin.html")

# Profile Route
@app.route("/profile")
def profile():
    if "customer_id" not in session:
        return redirect("/login")

    conn = sqlite3.connect("computer-ecommerce.db")
    c = conn.cursor()

    c.execute(
    "SELECT username, email FROM customers WHERE id = ?",
    (session["customer_id"],)
)

    customer = c.fetchone()
    conn.close()

    return render_template(
        "profile.html",
        customer=customer,
        cart_count=get_cart_count()
    )

@app.route("/profile/<name>")
def profile_page(name):

    if "customer_id" not in session:
        return redirect("/login")

    conn = sqlite3.connect("computer-ecommerce.db")
    c = conn.cursor()

    c.execute(
        "SELECT username, email, cart, wishlist, orders FROM customers WHERE id = ?",
        (session["customer_id"],)
    )

    customer = c.fetchone()

    conn.close()

    return render_template(
        f"profile-pages/{name}.html",
        customer=customer
    )

@app.route('/productview/<int:product_id>')
def product_view(product_id):
    selected_choices = request.args.to_dict()

    conn = sqlite3.connect("computer-ecommerce.db")
    c = conn.cursor()

    c.execute("SELECT * FROM products WHERE id = ?", (product_id,))
    product = c.fetchone()

    conn.close()

    if not product:
        abort(404)

    product = product_formatter([product])[0]

    compareStr = ""
    for i, choice in enumerate(selected_choices):
        compareStr += choice + "_" + selected_choices[choice]
        if i < len(selected_choices.keys()) - 1:
            compareStr += ","

    productImg = product["img_sources"]
    correctImage = ""
    for img_src in productImg:
        decoded = unquote(img_src)
        match = re.search(r'\[(.*?)\]', decoded)
        if not match:
            continue

        img_choices = match.group(1)

        if img_choices == compareStr:
            correctImage = img_src
            break
        
    if correctImage == "":
        correctImage = productImg[0]

    # Only convert if it is still a JSON string
    if isinstance(product["specifications"], str):
        product["specifications"] = json.loads(product["specifications"])

    return render_template("productview.html", product=product, selected_choices=selected_choices, correctImage=correctImage)


# Product Upload Route
@app.route("/add_product", methods=["POST", "GET"])
def add_product():
    title = request.form["title"]
    description = request.form["description"]
    images = request.files.getlist("images[]")
    tags = request.form["tags"]
    price = request.form["price"]
    specifications = request.form["specifications"]
    availability = request.form["availability"]
    in_banner = request.form["in_banner"]
    company = request.form["company"]

    uploaded_urls = []

    for image in images:
        if image.filename:
            result = cloudinary.uploader.upload(image)

            uploaded_urls.append(result["secure_url"])

    conn = sqlite3.connect("computer-ecommerce.db")
    c = conn.cursor()

    c.execute("""
        INSERT INTO products (
            title,
            description,
            img_sources,
            tags,
            price,
            specifications,
            availability,
            in_banner,
            company
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        title,
        description,
        json.dumps(uploaded_urls),  
        tags,
        price,
        specifications, 
        availability,
        int(in_banner),
        company
    ))

    conn.commit()
    conn.close()

    return "product added successsfully."

if __name__ == "__main__":
    app.run(debug=True)