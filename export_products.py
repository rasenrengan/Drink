import json
import csv
import os

def export_to_csv():
    json_path = 'data/products.json'
    csv_path = 'products_inventory.csv'
    
    if not os.path.exists(json_path):
        print(f"Error: {json_path} not found!")
        return
        
    with open(json_path, 'r', encoding='utf-8') as f:
        products = json.load(f)
        
    # We will export ID, Name, Category, Price, and Description
    # This allows the user to easily edit the prices in Excel/Google Sheets
    fields = ['ID', 'Category', 'Name', 'Price (EGP)', 'Description']
    
    with open(csv_path, 'w', newline='', encoding='utf-8-sig') as f:
        writer = csv.writer(f)
        writer.writerow(fields)
        
        for p in products:
            writer.writerow([
                p.get('id', ''),
                p.get('category', ''),
                p.get('name', ''),
                p.get('price', 0.0),
                p.get('description', '')
            ])
            
    print(f"Successfully exported {len(products)} products to {csv_path}!")

if __name__ == '__main__':
    export_to_csv()
