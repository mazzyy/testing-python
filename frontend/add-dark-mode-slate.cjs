const fs = require('fs');
const path = require('path');

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

const pagesDir = path.join(__dirname, 'src/pages');
const componentsDir = path.join(__dirname, 'src/components');

const allFiles = [...walkSync(pagesDir), ...walkSync(componentsDir)];
const tsxFiles = allFiles.filter(f => f.endsWith('.tsx'));

const replacements = [
    // Backgrounds
    [/\bbg-slate-50(?!\s*dark:)(?!\/)/g, 'bg-slate-50 dark:bg-surface-800/50'],
    [/\bbg-slate-100(?!\s*dark:)(?!\/)/g, 'bg-slate-100 dark:bg-surface-800'],

    // Text colors
    [/\btext-slate-900(?!\s*dark:)/g, 'text-slate-900 dark:text-white'],
    [/\btext-slate-800(?!\s*dark:)/g, 'text-slate-800 dark:text-surface-100'],
    [/\btext-slate-700(?!\s*dark:)/g, 'text-slate-700 dark:text-surface-300'],
    [/\btext-slate-600(?!\s*dark:)/g, 'text-slate-600 dark:text-surface-300'],
    [/\btext-slate-500(?!\s*dark:)/g, 'text-slate-500 dark:text-surface-400'],

    // Borders
    [/\bborder-slate-100(?!\s*dark:)/g, 'border-slate-100 dark:border-surface-700'],
    [/\bborder-slate-200(?!\s*dark:)/g, 'border-slate-200 dark:border-surface-700'],
    [/\bborder-slate-300(?!\s*dark:)/g, 'border-slate-300 dark:border-surface-600'],

    // Divide
    [/\bdivide-slate-100(?!\s*dark:)/g, 'divide-slate-100 dark:divide-surface-700'],

    // Specific backgrounds
    [/\bfrom-slate-50 to-white(?!\s*dark:)/g, 'from-slate-50 to-white dark:from-surface-900 dark:to-surface-900'],
];

let totalChanges = 0;

for (const filePath of tsxFiles) {
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
        console.log(`UPDATED: ${path.basename(filePath)}`);
        totalChanges++;
    }
}

console.log(`\nUpdated ${totalChanges} files.`);
