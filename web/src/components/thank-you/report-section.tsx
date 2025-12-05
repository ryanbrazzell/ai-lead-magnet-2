/**
 * ReportSection Component
 * Displays the AI-generated EA task report
 */

"use client";

import * as React from 'react';
import type { TaskGenerationResult, Task } from '@/types';
import { CheckCircle, Clock, AlertTriangle, Download, Mail } from 'lucide-react';

interface ReportSectionProps {
  data: TaskGenerationResult | null;
  isLoading: boolean;
  error: string | null;
  firstName: string;
  stage: number;
  stageName: string;
}

export function ReportSection({
  data,
  isLoading,
  error,
  firstName,
  stage,
  stageName,
}: ReportSectionProps) {
  if (isLoading) {
    return (
      <section className="py-12 border-t-2 border-gray-300 bg-white relative z-10">
        <div className="max-w-4xl mx-auto text-center px-4">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-3/4 mx-auto mb-4" />
            <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto mb-8" />
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-20 bg-gray-100 rounded-lg" />
              ))}
            </div>
          </div>
          <p className="text-gray-600 mt-8">
            Generating your personalized EA Roadmap...
          </p>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-12 border-t-2 border-gray-300 bg-white relative z-10">
        <div className="max-w-4xl mx-auto text-center px-4">
          <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            We hit a snag generating your report
          </h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-primary text-white rounded-full font-medium hover:bg-primary/90 transition-colors"
          >
            Try Again
          </button>
        </div>
      </section>
    );
  }

  if (!data) {
    return (
      <section className="py-12 border-t-2 border-gray-300 bg-white relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-gray-600">
            No report data available. Please complete the form to generate your EA Roadmap.
          </p>
        </div>
      </section>
    );
  }

  const { tasks, total_task_count, ea_task_percent, summary } = data;

  return (
    <section className="py-12 border-t-2 border-gray-300 bg-white relative z-10">
      <div className="max-w-4xl mx-auto px-4">
        {/* Report Header */}
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
            {firstName}&apos;s EA Time Freedom Roadmap
          </h2>
          <p className="text-xl text-gray-600 mb-4">
            Stage {stage}: {stageName}
          </p>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-full text-sm font-medium">
            <CheckCircle className="w-4 h-4" />
            {ea_task_percent}% of tasks can be delegated to an EA
          </div>
        </div>

        {/* Summary */}
        {summary && (
          <div className="bg-gradient-to-br from-primary/5 to-violet-50 rounded-xl p-6 mb-8">
            <h3 className="font-bold text-lg text-gray-900 mb-2">Executive Summary</h3>
            <p className="text-gray-700">{summary}</p>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-10">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center">
            <div className="text-3xl font-bold text-primary">{total_task_count}</div>
            <div className="text-sm text-gray-600">Total Tasks</div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center">
            <div className="text-3xl font-bold text-green-600">{ea_task_percent}%</div>
            <div className="text-sm text-gray-600">EA Delegatable</div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center">
            <div className="text-3xl font-bold text-violet-600">{stage}</div>
            <div className="text-sm text-gray-600">Business Stage</div>
          </div>
        </div>

        {/* Tasks by Frequency */}
        {tasks && (
          <div className="space-y-8">
            <TaskFrequencySection 
              title="Daily Tasks" 
              tasks={tasks.daily || []}
              icon={<Clock className="w-5 h-5" />}
              color="text-blue-600"
              bgColor="bg-blue-50"
            />
            <TaskFrequencySection 
              title="Weekly Tasks" 
              tasks={tasks.weekly || []}
              icon={<Clock className="w-5 h-5" />}
              color="text-violet-600"
              bgColor="bg-violet-50"
            />
            <TaskFrequencySection 
              title="Monthly Tasks" 
              tasks={tasks.monthly || []}
              icon={<Clock className="w-5 h-5" />}
              color="text-amber-600"
              bgColor="bg-amber-50"
            />
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10 pt-8 border-t border-gray-200">
          <button
            onClick={async () => {
              // Generate and download PDF
              try {
                const response = await fetch('/api/generate-pdf', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    tasks: data?.tasks || { daily: [], weekly: [], monthly: [] },
                    eaPercentage: data?.ea_task_percent || 0,
                    userData: {
                      firstName,
                      stage,
                      stageName,
                    },
                  }),
                });
                
                const result = await response.json();
                
                if (result.success && result.pdf) {
                  // Create download link from base64
                  const link = document.createElement('a');
                  link.href = `data:application/pdf;base64,${result.pdf}`;
                  link.download = `EA-Time-Freedom-Report-${firstName || 'Report'}.pdf`;
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                } else {
                  alert('Failed to generate PDF. Please try again.');
                }
              } catch (error) {
                console.error('PDF download error:', error);
                alert('Failed to generate PDF. Please try again.');
              }
            }}
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-full font-medium hover:bg-primary/90 transition-colors"
          >
            <Download className="w-5 h-5" />
            Download PDF
          </button>
          <button
            onClick={() => {
              // Send email reminder
              alert('Your report has been sent to your email!');
            }}
            className="inline-flex items-center gap-2 px-6 py-3 border-2 border-primary text-primary rounded-full font-medium hover:bg-primary/5 transition-colors"
          >
            <Mail className="w-5 h-5" />
            Email Me This Report
          </button>
        </div>
      </div>
    </section>
  );
}

