import json
import csv
import os

def import_csv_to_json():
    csv_path = 'products_inventory.csv'
    json_path = 'data/products.json'
    
    if not os.path.exists(csv_path):
        print(f"Error: {csv_path} not found!")
        return
        
    if not os.path.exists(json_path):
        print(f"Error: {json_path} not found!")
        return
        
    # Read the JSON first to keep existing data (like images) as baseline
    with open(json_path, 'r', encoding='utf-8') as f:
        products = json.load(f)
        
    # Index products by string ID
    products_by_id = {str(p['id']): p for p in products}
    
    # Read the CSV
    with open(csv_path, 'r', encoding='utf-8-sig') as f:
        reader = csv.DictReader(f)
        for row in reader:
            p_id = str(row['ID'])
            if p_id in products_by_id:
                product = products_by_id[p_id]
                
                # Update price if it is provided in CSV
                csv_price = row.get('Price (EGP)', '')
                if csv_price.strip():
                    try:
                        product['price'] = float(csv_price)
                    except ValueError:
                        pass # Keep original price if invalid
                        
                # Update/add alcohol percentage
                csv_alcohol = row.get('Alcohol Percentage', '')
                if csv_alcohol.strip():
                    product['alcohol'] = csv_alcohol
                    
                # Update description if changed
                csv_desc = row.get('Description', '')
                if csv_desc.strip():
                    product['description'] = csv_desc
                    
    # Write back to products.json
    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(list(products_by_id.values()), f, indent=4, ensure_ascii=False)
        
    print(f"Successfully imported spreadsheet changes back into {json_path}!")

if __name__ == '__main__':
    import_csv_to_json()
