#!/usr/bin/env node

import fs from 'node:fs';

const [action, branchNameArg] = process.argv.slice(2);

const apiKey = process.env.NEON_API_KEY;
const projectId = process.env.NEON_PROJECT_ID;
const parentBranchId = process.env.NEON_PARENT_BRANCH_ID;
const databaseName = process.env.NEON_DATABASE_NAME || 'neondb';
const roleName = process.env.NEON_ROLE_NAME || 'neondb_owner';

if (!apiKey || !projectId) {
  throw new Error('NEON_API_KEY and NEON_PROJECT_ID are required');
}
if (!action || !['create', 'delete'].includes(action)) {
  throw new Error('Usage: neon-branch.mjs <create|delete> <branch-name>');
}
if (!branchNameArg) {
  throw new Error('Branch name is required');
}
if (action === 'create' && !parentBranchId) {
  throw new Error('NEON_PARENT_BRANCH_ID is required for create action');
}

const apiBase = `https://console.neon.tech/api/v2/projects/${projectId}`;
const headers = {
  Authorization: `Bearer ${apiKey}`,
  'Content-Type': 'application/json',
};

function setOutput(name, value) {
  if (!process.env.GITHUB_OUTPUT) {
    return;
  }
  fs.appendFileSync(process.env.GITHUB_OUTPUT, `${name}=${value}\n`);
}

async function request(path, options = {}) {
  const response = await fetch(`${apiBase}${path}`, {
    ...options,
    headers: {
      ...headers,
      ...(options.headers ?? {}),
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Neon API ${response.status} ${response.statusText}: ${text}`);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

async function findBranchByName(branchName) {
  const payload = await request('/branches', { method: 'GET' });
  return payload?.branches?.find((branch) => branch.name === branchName) ?? null;
}

async function createOrReuseBranch(branchName) {
  const existing = await findBranchByName(branchName);
  if (existing) {
    return existing;
  }

  const payload = await request('/branches', {
    method: 'POST',
    body: JSON.stringify({
      branch: {
        name: branchName,
        parent_id: parentBranchId,
      },
    }),
  });

  return payload.branch;
}

async function getConnectionUri(branchId) {
  const query = new URLSearchParams({
    branch_id: branchId,
    database_name: databaseName,
    role_name: roleName,
  });
  const payload = await request(`/connection_uri?${query.toString()}`, {
    method: 'GET',
  });

  if (!payload?.uri) {
    throw new Error('Neon connection URI was not returned');
  }

  return payload.uri;
}

async function deleteBranch(branchName) {
  const branch = await findBranchByName(branchName);
  if (!branch) {
    console.log(`No Neon branch found for ${branchName}, skipping delete`);
    return;
  }

  await request(`/branches/${branch.id}`, { method: 'DELETE' });
  console.log(`Deleted Neon branch ${branchName} (${branch.id})`);
}

async function run() {
  if (action === 'create') {
    const branch = await createOrReuseBranch(branchNameArg);
    const databaseUrl = await getConnectionUri(branch.id);

    setOutput('branch_id', branch.id);
    setOutput('branch_name', branch.name);
    setOutput('database_url', databaseUrl);

    console.log(
      JSON.stringify(
        {
          branchId: branch.id,
          branchName: branch.name,
          databaseUrl,
        },
        null,
        2,
      ),
    );
    return;
  }

  await deleteBranch(branchNameArg);
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
