/**
 * TaskCalculatorScreen - Interactive task time calculator
 *
 * Features:
 * - 4 task categories with +/- hour adjustments
 * - Color-coded progress bars (green/yellow/red)
 * - Money falling animation on + click
 * - Blurred revenue impact until "Next"
 */

"use client";

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Minus, DollarSign } from 'lucide-react';
import { PillButton } from '@/components/ui/pill-button';
import { PreviousLink } from './previous-link';
import { cn } from '@/lib/utils';

interface TaskCalculatorScreenProps {
  taskHours: TaskHours;
  ceoHourlyRate: number;
  onTaskHoursChange: (hours: TaskHours) => void;
  onPrevious: () => void;
  onSubmit: (taskHours: TaskHours) => Promise<void>;
  isLoading: boolean;
}

export interface TaskHours {
  email: number;
  personalLife: number;
  calendar: number;
  businessProcesses: number;
}

interface TaskCategory {
  key: keyof TaskHours;
  label: string;
  description: string;
}

const TASK_CATEGORIES: TaskCategory[] = [
  { key: 'email', label: 'Managing Email', description: 'Inbox processing, responses, filtering' },
  { key: 'personalLife', label: 'Personal Life', description: 'Appointments, errands, family coordination' },
  { key: 'calendar', label: 'Calendar & Booking', description: 'Scheduling meetings, managing appointments' },
  { key: 'businessProcesses', label: 'Business Processes', description: 'Admin tasks, data entry, coordination' },
];

const MAX_HOURS = 15;

function getBarColor(hours: number): string {
  if (hours <= 2) return 'bg-green-500';
  if (hours <= 4) return 'bg-yellow-500';
  return 'bg-red-500';
}

function getBarBgColor(hours: number): string {
  if (hours <= 2) return 'bg-green-100';
  if (hours <= 4) return 'bg-yellow-100';
  return 'bg-red-100';
}

// Falling dollar component
function FallingDollar({ id, onComplete }: { id: number; onComplete: (id: number) => void }) {
  const randomX = React.useMemo(() => Math.random() * 60 - 30, []);
  const randomRotation = React.useMemo(() => Math.random() * 360, []);
  const randomDuration = React.useMemo(() => 0.8 + Math.random() * 0.4, []);

  return (
    <motion.div
      className="absolute pointer-events-none z-50"
      initial={{
        y: 0,
        x: 0,
        opacity: 1,
        rotate: 0,
        scale: 1
      }}
      animate={{
        y: 150,
        x: randomX,
        opacity: 0,
        rotate: randomRotation,
        scale: 0.5
      }}
      transition={{
        duration: randomDuration,
        ease: "easeIn"
      }}
      onAnimationComplete={() => onComplete(id)}
    >
      <div className="bg-green-500 text-white rounded-full p-1 shadow-lg">
        <DollarSign className="w-4 h-4" />
      </div>
    </motion.div>
  );
}

interface TaskCardProps {
  category: TaskCategory;
  hours: number;
  ceoHourlyRate: number;
  onIncrement: () => void;
  onDecrement: () => void;
}

