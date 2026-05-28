const fs = require('fs');
const path = require('path');

const productsPath = path.join(__dirname, 'data', 'products.json');
const products = JSON.parse(fs.readFileSync(productsPath, 'utf8'));

const baseUrl = 'https://rasenrengan.github.io/beverage-catalog';

let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}/index.html</loc>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${baseUrl}/catalog.html</loc>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${baseUrl}/about.html</loc>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${baseUrl}/contact.html</loc>
    <priority>0.8</priority>
  </url>
`;

products.forEach(p => {
    sitemap += `  <url>
    <loc>${baseUrl}/product.html?id=${p.id}</loc>
    <priority>0.7</priority>
  </url>
`;
});

sitemap += `</urlset>`;

fs.writeFileSync(path.join(__dirname, 'sitemap.xml'), sitemap);
console.log(`Generated sitemap.xml with ${products.length + 4} URLs.`);
