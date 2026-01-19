#!/usr/bin/env node
/**
 * ALTURA - Single Entry Point
 * Serves the Altura funnel store
 */

const path = require('path');
const fs = require('fs');

console.log('\n');
console.log('      ALTURA Funnel Store Server       ');
console.log('\n');

// Check for .env file
const envPath = path.join(__dirname, 'ALTURA_SERVER', 'server', '.env');
if (!fs.existsSync(envPath)) {
  console.log('  No .env file found!');
  console.log(' Creating .env from .env.example...\n');
  
  const examplePath = path.join(__dirname, 'ALTURA_SERVER', 'server', '.env.example');
  if (fs.existsSync(examplePath)) {
    const content = fs.readFileSync(examplePath, 'utf8');
    fs.writeFileSync(envPath, content);
    console.log(' .env created. Please configure it with your keys.\n');
  }
}

// Launch the server
console.log(' Starting server...\n');
require('./ALTURA_SERVER/server/server.js');
