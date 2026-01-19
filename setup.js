/**
 * ALTURA Setup Script
 * Configure environment and prepare the application
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (prompt) => new Promise((resolve) => rl.question(prompt, resolve));

const envPath = path.join(__dirname, 'ALTURA_SERVER', 'server', '.env');
const examplePath = path.join(__dirname, 'ALTURA_SERVER', 'server', '.env.example');

async function setup() {
  console.log('\n');
  console.log('      ALTURA Setup Configuration       ');
  console.log('\n');

  // Check if .env exists
  if (fs.existsSync(envPath)) {
    const overwrite = await question(' .env already exists. Overwrite? (y/n) ');
    if (overwrite.toLowerCase() !== 'y') {
      console.log('\n Setup cancelled. Using existing .env\n');
      rl.close();
      return;
    }
  }

  // Copy from example
  if (fs.existsSync(examplePath)) {
    fs.copyFileSync(examplePath, envPath);
    console.log('\n .env created from template\n');
  }

  // Guide through key configuration
  console.log(' Configure your keys (or edit ALTURA_SERVER/server/.env directly):\n');
  
  const PORT = await question('Port (default 8080): ');
  const BASE_URL = await question('Base URL (default http://localhost:8080): ');
  const STRIPE_KEY = await question('Stripe Secret Key (sk_...): ');
  const PAYPAL_ID = await question('PayPal Client ID: ');
  const MJ_PUBLIC = await question('Mailjet Public Key: ');

  // Update .env with provided values
  let envContent = fs.readFileSync(envPath, 'utf8');
  
  if (PORT) envContent = envContent.replace(/PORT=.*/g, `PORT=${PORT}`);
  if (BASE_URL) envContent = envContent.replace(/BASE_URL=.*/g, `BASE_URL=${BASE_URL}`);
  if (STRIPE_KEY) envContent = envContent.replace(/STRIPE_SECRET_KEY=.*/g, `STRIPE_SECRET_KEY=${STRIPE_KEY}`);
  if (PAYPAL_ID) envContent = envContent.replace(/PAYPAL_CLIENT_ID=.*/g, `PAYPAL_CLIENT_ID=${PAYPAL_ID}`);
  if (MJ_PUBLIC) envContent = envContent.replace(/MJ_APIKEY_PUBLIC=.*/g, `MJ_APIKEY_PUBLIC=${MJ_PUBLIC}`);

  fs.writeFileSync(envPath, envContent);
  
  console.log('\n Configuration saved to .env\n');
  console.log('To start the server, run: npm start\n');
  
  rl.close();
}

setup().catch(err => {
  console.error('Setup error:', err.message);
  process.exit(1);
});
