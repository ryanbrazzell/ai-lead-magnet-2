import { POST } from '../src/app/api/send-report-email/route';
import { NextRequest } from 'next/server';

// Mock Tasks and Data
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

const taskHours = {
  email: 10,
  personalLife: 5,
  calendar: 5,
  businessProcesses: 10
};

const mockBody = {
  email: 'rcbrazzell@gmail.com', // User's email
  firstName: 'Ryan',
  lastName: 'Brazzell',
  tasks: mockTasks,
  eaPercentage: 75,
  taskHours: taskHours,
  revenueRange: '$500k to $1M'
};

// Create a fake NextRequest
const req = new NextRequest('http://localhost:3000/api/send-report-email', {
  method: 'POST',
  body: JSON.stringify(mockBody)
});

async function run() {
  console.log('Sending email to rcbrazzell@gmail.com...');
  try {
    const response = await POST(req);
    const data = await response.json();
    console.log('Response:', data);
  } catch (error) {
    console.error('Error:', error);
  }
}

run();
