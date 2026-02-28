// Simple SVG icon generator for PWA
// In production, replace with actual designed icons

const sizes = [192, 512];

sizes.forEach(size => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 100 100">
    <rect width="100" height="100" fill="#0f172a" rx="20"/>
    <text x="50" y="65" font-family="Arial, sans-serif" font-size="45" font-weight="bold" fill="#3b82f6" text-anchor="middle">S</text>
    <circle cx="75" cy="25" r="12" fill="#22c55e"/>
  </svg>`;
  
  // This is a placeholder - in production use real PNG icons
  console.log(`Icon ${size}x${size} placeholder created`);
});
