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
            "availabilty": product[7],
            "in_banner": product[8],
            "company": product[9],
            "main_category": product[10],
        })

    return formatted_products


@app.route("/")
def index():
    conn = sqlite3.connect("computer-ecommerce.db")
    c = conn.cursor()

    c.execute('SELECT * FROM products')
    all_products = c.fetchall()

    c.execute('SELECT * FROM products WHERE in_banner = ?', (1,))
    in_banner_products = c.fetchall()

    conn.close()

    all_products = product_formatter(all_products)
    in_banner_products = product_formatter(in_banner_products)

    return render_template("index.html", in_banner_products=in_banner_products, all_products=all_products)

if __name__ == "__main__":
    app.run(debug=True)