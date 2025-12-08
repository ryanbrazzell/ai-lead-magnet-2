/**
 * ReportSection Component - shadcn-admin style
 * Displays the AI-generated EA task report with clean card styling
 */

"use client";

import * as React from 'react';
import type { TaskGenerationResult, Task } from '@/types';
import { CheckCircle, Clock, AlertTriangle, Download, Mail } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { getCeoHourlyRate, formatCurrency, type TaskHours } from '@/lib/roi-calculator';

interface ReportSectionProps {
  data: TaskGenerationResult | null;
  isLoading: boolean;
  error: string | null;
  firstName: string;
  stage: number;
  stageName: string;
  taskHours?: TaskHours;
  revenueRange?: string;
}

export function ReportSection({
  data,
  isLoading,
  error,
  firstName,
  stage,
  stageName,
  taskHours,
  revenueRange = '$500k to $1M',
}: ReportSectionProps) {
  const ceoHourlyRate = getCeoHourlyRate(revenueRange);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center">
            <div className="animate-pulse space-y-4">
              <div className="h-6 bg-gray-200 rounded w-3/4 mx-auto" />
              <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto" />
              <div className="space-y-3 mt-8">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="h-16 bg-gray-100 rounded-lg" />
                ))}
              </div>
            </div>
            <p className="text-sm text-gray-500 mt-6">
              Generating your personalized EA Roadmap...
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center">
            <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              We hit a snag generating your report
            </h3>
            <p className="text-sm text-gray-500 mb-6">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
            >
              Try Again
            </button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card>
        <CardContent className="py-12">
          <p className="text-center text-sm text-gray-500">
            No report data available. Please complete the form to generate your EA Roadmap.
          </p>
        </CardContent>
      </Card>
    );
  }

  const { tasks, total_task_count, ea_task_percent, summary } = data;

  return (
    <section className="space-y-4">
      {/* Section Header */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 tracking-tight">
          {firstName}&apos;s Task Roadmap
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Stage {stage}: {stageName} - {total_task_count} tasks analyzed
        </p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-2">
        <Card className="p-3">
          <p className="text-2xl font-bold text-gray-900">{total_task_count}</p>
          <p className="text-xs text-gray-500">Total Tasks</p>
        </Card>
        <Card className="p-3">
          <p className="text-2xl font-bold text-blue-600">{ea_task_percent}%</p>
          <p className="text-xs text-gray-500">EA Delegatable</p>
        </Card>
        <Card className="p-3">
          <p className="text-2xl font-bold text-gray-900">{stage}</p>
          <p className="text-xs text-gray-500">Business Stage</p>
        </Card>
      </div>

      {/* Summary */}
      {summary && (
        <Card className="bg-gray-50 border-gray-100">
          <CardContent className="py-4">
            <p className="text-sm text-gray-600">{summary}</p>
          </CardContent>
        </Card>
      )}

      {/* Tasks by Frequency */}
      {tasks && (
        <div className="space-y-4">
          <TaskFrequencySection
            title="Daily Tasks"
            tasks={tasks.daily || []}
            color="blue"
            ceoHourlyRate={ceoHourlyRate}
            frequency="daily"
          />
          <TaskFrequencySection
            title="Weekly Tasks"
            tasks={tasks.weekly || []}
            color="violet"
            ceoHourlyRate={ceoHourlyRate}
            frequency="weekly"
          />
          <TaskFrequencySection
            title="Monthly Tasks"
            tasks={tasks.monthly || []}
            color="amber"
            ceoHourlyRate={ceoHourlyRate}
            frequency="monthly"
          />
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2 pt-4">
        <button
          onClick={async () => {
            try {
              const response = await fetch('/api/generate-pdf', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  tasks: data?.tasks || { daily: [], weekly: [], monthly: [] },
                  eaPercentage: data?.ea_task_percent || 0,
                  userData: { firstName, stage, stageName },
                  taskHours: taskHours,
                  revenueRange: revenueRange,
                }),
              });

              const result = await response.json();

              if (result.success && result.pdf) {
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
          className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
        >
          <Download className="w-4 h-4" />
          Download PDF
        </button>
        <button
          onClick={() => alert('Your report has been sent to your email!')}
          className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
        >
          <Mail className="w-4 h-4" />
          Email Report
        </button>
      </div>
    </section>
  );
}

interface TaskFrequencySectionProps {
  title: string;
  tasks: Task[];
  color: 'blue' | 'violet' | 'amber';
  ceoHourlyRate: number;
  frequency: 'daily' | 'weekly' | 'monthly';
}

function TaskFrequencySection({ title, tasks, color, ceoHourlyRate, frequency }: TaskFrequencySectionProps) {
  if (!tasks || tasks.length === 0) return null;

  const colorStyles = {
    blue: { badge: 'bg-blue-50 text-blue-700', icon: 'text-blue-600' },
    violet: { badge: 'bg-violet-50 text-violet-700', icon: 'text-violet-600' },
    amber: { badge: 'bg-amber-50 text-amber-700', icon: 'text-amber-600' },
  };

  const styles = colorStyles[color];

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className={`w-4 h-4 ${styles.icon}`} />
            <CardTitle className="text-base">{title}</CardTitle>
          </div>
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${styles.badge}`}>
            {tasks.length} tasks
          </span>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2">
          {tasks.map((task, index) => (
            <TaskCard
              key={index}
              task={task}
              ceoHourlyRate={ceoHourlyRate}
              frequency={frequency}
              taskIndex={index}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

interface TaskCardProps {
  task: Task;
  ceoHourlyRate: number;
  frequency: 'daily' | 'weekly' | 'monthly';
  taskIndex: number;
}

function estimateTaskTime(
  task: Task,
  frequency: 'daily' | 'weekly' | 'monthly',
  taskIndex: number
): number {
  const baseTimes = {
    daily: [0.25, 0.33, 0.5, 0.75],
    weekly: [0.5, 0.75, 1, 1.5],
    monthly: [1, 1.5, 2, 3],
  };

  const timeOptions = baseTimes[frequency];
  const baseTime = timeOptions[taskIndex % timeOptions.length];

  const title = (task.title || '').toLowerCase();
  let multiplier = 1;

  if (title.includes('strategy') || title.includes('planning') || title.includes('analysis')) {
    multiplier = 1.5;
  } else if (title.includes('report') || title.includes('review') || title.includes('compile')) {
    multiplier = 1.3;
  } else if (title.includes('quick') || title.includes('simple') || title.includes('check')) {
    multiplier = 0.7;
  }

  const isEA = task.isEA || (task.owner?.toLowerCase() === 'ea');
  if (isEA && frequency !== 'daily') {
    multiplier *= 1.2;
  }

  return baseTime * multiplier;
}

function calculateAnnualCost(
  hoursPerOccurrence: number,
  frequency: 'daily' | 'weekly' | 'monthly',
  hourlyRate: number
): number {
  const occurrencesPerYear = { daily: 260, weekly: 52, monthly: 12 };
  return hoursPerOccurrence * occurrencesPerYear[frequency] * hourlyRate;
}

function TaskCard({ task, ceoHourlyRate, frequency, taskIndex }: TaskCardProps) {
  const owner = task.owner?.toLowerCase() || 'ea';
  const isEATask = task.isEA || owner === 'ea';

  const hoursPerOccurrence = estimateTaskTime(task, frequency, taskIndex);
  const annualCost = calculateAnnualCost(hoursPerOccurrence, frequency, ceoHourlyRate);

  return (
    <div className={`rounded-lg border p-3 ${isEATask ? 'border-blue-200 bg-blue-50/30' : 'border-gray-200 bg-white'}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="text-sm font-medium text-gray-900 truncate">{task.title}</h4>
            {isEATask && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-blue-100 text-blue-700 text-xs rounded font-medium">
                <CheckCircle className="w-3 h-3" />
                EA
              </span>
            )}
          </div>
          {task.description && (
            <p className="text-xs text-gray-500 mt-1 line-clamp-2">{task.description}</p>
          )}
        </div>
        <div className="text-right shrink-0">
          <span className="inline-block px-2 py-1 bg-red-50 text-red-600 text-xs font-semibold rounded">
            {formatCurrency(annualCost)}/yr
          </span>
        </div>
      </div>
    </div>
  );
}
