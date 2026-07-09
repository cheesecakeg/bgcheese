const express = require('express');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 8080;
const DATA_DIR = path.join(__dirname, 'data');
const VAULT_FILE = path.join(DATA_DIR, 'vault.enc');
const INVITES_FILE = path.join(__dirname, 'invites.json');
const APP_HTML = path.join(__dirname, 'bgnk4.html');

const app = express();
app.use(express.json({ limit: '50mb' }));

function loadInvites() {
  try {
    return JSON.parse(fs.readFileSync(INVITES_FILE, 'utf8'));
  } catch {
    return [];
  }
}

function isValidInvite(code) {
  if (!code || typeof code !== 'string') return false;
  return loadInvites().includes(code.trim());
}

function isAdmin(code) {
  return code.trim() === '2011';
}

function requireInvite(req, res, next) {
  const code = req.headers['x-invite'] || req.body?.code;
  if (!isValidInvite(code)) {
    return res.status(403).json({ ok: false, error: 'Ungültige Einladung' });
  }
  req.invite = code.trim();
  req.isAdmin = isAdmin(code.trim());
  next();
}

function readVault() {
  try {
    if (fs.existsSync(VAULT_FILE)) {
      return fs.readFileSync(VAULT_FILE, 'utf8');
    }
  } catch {}
  return null;
}

function writeVault(vault) {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(VAULT_FILE, vault, 'utf8');
}

app.post('/api/invite', (req, res) => {
  const code = (req.body?.code || '').trim();
  if (isValidInvite(code)) {
    return res.json({ ok: true });
  }
  res.status(403).json({ ok: false, error: 'Ungültige Einladung' });
});

app.get('/api/vault', requireInvite, (req, res) => {
  res.json({ vault: readVault() });
});

app.put('/api/vault', requireInvite, (req, res) => {
  const vault = req.body?.vault;
  if (typeof vault !== 'string' || !vault) {
    return res.status(400).json({ ok: false, error: 'Kein Vault' });
  }
  writeVault(vault);
  res.json({ ok: true });
});

app.delete('/api/vault', requireInvite, (req, res) => {
  if (!req.isAdmin) {
    return res.status(403).json({ ok: false, error: 'Nur Admins können löschen' });
  }
  try {
    if (fs.existsSync(VAULT_FILE)) {
      fs.unlinkSync(VAULT_FILE);
    }
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ ok: false, error: 'Fehler beim Löschen' });
  }
});

app.get('/', (req, res) => {
  if (fs.existsSync(APP_HTML)) return res.sendFile(APP_HTML);
  res.status(404).send('bgnk4.html nicht auf dem Desktop gefunden');
});

app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) return res.status(404).json({ ok: false });
  if (fs.existsSync(APP_HTML)) return res.sendFile(APP_HTML);
  res.status(404).send('Nicht gefunden');
});

app.listen(PORT, () => {
  console.log(`bgnk4 läuft auf http://localhost:${PORT}`);
  console.log(`App: ${APP_HTML}`);
  console.log(`Einladungen: ${loadInvites().join(', ')}`);
});
