#!/usr/bin/env node
const { Client } = require('@notionhq/client');

// Validate environment
const NOTION_API_KEY = process.env.NOTION_API_KEY;
const NOTION_TASKS_DB_ID = process.env.NOTION_TASKS_DB_ID;

if (!NOTION_API_KEY || !NOTION_TASKS_DB_ID) {
  console.error('❌ Missing NOTION_API_KEY or NOTION_TASKS_DB_ID');
  process.exit(1);
}

const notion = new Client({ auth: NOTION_API_KEY });

// Extract [TASK-XXX] from commit/PR message
function extractTaskId(message) {
  const match = message.match(/\[TASK-(\d+)\]/);
  return match ? `TASK-${match[1]}` : null;
}

// Find Notion task by Task ID property
async function findNotionTask(taskId) {
  try {
    const response = await notion.databases.query({
      database_id: NOTION_TASKS_DB_ID,
      filter: {
        property: 'Task ID',
        rich_text: { equals: taskId }
      }
    });
    return response.results[0] || null;
  } catch (error) {
    console.error(`❌ Failed to query Notion: ${error.message}`);
    return null;
  }
}

// Update GitHub Commits field (append commit link)
async function updateTaskCommits(pageId, commitUrl, commitMessage, author) {
  try {
    // Get current page data
    const page = await notion.pages.retrieve({ page_id: pageId });
    const currentNotes = page.properties.Notes?.rich_text[0]?.plain_text || '';

    const timestamp = new Date().toISOString();
    const newNote = `\n[${timestamp}] ${author}: ${commitMessage}\nCommit: ${commitUrl}`;

    await notion.pages.update({
      page_id: pageId,
      properties: {
        'GitHub Commits': {
          url: commitUrl
        },
        'Notes': {
          rich_text: [{
            text: { content: (currentNotes + newNote).slice(0, 2000) } // Notion limit
          }]
        }
      }
    });

    console.log(`✅ Updated Notion task with commit: ${commitUrl}`);
  } catch (error) {
    console.error(`❌ Failed to update task: ${error.message}`);
    throw error;
  }
}

// Mark task Done on PR merge
async function markTaskDone(pageId, prUrl) {
  try {
    await notion.pages.update({
      page_id: pageId,
      properties: {
        'Status': { status: { name: 'Done' } },
        'Completed Date': { date: { start: new Date().toISOString().split('T')[0] } },
        'GitHub Commits': {
          url: prUrl
        }
      }
    });

    console.log(`✅ Marked task Done in Notion: ${prUrl}`);
  } catch (error) {
    console.error(`❌ Failed to mark task done: ${error.message}`);
    throw error;
  }
}

// Retry with exponential backoff
async function retryWithBackoff(fn, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      const delay = Math.pow(2, i) * 1000;
      console.log(`⏳ Retry ${i + 1}/${maxRetries} after ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

// Main execution
async function main() {
  const action = process.argv[2] || 'update'; // 'update' or 'done'
  const commitMessage = process.env.COMMIT_MESSAGE || process.env.PR_TITLE || '';
  const commitUrl = process.env.COMMIT_URL || process.env.PR_URL || '';
  const commitAuthor = process.env.COMMIT_AUTHOR || 'Unknown';

  // Extract task ID
  const taskId = extractTaskId(commitMessage);
  if (!taskId) {
    console.log('ℹ️  No [TASK-XXX] found in message, skipping Notion sync');
    return;
  }

  // Find task in Notion
  const task = await retryWithBackoff(() => findNotionTask(taskId));
  if (!task) {
    console.error(`❌ Task ${taskId} not found in Notion database`);
    process.exit(1);
  }

  // Perform action
  if (action === 'update') {
    await retryWithBackoff(() =>
      updateTaskCommits(task.id, commitUrl, commitMessage, commitAuthor)
    );
  } else if (action === 'done') {
    await retryWithBackoff(() =>
      markTaskDone(task.id, commitUrl)
    );
  } else {
    console.error(`❌ Unknown action: ${action}`);
    process.exit(1);
  }

  console.log(`✅ Notion sync complete for ${taskId}`);
}

main().catch(error => {
  console.error('❌ Notion sync failed:', error.message);
  // Graceful failure - don't block Git operations
  process.exit(0);
});
