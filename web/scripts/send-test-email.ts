import { generatePDF } from '../src/lib/pdf/generator';
import { sendEmailAsync } from '../src/lib/email/asyncNotifications';
import { TaskGenerationResult, UnifiedLeadData } from '../src/types';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

// Mock Data (Same as before)
const mockTasks = {
  daily: [
    {
      id: '1',
      title: 'Priority Inbox Zero Maintenance',
      description: 'Processing and organizing email inbox, filtering client inquiries, responding to routine questions using templates.',
      isEA: true,
      owner: 'EA',
      category: 'Admin',
      time_estimate: '30m'
    },
    {
      id: '2',
      title: 'Calendar Optimization and Scheduling',
      description: 'Managing calendar, scheduling client calls, blocking focus time for strategic work, coordinating team meetings.',
      isEA: true,
      owner: 'EA',
      category: 'Admin',
      time_estimate: '15m'
    },
    {
      id: '3',
      title: 'Team Performance Check-ins',
      description: 'Conducting daily standups with EA team members, reviewing client satisfaction metrics.',
      isEA: false,
      owner: 'You',
      category: 'Management',
      time_estimate: '45m'
    }
  ],
  weekly: [
    {
      id: '4',
      title: 'Weekly Performance Report Compilation',
      description: 'Gathering client satisfaction scores, EA performance metrics, sales pipeline data, and operational KPIs into a dashboard.',
      isEA: true,
      owner: 'EA',
      category: 'Reporting',
      time_estimate: '1h'
    },
    {
      id: '5',
      title: 'Strategic Planning Sessions',
      description: 'Reviewing quarterly goals, adjusting resource allocation, and planning high-level initiatives.',
      isEA: false,
      owner: 'You',
      category: 'Strategy',
      time_estimate: '2h'
    }
  ],
  monthly: [
    {
      id: '6',
      title: 'Monthly Financial Reconciliation',
      description: 'Processing expense reports, reconciling accounts, organizing financial documents, tracking client payments.',
      isEA: true,
      owner: 'EA',
      category: 'Finance',
      time_estimate: '3h'
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
  email: 'rcbrazzell@gmail.com', // Using the email from logs
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
  console.log('Generating PDF for email...');
  try {
    const result = await generatePDF(mockReport, mockLeadData, mockOptions);
    
    if (result.success && result.base64) {
      console.log('PDF generated. Sending email to:', mockLeadData.email);
      
      // Send email
      await sendEmailAsync(mockLeadData, result.base64);
      
      console.log('Email send process initiated. Check your inbox!');
    } else {
      console.error('Failed to generate PDF:', result.error);
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

run();