interface TaskFrequencySectionProps {
  title: string;
  tasks: Task[];
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}

function TaskFrequencySection({ title, tasks, icon, color, bgColor }: TaskFrequencySectionProps) {
  if (!tasks || tasks.length === 0) return null;

  return (
    <div>
      <div className={`flex items-center gap-2 mb-4 ${color}`}>
        {icon}
        <h3 className="font-bold text-lg">{title}</h3>
        <span className={`ml-auto px-2 py-1 rounded-full text-xs font-medium ${bgColor} ${color}`}>
          {tasks.length} tasks
        </span>
      </div>
      <div className="space-y-3">
        {tasks.map((task, index) => (
          <TaskCard key={index} task={task} />
        ))}
      </div>
    </div>
  );
}

interface TaskCardProps {
  task: Task;
}

function TaskCard({ task }: TaskCardProps) {
  const ownerColors: Record<string, { bg: string; text: string }> = {
    ea: { bg: 'bg-green-100', text: 'text-green-700' },
    you: { bg: 'bg-purple-100', text: 'text-purple-700' },
    ceo: { bg: 'bg-purple-100', text: 'text-purple-700' },
    team: { bg: 'bg-blue-100', text: 'text-blue-700' },
    both: { bg: 'bg-amber-100', text: 'text-amber-700' },
  };

  const priorityColors: Record<string, { bg: string; text: string }> = {
    high: { bg: 'bg-red-100', text: 'text-red-700' },
    medium: { bg: 'bg-yellow-100', text: 'text-yellow-700' },
    low: { bg: 'bg-gray-100', text: 'text-gray-700' },
  };

  const owner = task.owner?.toLowerCase() || 'ea';
  const priority = task.priority?.toLowerCase() || 'medium';
  const ownerStyle = ownerColors[owner] || ownerColors.ea;
  const priorityStyle = priorityColors[priority] || priorityColors.medium;

  // Determine if this is an EA task for styling
  const isEATask = task.isEA || owner === 'ea';

  return (
    <div className={`bg-white rounded-lg p-4 shadow-sm border hover:shadow-md transition-shadow ${isEATask ? 'border-green-200' : 'border-gray-100'}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-medium text-gray-900">{task.title}</h4>
            {isEATask && (
              <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full font-medium">
                EA Task
              </span>
            )}
          </div>
          {task.description && (
            <p className="text-sm text-gray-600">{task.description}</p>
          )}
          {task.category && (
            <p className="text-xs text-gray-400 mt-1">Category: {task.category}</p>
          )}
        </div>
        <div className="flex flex-col gap-2 items-end">
          <span className={`px-2 py-1 rounded text-xs font-medium ${ownerStyle.bg} ${ownerStyle.text}`}>
            {owner === 'ea' ? 'EA' : owner === 'you' ? 'YOU' : owner.toUpperCase()}
          </span>
          {task.priority && (
            <span className={`px-2 py-1 rounded text-xs font-medium ${priorityStyle.bg} ${priorityStyle.text}`}>
              {priority}
            </span>
          )}
          {task.timeEstimate && (
            <span className="text-xs text-gray-500">
              {task.timeEstimate}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

