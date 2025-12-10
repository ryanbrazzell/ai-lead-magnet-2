import { generatePDF } from '../src/lib/pdf/generator';
import { TaskGenerationResult, UnifiedLeadData, TasksByFrequency } from '../src/types';
import * as fs from 'fs';
import * as path from 'path';

// Mock Data matching the user's context
const mockTasks: TasksByFrequency = {
  daily: [
    {
      id: '1',
      title: 'Priority Inbox Zero Maintenance',
      description: 'Processing and organizing email inbox, filtering client inquiries, responding to routine questions using templates.',
      isEA: true,
      owner: 'EA' as const,
      category: 'Admin',
      timeEstimate: '30m'
    },
    {
      id: '2',
      title: 'Calendar Optimization and Scheduling',
      description: 'Managing calendar, scheduling client calls, blocking focus time for strategic work, coordinating team meetings.',
      isEA: true,
      owner: 'EA' as const,
      category: 'Admin',
      timeEstimate: '15m'
    },
    {
      id: '3',
      title: 'Team Performance Check-ins',
      description: 'Conducting daily standups with EA team members, reviewing client satisfaction metrics.',
      isEA: false,
      owner: 'You' as const,
      category: 'Management',
      timeEstimate: '45m'
    }
  ],
  weekly: [
    {
      id: '4',
      title: 'Weekly Performance Report Compilation',
      description: 'Gathering client satisfaction scores, EA performance metrics, sales pipeline data, and operational KPIs into a dashboard.',
      isEA: true,
      owner: 'EA' as const,
      category: 'Reporting',
      timeEstimate: '1h'
    },
    {
      id: '5',
      title: 'Strategic Planning Sessions',
      description: 'Reviewing quarterly goals, adjusting resource allocation, and planning high-level initiatives.',
      isEA: false,
      owner: 'You' as const,
      category: 'Strategy',
      timeEstimate: '2h'
    }
  ],
  monthly: [
    {
      id: '6',
      title: 'Monthly Financial Reconciliation',
      description: 'Processing expense reports, reconciling accounts, organizing financial documents, tracking client payments.',
      isEA: true,
      owner: 'EA' as const,
      category: 'Finance',
      timeEstimate: '3h'
    }
  ]
};

const mockReport: TaskGenerationResult = {
  tasks: mockTasks,
  ea_task_percent: 75,
  ea_task_count: 4,
  total_task_count: 6,
  summary: 'Based on our analysis, approximately 75% of your tasks could be delegated to an Executive Assistant.'
};

const mockLeadData: UnifiedLeadData = {
  leadType: 'main',
  timestamp: new Date().toISOString(),
  firstName: 'Ryan',
  lastName: 'Brazzell',
  email: 'ryan@test.com',
  businessType: 'Agency'
};

const mockOptions = {
  taskHours: {
    email: 10,
    personalLife: 5,
    calendar: 5,
    businessProcesses: 10
  },
  revenueRange: '$500k to $1M'
};

async function run() {
  console.log('Generating sample PDF...');
  try {
    const result = await generatePDF(mockReport, mockLeadData, mockOptions);
    
    if (result.success && result.base64) {
      const outputPath = path.join(process.cwd(), 'public', 'sample-report.pdf');
      fs.writeFileSync(outputPath, Buffer.from(result.base64, 'base64'));
      console.log(`Success! PDF saved to: ${outputPath}`);
      console.log('You can view it at: http://localhost:3000/sample-report.pdf');
    } else {
      console.error('Failed to generate PDF:', result.error);
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

run();
