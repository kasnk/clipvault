const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.json());

// ✅ Serve frontend static files
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ✅ Set up uploads folder globally
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, 'uploads')),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname),
});
const upload = multer({ storage });

const clipboard = {};

function generateCode() {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

// ✅ Clean expired data every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const code in clipboard) {
    if (clipboard[code].expiresAt < now) {
      if (clipboard[code].type === 'file') {
        const absolutePath = path.resolve(__dirname, clipboard[code].path);
        fs.unlink(absolutePath, (err) => {
          if (err) console.error('File deletion error:', err);
        });
      }
      delete clipboard[code];
    }
  }
}, 5 * 60 * 1000);

// ✅ Send (upload text/file)
// ✅ API: Send (text or file)
app.post('/api/send', upload.array('file'), (req, res) => {
  const { text } = req.body;
  let code = generateCode();

  // Ensure code is unique
  while (clipboard[code]) {
    code = generateCode();
  }

  const expiresAt = Date.now() + 30 * 60 * 1000; // Expires in 30 mins
  let files = [];

  if (req.files && req.files.length > 0) {
    files = req.files.map(file => ({
      filename: file.originalname,
      path: 'uploads/' + path.basename(file.path),
    }));
  }

  if (files.length > 0) {
    clipboard[code] = {
      type: 'file',
      files,
      expiresAt,
    };
  } else if (text) {
    clipboard[code] = { type: 'text', content: text, expiresAt };
  } else {
    return res.status(400).json({ error: 'No text or file provided' });
  }

  // ✅ Always send success message too
  res.json({ 
    success: true, 
    message: 'Sent successfully!', 
    code 
  });
});

// ✅ Receive (get by code)
app.get('/api/receive/:code', (req, res) => {
  const { code } = req.params;
  const data = clipboard[code];

  if (!data) return res.status(404).json({ error: 'Invalid or expired code' });

  if (data.type === 'text') {
    res.json({ type: 'text', content: data.content });
  } else if (data.type === 'file') {
    res.json({
      type: 'file',
      files: data.files.map(file => ({
        filename: file.filename,
        url: '/' + file.path,
      })),
    });
  }
});

// ✅ Serve index.html for root
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
