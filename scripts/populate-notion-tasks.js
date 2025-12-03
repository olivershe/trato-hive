#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { Client } = require('@notionhq/client');

const notion = new Client({ auth: process.env.NOTION_API_KEY });
const TASKS_DB_ID = process.env.NOTION_TASKS_DB_ID;
const PROJECT_STATUS_PATH = path.join(__dirname, '../PROJECT_STATUS.md');

// Parse PROJECT_STATUS.md Phase 6 tasks
function parsePhase6Tasks() {
  const content = fs.readFileSync(PROJECT_STATUS_PATH, 'utf-8');

  // Extract Phase 6 section (flexible matching for title variations)
  const phase6Match = content.match(/### Phase 6:.*[\s\S]*?(?=### Phase 7:)/);
  if (!phase6Match) {
    throw new Error('Phase 6 section not found in PROJECT_STATUS.md');
  }

  const phase6Content = phase6Match[0];

  // Parse tasks: - [ ] **[TASK-001] Task Name** (Xh)
  const taskRegex = /- \[([ x])\] \*\*\[TASK-(\d{3})\] (.*?)\*\* \((\d+) hours?\)/g;
  const tasks = [];
  let match;

  // Determine package from section headers
  let currentPackage = 'shared';
  const lines = phase6Content.split('\n');
  let lineIndex = 0;

  while ((match = taskRegex.exec(phase6Content)) !== null) {
    const taskId = `TASK-${match[2]}`;
    const name = match[3].trim();
    const timeEst = `${match[4]}h`;
    const completed = match[1] === 'x';

    // Infer package from task name or section
    if (name.includes('Migration') || name.includes('Seed') || name.includes('Prisma')) {
      currentPackage = 'db';
    } else if (name.includes('NextAuth') || name.includes('OAuth') || name.includes('SAML') || name.includes('RBAC')) {
      currentPackage = 'auth';
    } else if (['TASK-001', 'TASK-002', 'TASK-003', 'TASK-004', 'TASK-005'].includes(taskId)) {
      currentPackage = 'shared';
    } else if (['TASK-006', 'TASK-007'].includes(taskId)) {
      currentPackage = 'db';
    } else if (['TASK-008', 'TASK-009', 'TASK-010', 'TASK-011', 'TASK-012', 'TASK-013'].includes(taskId)) {
      currentPackage = 'auth';
    }

    // Determine priority
    let priority = 'P1 High';
    if (name.includes('Critical') || name.includes('Migration')) {
      priority = 'P0 Critical';
    } else if (name.includes('Testing') || name.includes('Utilities')) {
      priority = 'P2 Medium';
    } else if (name.includes('LOW PRIORITY') || name.includes('SAML')) {
      priority = 'P3 Low';
    }

    tasks.push({
      taskId,
      name,
      status: completed ? 'Done' : 'Not Started',
      priority,
      phase: 'Phase 6',
      package: currentPackage,
      timeEst
    });
  }

  return tasks;
}

// Create tasks in Notion
async function createNotionTasks(tasks) {
  console.log(`\n📋 Creating ${tasks.length} tasks in Notion...\n`);

  for (const task of tasks) {
    try {
      await notion.pages.create({
        parent: { database_id: TASKS_DB_ID },
        properties: {
          'Name': {
            title: [{ text: { content: task.name } }]
          },
          'Task ID': {
            rich_text: [{ text: { content: task.taskId } }]
          },
          'Status': {
            status: { name: task.status }
          },
          'Priority': {
            select: { name: task.priority }
          },
          'Phase': {
            select: { name: task.phase }
          },
          'Package': {
            select: { name: task.package }
          },
          'Time Est': {
            rich_text: [{ text: { content: task.timeEst } }]
          },
          'Notes': {
            rich_text: [{ text: { content: 'Auto-imported from PROJECT_STATUS.md' } }]
          }
        }
      });

      console.log(`✅ Created ${task.taskId}: ${task.name} (${task.package}, ${task.timeEst})`);
    } catch (error) {
      console.error(`❌ Failed to create ${task.taskId}: ${error.message}`);
    }
  }
}

// Main execution
async function main() {
  if (!process.env.NOTION_API_KEY || !process.env.NOTION_TASKS_DB_ID) {
    console.error('❌ Missing NOTION_API_KEY or NOTION_TASKS_DB_ID');
    console.error('Usage: NOTION_API_KEY=secret_XXX NOTION_TASKS_DB_ID=xxx node populate-notion-tasks.js');
    process.exit(1);
  }

  try {
    const tasks = parsePhase6Tasks();
    console.log(`📋 Found ${tasks.length} Phase 6 tasks in PROJECT_STATUS.md`);

    await createNotionTasks(tasks);

    console.log(`\n✅ All ${tasks.length} tasks populated in Notion!`);
  } catch (error) {
    console.error('❌ Population failed:', error.message);
    process.exit(1);
  }
}

main();
