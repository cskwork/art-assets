#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');

function readJsonSafe(filePath, fallbackValue) {
  if (!fs.existsSync(filePath)) {
    return fallbackValue;
  }

  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(raw);
  } catch {
    return fallbackValue;
  }
}

function main() {
  const rootDir = process.env.PROJECT_ROOT || path.resolve(__dirname, '..');
  const jobsPath = process.env.JOB_STORE_PATH || path.join(rootDir, 'api', 'data', 'jobs.json');
  const eduRoot = path.join(rootDir, 'edu-content');

  const payload = readJsonSafe(jobsPath, { version: 1, jobs: [] });
  if (!Array.isArray(payload.jobs)) {
    payload.jobs = [];
  }

  if (!fs.existsSync(eduRoot)) {
    console.log('[backfill-jobs] edu-content 디렉토리가 없어 작업을 건너뜁니다.');
    return;
  }

  const existingModulePaths = new Set(
    payload.jobs
      .map((job) => job && job.modulePath)
      .filter((modulePath) => typeof modulePath === 'string' && modulePath.length > 0)
  );

  const entries = fs.readdirSync(eduRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .sort((a, b) => a.name.localeCompare(b.name));

  let addedCount = 0;

  entries.forEach((entry) => {
    const moduleId = entry.name;
    const modulePath = path.posix.join('edu-content', moduleId);
    const moduleDir = path.join(eduRoot, moduleId);
    const indexPath = path.join(moduleDir, 'index.html');

    if (existingModulePaths.has(modulePath) || !fs.existsSync(indexPath)) {
      return;
    }

    let createdAt = Date.now();
    try {
      createdAt = Math.floor(fs.statSync(indexPath).mtimeMs);
    } catch {
      createdAt = Date.now();
    }

    const files = ['index.html', 'script.js', 'style.css']
      .filter((fileName) => fs.existsSync(path.join(moduleDir, fileName)));

    payload.jobs.push({
      id: `backfill-${moduleId}`,
      jobType: 'generate',
      status: 'completed',
      request: {
        subject: 'math',
        topic: moduleId,
        gradeLevel: 'unknown'
      },
      moduleId,
      modulePath,
      files,
      createdAt
    });

    existingModulePaths.add(modulePath);
    addedCount += 1;
  });

  payload.version = 1;
  fs.mkdirSync(path.dirname(jobsPath), { recursive: true });
  fs.writeFileSync(jobsPath, JSON.stringify(payload, null, 2) + '\n', 'utf8');

  console.log(`[backfill-jobs] added=${addedCount} total=${payload.jobs.length} path=${jobsPath}`);
}

main();
