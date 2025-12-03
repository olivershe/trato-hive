#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { Client } = require('@notionhq/client');

const notion = new Client({ auth: process.env.NOTION_API_KEY });
const TASKS_DB_ID = process.env.NOTION_TASKS_DB_ID;
const PROJECT_STATUS_PATH = path.join(__dirname, '../../PROJECT_STATUS.md');

// Parse PROJECT_STATUS.md Phase 6 tasks
function parseProjectStatusTasks() {
  const content = fs.readFileSync(PROJECT_STATUS_PATH, 'utf-8');

  // Extract Phase 6 section (flexible matching for title variations)
  const phase6Match = content.match(/### Phase 6:.*[\s\S]*?(?=### Phase 7:)/);
  if (!phase6Match) return [];

  const phase6Content = phase6Match[0];

  // Parse checkboxes with [TASK-XXX]: - [ ] **[TASK-001] Task Name** (Xh)
  const taskRegex = /- \[([ x])\] \*\*\[TASK-(\d{3})\] (.*?)\*\* \((\d+) hours?\)/g;
  const tasks = [];
  let match;

  while ((match = taskRegex.exec(phase6Content)) !== null) {
    tasks.push({
      completed: match[1] === 'x',
      taskId: `TASK-${match[2]}`,
      name: match[3].trim(),
      timeEst: `${match[4]}h`
    });
  }

  return tasks;
}

// Fetch Phase 6 tasks from Notion
async function fetchNotionTasks() {
  try {
    const response = await notion.databases.query({
      database_id: TASKS_DB_ID,
      filter: {
        property: 'Phase',
        select: { equals: 'Phase 6' }
      },
      sorts: [{
        property: 'Task ID',
        direction: 'ascending'
      }]
    });

    return response.results.map(page => ({
      id: page.id,
      name: page.properties.Name?.title[0]?.plain_text || '',
      taskId: page.properties['Task ID']?.rich_text[0]?.plain_text || '',
      status: page.properties.Status?.status?.name || 'Not Started',
      completedDate: page.properties['Completed Date']?.date?.start,
      lastEdited: page.last_edited_time
    }));
  } catch (error) {
    console.error(`❌ Failed to fetch Notion tasks: ${error.message}`);
    throw error;
  }
}

// Update PROJECT_STATUS.md checkbox
function updateProjectStatusCheckbox(taskId, completed) {
  let content = fs.readFileSync(PROJECT_STATUS_PATH, 'utf-8');

  const checkbox = completed ? '[x]' : '[ ]';
  const regex = new RegExp(`- \\[([ x])\\] \\*\\*\\[${taskId}\\]`, 'g');

  if (regex.test(content)) {
    content = content.replace(regex, `- ${checkbox} **[${taskId}]`);
    fs.writeFileSync(PROJECT_STATUS_PATH, content, 'utf-8');
    return true;
  }

  return false;
}

// Update Notion task status
async function updateNotionTaskStatus(pageId, status) {
  try {
    await notion.pages.update({
      page_id: pageId,
      properties: {
        'Status': { status: { name: status } },
        ...(status === 'Done' && {
          'Completed Date': { date: { start: new Date().toISOString().split('T')[0] } }
        })
      }
    });
  } catch (error) {
    console.error(`❌ Failed to update Notion task: ${error.message}`);
    throw error;
  }
}

// Main sync logic
async function syncBidirectional() {
  console.log('🔄 Starting bidirectional sync...\n');

  // Read both sources
  const projectTasks = parseProjectStatusTasks();
  const notionTasks = await fetchNotionTasks();

  console.log(`📋 Found ${projectTasks.length} tasks in PROJECT_STATUS.md`);
  console.log(`📋 Found ${notionTasks.length} tasks in Notion\n`);

  let syncedCount = 0;

  // Compare and sync
  for (const notionTask of notionTasks) {
    const projectTask = projectTasks.find(pt => pt.taskId === notionTask.taskId);

    if (!projectTask) {
      console.log(`⚠️  Notion task "${notionTask.taskId}: ${notionTask.name}" not found in PROJECT_STATUS.md`);
      continue;
    }

    const notionDone = notionTask.status === 'Done';
    const projectDone = projectTask.completed;

    // Notion is Done but PROJECT_STATUS is unchecked
    if (notionDone && !projectDone) {
      console.log(`📝 Syncing to PROJECT_STATUS.md: ${projectTask.taskId} → Done`);
      updateProjectStatusCheckbox(projectTask.taskId, true);
      syncedCount++;
    }

    // PROJECT_STATUS is checked but Notion is not Done
    else if (projectDone && !notionDone) {
      console.log(`📝 Syncing to Notion: ${notionTask.taskId} → Done`);
      await updateNotionTaskStatus(notionTask.id, 'Done');
      syncedCount++;
    }
  }

  console.log(`\n✅ Bidirectional sync complete! ${syncedCount} tasks synced.`);
}

// Execute with error handling
syncBidirectional().catch(error => {
  console.error('❌ Sync failed:', error.message);
  process.exit(1);
});
