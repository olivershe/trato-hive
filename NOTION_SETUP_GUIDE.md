# 🐝 Trato Hive Notion Workspace Setup Guide

**Complete step-by-step instructions for building your Notion project management system**

**Estimated Setup Time:** 30-45 minutes
**Last Updated:** December 2025

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Step 1: Clean Existing Workspace](#step-1-clean-existing-workspace)
3. [Step 2: Create Tasks Database](#step-2-create-tasks-database)
4. [Step 3: Create Phases Database](#step-3-create-phases-database)
5. [Step 4: Create Documentation Database](#step-4-create-documentation-database)
6. [Step 5: Build Command Center Dashboard](#step-5-build-command-center-dashboard)
7. [Step 6: Populate Sample Data](#step-6-populate-sample-data)
8. [Verification Checklist](#verification-checklist)
9. [GitHub Automation (Future)](#github-automation-future)

---

## Prerequisites

✅ Notion account with Trato Hive workspace
✅ Notion integration created at https://www.notion.so/my-integrations
✅ Integration connected to your workspace
✅ GitHub repository: `olivershe/trato-hive`

---

## Step 1: Clean Existing Workspace

### 1.1 Navigate to Your Trato Hive Workspace

1. Open Notion
2. Go to your "Trato Hive" workspace
3. Review existing pages/databases

### 1.2 Delete Default Content

Delete any default pages that aren't needed:
- Getting Started pages
- Template galleries
- Example databases
- Welcome pages

**Keep:** Any custom pages you've already created

---

## Step 2: Create Tasks Database

### 2.1 Create New Database

1. In your Trato Hive workspace, click **"New page"**
2. Type: **📋 Tasks**
3. Choose: **"Database - Full page"**
4. Select: **"Table"** view

### 2.2 Configure Properties

**Delete default properties except "Name"**, then add these:

| Property Name | Type | Configuration |
|--------------|------|---------------|
| **Name** | Title | (already exists) |
| **Status** | Status | Options: Not Started, In Progress, Done, Blocked |
| **Priority** | Select | Options: P0 Critical, P1 High, P2 Medium, P3 Low |
| **Phase** | Select | Options: Phase 6, Phase 7, Phase 8, Phase 9, Phase 10 |
| **Package** | Select | Options: shared, ui, db, auth, data-plane, semantic-layer, ai-core, agents, web, api |
| **Feature** | Select | Options: Command Center, Discovery, Deals, Diligence, Generator |
| **Time Est** | Text | - |
| **Task ID** | Text | - |
| **GitHub Commits** | URL | - |
| **Notes** | Text | - |
| **Completed Date** | Date | - |
| **Dependencies** | Relation | Relation to: Tasks (self) |

### 2.3 Configure Status Property Colors

1. Click on **Status** property
2. Edit options:
   - **Not Started**: Gray
   - **In Progress**: Orange
   - **Done**: Green
   - **Blocked**: Red

### 2.4 Configure Priority Property Colors

1. Click on **Priority** property
2. Edit options:
   - **P0 Critical**: Red
   - **P1 High**: Orange
   - **P2 Medium**: Yellow
   - **P3 Low**: Gray

### 2.5 Create Views

#### View 1: Active Work (Board)

1. Click **"+ Add a view"**
2. Name: **Active Work**
3. Type: **Board**
4. Group by: **Status**
5. Filter: **Status** is not **Done**
6. Properties to show: Name, Priority, Phase, Package, Time Est, Task ID

#### View 2: By Phase (Board)

1. Click **"+ Add a view"**
2. Name: **By Phase**
3. Type: **Board**
4. Group by: **Phase**
5. Properties to show: Name, Status, Priority, Package, Time Est

#### View 3: All Tasks (Table)

1. Click **"+ Add a view"**
2. Name: **All Tasks**
3. Type: **Table**
4. Sort by: **Priority** (P0 → P3)
5. Show all properties

#### View 4: Blocked Items (List)

1. Click **"+ Add a view"**
2. Name: **Blocked Items**
3. Type: **List**
4. Filter: **Status** is **Blocked**
5. Properties to show: Name, Phase, Package, Notes

#### View 5: This Week (Calendar)

1. Click **"+ Add a view"**
2. Name: **This Week**
3. Type: **Calendar**
4. Show by: **Completed Date**
5. Filter: **Status** is **Done**

---

## Step 3: Create Phases Database

### 3.1 Create New Database

1. In your Trato Hive workspace, click **"New page"**
2. Type: **🎯 Phases**
3. Choose: **"Database - Full page"**
4. Select: **"Table"** view

### 3.2 Configure Properties

| Property Name | Type | Configuration |
|--------------|------|---------------|
| **Name** | Title | (already exists) |
| **Status** | Select | Options: Planning, Active, Complete |
| **Progress** | Number | Format: Percent |
| **Start Date** | Date | - |
| **Target Date** | Date | - |
| **Description** | Text | - |
| **Key Deliverables** | Text | - |
| **Time Estimate** | Text | - |

### 3.3 Configure Status Property Colors

1. Click on **Status** property
2. Edit options:
   - **Planning**: Gray
   - **Active**: Orange
   - **Complete**: Green

### 3.4 Create Views

#### View 1: Active Phase (Gallery)

1. Click **"+ Add a view"**
2. Name: **Active Phase**
3. Type: **Gallery**
4. Filter: **Status** is **Active**
5. Card preview: **Description**
6. Card size: **Large**

#### View 2: Timeline (Timeline)

1. Click **"+ Add a view"**
2. Name: **Timeline**
3. Type: **Timeline**
4. Show by: **Start Date** → **Target Date**

#### View 3: All Phases (Table)

1. Click **"+ Add a view"**
2. Name: **All Phases**
3. Type: **Table**
4. Sort by: **Name** (Phase 6 → Phase 10)

---

## Step 4: Create Documentation Database

### 4.1 Create New Database

1. In your Trato Hive workspace, click **"New page"**
2. Type: **📚 Documentation**
3. Choose: **"Database - Full page"**
4. Select: **"Table"** view

### 4.2 Configure Properties

| Property Name | Type | Configuration |
|--------------|------|---------------|
| **Name** | Title | (already exists) |
| **Type** | Select | Options: CLAUDE.md, PRD, Architecture, Setup Guide, Design System |
| **URL** | URL | - |
| **Package/Feature** | Text | - |

### 4.3 Configure Type Property Colors

1. Click on **Type** property
2. Edit options:
   - **CLAUDE.md**: Blue
   - **PRD**: Purple
   - **Architecture**: Teal
   - **Setup Guide**: Gray
   - **Design System**: Orange

### 4.4 Create Views

#### View 1: By Type (Board)

1. Click **"+ Add a view"**
2. Name: **By Type**
3. Type: **Board**
4. Group by: **Type**

#### View 2: Quick Links (Table)

1. Click **"+ Add a view"**
2. Name: **Quick Links**
3. Type: **Table**
4. Sort by: **Type**
5. Show all properties

---

## Step 5: Build Command Center Dashboard

### 5.1 Create Dashboard Page

1. In your Trato Hive workspace, click **"New page"**
2. Type: **🐝 Trato Hive Command Center**
3. Choose: **"Empty page"**

### 5.2 Add Header

```
🐝 Trato Hive Command Center
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**Formatting:**
- Title: H1 (Heading 1)
- Line: Use divider block

### 5.3 Add Current Phase Section

1. Type: **## 📊 Current Phase**
2. Press Enter
3. Type: `/linked` and choose **"Create linked database"**
4. Select: **🎯 Phases**
5. Name this view: **Active Phase**
6. Configure:
   - View type: **Gallery**
   - Filter: **Status** is **Active**
   - Card preview: **Description**
   - Properties to show: Progress, Start Date, Target Date, Key Deliverables

### 5.4 Add Active Tasks Section

1. Type: **## ⚡ Active Tasks**
2. Press Enter
3. Type: `/linked` and choose **"Create linked database"**
4. Select: **📋 Tasks**
5. Name this view: **Active Work Board**
6. Configure:
   - View type: **Board**
   - Group by: **Status**
   - Filter: **Status** is not **Done**
   - Properties to show: Priority, Phase, Package, Time Est

### 5.5 Add Phase 6 Progress Section

1. Type: **## 📈 Phase 6 Progress**
2. Press Enter
3. Type: `/linked` and choose **"Create linked database"**
4. Select: **📋 Tasks**
5. Name this view: **Phase 6 Tasks**
6. Configure:
   - View type: **Table**
   - Filter: **Phase** is **Phase 6**
   - Properties to show: Name, Status, Priority, Package, Time Est, Task ID
   - Sort by: **Priority**

### 5.6 Add Blocked Items Section

1. Type: **## 🚧 Blocked Items**
2. Press Enter
3. Type: `/linked` and choose **"Create linked database"**
4. Select: **📋 Tasks**
5. Name this view: **Blocked Tasks**
6. Configure:
   - View type: **List**
   - Filter: **Status** is **Blocked**
   - Properties to show: Name, Phase, Package, Notes

### 5.7 Add Quick Links Section

1. Type: **## 📚 Quick Links**
2. Press Enter
3. Type: `/linked` and choose **"Create linked database"**
4. Select: **📚 Documentation**
5. Name this view: **Docs Quick Access**
6. Configure:
   - View type: **Table**
   - Properties to show: Name, Type, URL, Package/Feature
   - Sort by: **Type**

### 5.8 Add Recent Completions Section

1. Type: **## 🎯 Recent Completions**
2. Press Enter
3. Type: `/linked` and choose **"Create linked database"**
4. Select: **📋 Tasks**
5. Name this view: **Recently Done**
6. Configure:
   - View type: **List**
   - Filter: **Status** is **Done**
   - Sort by: **Completed Date** (Descending)
   - Limit: 5 items
   - Properties to show: Name, Completed Date, Package

### 5.9 Apply Trato Hive Colors (Optional)

To match the Trato Hive design system:
- Section headers: Add callout blocks with **Bone** background `#E2D9CB`
- Use **Orange** `#EE8D1D` for important callouts
- Use **Teal Blue** `#2F7E8A` for citation/link callouts

---

## Step 6: Populate Sample Data

### 6.1 Add Phases

Navigate to **🎯 Phases** database and add these entries:

#### Phase 6: Foundation Packages

- **Name:** Phase 6: Foundation Packages (40h)
- **Status:** Active
- **Progress:** 0
- **Start Date:** (Today's date)
- **Target Date:** (5 working days from today)
- **Description:** Implement core foundation packages: shared types/validators/utilities, database migrations, and authentication setup
- **Key Deliverables:** @trato-hive/shared, @trato-hive/db, @trato-hive/auth
- **Time Estimate:** 40h

#### Phase 7: Frontend

- **Name:** Phase 7: Frontend (35h)
- **Status:** Planning
- **Progress:** 0
- **Start Date:** (Leave empty)
- **Target Date:** (Leave empty)
- **Description:** Build UI component library and Next.js pages for all modules
- **Key Deliverables:** @trato-hive/ui component library, apps/web pages and layouts
- **Time Estimate:** 35h

#### Phase 8: Backend

- **Name:** Phase 8: Backend (30h)
- **Status:** Planning
- **Progress:** 0
- **Start Date:** (Leave empty)
- **Target Date:** (Leave empty)
- **Description:** Implement Fastify backend with tRPC routers and business logic services
- **Key Deliverables:** apps/api routers, tRPC endpoints, service layer
- **Time Estimate:** 30h

#### Phase 9: AI Stack

- **Name:** Phase 9: AI Stack (70h)
- **Status:** Planning
- **Progress:** 0
- **Start Date:** (Leave empty)
- **Target Date:** (Leave empty)
- **Description:** Implement AI core infrastructure: LLM services, vector database, document processing, and agentic workflows
- **Key Deliverables:** ai-core, semantic-layer, data-plane, agents packages
- **Time Estimate:** 70h

#### Phase 10: Features

- **Name:** Phase 10: Features (60h)
- **Status:** Planning
- **Progress:** 0
- **Start Date:** (Leave empty)
- **Target Date:** (Leave empty)
- **Description:** Implement all 5 feature modules with full functionality
- **Key Deliverables:** Command Center, Discovery, Deals, Diligence, Generator modules
- **Time Estimate:** 60h

### 6.2 Add Sample Tasks

Navigate to **📋 Tasks** database and add these 5 tasks:

#### Task 1

- **Name:** Implement @trato-hive/shared types
- **Status:** Not Started
- **Priority:** P1 High
- **Phase:** Phase 6
- **Package:** shared
- **Feature:** (Leave empty)
- **Time Est:** 4h
- **Task ID:** TASK-001
- **GitHub Commits:** (Leave empty)
- **Notes:** Define User, Organization, Deal, Company, Document, Fact, Activity types
- **Completed Date:** (Leave empty)
- **Dependencies:** (Leave empty)

#### Task 2

- **Name:** Implement @trato-hive/shared validators
- **Status:** Not Started
- **Priority:** P1 High
- **Phase:** Phase 6
- **Package:** shared
- **Feature:** (Leave empty)
- **Time Est:** 4h
- **Task ID:** TASK-002
- **GitHub Commits:** (Leave empty)
- **Notes:** Create Zod schemas for all inputs and API requests
- **Completed Date:** (Leave empty)
- **Dependencies:** TASK-001

#### Task 3

- **Name:** Implement @trato-hive/shared utilities
- **Status:** Not Started
- **Priority:** P2 Medium
- **Phase:** Phase 6
- **Package:** shared
- **Feature:** (Leave empty)
- **Time Est:** 4h
- **Task ID:** TASK-003
- **GitHub Commits:** (Leave empty)
- **Notes:** Date formatting, currency helpers, string utilities
- **Completed Date:** (Leave empty)
- **Dependencies:** (Leave empty)

#### Task 4

- **Name:** Create Prisma migrations for initial schema
- **Status:** Not Started
- **Priority:** P0 Critical
- **Phase:** Phase 6
- **Package:** db
- **Feature:** (Leave empty)
- **Time Est:** 3h
- **Task ID:** TASK-004
- **GitHub Commits:** (Leave empty)
- **Notes:** Generate migrations from schema.prisma, run db:push
- **Completed Date:** (Leave empty)
- **Dependencies:** (Leave empty)

#### Task 5

- **Name:** Set up NextAuth 5 configuration
- **Status:** Not Started
- **Priority:** P1 High
- **Phase:** Phase 6
- **Package:** auth
- **Feature:** (Leave empty)
- **Time Est:** 6h
- **Task ID:** TASK-005
- **GitHub Commits:** (Leave empty)
- **Notes:** Configure credentials provider, session strategy, RBAC middleware
- **Completed Date:** (Leave empty)
- **Dependencies:** TASK-004

### 6.3 Link Task Dependencies

1. Open **TASK-002** (validators)
2. Click **Dependencies** property
3. Select **TASK-001** (types)
4. This shows that TASK-002 depends on TASK-001

### 6.4 Add Documentation Links

Navigate to **📚 Documentation** database and add these entries:

> **Note:** Replace `YOUR_GITHUB_USERNAME` with `olivershe` in all URLs

#### Root Documentation

1. **Name:** Root CLAUDE.md
   **Type:** CLAUDE.md
   **URL:** https://github.com/olivershe/trato-hive/blob/main/CLAUDE.md
   **Package/Feature:** Root

2. **Name:** PROJECT_STATUS.md
   **Type:** Setup Guide
   **URL:** https://github.com/olivershe/trato-hive/blob/main/PROJECT_STATUS.md
   **Package/Feature:** Root

#### Package Documentation

3. **Name:** packages/shared/CLAUDE.md
   **Type:** CLAUDE.md
   **URL:** https://github.com/olivershe/trato-hive/blob/main/packages/shared/CLAUDE.md
   **Package/Feature:** shared

4. **Name:** packages/ui/CLAUDE.md
   **Type:** CLAUDE.md
   **URL:** https://github.com/olivershe/trato-hive/blob/main/packages/ui/CLAUDE.md
   **Package/Feature:** ui

5. **Name:** packages/db/CLAUDE.md
   **Type:** CLAUDE.md
   **URL:** https://github.com/olivershe/trato-hive/blob/main/packages/db/CLAUDE.md
   **Package/Feature:** db

6. **Name:** packages/auth/CLAUDE.md
   **Type:** CLAUDE.md
   **URL:** https://github.com/olivershe/trato-hive/blob/main/packages/auth/CLAUDE.md
   **Package/Feature:** auth

7. **Name:** packages/ai-core/CLAUDE.md
   **Type:** CLAUDE.md
   **URL:** https://github.com/olivershe/trato-hive/blob/main/packages/ai-core/CLAUDE.md
   **Package/Feature:** ai-core

8. **Name:** packages/semantic-layer/CLAUDE.md
   **Type:** CLAUDE.md
   **URL:** https://github.com/olivershe/trato-hive/blob/main/packages/semantic-layer/CLAUDE.md
   **Package/Feature:** semantic-layer

9. **Name:** packages/data-plane/CLAUDE.md
   **Type:** CLAUDE.md
   **URL:** https://github.com/olivershe/trato-hive/blob/main/packages/data-plane/CLAUDE.md
   **Package/Feature:** data-plane

10. **Name:** packages/agents/CLAUDE.md
    **Type:** CLAUDE.md
    **URL:** https://github.com/olivershe/trato-hive/blob/main/packages/agents/CLAUDE.md
    **Package/Feature:** agents

#### Feature Documentation

11. **Name:** features/deals/CLAUDE.md
    **Type:** CLAUDE.md
    **URL:** https://github.com/olivershe/trato-hive/blob/main/features/deals/CLAUDE.md
    **Package/Feature:** deals

12. **Name:** features/discovery/CLAUDE.md
    **Type:** CLAUDE.md
    **URL:** https://github.com/olivershe/trato-hive/blob/main/features/discovery/CLAUDE.md
    **Package/Feature:** discovery

13. **Name:** features/diligence/CLAUDE.md
    **Type:** CLAUDE.md
    **URL:** https://github.com/olivershe/trato-hive/blob/main/features/diligence/CLAUDE.md
    **Package/Feature:** diligence

14. **Name:** features/generator/CLAUDE.md
    **Type:** CLAUDE.md
    **URL:** https://github.com/olivershe/trato-hive/blob/main/features/generator/CLAUDE.md
    **Package/Feature:** generator

15. **Name:** features/command-center/CLAUDE.md
    **Type:** CLAUDE.md
    **URL:** https://github.com/olivershe/trato-hive/blob/main/features/command-center/CLAUDE.md
    **Package/Feature:** command-center

#### Product & Architecture Docs

16. **Name:** docs/PRD.md
    **Type:** PRD
    **URL:** https://github.com/olivershe/trato-hive/blob/main/docs/PRD.md
    **Package/Feature:** Root

17. **Name:** context/style-guide.md
    **Type:** Design System
    **URL:** https://github.com/olivershe/trato-hive/blob/main/context/style-guide.md
    **Package/Feature:** Design

18. **Name:** docs/architecture/7-layer-architecture.md
    **Type:** Architecture
    **URL:** https://github.com/olivershe/trato-hive/blob/main/docs/architecture/7-layer-architecture.md
    **Package/Feature:** Architecture

---

## Verification Checklist

After completing all steps, verify:

### Databases
- [ ] **📋 Tasks** database exists with 12 properties
- [ ] Tasks database has 5 views configured
- [ ] Status colors: Gray, Orange, Green, Red
- [ ] Priority colors: Red, Orange, Yellow, Gray
- [ ] Dependencies relation working (TASK-002 → TASK-001)

- [ ] **🎯 Phases** database exists with 8 properties
- [ ] Phases database has 3 views configured
- [ ] 5 phase entries created (Phase 6-10)
- [ ] Phase 6 marked as "Active"

- [ ] **📚 Documentation** database exists with 4 properties
- [ ] Documentation database has 2 views configured
- [ ] 18 documentation entries with GitHub URLs

### Dashboard
- [ ] **🐝 Trato Hive Command Center** page exists
- [ ] 6 sections with linked database views
- [ ] Current Phase shows Phase 6
- [ ] Active Tasks shows 5 sample tasks
- [ ] Phase 6 Progress table displays correctly
- [ ] Quick Links shows all 18 docs
- [ ] Recent Completions section ready (empty for now)

### Sample Data
- [ ] 5 tasks created (TASK-001 through TASK-005)
- [ ] All tasks marked as "Not Started"
- [ ] TASK-004 has priority "P0 Critical"
- [ ] TASK-002 depends on TASK-001

### Colors & Styling
- [ ] Status "In Progress" is Orange `#EE8D1D`
- [ ] Status "Not Started" is Gray `#313131`
- [ ] Priority colors configured correctly
- [ ] Phase status colors configured

---

## GitHub Automation (Future)

### Setup Instructions (To Be Implemented Later)

After your Notion workspace is ready, you can add GitHub automation to auto-update tasks when you commit code.

**Files to create:**
1. `.github/workflows/notion-sync.yml` - GitHub Action workflow
2. `.github/scripts/update-notion.js` - Node.js script

**Environment secrets needed:**
- `NOTION_API_KEY` - Your integration token
- `NOTION_TASKS_DB` - Tasks database ID (copy from database URL)

**How it works:**
1. Commit with format: `feat(shared): implement types [TASK-001]`
2. GitHub Action extracts `[TASK-001]`
3. Finds task in Notion by Task ID property
4. Updates Status → Done
5. Adds commit link and message
6. Sets Completed Date

**Next Steps:**
- Save your Notion API token from integration settings
- Get your Tasks database ID (last part of database URL)
- Create GitHub secrets in repository settings
- Implement workflow files (will be provided separately)

---

## Tips & Best Practices

### Daily Workflow
1. Start day: Open **🐝 Trato Hive Command Center**
2. Check **Active Tasks** board
3. Move task to "In Progress" when starting
4. Update **Notes** with progress/blockers
5. Mark **Done** when complete
6. Set **Completed Date**

### Weekly Review
1. Check **Phase 6 Progress** table
2. Update **Phases** database **Progress** percentage
3. Review **Blocked Items** and resolve
4. Plan next week's tasks

### Task Management
- Use **Task ID** format: TASK-XXX (e.g., TASK-001, TASK-002)
- Always set **Priority** (P0 = Critical, must do today)
- Link **Dependencies** when tasks block each other
- Update **Notes** with context for future reference

### Documentation
- Click **Quick Links** to access GitHub docs
- Keep URLs updated when files move
- Add new docs as they're created

---

## Troubleshooting

**Q: Can't create linked database views?**
A: Make sure you've shared the databases with your Notion integration.

**Q: Dependencies not showing?**
A: The Dependencies property must be a "Relation" type pointing to the same Tasks database.

**Q: Colors not saving?**
A: Click the colored dot next to each option and select the desired color.

**Q: Views not filtering correctly?**
A: Check filter conditions - "is not" vs "is", and ensure property values match exactly.

**Q: Can't see all properties in a view?**
A: Click "Properties" button in top-right of view and toggle them on.

---

## Next Steps

After completing this setup:

1. ✅ **Notion workspace ready!**
2. 🔄 **Start using it:** Move tasks through the workflow
3. 🤖 **Add GitHub automation** when ready (scripts provided separately)
4. 📊 **Track progress:** Update Phase 6 progress as you complete tasks
5. 🎯 **Add more tasks:** Create tasks for all Phase 6 work

---

## Support

**Notion Help:** https://www.notion.so/help
**Trato Hive Repository:** https://github.com/olivershe/trato-hive
**Integration Settings:** https://www.notion.so/my-integrations

---

**Setup Complete!** 🎉
Your Trato Hive Notion workspace is ready for project management.
