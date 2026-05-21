import sqlite3
import base64
from flask import Flask, render_template
app = Flask(__name__)

@app.route('/catalog')
def catalog():
    conn = sqlite3.connect('products.db')
    conn.row_factory = sqlite3.Row  # Allows accessing columns by their text names
    cursor = conn.cursor()

    # Select all rows from your products table
    cursor.execute("SELECT id, ProductName, Category, Amount, Price, Image, Brand, Description FROM products")
    db_rows = cursor.fetchall()
    conn.close()
    
    products_list = []
    for row in db_rows:
        # Convert binary data to a renderable Base64 string if it exists
        image_b64 = ""
        if row['Image'] is not None:
            image_b64 = base64.b64encode(row['Image']).decode('utf-8')
            
        products_list.append({
            'id': row['id'],
            'name': row['ProductName'],
            'category': row['Category'],
            'amount': row['Amount'],
            'price': row['Price'],
            'image': image_b64,
            'brand': row['Brand'],
            'description': row['Description']
        })
        
    # Pass the list of all 7 items to your template file
    return render_template('products.html', items=products_list)    

@app.route("/products")
def products():
    return render_template("products.html")

## DB STUFF 

def insert_product(name, category, amount, price, image_path):
    try:
        with open(image_path, 'rb') as file:
            blob_data = file.read()
    except FileNotFoundError:
        print(f"Error: Image not found at {image_path}")
        return
    
    con = sqlite3.connect('products.db')
    cur = con.cursor()

    query = """
    INSERT INTO products (ProductName, Category, Amount, Price, Image, Brand, Description)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    """
    cursor.execute(query, (name, category, amount, price, blob_data))

    con.commit()
    con.close()
    print(f"Product '{name}' successfully added!")

if __name__ == "__main__":
    app.run(debug=True)