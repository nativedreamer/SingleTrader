import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const publicDir = path.resolve('public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Minimalist, high-end financial SVG icon:
// Clean geometric Bitcoin symbol with precision crosshairs and candle bars
const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <rect width="512" height="512" rx="104" fill="#090d16"/>
  <rect x="12" y="12" width="488" height="488" rx="92" fill="none" stroke="#1f293d" stroke-width="2"/>
  
  <!-- Subtle coordinate grid lines -->
  <line x1="64" y1="256" x2="448" y2="256" stroke="#182338" stroke-width="2" stroke-dasharray="4 6"/>
  <line x1="256" y1="64" x2="256" y2="448" stroke="#182338" stroke-width="2" stroke-dasharray="4 6"/>
  
  <!-- Candlestick bar left (bullish teal) -->
  <line x1="148" y1="180" x2="148" y2="340" stroke="#00d09c" stroke-width="3" stroke-linecap="round"/>
  <rect x="136" y="210" width="24" height="80" rx="4" fill="#00d09c"/>
  
  <!-- Candlestick bar right (accent high) -->
  <line x1="364" y1="140" x2="364" y2="310" stroke="#2563eb" stroke-width="3" stroke-linecap="round"/>
  <rect x="352" y="170" width="24" height="90" rx="4" fill="#2563eb"/>
  
  <!-- Central Signal Diamond & Bitcoin Symbol -->
  <circle cx="256" cy="256" r="100" fill="#0f172a" stroke="#334155" stroke-width="3"/>
  <circle cx="256" cy="256" r="88" fill="#0a0f1d"/>
  
  <!-- Stylized Bitcoin Currency Glyph -->
  <g fill="#f8fafc">
    <path d="M236 172h38c20 0 34 8 34 26 0 11-6 20-16 23 14 3 22 13 22 28 0 20-16 29-38 29h-40v-106zm20 18v28h17c10 0 16-4 16-14s-6-14-16-14h-17zm0 44v30h19c11 0 18-5 18-15s-7-15-18-15h-19z"/>
    <!-- BTC vertical pins -->
    <rect x="250" y="156" width="6" height="18" rx="3" fill="#00d09c"/>
    <rect x="268" y="156" width="6" height="18" rx="3" fill="#00d09c"/>
    <rect x="250" y="276" width="6" height="18" rx="3" fill="#00d09c"/>
    <rect x="268" y="276" width="6" height="18" rx="3" fill="#00d09c"/>
  </g>
  
  <!-- Precision Target Crosshair Markers -->
  <circle cx="256" cy="116" r="4" fill="#00d09c"/>
  <circle cx="256" cy="396" r="4" fill="#ef4444"/>
  <circle cx="116" cy="256" r="3" fill="#64748b"/>
  <circle cx="396" cy="256" r="3" fill="#64748b"/>
</svg>`;

// Safe-zone maskable version with 15% inner padding
const svgMaskable = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <rect width="512" height="512" fill="#090d16"/>
  
  <g transform="translate(51.2, 51.2) scale(0.8)">
    <rect width="512" height="512" rx="104" fill="#090d16"/>
    <rect x="12" y="12" width="488" height="488" rx="92" fill="none" stroke="#1f293d" stroke-width="2"/>
    <line x1="64" y1="256" x2="448" y2="256" stroke="#182338" stroke-width="2" stroke-dasharray="4 6"/>
    <line x1="256" y1="64" x2="256" y2="448" stroke="#182338" stroke-width="2" stroke-dasharray="4 6"/>
    <line x1="148" y1="180" x2="148" y2="340" stroke="#00d09c" stroke-width="3" stroke-linecap="round"/>
    <rect x="136" y="210" width="24" height="80" rx="4" fill="#00d09c"/>
    <line x1="364" y1="140" x2="364" y2="310" stroke="#2563eb" stroke-width="3" stroke-linecap="round"/>
    <rect x="352" y="170" width="24" height="90" rx="4" fill="#2563eb"/>
    <circle cx="256" cy="256" r="100" fill="#0f172a" stroke="#334155" stroke-width="3"/>
    <circle cx="256" cy="256" r="88" fill="#0a0f1d"/>
    <g fill="#f8fafc">
      <path d="M236 172h38c20 0 34 8 34 26 0 11-6 20-16 23 14 3 22 13 22 28 0 20-16 29-38 29h-40v-106zm20 18v28h17c10 0 16-4 16-14s-6-14-16-14h-17zm0 44v30h19c11 0 18-5 18-15s-7-15-18-15h-19z"/>
      <rect x="250" y="156" width="6" height="18" rx="3" fill="#00d09c"/>
      <rect x="268" y="156" width="6" height="18" rx="3" fill="#00d09c"/>
      <rect x="250" y="276" width="6" height="18" rx="3" fill="#00d09c"/>
      <rect x="268" y="276" width="6" height="18" rx="3" fill="#00d09c"/>
    </g>
    <circle cx="256" cy="116" r="4" fill="#00d09c"/>
    <circle cx="256" cy="396" r="4" fill="#ef4444"/>
    <circle cx="116" cy="256" r="3" fill="#64748b"/>
    <circle cx="396" cy="256" r="3" fill="#64748b"/>
  </g>
</svg>`;

fs.writeFileSync(path.join(publicDir, 'icon.svg'), svgContent, 'utf8');

async function generate() {
  const svgBuffer = Buffer.from(svgContent);
  const maskableBuffer = Buffer.from(svgMaskable);

  await sharp(svgBuffer).resize(192, 192).png().toFile(path.join(publicDir, 'pwa-192x192.png'));
  await sharp(svgBuffer).resize(512, 512).png().toFile(path.join(publicDir, 'pwa-512x512.png'));
  await sharp(maskableBuffer).resize(512, 512).png().toFile(path.join(publicDir, 'pwa-maskable-512x512.png'));
  await sharp(svgBuffer).resize(180, 180).png().toFile(path.join(publicDir, 'apple-touch-icon.png'));
  await sharp(svgBuffer).resize(32, 32).png().toFile(path.join(publicDir, 'favicon.png'));
  console.log('Icons generated successfully.');
}

generate().catch(err => {
  console.error(err);
  process.exit(1);
});
