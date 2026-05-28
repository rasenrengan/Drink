const fs = require('fs');
const path = require('path');

const productsPath = path.join(__dirname, 'data', 'products.json');
let products = JSON.parse(fs.readFileSync(productsPath, 'utf8'));

const wineDescriptors = ["A full-bodied and elegant vintage with notes of dark berries and a smooth finish.", "Crisp and refreshing with hints of citrus and a floral bouquet.", "A complex blend offering layers of oak, vanilla, and spice.", "Perfectly balanced with a lingering, velvety mouthfeel."];
const beerDescriptors = ["A refreshing, crisp brew with a clean finish and balanced bitterness.", "Rich and malty with a robust flavor profile and smooth head.", "Light, easily drinkable with subtle citrus notes.", "A classic premium brew crafted with the finest hops and barley."];
const spiritsDescriptors = ["Aged to perfection in oak barrels, delivering a smooth and complex flavor.", "Triple distilled for ultimate purity and a clean, crisp taste.", "Rich and warming with notes of caramel, spice, and a hint of smoke.", "A premium spirit, perfect neat or as the base for exquisite cocktails."];
const rtdDescriptors = ["A convenient, perfectly mixed cocktail ready to enjoy.", "Refreshing and vibrant, delivering a burst of fruit flavors.", "The perfect balance of premium spirits and natural mixers.", "Chill and serve for an instant premium bar experience."];

function getRandomItem(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

products.forEach(p => {
    let desc = "";
    if (p.category === 'Wine') desc = getRandomItem(wineDescriptors);
    else if (p.category === 'Beer') desc = getRandomItem(beerDescriptors);
    else if (p.category === 'Spirits') desc = getRandomItem(spiritsDescriptors);
    else if (p.category === 'RTDs') desc = getRandomItem(rtdDescriptors);
    else desc = "A premium beverage crafted for the discerning palate.";

    p.description = `${p.name} is a testament to quality and tradition. ${desc} Enjoy responsibly and elevate your next celebration with this exquisite choice.`;
});

fs.writeFileSync(productsPath, JSON.stringify(products, null, 2));
console.log(`Successfully enriched ${products.length} products with descriptions.`);
