/**
 * Hive Copilot Page
 *
 * Full-screen AI co-worker dashboard for executing CRM actions
 * via natural language conversation.
 *
 * @route /copilot
 * @task TASK-127
 */
import { CoworkerDashboard } from '@/components/copilot';

export const metadata = {
  title: 'Hive Copilot | Trato Hive',
  description: 'Your AI co-worker for M&A workflow automation',
};

export default function CopilotPage() {
  return <CoworkerDashboard />;
}
