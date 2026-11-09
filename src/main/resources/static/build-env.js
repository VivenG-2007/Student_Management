const fs = require('fs');
const path = require('path');

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

try {
  fs.writeFileSync(path.join(__dirname, 'env-config.js'), envFileContent, 'utf8');
} catch (e) {}

console.log(`[build-env] Success! Backend URL configured: "${backendUrl || '(empty - will use automatic fallback)'}"`);
