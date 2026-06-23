# Imports
from flask import Flask, render_template, request, redirect, abort, session, jsonify
import sqlite3
import json
import cloudinary
import cloudinary.uploader
import os
from urllib.parse import unquote
import re
import datetime
from datetime import datetime, timedelta
import requests

# Application Setup
app = Flask(__name__)
app.secret_key = "galact_secret_key" # required for login

CLIENT_ID = "Afk2Kw_C5TqguBDKkSKVfCCHWjI4sN4JA60RJljMcvWv7NJOIlKJhdH0RgWiBbPQtUWoSJlCFZixsoSg"
CLIENT_SECRET = "EIQUXfiYaUFBPcfFt2Dm4eg7BHBJnLWnKYjiC9I2f2Dy7Hp2UNrwG3qiSRCztLAtQewf21ppDDmTiR3R"
BASE_URL = "https://api-m.sandbox.paypal.com"

# cloudinary setup
cloudinary.config(
    cloud_name=os.getenv("CLOUD_NAME"),
    api_key=os.getenv("API_KEY"),
    api_secret=os.getenv("API_SECRET")
)

def get_access_token():
    response = requests.post(
        f"{BASE_URL}/v1/oauth2/token",
        auth=(CLIENT_ID, CLIENT_SECRET),
        data={"grant_type": "client_credentials"},
    )
    
    # Good practice: raise an exception if the request failed (e.g., bad credentials)
    response.raise_for_status() 
    
    return response.json()["access_token"]

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
            "arrival_date": product[12]
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
                    orders,
                    name,
                    address,
                    city,
                    postcode,
                    phone
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                username,
                password,
                email,
                "[]",
                "[]",
                "[]",
                "[]",
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

@app.route('/update_profile', methods=['POST'])
def update_profile():
    # 1. Authenticate user session framework (using customer_id from your session)
    user_id = session.get('customer_id')  
    if not user_id:
        return jsonify({"message": "Unauthorized access. Please log in again."}), 401

    # 2. Extract incoming JSON payload parameters 
    data = request.get_json()
    if not data:
        return jsonify({"message": "Malformatted request. No payload received."}), 400

    username = data.get('username')
    email = data.get('email')
    shipping_name = data.get('shipping_name')
    shipping_address = data.get('shipping_address')
    shipping_city = data.get('shipping_city')
    shipping_postcode = data.get('shipping_postcode')
    phone = data.get('phone')
    
    current_password = data.get('current_password')
    new_password = data.get('new_password')

    # Basic server-side validation boundary
    if not username or not email:
        return jsonify({"message": "Username and Email fields are required."}), 400

    conn = sqlite3.connect('computer-ecommerce.db') 
    cursor = conn.cursor()

    try:
        # 3. Handle Plain Text Password Verification and Updates
        if current_password and new_password:
            # Query the existing plain text password from the user row
            cursor.execute("SELECT password FROM customers WHERE id = ?", (user_id,))
            user_record = cursor.fetchone()

            if not user_record:
                return jsonify({"message": "Account record not located."}), 404

            stored_password = user_record[0]
            
            # Direct text string comparison
            if stored_password != current_password:
                return jsonify({"message": "The current password you entered is incorrect."}), 400

            # Save the new password directly as plain text
            cursor.execute("UPDATE customers SET password = ? WHERE id = ?", (new_password, user_id))

        # 4. Synchronize Account Details and Shipping Parameters
        cursor.execute("""
            UPDATE customers 
            SET username = ?, 
                email = ?, 
                name = ?, 
                address = ?, 
                city = ?, 
                postcode = ?
                phone = ?
            WHERE id = ?
        """, (username, email, shipping_name, shipping_address, shipping_city, shipping_postcode, user_id, phone))
        
        conn.commit()
        return jsonify({"message": "Account details synchronized successfully!"}), 200

    except Exception as err:
        conn.rollback()
        print(f"Critical operational exception identified: {err}")
        return jsonify({"message": "An internal server error disrupted the update loop."}), 500
        
    finally:
        cursor.close()

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
        cart_count=get_cart_count(),
    )

