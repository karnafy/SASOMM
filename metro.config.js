const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '..');
const sharedRoot = path.resolve(monorepoRoot, 'shared');

const config = getDefaultConfig(projectRoot);

// Only watch the shared package (not the entire monorepo root)
config.watchFolders = [sharedRoot];

// Resolve node_modules from monorepo root and mobile root
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
];

// Ensure we don't get duplicate React
config.resolver.disableHierarchicalLookup = true;

module.exports = config;
