const fs = require('fs');
const path = require('path');

const directoryToSearch = path.join(__dirname, 'src');

const replacements = {
  'max-w-xs': 'max-w-[320px]',
  'max-w-sm': 'max-w-[384px]',
  'max-w-md': 'max-w-[448px]',
  'max-w-lg': 'max-w-[512px]',
  'max-w-xl': 'max-w-[576px]',
  'max-w-2xl': 'max-w-[672px]',
  'max-w-3xl': 'max-w-[768px]',
};

const regex = new RegExp(`\\b(${Object.keys(replacements).join('|')})\\b`, 'g');

function walkDir(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      results = results.concat(walkDir(fullPath));
    } else if (fullPath.endsWith('.tsx')) {
      results.push(fullPath);
    }
  });
  return results;
}

const files = walkDir(directoryToSearch);

files.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  if (regex.test(content)) {
    const newContent = content.replace(regex, (match) => replacements[match]);
    fs.writeFileSync(file, newContent, 'utf8');
    console.log(`Updated ${file}`);
  }
});

console.log('Finished updating max-w-* classes.');
