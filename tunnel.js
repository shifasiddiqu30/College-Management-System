import localtunnel from 'localtunnel';
import https from 'node:https';

function getPublicIP() {
  return new Promise((resolve) => {
    https.get('https://api.ipify.org', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data.trim()));
    }).on('error', () => resolve('Unknown'));
  });
}

async function startTunnel() {
  const publicIP = await getPublicIP();
  console.log('HOST_PUBLIC_IP:', publicIP);

  const tunnel = await localtunnel({ port: 5173 });
  console.log('PUBLIC_TUNNEL_URL:', tunnel.url);

  tunnel.on('close', () => {
    console.log('Tunnel closed, restarting...');
    setTimeout(startTunnel, 3000);
  });

  tunnel.on('error', (err) => {
    console.error('Tunnel error:', err.message);
  });
}

startTunnel().catch(console.error);
