// Copies src/ring-segments/segments.json into docs/orientation.html,
// so the page works when opened straight from disk (file:// can't fetch).
// Run after changing segments.json: node docs/embed-segments.js
const fs = require('fs');
const path = require('path');

const htmlPath = path.join(__dirname, 'orientation.html');
const segments = require('../src/ring-segments/segments.json');
const data = JSON.stringify(segments).replace(/</g, '\\u003c');

const html = fs.readFileSync(htmlPath, 'utf8');
const re = /(<script id="segments-data" type="application\/json">)[\s\S]*?(<\/script>)/;
if (!re.test(html)) throw new Error('segments-data block not found in orientation.html');
fs.writeFileSync(htmlPath, html.replace(re, (_, open, close) => open + data + close));
console.log('Embedded segments.json into docs/orientation.html');
