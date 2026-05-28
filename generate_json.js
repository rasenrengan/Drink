const fs = require('fs');
const path = require('path');

const imagesDir = path.join(__dirname, 'images');
const products = [];
let idCounter = 1;

// Price mapping based on competitor scraped data to keep it realistic
const priceMap = {
    "Skinos Mastiha Spirit 700ml": 1750,
    "Skinos Mastiha Spirit 350ml": 950,
    "Shahrazade Rose Wine BIB 3L": 835,
    "Devlin Blended Whiskey 750ml": 550,
    "Aria White Sparkling Wine 750ml": 450,
    "Aria Rose Sparkling Wine 750ml": 450,
    "Le Baron White Signature Sparkling Wine 750ml": 850,
    "Heineken Can 500ml": 70,
    "Swan Premium Vodka 750ml": 400,
    "Black Rhino Whisky 750ml": 495,
    "Harry’s Premium Gin 750ml": 500
};

function getCategory(dirPath) {
    const lowerPath = dirPath.toLowerCase();
    if (lowerPath.includes('beer')) return 'Beer';
    if (lowerPath.includes('wine')) return 'Wine';
    if (lowerPath.includes('rtd')) return 'RTDs';
    if (lowerPath.includes('spirit')) return 'Spirits';
    if (lowerPath.includes('vodka') || lowerPath.includes('whisky') || lowerPath.includes('whiskey') || 
        lowerPath.includes('tequila') || lowerPath.includes('rum') || lowerPath.includes('gin') || 
        lowerPath.includes('cognac') || lowerPath.includes('brandy') || lowerPath.includes('arak') || 
        lowerPath.includes('ouzo')) return 'Spirits';
    return 'Extras';
}

function walkDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            // skip nested DRINK-product-images to avoid duplicates
            if (file === 'DRINK-product-images') continue;
            walkDir(fullPath);
        } else {
            const ext = path.extname(file).toLowerCase();
            if (ext === '.jpg' || ext === '.png' || ext === '.jpeg') {
                if (file.startsWith('premium_')) continue; // skip AI placeholders
                
                const name = path.basename(file, path.extname(file));
                const category = getCategory(fullPath);
                
                // Match exact price or generate random realistic price
                let price = priceMap[name];
                if (!price) {
                    if (category === 'Wine') price = Math.floor(Math.random() * 500) + 200;
                    else if (category === 'Spirits') price = Math.floor(Math.random() * 1500) + 300;
                    else if (category === 'Beer') price = Math.floor(Math.random() * 50) + 40;
                    else price = Math.floor(Math.random() * 100) + 50;
                }

                // Format path relative to images dir
                const relativePath = path.relative(__dirname, fullPath).replace(/\\/g, '/');

                products.push({
                    id: String(idCounter++),
                    name: name,
                    category: category,
                    price: price,
                    image: relativePath
                });
            }
        }
    }
}

walkDir(imagesDir);

fs.writeFileSync(path.join(__dirname, 'data', 'products.json'), JSON.stringify(products, null, 2));
console.log(`Generated products.json with ${products.length} products.`);
