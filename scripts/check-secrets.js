#!/usr/bin/env node
const { execSync } = require('child_process');

const SECRET_PATTERNS = [
  /ANTHROPIC_API_KEY\s*=\s*["']?sk-ant-[a-zA-Z0-9-_]+/,
  /OPENAI_API_KEY\s*=\s*["']?sk-[a-zA-Z0-9-]+/,
  /PINECONE_API_KEY\s*=\s*["']?[a-zA-Z0-9-]{20,}/,
  /NOTION_API_KEY\s*=\s*["']?secret_[a-zA-Z0-9]+/,
  /NOTION_TOKEN\s*=\s*["']?secret_[a-zA-Z0-9]+/,
  /NEXTAUTH_SECRET\s*=\s*["']?[a-zA-Z0-9+/=]{20,}/,
  /JWT_SECRET\s*=\s*["']?[a-zA-Z0-9+/=]{20,}/,
  /AWS_ACCESS_KEY_ID\s*=\s*["']?AKIA[A-Z0-9]{16}/,
  /AWS_SECRET_ACCESS_KEY\s*=\s*["']?[a-zA-Z0-9/+=]{40}/,
  /-----BEGIN (RSA |EC |PRIVATE )?KEY-----/
];

const EXCLUDE_FILES = ['.env.example', '.env.template', 'check-secrets.js', '.mcp.json.example', 'populate-notion-tasks.js'];

try {
  const stagedFiles = execSync('git diff --cached --name-only', { encoding: 'utf-8' })
    .split('\n')
    .filter(Boolean)
    .filter(f => !f.includes('node_modules/') && !EXCLUDE_FILES.some(ex => f.includes(ex)));

  let foundSecrets = false;

  for (const file of stagedFiles) {
    try {
      const content = execSync(`git show :${file}`, { encoding: 'utf-8' });

      for (const pattern of SECRET_PATTERNS) {
        if (pattern.test(content)) {
          console.error(`❌ Potential secret detected in: ${file}`);
          foundSecrets = true;
        }
      }
    } catch (err) {
      // File deleted, skip
    }
  }

  if (foundSecrets) {
    console.error('\n❌ COMMIT BLOCKED: Secrets detected!');
    console.error('Remove secrets and use environment variables instead.');
    process.exit(1);
  }

  console.log('✅ No secrets detected');
} catch (error) {
  console.error('❌ Secret scan failed:', error.message);
  process.exit(1);
}
