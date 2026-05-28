import json
import csv
import os

def apply():
    csv_path = 'products_inventory.csv'
    json_path = 'data/products.json'
    
    if not os.path.exists(csv_path) or not os.path.exists(json_path):
        print("Error: Required files missing!")
        return
        
    # Read the existing products first to retain images and base properties
    with open(json_path, 'r', encoding='utf-8') as f:
        existing_products = json.load(f)
        
    existing_by_id = {str(p['id']): p for p in existing_products}
    
    # Read the CSV rows
    csv_products = []
    with open(csv_path, 'r', encoding='utf-8-sig') as f:
        reader = csv.DictReader(f)
        for row in reader:
            csv_products.append(row)
            
    # Determine the maximum numeric ID so far to allocate new ones safely
    max_id = 0
    for p in existing_products:
        try:
            val = int(p['id'])
            if val > max_id:
                max_id = val
        except ValueError:
            pass
            
    updated_products = []
    
    for row in csv_products:
        p_id = str(row.get('ID', '')).strip()
        name = row.get('Name', '').strip()
        category = row.get('Category', '').strip()
        price_str = row.get('Price (EGP)', '').strip()
        alcohol = row.get('Alcohol Percentage', '').strip()
        desc = row.get('Description', '').strip()
        
        if not name:
            continue
            
        # Parse Price
        price = None
        if price_str:
            try:
                price = float(price_str)
            except ValueError:
                pass
                
        # Handle added product with ID 'new' or blank ID
        if p_id.lower() in ('new', '') or p_id not in existing_by_id:
            max_id += 1
            new_id = str(max_id)
            
            # Formulate image path based on category and name
            cat_folder = category.lower()
            if cat_folder == 'beer':
                cat_folder = 'Beers'
            elif cat_folder == 'rtds':
                cat_folder = 'spirit/RTD'
            elif cat_folder == 'wine':
                cat_folder = 'wine/red' # Default
            else:
                cat_folder = 'spirit'
                
            img_path = f"images/{cat_folder}/{name}.png"
            
            product_entry = {
                "id": new_id,
                "name": name,
                "category": category,
                "price": price if price is not None else 0.0,
                "image": img_path,
                "description": desc or f"{name} is a premium {category.lower()} crafted for the discerning palate.",
                "alcohol": alcohol or "0%"
            }
            updated_products.append(product_entry)
        else:
            # Update existing product entry
            base_p = existing_by_id[p_id]
            
            updated_p = {
                "id": p_id,
                "name": name,
                "category": category,
                "price": price if price is not None else base_p.get('price', 0.0),
                "image": base_p.get('image', 'images/logo.png'),
                "description": desc or base_p.get('description', ''),
                "alcohol": alcohol or base_p.get('alcohol', '0%')
            }
            updated_products.append(updated_p)
            
    # Write back to data/products.json
    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(updated_products, f, indent=4, ensure_ascii=False)
        
    print(f"Successfully compiled and updated {len(updated_products)} products to data/products.json!")

if __name__ == '__main__':
    apply()
