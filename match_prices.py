import json
import csv
import re
import os

# Drinkies prices lookup table (regex pattern -> price)
DRINKIES_LOOKUP = {
    # Beers
    r'heineken.*bottle.*330': 55.0,
    r'heineken.*can.*330': 55.0,
    r'heineken.*can.*500': 70.0,
    r'stella.*returnable.*bottle.*500': 50.0,
    r'stella.*one.*way.*bottle.*500': 55.0,
    r'stella.*can.*330': 50.0,
    r'stella.*can.*500': 55.0,
    r'sakara.*gold.*bottle.*500': 50.0,
    r'sakara.*gold.*can.*500': 50.0,
    r'sakara.*el-king.*can.*500': 60.0,
    r'meister.*max.*can.*500': 60.0,
    
    # RTDs (ID RTDs)
    r'double.*edge': 65.0,
    r'xxx.*cherry': 70.0,
    r'xxxx.*watermelon': 80.0,
    r'xxxx.*mango': 80.0,
    r'xxxx.*pineapple': 80.0,
    r'watermelon.*15%': 70.0,
    
    # Spirits
    r'id.*vodka.*350': 150.0,
    r'id.*vodka.*750': 250.0,
    r'id.*vodka.*blue40.*750': 440.0,
    r'greeco.*ouzo.*250': 85.0,
    r'greeco.*ouzo.*500': 130.0,
    r'auld.*stag.*whisky.*350': 130.0,
    r'auld.*stag.*whisky.*750': 250.0,
    r'black.*rhino.*750': 250.0,
    r'devlin.*blended.*750': 350.0,
    r'devlin.*whiskey.*750': 350.0,
    r'arak.*kesrouan.*500': 220.0,
    
    # Wines
    r'omar.*khayyam.*rose.*750': 250.0,
    r'omar.*khayyam.*red.*750': 250.0,
    r'omar.*khayyam.*white.*750': 250.0,
    r'shahrazade.*rose.*750': 260.0,
    r'shahrazade.*red.*750': 260.0,
    r'shahrazade.*white.*750': 260.0,
    r'grand.*marquis.*750': 340.0,
    r'cape.*bay.*750': 300.0,
    r'beausoleil.*750': 375.0,
}

def get_alcohol_percentage(name, category):
    name_lower = name.lower()
    cat_lower = category.lower()
    
    if cat_lower == 'beer':
        if 'stella meister' in name_lower:
            return '8%'
        elif 'sakara el-king' in name_lower:
            return '10%'
        elif 'meister max' in name_lower:
            return '8%'
        elif 'heineken' in name_lower:
            return '5%'
        elif 'sakara gold' in name_lower:
            return '4%'
        elif 'stella' in name_lower:
            return '4.5%'
        return '4.5%'
        
    elif cat_lower == 'rtds':
        if 'double edge' in name_lower:
            return '10%'
        elif 'xxxx' in name_lower:
            return '20%'
        elif 'xxx' in name_lower:
            return '15%'
        elif '15%' in name_lower:
            return '15%'
        return '10%'
        
    elif cat_lower == 'wine':
        if 'valmont' in name_lower:
            return '12%'
        return '12.5%'
        
    elif cat_lower == 'spirits':
        if 'skinos' in name_lower:
            return '30%'
        elif 'ouzo' in name_lower or 'greeco' in name_lower:
            return '38%'
        elif 'arak' in name_lower:
            return '50%'
        elif 'vodka' in name_lower or 'whisky' in name_lower or 'whiskey' in name_lower or 'rum' in name_lower or 'tequila' in name_lower or 'cognac' in name_lower:
            return '40%'
        return '40%'
        
    return '0%'

def match_and_export():
    json_path = 'data/products.json'
    csv_path = 'products_inventory.csv'
    
    if not os.path.exists(json_path):
        print(f"Error: {json_path} not found!")
        return
        
    with open(json_path, 'r', encoding='utf-8') as f:
        products = json.load(f)
        
    # We want to export ID, Category, Name, Price (EGP), Alcohol Percentage (%), Description
    fields = ['ID', 'Category', 'Name', 'Price (EGP)', 'Alcohol Percentage', 'Description']
    
    matched_count = 0
    with open(csv_path, 'w', newline='', encoding='utf-8-sig') as f:
        writer = csv.writer(f)
        writer.writerow(fields)
        
        for p in products:
            name = p.get('name', '')
            category = p.get('category', '')
            
            # Alcohol Percentage
            alcohol = get_alcohol_percentage(name, category)
            if category in ['Accessories', 'Extras']:
                alcohol = '0%'
                
            # Attempt to match with Drinkies.net prices
            matched_price = ""
            name_norm = name.lower()
            
            for pattern, price in DRINKIES_LOOKUP.items():
                if re.search(pattern, name_norm):
                    matched_price = price
                    matched_count += 1
                    break
            
            writer.writerow([
                p.get('id', ''),
                category,
                name,
                matched_price, # Matched price (blank if no match found)
                alcohol,
                p.get('description', '')
            ])
            
    print(f"Successfully processed {len(products)} products!")
    print(f"Matched {matched_count} products directly from Drinkies.net. Unmatched prices left blank.")

if __name__ == '__main__':
    match_and_export()
