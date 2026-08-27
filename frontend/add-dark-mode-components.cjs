const fs = require('fs');
const path = require('path');

const componentsDir = path.join(__dirname, 'src/components');

// Find all .tsx files recursively
const walkSync = (dir, filelist = []) => {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const filepath = path.join(dir, file);
        if (fs.statSync(filepath).isDirectory()) {
            filelist = walkSync(filepath, filelist);
        } else {
            filelist.push(filepath);
        }
    }
    return filelist;
};

const allFiles = walkSync(componentsDir);
const tsxFiles = allFiles.filter(f => f.endsWith('.tsx'));

const skipFiles = ['Layout.tsx', 'Header.tsx', 'Footer.tsx', 'CreatePostModal.tsx'];

// Replacement rules: [pattern, replacement]
const replacements = [
    // Background colors
    [/\bbg-white(?!\s*dark:)(?!\/)/g, 'bg-white dark:bg-surface-800'],
    [/\bbg-gray-50(?!\s*dark:)/g, 'bg-gray-50 dark:bg-surface-900'],
    [/\bbg-surface-50(?!\s*dark:)/g, 'bg-surface-50 dark:bg-surface-800'],
    [/\bbg-surface-100(?!\s*dark:)/g, 'bg-surface-100 dark:bg-surface-700'],

    // Text colors  
    [/\btext-surface-900(?!\s*dark:)/g, 'text-surface-900 dark:text-white'],
    [/\btext-surface-800(?!\s*dark:)/g, 'text-surface-800 dark:text-surface-100'],
    [/\btext-surface-700(?!\s*dark:)/g, 'text-surface-700 dark:text-surface-300'],
    [/\btext-surface-600(?!\s*dark:)/g, 'text-surface-600 dark:text-surface-400'],
    [/\btext-surface-500(?!\s*dark:)/g, 'text-surface-500 dark:text-surface-400'],
    [/\btext-gray-900(?!\s*dark:)/g, 'text-gray-900 dark:text-white'],
    [/\btext-gray-800(?!\s*dark:)/g, 'text-gray-800 dark:text-gray-100'],
    [/\btext-gray-700(?!\s*dark:)/g, 'text-gray-700 dark:text-gray-300'],
    [/\btext-gray-600(?!\s*dark:)/g, 'text-gray-600 dark:text-gray-400'],
    [/\btext-gray-500(?!\s*dark:)/g, 'text-gray-500 dark:text-gray-400'],

    // Border colors
    [/\bborder-surface-100(?!\s*dark:)/g, 'border-surface-100 dark:border-surface-700'],
    [/\bborder-surface-200(?!\s*dark:)/g, 'border-surface-200 dark:border-surface-700'],
    [/\bborder-gray-100(?!\s*dark:)/g, 'border-gray-100 dark:border-gray-700'],
    [/\bborder-gray-200(?!\s*dark:)/g, 'border-gray-200 dark:border-gray-700'],
    [/\bborder-gray-300(?!\s*dark:)/g, 'border-gray-300 dark:border-gray-600'],

    // Hover backgrounds
    [/\bhover:bg-surface-50(?!\s*dark:)/g, 'hover:bg-surface-50 dark:hover:bg-surface-700'],
    [/\bhover:bg-surface-100(?!\s*dark:)/g, 'hover:bg-surface-100 dark:hover:bg-surface-700'],
    [/\bhover:bg-gray-50(?!\s*dark:)/g, 'hover:bg-gray-50 dark:hover:bg-surface-700'],
    [/\bhover:bg-gray-100(?!\s*dark:)/g, 'hover:bg-gray-100 dark:hover:bg-surface-700'],

    // Divide colors
    [/\bdivide-surface-100(?!\s*dark:)/g, 'divide-surface-100 dark:divide-surface-700'],
    [/\bdivide-gray-100(?!\s*dark:)/g, 'divide-gray-100 dark:divide-gray-700'],
    [/\bdivide-gray-200(?!\s*dark:)/g, 'divide-gray-200 dark:divide-gray-700'],

    // Placeholder colors
    [/\bplaceholder-surface-400(?!\s*dark:)/g, 'placeholder-surface-400 dark:placeholder-surface-500'],
    [/\bplaceholder-gray-400(?!\s*dark:)/g, 'placeholder-gray-400 dark:placeholder-gray-500'],

    // Ring colors
    [/\bring-surface-200(?!\s*dark:)/g, 'ring-surface-200 dark:ring-surface-700'],
];

let totalChanges = 0;

for (const filePath of tsxFiles) {
    const fileName = path.basename(filePath);
    if (skipFiles.includes(fileName)) {
        console.log(`SKIP: ${fileName}`);
        continue;
    }

    let content = fs.readFileSync(filePath, 'utf8');
    let fileChanges = 0;

    for (const [pattern, replacement] of replacements) {
        const before = content;
        content = content.replace(pattern, replacement);
        if (content !== before) {
            fileChanges++;
        }
    }

    if (fileChanges > 0) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`UPDATED: ${fileName} (${fileChanges} pattern groups changed)`);
        totalChanges += fileChanges;
    } else {
        // console.log(`NO CHANGES: ${fileName}`);
    }
}

console.log(`\nDone! Total files with changes: ${totalChanges}`);
