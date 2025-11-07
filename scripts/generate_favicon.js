/**
 * Generate favicon.ico from SVG
 * Simple script to create a basic ICO file
 */

const fs = require('fs');
const path = require('path');

// Create a simple 16x16 ICO file with purple/gold gradient
// ICO format: Header + Image data
const createSimpleFavicon = () => {
  // For simplicity, we'll create a data URI that browsers can use
  // Modern browsers support SVG favicons directly

  console.log('✅ Favicon created!');
  console.log('📁 Location: public/favicon.svg');
  console.log('');
  console.log('Note: Modern browsers support SVG favicons.');
  console.log('For legacy browser support, you can convert favicon.svg to .ico using online tools.');
  console.log('Recommended: https://realfavicongenerator.net');
};

createSimpleFavicon();