function TaskCard({ category, hours, ceoHourlyRate, onIncrement, onDecrement }: TaskCardProps) {
  const [fallingDollars, setFallingDollars] = React.useState<number[]>([]);
  const nextDollarId = React.useRef(0);
  const cardRef = React.useRef<HTMLDivElement>(null);

  const handleIncrement = () => {
    if (hours < MAX_HOURS) {
      onIncrement();
      // Spawn 3-5 falling dollars
      const count = 3 + Math.floor(Math.random() * 3);
      const newDollars = Array.from({ length: count }, () => nextDollarId.current++);
      setFallingDollars(prev => [...prev, ...newDollars]);
    }
  };

  const removeDollar = (id: number) => {
    setFallingDollars(prev => prev.filter(d => d !== id));
  };

  const weeklyLoss = hours * ceoHourlyRate;
  const progressPercent = Math.min((hours / MAX_HOURS) * 100, 100);

  return (
    <div
      ref={cardRef}
      className="relative bg-white rounded-xl border border-gray-200 p-3 shadow-sm"
    >
      {/* Falling dollars container */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
        <AnimatePresence>
          {fallingDollars.map(id => (
            <FallingDollar key={id} id={id} onComplete={removeDollar} />
          ))}
        </AnimatePresence>
      </div>

      <div className="flex items-center justify-between gap-3">
        {/* Label and description */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 text-sm truncate">{category.label}</h3>
          <p className="text-xs text-gray-500 truncate">{category.description}</p>
        </div>

        {/* Hours control */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onDecrement}
            disabled={hours === 0}
            className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center transition-all",
              "border-2 border-gray-300",
              hours === 0
                ? "opacity-40 cursor-not-allowed"
                : "hover:border-gray-400 hover:bg-gray-50 active:scale-95"
            )}
            aria-label={`Decrease ${category.label} hours`}
          >
            <Minus className="w-4 h-4 text-gray-600" />
          </button>

          <div className="w-12 text-center">
            <span className="text-lg font-bold text-gray-900">{hours}</span>
            <span className="text-xs text-gray-500 block -mt-1">hrs</span>
          </div>

          <button
            type="button"
            onClick={handleIncrement}
            disabled={hours >= MAX_HOURS}
            className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center transition-all",
              "border-2 border-primary bg-primary/10",
              hours >= MAX_HOURS
                ? "opacity-40 cursor-not-allowed"
                : "hover:bg-primary/20 active:scale-95"
            )}
            aria-label={`Increase ${category.label} hours`}
          >
            <Plus className="w-4 h-4 text-primary" />
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mt-2">
        <div className={cn("h-2 rounded-full transition-colors duration-300", getBarBgColor(hours))}>
          <motion.div
            className={cn("h-full rounded-full transition-colors duration-300", getBarColor(hours))}
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          />
        </div>
      </div>

      {/* Weekly cost indicator */}
      {hours > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-1 text-right"
        >
          <span className={cn(
            "text-xs font-medium",
            hours <= 2 ? "text-green-600" : hours <= 4 ? "text-yellow-600" : "text-red-600"
          )}>
            ${weeklyLoss.toLocaleString()}/week
          </span>
        </motion.div>
      )}
    </div>
  );
}

export function TaskCalculatorScreen({
  taskHours,
  ceoHourlyRate,
  onTaskHoursChange,
  onPrevious,
  onSubmit,
  isLoading,
}: TaskCalculatorScreenProps) {
  const totalHours = Object.values(taskHours).reduce((sum, h) => sum + h, 0);
  const annualRevenueLoss = totalHours * ceoHourlyRate * 52;

  const updateHours = (key: keyof TaskHours, delta: number) => {
    const newValue = Math.max(0, Math.min(MAX_HOURS, taskHours[key] + delta));
    onTaskHoursChange({ ...taskHours, [key]: newValue });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(taskHours);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="text-center mb-4">
        <h2 className="text-xl md:text-2xl font-normal text-gray-900">
          What did you work on <strong className="font-bold">last week</strong>?
        </h2>
        <p className="text-sm text-gray-600 mt-1">
          Adjust hours spent on each category
        </p>
      </div>

      {/* Task Cards - stacked vertically */}
      <div className="space-y-3">
        {TASK_CATEGORIES.map((category) => (
          <TaskCard
            key={category.key}
            category={category}
            hours={taskHours[category.key]}
            ceoHourlyRate={ceoHourlyRate}
            onIncrement={() => updateHours(category.key, 1)}
            onDecrement={() => updateHours(category.key, -1)}
          />
        ))}
      </div>

      {/* Blurred Revenue Impact */}
      <div className="relative mt-6 p-4 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl border border-purple-200">
        <div className="text-center">
          <p className="text-sm text-gray-600 mb-1">Annual Revenue Impact</p>
          <div className="relative">
            <p className={cn(
              "text-3xl font-bold transition-all duration-300",
              totalHours === 0 ? "blur-md text-gray-400" : "text-red-600"
            )}>
              ${annualRevenueLoss.toLocaleString()}
            </p>
            {totalHours === 0 && (
              <p className="absolute inset-0 flex items-center justify-center text-sm text-gray-500">
                Add hours to see impact
              </p>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {totalHours} hours/week on delegatable tasks
          </p>
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex justify-center pt-4">
        <PillButton
          type="submit"
          variant="primary"
          loading={isLoading}
          disabled={totalHours === 0}
        >
          {isLoading ? 'CALCULATING...' : 'SEE MY ROI REPORT'}
        </PillButton>
      </div>

      <PreviousLink onClick={onPrevious} />
    </form>
  );
}
