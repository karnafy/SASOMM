const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const sharedRoot = path.resolve(projectRoot, 'shared');

const config = getDefaultConfig(projectRoot);

// Watch the shared package (now local)
config.watchFolders = [sharedRoot];

// Resolve node_modules from project root
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
];

// Ensure we don't get duplicate React
config.resolver.disableHierarchicalLookup = true;

module.exports = config;
