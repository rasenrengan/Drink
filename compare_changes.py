import json
import csv
import os

def compare():
    csv_path = 'products_inventory.csv'
    json_path = 'data/products.json'
    report_path = 'changes_report.json'
    
    if not os.path.exists(csv_path):
        print("CSV file not found!")
        return
    if not os.path.exists(json_path):
        print("JSON file not found!")
        return
        
    with open(json_path, 'r', encoding='utf-8') as f:
        json_products = json.load(f)
        
    json_by_id = {str(p['id']): p for p in json_products}
    
    csv_products = []
    with open(csv_path, 'r', encoding='utf-8-sig') as f:
        reader = csv.DictReader(f)
        for row in reader:
            csv_products.append(row)
            
    csv_by_id = {str(row['ID']): row for row in csv_products if row.get('ID')}
    
    # 1. Deleted products (present in JSON but missing in CSV)
    deleted = []
    for p_id, p in json_by_id.items():
        if p_id not in csv_by_id:
            deleted.append(p)
            
    # 2. Added products (present in CSV but missing in JSON)
    added = []
    for p_id, row in csv_by_id.items():
        if p_id not in json_by_id:
            added.append(row)
            
    # 3. Modified products (present in both, but fields changed)
    modified = []
    for p_id, row in csv_by_id.items():
        if p_id in json_by_id:
            p_json = json_by_id[p_id]
            changes = {}
            
            # Check price change
            csv_price_str = row.get('Price (EGP)', '').strip()
            if csv_price_str:
                try:
                    csv_price = float(csv_price_str)
                    if abs(p_json.get('price', 0.0) - csv_price) > 0.01:
                        changes['price'] = (p_json.get('price', 0.0), csv_price)
                except ValueError:
                    pass
            elif p_json.get('price') is not None:
                # Price was set to empty in CSV, let's capture it
                changes['price'] = (p_json.get('price'), None)
                
            # Check alcohol percentage change
            csv_alcohol = row.get('Alcohol Percentage', '').strip()
            if csv_alcohol and p_json.get('alcohol') != csv_alcohol:
                changes['alcohol'] = (p_json.get('alcohol'), csv_alcohol)
                
            # Check category change
            csv_cat = row.get('Category', '').strip()
            if csv_cat and p_json.get('category') != csv_cat:
                changes['category'] = (p_json.get('category'), csv_cat)
                
            # Check name change
            csv_name = row.get('Name', '').strip()
            if csv_name and p_json.get('name') != csv_name:
                changes['name'] = (p_json.get('name'), csv_name)
                
            if changes:
                modified.append({
                    'id': p_id,
                    'name': p_json['name'],
                    'changes': changes
                })
                
    report = {
        'deleted_count': len(deleted),
        'added_count': len(added),
        'modified_count': len(modified),
        'deleted': deleted,
        'added': added,
        'modified': modified
    }
    
    with open(report_path, 'w', encoding='utf-8') as f:
        json.dump(report, f, indent=4, ensure_ascii=False)
        
    print(f"Comparison report written successfully to {report_path}!")

if __name__ == '__main__':
    compare()
