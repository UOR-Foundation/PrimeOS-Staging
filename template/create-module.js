#!/usr/bin/env node

/**
 * Module Creation Script
 * ======================
 * 
 * This script creates a new module based on the template.
 * Usage: npm run create-module -- --name=your-module-name --path=path/to/parent/directory
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

// Parse command line arguments
const args = process.argv.slice(2).reduce((acc, arg) => {
  if (arg.startsWith('--')) {
    const [key, value] = arg.slice(2).split('=');
    acc[key] = value;
  }
  return acc;
}, {});

// Validate required arguments
if (!args.name) {
  console.error('Error: Module name is required (--name=your-module-name)');
  process.exit(1);
}

// Set default path if not provided
if (!args.path) {
  args.path = '.';
  console.log('No path specified, using current directory');
}

// Create module name variants
const moduleName = args.name;
const moduleNameCamel = moduleName.replace(/-([a-z])/g, g => g[1].toUpperCase());
const moduleNamePascal = moduleNameCamel.charAt(0).toUpperCase() + moduleNameCamel.slice(1);
const moduleNameUnderline = '='.repeat(moduleName.length);
const modulePrefix = moduleNamePascal;

// Default module description
const moduleDescription = args.description || `${moduleNamePascal} implementation for PrimeOS`;

// Template directory
const templateDir = path.join(__dirname);

// Target directory
const targetDir = path.join(process.cwd(), args.path, moduleName);

// Create target directory if it doesn't exist
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
  console.log(`Created directory: ${targetDir}`);
} else {
  console.log(`Directory already exists: ${targetDir}`);
}

// Get parent module name for dependencies
const parentModule = args.parent || 'primeos';

// Get template files
const templateFiles = [
  { source: 'module-README.md', target: 'README.md' },
  'package.json',
  'types.ts',
  'index.ts',
  'test.ts'
];

// Replace placeholders in content
function replacePlaceholders(content) {
  return content
    .replace(/\{\{module-name\}\}/g, moduleName)
    .replace(/\{\{module-name-underline\}\}/g, moduleNameUnderline)
    .replace(/\{\{module-prefix\}\}/g, modulePrefix)
    .replace(/\{\{module-description\}\}/g, moduleDescription)
    .replace(/\{\{module-keyword\}\}/g, moduleName)
    .replace(/\{\{parent-module\}\}/g, parentModule);
}

// Process each template file
templateFiles.forEach(fileConfig => {
  // Skip the script itself
  if (fileConfig === 'create-module.js') return;
  
  // Handle both string and object formats
  let sourceName, targetName;
  if (typeof fileConfig === 'string') {
    sourceName = fileConfig;
    targetName = fileConfig;
  } else {
    sourceName = fileConfig.source;
    targetName = fileConfig.target;
  }
  
  const templateFilePath = path.join(templateDir, sourceName);
  const targetFilePath = path.join(targetDir, targetName);
  
  if (fs.existsSync(templateFilePath)) {
    // Read template file
    const templateContent = fs.readFileSync(templateFilePath, 'utf8');
    
    // Replace placeholders
    const processedContent = replacePlaceholders(templateContent);
    
    // Write to target file
    fs.writeFileSync(targetFilePath, processedContent);
    console.log(`Created ${targetName}`);
  } else {
    console.warn(`Template file not found: ${templateFilePath}`);
  }
});

// Update main package.json dependencies if requested
if (args.install === 'true' || args.install === true) {
  const mainPackageJsonPath = path.join(process.cwd(), 'package.json');
  
  if (fs.existsSync(mainPackageJsonPath)) {
    const mainPackageJson = JSON.parse(fs.readFileSync(mainPackageJsonPath, 'utf8'));
    
    // Add the new module to dependencies
    if (!mainPackageJson.dependencies) {
      mainPackageJson.dependencies = {};
    }
    
    mainPackageJson.dependencies[moduleName] = `file:${path.relative(process.cwd(), targetDir)}`;
    
    // Write updated package.json
    fs.writeFileSync(mainPackageJsonPath, JSON.stringify(mainPackageJson, null, 2));
    console.log(`Updated dependencies in main package.json`);
    
    // Run npm install if requested
    if (args.npm === 'true' || args.npm === true) {
      console.log('Running npm install...');
      exec('npm install', { cwd: process.cwd() }, (error, stdout, stderr) => {
        if (error) {
          console.error(`Error running npm install: ${error.message}`);
          return;
        }
        if (stderr) {
          console.error(`npm install stderr: ${stderr}`);
        }
        console.log(`npm install stdout: ${stdout}`);
        console.log('Module created and installed successfully!');
      });
    } else {
      console.log('Module created successfully!');
      console.log('Run npm install to update dependencies');
    }
  } else {
    console.warn('Main package.json not found, skipping dependency update');
    console.log('Module created successfully!');
  }
} else {
  console.log('Module created successfully!');
}
