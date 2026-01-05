/**
 * BonusStack Component
 * Displays the free bonuses included with the report
 */

import { FileText, Calculator, ClipboardCheck, Users } from 'lucide-react';

const bonuses = [
  {
    icon: FileText,
    title: '10 Things to Delegate',
    subtitle: 'Save 10+ hours/week',
  },
  {
    icon: Calculator,
    title: 'Buy Back Your Time Calculator',
    subtitle: 'Know your ROI instantly',
  },
  {
    icon: ClipboardCheck,
    title: 'EA Daily Checklist SOP',
    subtitle: 'Hit the ground running',
  },
  {
    icon: Users,
    title: '15 EA Interview Questions',
    subtitle: 'Hire your dream EA',
  },
];

export function BonusStack() {
  return (
    <div className="w-full max-w-form mx-auto px-4 py-4">
      <p className="text-center text-sm text-gray-900 mb-3 font-bold underline">
        PLUS 4 FREE BONUSES:
      </p>
      <div className="grid grid-cols-2 gap-2">
        {bonuses.map((bonus, index) => (
          <div
            key={index}
            className="flex items-start gap-2 p-2 bg-gray-50 rounded-lg border border-gray-100"
          >
            <div className="flex-shrink-0 w-8 h-8 bg-[#f59e0b]/10 rounded-full flex items-center justify-center">
              <bonus.icon className="w-4 h-4 text-[#f59e0b]" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-gray-900 leading-tight">
                {bonus.title}
              </p>
              <p className="text-[10px] text-gray-500 leading-tight">
                {bonus.subtitle}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
