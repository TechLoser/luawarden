const express = require('express');
const mongoose = require('mongoose');
const crypto = require('crypto');
const multer = require('multer');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// MongoDB Connection
mongoose.connect('mongodb://localhost:27017/luawarden', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

// Script Schema
const scriptSchema = new mongoose.Schema({
    code: { type: String, required: true },
    hash: { type: String, required: true, unique: true },
    createdAt: { type: Date, default: Date.now },
    views: { type: Number, default: 0 }
});

const Script = mongoose.model('Script', scriptSchema);

// Multer configuration for file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Generate unique hash for script
function generateHash(content) {
    return crypto.createHash('md5').update(content + Date.now().toString()).digest('hex');
}

// Routes

// Serve main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Handle script upload (file or raw code)
app.post('/upload', upload.single('luaFile'), async (req, res) => {
    try {
        let code;
        
        if (req.file) {
            // If file uploaded
            code = req.file.buffer.toString('utf8');
        } else {
            // If raw code pasted
            code = req.body.code;
        }

        if (!code || code.trim() === '') {
            return res.status(400).json({ error: 'No code provided' });
        }

        const hash = generateHash(code);
        
        // Check if hash already exists
        const existingScript = await Script.findOne({ hash });
        if (existingScript) {
            return res.json({ 
                success: true, 
                link: `${req.protocol}://${req.get('host')}/paste/${hash}`,
                message: 'Script already exists with this hash'
            });
        }

        // Save new script
        const newScript = new Script({ code, hash });
        await newScript.save();

        res.json({ 
            success: true, 
            link: `${req.protocol}://${req.get('host')}/paste/${hash}`,
            message: 'Script uploaded successfully!'
        });

    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Serve script by hash (for loadstring access)
app.get('/paste/:hash', async (req, res) => {
    try {
        const { hash } = req.params;
        const script = await Script.findOne({ hash });

        if (!script) {
            return res.status(404).send('Script not found');
        }

        // Increment view count
        script.views += 1;
        await script.save();

        // For loadstring compatibility, return just the code
        if (req.headers['user-agent'].includes('Lua') || req.query.raw === 'true') {
            res.set('Content-Type', 'text/plain');
            res.send(script.code);
        } else {
            // For browser, serve the paste page
            res.sendFile(path.join(__dirname, 'views', 'paste.html'));
        }

    } catch (error) {
        console.error('Fetch error:', error);
        res.status(500).send('Server error');
    }
});

// Get script code for loadstring (alternative endpoint)
app.get('/raw/:hash', async (req, res) => {
    try {
        const { hash } = req.params;
        const script = await Script.findOne({ hash });

        if (!script) {
            return res.status(404).send('Script not found');
        }

        res.set('Content-Type', 'text/plain');
        res.send(script.code);

    } catch (error) {
        console.error('Raw fetch error:', error);
        res.status(500).send('Server error');
    }
});

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
    console.log(`Lua Warden server running on port ${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/health`);
});
