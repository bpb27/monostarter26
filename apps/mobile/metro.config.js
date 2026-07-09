// Metro config for the pnpm monorepo. Expo SDK 55+ auto-detects monorepos, but
// we set watchFolders + nodeModulesPaths explicitly so workspace packages
// (@repo/*) resolve reliably from the repo root.
const { getDefaultConfig } = require('expo/metro-config');
const path = require('node:path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

module.exports = config;
