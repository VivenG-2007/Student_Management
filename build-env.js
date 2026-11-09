const fs = require('fs');
const path = require('path');

// Extract backend URL from environment variables
const backendUrl = (
  process.env.BACKEND_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  process.env.REACT_APP_BACKEND_URL ||
  process.env.VITE_BACKEND_URL ||
  process.env.API_URL ||
  ''
).trim().replace(/\/+$/, '');

const envFileContent = `// Auto-generated build-time configuration
window.__ENV__ = {
  BACKEND_URL: ${JSON.stringify(backendUrl)}
};
`;

const targetDirectories = [
  path.join(__dirname, 'public'),
  path.join(__dirname, 'src', 'main', 'resources', 'static')
];

targetDirectories.forEach(dir => {
  if (fs.existsSync(dir)) {
    try {
      const filePath = path.join(dir, 'env-config.js');
      fs.writeFileSync(filePath, envFileContent, 'utf8');
      console.log(`[build-env] Wrote env-config.js to ${filePath}`);
    } catch (e) {
      console.warn(`[build-env] Could not write to ${dir}:`, e.message);
    }
  }
});

console.log(`[build-env] Success! Backend URL configured: "${backendUrl || '(empty - will use automatic fallback)'}"`);
