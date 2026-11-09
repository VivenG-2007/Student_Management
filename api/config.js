module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const backendUrl = (
    process.env.BACKEND_URL ||
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    process.env.REACT_APP_BACKEND_URL ||
    process.env.VITE_BACKEND_URL ||
    process.env.API_URL ||
    ''
  ).trim().replace(/\/+$/, '');

  res.status(200).json({
    backendUrl: backendUrl,
    status: 'ok'
  });
};

