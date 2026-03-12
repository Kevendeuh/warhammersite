const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const imagesDir = path.join(__dirname, '..', 'public', 'images');

async function optimizeImages() {
  try {
    const files = fs.readdirSync(imagesDir);
    
    for (const file of files) {
      if (file.match(/\.(png|jpg|jpeg)$/i)) {
        const filePath = path.join(imagesDir, file);
        const stats = fs.statSync(filePath);
        
        // Optimize if file > 1MB
        if (stats.size > 1024 * 1024) {
          console.log(`Optimizing: ${file} (${(stats.size / 1024 / 1024).toFixed(2)} MB)`);
          
          const tempPath = path.join(imagesDir, `temp_${file}`);
          
          await sharp(filePath)
            .resize(800, null, { withoutEnlargement: true }) // Max width 800px, preserve aspect ratio
            .webp({ quality: 80 }) // Convert to webp/compress
            .toFile(tempPath);
            
          // Replace original with optimized version
          const newExt = '.webp';
          const newFileName = file.replace(/\.(png|jpg|jpeg)$/i, newExt);
          const newFilePath = path.join(imagesDir, newFileName);
          
          fs.renameSync(tempPath, newFilePath);
          
          if (file !== newFileName) {
              fs.unlinkSync(filePath); // remove original if converted
          }
           
          const newStats = fs.statSync(newFilePath);
          console.log(`✅ Done: ${newFileName} (${(newStats.size / 1024).toFixed(2)} KB)`);
        } else {
             console.log(`Skipping: ${file} (${(stats.size / 1024).toFixed(2)} KB) - Already small`);
        }
      }
    }
    console.log('Image optimization complete!');
  } catch (error) {
    console.error('Error optimizing images:', error);
  }
}

optimizeImages();
