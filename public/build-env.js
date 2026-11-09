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

// 1. Write to current directory (handles running from within public/)
try {
  fs.writeFileSync(path.join(__dirname, 'env-config.js'), envFileContent, 'utf8');
  console.log(`[build-env] Wrote env-config.js to ${path.join(__dirname, 'env-config.js')}`);
} catch (e) {
  console.warn(`[build-env] Could not write to ${__dirname}:`, e.message);
}

// 2. Also write to src/main/resources/static if present
const staticDir = path.join(__dirname, '..', 'src', 'main', 'resources', 'static');
if (fs.existsSync(staticDir)) {
  try {
    fs.writeFileSync(path.join(staticDir, 'env-config.js'), envFileContent, 'utf8');
  } catch (e) {}
}

console.log(`[build-env] Success! Backend URL configured: "${backendUrl || '(empty - will use automatic fallback)'}"`);

