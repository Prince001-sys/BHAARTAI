const fs = require('fs');
const path = require('path');

function walk(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    const dirPath = path.join(dir, f);
    const isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walk(dirPath, callback) : callback(path.join(dir, f));
  });
}

walk('src/app/api', (filePath) => {
  if (filePath.endsWith('.ts')) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    const originalContent = content;

    // Add import if not present and there are console calls
    if (/(console\.error|console\.log|console\.warn)/.test(content)) {
      if (!content.includes('import { logger } from \'@/lib/logger\'')) {
        content = `import { logger } from '@/lib/logger'\n` + content;
      }
      
      content = content.replace(/console\.error\((.*?)\)/g, 'logger.error($1)');
      content = content.replace(/console\.log\((.*?)\)/g, 'logger.info($1)');
      content = content.replace(/console\.warn\((.*?)\)/g, 'logger.warn($1)');
      
      if (content !== originalContent) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Updated ${filePath}`);
      }
    }
  }
});