@app.route("/profile/<name>")
def profile_page(name):

    if name == "wishlist":
        print(name)

    if "customer_id" not in session:
        return redirect("/login")

    conn = sqlite3.connect("computer-ecommerce.db")
    c = conn.cursor()

    c.execute(
        "SELECT username, email, cart, wishlist, orders, name, address, city, postcode, phone FROM customers WHERE id = ?",
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

@app.route("/add_wishlist", methods=["POST"])
def add_wishlist():
    data = request.get_json()

    conn = sqlite3.connect("computer-ecommerce.db")
    c = conn.cursor()

    c.execute("SELECT wishlist FROM customers WHERE id = ?", (session["customer_id"],))
    wishlistArr = c.fetchone()[0]
    wishlistArr = json.loads(wishlistArr)
    wishlistArr.append(data["id"])
    wishlistArrFinal = json.dumps(wishlistArr)

    query = "UPDATE customers SET wishlist = ? WHERE id = ?"
    new_data = (wishlistArrFinal, session["customer_id"])

    c.execute(query, new_data)

    conn.commit()
    conn.close()

    return {"success": True}

@app.route("/remove_wishlist", methods=["POST"])
def remove_wishlist():
    data = request.get_json()

    conn = sqlite3.connect("computer-ecommerce.db")
    c = conn.cursor()

    c.execute(
        "SELECT wishlist FROM customers WHERE id = ?",
        (session["customer_id"],)
    )

    wishlistArr = json.loads(c.fetchone()[0])

    product_id = str(data["id"])

    if product_id in wishlistArr:
        wishlistArr.remove(product_id)

    c.execute(
        "UPDATE customers SET wishlist = ? WHERE id = ?",
        (
            json.dumps(wishlistArr),
            session["customer_id"]
        )
    )

    conn.commit()
    conn.close()

    return {"success": True}

@app.route("/add_cart", methods=["POST"])
def add_cart():
    data = request.get_json()

    conn = sqlite3.connect("computer-ecommerce.db")
    c = conn.cursor()

    c.execute("SELECT cart FROM customers WHERE id = ?", (session["customer_id"],))
    cartArr = c.fetchone()[0]
    
    if cartArr:
        cartArr = json.loads(cartArr)
    else:
        cartArr = []

    product_id = str(data["id"])
    quantity = int(data["quantity"])

    # Look for the product in the cart to update its quantity
    item_found = False
    for item in cartArr:
        if str(item["id"]) == product_id:
            item["quantity"] = quantity
            item_found = True
            break

    # If it's a new product, append it as a dictionary configuration
    if not item_found:
        cartArr.append({
            "id": product_id,
            "quantity": quantity
        })

    cartArrFinal = json.dumps(cartArr)

    query = "UPDATE customers SET cart = ? WHERE id = ?"
    new_data = (cartArrFinal, session["customer_id"])

    c.execute(query, new_data)

    conn.commit()
    conn.close()

    return {"success": True}

@app.route("/remove_cart", methods=["POST"])
def remove_cart():
    data = request.get_json()

    conn = sqlite3.connect("computer-ecommerce.db")
    c = conn.cursor()

    c.execute(
        "SELECT cart FROM customers WHERE id = ?",
        (session["customer_id"],)
    )

    cartArr = c.fetchone()[0]
    if cartArr:
        cartArr = json.loads(cartArr)
    else:
        cartArr = []

    product_id = str(data["id"])

    # Rebuild list excluding the target item dictionary
    cartArr = [item for item in cartArr if str(item["id"]) != product_id]

    c.execute(
        "UPDATE customers SET cart = ? WHERE id = ?",
        (
            json.dumps(cartArr),
            session["customer_id"]
        )
    )

    conn.commit()
    conn.close()

    return {"success": True}

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

@app.route("/get-user", methods=["POST"])
def get_user():
    if "customer_id" not in session:
        return jsonify({
            "loggedIn": False
        })
    
    conn = sqlite3.connect("computer-ecommerce.db")
    c = conn.cursor()

    c.execute("SELECT * FROM customers WHERE id = ?", (session["customer_id"],))
    user = c.fetchone()
    conn.commit()
    conn.close()

    return jsonify({
        "loggedIn": True,
        "id": user[0],
        "username": user[1],
        "mail": user[3],
        "cart": json.loads(user[4]),
        "wishlist": json.loads(user[5]),
        "orders": json.loads(user[6])
    })

@app.route("/get-product-details", methods=["POST"])
def get_product_details():
    data = request.get_json()
    productId = data.get("productId")

    conn = sqlite3.connect("computer-ecommerce.db")
    c = conn.cursor()

    c.execute("SELECT * FROM products WHERE id = ?", (productId,))
    product = c.fetchone()

    conn.commit()
    conn.close()

    if product is None:
        return jsonify({}), 404

    return jsonify({
        "id": product[0],
        "title": product[1],
        "description": product[2],
        "image": json.loads(product[3]),
        "tags": product[4],
        "price": product[5],
        "specifications": json.loads(product[6]),
        "availability": product[7],
        "in_banner": product[8],
        "company": product[9],
        "choices": json.loads(product[10]),
        "discount": product[11],
        "arrival_date": product[12]
    })
    
@app.route("/search")
def search():
    search_query = request.args.get("q", "")

    conn = sqlite3.connect("computer-ecommerce.db")
    c = conn.cursor()

    c.execute("""
        SELECT * FROM products
        WHERE title LIKE ?
        OR tags LIKE ?
    """, (
        "%" + search_query + "%",
        "%" + search_query + "%"
    ))

    filtered_products = c.fetchall()

    conn.close()

    filtered_products = product_formatter(filtered_products)

    return render_template(
        "products.html",
        filtered_products=filtered_products,
        cart_count=get_cart_count()
    )    

@app.route("/pay")
def payy():
    return render_template("pay.html")

@app.route("/create-order", methods=["POST"])
def create_order():
    try:
        data = request.get_json()
        token = get_access_token()

        # ⚠️ SECURITY WARNING: Currently trusting the frontend amount.
        # FUTURE GOAL: Fetch cart items from database here and calculate the total 
        # on the server to prevent malicious users from changing the price to $0.01.
        raw_amount = float(data["amount"])
        
        # FIX: Enforce 2 decimal places to prevent PayPal 400 errors
        formatted_amount = f"{raw_amount:.2f}" 

        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {token}",
        }

        order = {
            "intent": "CAPTURE",
            "purchase_units": [
                {
                    "amount": {
                        "currency_code": "NZD",
                        "value": formatted_amount
                    }
                }
            ]
        }

        response = requests.post(
            f"{BASE_URL}/v2/checkout/orders",
            json=order,
            headers=headers,
        )
        response.raise_for_status()

        return jsonify(response.json())

    except Exception as e:
        print(f"Error creating order: {e}")
        return jsonify({"error": "Failed to create order"}), 500

