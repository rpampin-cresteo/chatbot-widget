#!/usr/bin/env node
import { access, copyFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const envTemplate = path.join(projectRoot, '.env.example');
const envFile = path.join(projectRoot, '.env');

const ensureEnvFile = async () => {
  try {
    await access(envFile);
  } catch {
    try {
      await access(envTemplate);
    } catch {
      console.warn('[env] Missing .env.example template, skipping auto-creation.');
      return;
    }
    await copyFile(envTemplate, envFile);
    console.log('[env] Created .env from .env.example');
  }
};

ensureEnvFile().catch((error) => {
  console.error('[env] Failed to ensure environment file:', error);
  process.exitCode = 1;
});
