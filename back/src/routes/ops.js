const fs = require('fs');
const path = require('path');
const express = require('express');
const config = require('../config');

const router = express.Router();

function unauthorized(res) {
  res.status(401).json({ success: false, error: 'Unauthorized' });
}

function assertSecret(req, res) {
  const secret = config.deployHookSecret;
  if (!secret) {
    res.status(404).json({ success: false, error: 'Not found' });
    return false;
  }

  const header = String(req.headers.authorization || '');
  const bearer = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
  const alt = String(req.headers['x-deploy-secret'] || '').trim();

  if (bearer !== secret && alt !== secret) {
    unauthorized(res);
    return false;
  }

  return true;
}

function requestPath() {
  return path.join(config.dataDir, 'ops', 'deploy.request');
}

router.post('/deploy', (req, res) => {
  if (!assertSecret(req, res)) {
    return;
  }

  const target = requestPath();
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(
    target,
    JSON.stringify({
      at: new Date().toISOString(),
      by: 'http-hook',
      ip: req.ip
    }),
    'utf8'
  );

  res.status(202).json({
    success: true,
    message: 'Deploy requested; host autodeploy timer will run within ~2 minutes',
    timestamp: new Date().toISOString()
  });
});

router.get('/status', (req, res) => {
  if (!assertSecret(req, res)) {
    return;
  }

  const pending = fs.existsSync(requestPath());

  res.json({
    success: true,
    role: config.processRole,
    telegramApiRoot: config.telegramApiRoot,
    emailHost: config.email.host,
    emailPort: config.email.port,
    deployPending: pending,
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
