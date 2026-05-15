from flask import Flask, render_template
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


@app.route("/")
def index():
    conn = sqlite3.connect("computer-ecommerce.db")
    c = conn.cursor()

    c.execute('SELECT * FROM products WHERE in_banner = ?', (1,))
    in_banner_products = c.fetchall()

    c.execute("SELECT * FROM products WHERE tags LIKE '%laptop%' AND tags like '%gaming%'")
    gaming_laptops = c.fetchall()

    c.execute("SELECT * FROM products WHERE tags LIKE '%headphone%'")
    headphones = c.fetchall()

    c.execute("SELECT * FROM products WHERE tags LIKE '%desktop%' AND tags like '%gaming%'")
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

    return render_template("index.html", in_banner_products=in_banner_products, 
                           display_sections=display_sections)

if __name__ == "__main__":
    app.run(debug=True)