@app.route("/capture-order/<order_id>", methods=["POST"])
def capture_order(order_id):
    try:
        # 1. Capture the payment with PayPal
        token = get_access_token()
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {token}",
        }
        
        response = requests.post(
            f"{BASE_URL}/v2/checkout/orders/{order_id}/capture",
            headers=headers,
        )
        response.raise_for_status() 
        paypal_data = response.json()

        # ==========================================
        # 2. RAW SQLITE DATABASE LOGIC
        # ==========================================
        if "customer_id" not in session:
            return jsonify({"error": "User not logged in"}), 401
            
        customer_id = session["customer_id"]
        
        conn = sqlite3.connect("computer-ecommerce.db")
        c = conn.cursor()

        # Fetch current cart and orders
        c.execute("SELECT cart, orders FROM customers WHERE id = ?", (customer_id,))
        user_data = c.fetchone()

        if user_data:
            # Parse the JSON strings from the database (fallback to empty list if None)
            current_cart = json.loads(user_data[0]) if user_data[0] else []
            current_orders = json.loads(user_data[1]) if user_data[1] else []

            # Extract the actual captured amount from PayPal's response
            captured_amount = paypal_data['purchase_units'][0]['payments']['captures'][0]['amount']['value']

            # Create a new order dictionary containing the cart items
            new_order = {
                "transaction_id": order_id,
                "date": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                "total_paid": captured_amount,
                "status": "Paid",
                "items": current_cart,
                "delivered": "0"
            }

            # Append the new order to their order history
            current_orders.append(new_order)

            # Update the database:
            # 1. Empty the cart by setting it to "[]"
            # 2. Save the updated orders array
            c.execute("""
                UPDATE customers 
                SET cart = '[]', orders = ? 
                WHERE id = ?
            """, (json.dumps(current_orders), customer_id))

            conn.commit()
            
    except requests.exceptions.RequestException as e:
        print(f"PayPal API Error: {e}")
        return jsonify({"error": "Failed to communicate with PayPal"}), 500
        
    except sqlite3.Error as e:
        # If DB fails, rollback so we don't accidentally corrupt user data
        if conn:
            conn.rollback()
        print(f"Database Error: {e}")
        return jsonify({"error": "Failed to update user database"}), 500
        
    finally:
        # Ensure the connection is always closed, even if an error happens
        if 'conn' in locals() and conn:
            conn.close()

    # If everything succeeded, send the PayPal data back to the frontend
    return jsonify(paypal_data)


if __name__ == "__main__":
    app.run(debug=True)
