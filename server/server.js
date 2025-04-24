import express from 'express';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Setup directory paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, 'uploads');
const fileMapPath = path.join(__dirname, 'fileMap.json');

// Ensure uploads directory exists
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Initialize or load fileMap
let fileMap = {};
if (fs.existsSync(fileMapPath)) {
  try {
    const fileData = fs.readFileSync(fileMapPath, 'utf8');
    fileMap = JSON.parse(fileData);
  } catch (error) {
    console.error('Error loading fileMap:', error);
    // Initialize empty fileMap if file is corrupted
    fileMap = {};
    // Save empty fileMap to fix corrupted file
    fs.writeFileSync(fileMapPath, JSON.stringify(fileMap, null, 2));
  }
}

// Save fileMap to disk
const saveFileMap = () => {
  try {
    fs.writeFileSync(fileMapPath, JSON.stringify(fileMap, null, 2));
  } catch (error) {
    console.error('Error saving fileMap:', error);
  }
};

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename with original extension
    const fileExt = path.extname(file.originalname);
    const uniqueId = uuidv4();
    const storedFilename = `${uniqueId}${fileExt}`;
    cb(null, storedFilename);
  }
});

const upload = multer({ storage });

// Setup Express app
const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(cors());
app.use(express.json());

// File upload endpoint
app.post('/upload', upload.array('files'), (req, res) => {
  try {
    const uploadedFiles = req.files;
    const fileData = [];

    if (!uploadedFiles || uploadedFiles.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    // Process each uploaded file
    uploadedFiles.forEach(file => {
      const uid = path.parse(file.filename).name;
      const fileInfo = {
        uid,
        originalFilename: file.originalname,
        storedFilename: file.filename,
        size: file.size,
        mimeType: file.mimetype,
        uploadTime: new Date().toISOString()
      };
      
      // Add to fileMap
      fileMap[uid] = fileInfo;
      fileData.push(fileInfo);
    });

    // Save updated fileMap
    saveFileMap();

    return res.status(200).json({ 
      message: 'Files uploaded successfully', 
      files: fileData 
    });
  } catch (error) {
    console.error('Upload error:', error);
    return res.status(500).json({ error: 'File upload failed' });
  }
});

// Get all files endpoint
app.get('/files', (req, res) => {
  try {
    const files = Object.values(fileMap);
    res.setHeader('Content-Type', 'application/json');
    return res.status(200).json(files);
  } catch (error) {
    console.error('Get files error:', error);
    return res.status(500).json({ error: 'Failed to fetch files' });
  }
});

// Download file endpoint
app.get('/download/:uid', (req, res) => {
  try {
    const { uid } = req.params;
    const fileInfo = fileMap[uid];

    if (!fileInfo) {
      return res.status(404).json({ error: 'File not found' });
    }

    const filePath = path.join(uploadsDir, fileInfo.storedFilename);

    // Check if file exists on disk
    if (!fs.existsSync(filePath)) {
      delete fileMap[uid]; // Remove from fileMap if file doesn't exist
      saveFileMap();
      return res.status(404).json({ error: 'File not found on server' });
    }

    // Set appropriate headers for download
    res.setHeader('Content-Type', fileInfo.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(fileInfo.originalFilename)}"`);
    res.setHeader('Content-Length', fileInfo.size);
    
    // Stream file to client
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);

    // Handle errors during streaming
    fileStream.on('error', (error) => {
      console.error('Stream error:', error);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Error streaming file' });
      }
    });
  } catch (error) {
    console.error('Download error:', error);
    return res.status(500).json({ error: 'File download failed' });
  }
});

// Delete file endpoint
app.delete('/files/:uid', (req, res) => {
  try {
    const { uid } = req.params;
    const fileInfo = fileMap[uid];

    if (!fileInfo) {
      return res.status(404).json({ error: 'File not found' });
    }

    const filePath = path.join(uploadsDir, fileInfo.storedFilename);

    // Delete file from disk if it exists
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Remove from fileMap
    delete fileMap[uid];
    saveFileMap();

    return res.status(200).json({ message: 'File deleted successfully' });
  } catch (error) {
    console.error('Delete error:', error);
    return res.status(500).json({ error: 'File deletion failed' });
  }
});

// Serve static frontend in production
if (process.env.NODE_ENV === 'production') {
  const clientBuildDir = path.join(__dirname, '../dist');
  app.use(express.static(clientBuildDir));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientBuildDir, 'index.html'));
  });
}

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;