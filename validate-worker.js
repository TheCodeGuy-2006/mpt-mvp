#!/usr/bin/env node

/**
 * Validate Cloudflare Worker Code
 * Checks if the worker code is properly formatted and exports the right structure
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function validateWorkerCode() {
  const workerPath = path.join(__dirname, 'cloudflare-worker.js');
  
  if (!fs.existsSync(workerPath)) {
    console.error('❌ cloudflare-worker.js not found');
    return false;
  }
  
  const content = fs.readFileSync(workerPath, 'utf8');
  
  // Check for new ES Module format
  const hasDefaultExport = content.includes('export default {');
  const hasFetchHandler = content.includes('async fetch(request, env, ctx)');
  const hasHealthEndpoint = content.includes('handleHealthCheck');
  const hasDataEndpoint = content.includes('handleGetData');
  const hasSaveEndpoint = content.includes('handleSave');
  
  // Check for old format (should not exist)
  const hasOldEventListener = content.includes('addEventListener(\'fetch\'');
  
  console.log('🔍 Cloudflare Worker Validation:');
  console.log('');
  console.log(`✅ Has ES Module export: ${hasDefaultExport ? '✅' : '❌'}`);
  console.log(`✅ Has fetch handler: ${hasFetchHandler ? '✅' : '❌'}`);
  console.log(`✅ Has health endpoint: ${hasHealthEndpoint ? '✅' : '❌'}`);
  console.log(`✅ Has data endpoint: ${hasDataEndpoint ? '✅' : '❌'}`);
  console.log(`✅ Has save endpoint: ${hasSaveEndpoint ? '✅' : '❌'}`);
  console.log(`✅ No old event listener: ${!hasOldEventListener ? '✅' : '❌'}`);
  console.log('');
  
  const isValid = hasDefaultExport && hasFetchHandler && hasHealthEndpoint && 
                  hasDataEndpoint && hasSaveEndpoint && !hasOldEventListener;
  
  if (isValid) {
    console.log('🎉 Worker code is valid and ready for deployment!');
    console.log('');
    console.log('📋 Next steps:');
    console.log('1. Copy the entire cloudflare-worker.js file');
    console.log('2. Go to your Cloudflare dashboard');
    console.log('3. Edit your Worker');
    console.log('4. Delete all existing code');
    console.log('5. Paste the new code');
    console.log('6. Update REPO_OWNER and REPO_NAME');
    console.log('7. Save and Deploy');
  } else {
    console.log('❌ Worker code has issues that need to be fixed!');
  }
  
  return isValid;
}

validateWorkerCode();
