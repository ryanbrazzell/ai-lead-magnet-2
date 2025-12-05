/**
 * PDF Layout Utilities Tests
 *
 * Tests for the PDF layout functions that generate headers, sections,
 * and footers in the EA Time Freedom Report.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { jsPDF } from 'jspdf';
import {
  addPDFHeader,
  addExecutiveSummary,
  addKeyInsightsBox,
  addTaskSection,
  addNextStepsSection,
  addCTABox,
  addFooterToAllPages,
} from '../layout';
import { PDF_COLOR_DEFAULTS } from '@/types/pdf';
import type { Task } from '@/types/task';
import type { UnifiedLeadData } from '@/types/lead';

// Mock jsPDF methods to track calls
const createMockDoc = () => {
  const mockDoc = {
    setFont: vi.fn().mockReturnThis(),
    setFontSize: vi.fn().mockReturnThis(),
    setTextColor: vi.fn().mockReturnThis(),
    setDrawColor: vi.fn().mockReturnThis(),
    setFillColor: vi.fn().mockReturnThis(),
    text: vi.fn().mockReturnThis(),
    line: vi.fn().mockReturnThis(),
    rect: vi.fn().mockReturnThis(),
    splitTextToSize: vi.fn().mockImplementation((text: string, width: number) => {
      // Simple mock: split by approx character count based on width
      const charsPerLine = Math.floor(width / 2);
      const words = text.split(' ');
      const lines: string[] = [];
      let currentLine = '';

      for (const word of words) {
        if ((currentLine + ' ' + word).trim().length <= charsPerLine) {
          currentLine = (currentLine + ' ' + word).trim();
        } else {
          if (currentLine) lines.push(currentLine);
          currentLine = word;
        }
      }
      if (currentLine) lines.push(currentLine);
      return lines.length > 0 ? lines : [text];
    }),
    addPage: vi.fn().mockReturnThis(),
    getNumberOfPages: vi.fn().mockReturnValue(1),
    setPage: vi.fn().mockReturnThis(),
  };
  return mockDoc as unknown as jsPDF;
};

describe('PDF Layout Utilities', () => {
  let mockDoc: jsPDF;
  const colors = PDF_COLOR_DEFAULTS;

  beforeEach(() => {
    mockDoc = createMockDoc();
  });

  describe('addPDFHeader', () => {
    it('generates correct header structure with lead data', () => {
      const leadData: UnifiedLeadData = {
        leadType: 'main',
        timestamp: new Date().toISOString(),
        firstName: 'John',
        lastName: 'Doe',
        title: 'CEO',
        businessType: 'Technology Consulting',
      };

      const yPosition = addPDFHeader(mockDoc, leadData, colors);

      // Verify title was added
      expect(mockDoc.setFontSize).toHaveBeenCalledWith(28);
      expect(mockDoc.setFont).toHaveBeenCalledWith('helvetica', 'bold');
      expect(mockDoc.text).toHaveBeenCalledWith(
        'EA Time Freedom Report',
        105,
        25,
        { align: 'center' }
      );

      // Verify lead name was added
      expect(mockDoc.text).toHaveBeenCalledWith('John Doe', 105, 40, { align: 'center' });

      // Verify title was added
      expect(mockDoc.text).toHaveBeenCalledWith('CEO', 105, 47, { align: 'center' });

      // Verify business type was added
      expect(mockDoc.text).toHaveBeenCalledWith('Technology Consulting', 105, 54, { align: 'center' });

      // Verify separator line was drawn
      expect(mockDoc.line).toHaveBeenCalled();

      // Verify yPosition is returned correctly
      expect(typeof yPosition).toBe('number');
      expect(yPosition).toBeGreaterThan(55);
    });

    it('handles missing lead data gracefully', () => {
      const leadData: UnifiedLeadData = {
        leadType: 'simple',
        timestamp: new Date().toISOString(),
      };

      const yPosition = addPDFHeader(mockDoc, leadData, colors);

      // Should still render title
      expect(mockDoc.text).toHaveBeenCalledWith(
        'EA Time Freedom Report',
        105,
        25,
        { align: 'center' }
      );

      // Should return a valid yPosition
      expect(typeof yPosition).toBe('number');
    });
  });

  describe('addExecutiveSummary', () => {
    it('renders summary with EA percentage', () => {
      const eaPercent = 55;
      const startY = 100;

      const yPosition = addExecutiveSummary(mockDoc, eaPercent, startY, colors);

      // Verify section header
      expect(mockDoc.setFontSize).toHaveBeenCalledWith(18);
      expect(mockDoc.setFont).toHaveBeenCalledWith('helvetica', 'bold');
      expect(mockDoc.text).toHaveBeenCalledWith('Executive Summary', 25, startY);

      // Verify splitTextToSize was called with summary text containing percentage
      expect(mockDoc.splitTextToSize).toHaveBeenCalled();
      const splitCall = (mockDoc.splitTextToSize as ReturnType<typeof vi.fn>).mock.calls[0];
      expect(splitCall[0]).toContain('55%');
      expect(splitCall[1]).toBe(165);

      // Verify yPosition is updated
      expect(yPosition).toBeGreaterThan(startY);
    });
  });

  describe('addKeyInsightsBox', () => {
    it('creates gray background box with task metrics', () => {
      const tasks: Task[] = [
        {
          title: 'Task 1',
          description: 'Desc 1',
          owner: 'EA',
          isEA: true,
          category: 'Admin',
        },
        {
          title: 'Task 2',
          description: 'Desc 2',
          owner: 'You',
          isEA: false,
          category: 'Strategy',
        },
        {
          title: 'Task 3',
          description: 'Desc 3',
          owner: 'EA',
          isEA: true,
          category: 'Admin',
        },
      ];
      const eaPercent = 67;
      const startY = 150;

      const yPosition = addKeyInsightsBox(mockDoc, tasks, eaPercent, startY, colors);

      // Verify gray background box
      expect(mockDoc.setFillColor).toHaveBeenCalledWith(colors.lightGray);
      expect(mockDoc.rect).toHaveBeenCalledWith(25, startY, 165, 25, 'F');

      // Verify "Key Insights" header
      expect(mockDoc.text).toHaveBeenCalledWith('Key Insights', 30, startY + 10);

      // Verify task count displays
      expect(mockDoc.text).toHaveBeenCalledWith(
        expect.stringContaining('Total tasks analyzed: 3'),
        30,
        startY + 17
      );
      expect(mockDoc.text).toHaveBeenCalledWith(
        expect.stringContaining('Tasks suitable for EA: 2'),
        100,
        startY + 17
      );

      // Verify yPosition is updated
      expect(yPosition).toBe(startY + 35);
    });
  });

  describe('addTaskSection', () => {
    it('formats tasks correctly with EA badges', () => {
      const tasks: Task[] = [
        {
          title: 'Email Management',
          description: 'Handle all incoming emails and prioritize responses',
          owner: 'EA',
          isEA: true,
          category: 'Communication',
        },
        {
          title: 'Strategic Planning',
          description: 'Develop quarterly business strategy',
          owner: 'You',
          isEA: false,
          category: 'Strategy',
        },
      ];
      const startY = 100;

      const result = addTaskSection(
        mockDoc,
        'Daily Tasks & Responsibilities',
        tasks,
        startY,
        colors
      );

      // Verify section title
      expect(mockDoc.setFontSize).toHaveBeenCalledWith(16);
      expect(mockDoc.text).toHaveBeenCalledWith('Daily Tasks & Responsibilities', 25, startY);

      // Verify task number and title (11pt bold)
      expect(mockDoc.setFontSize).toHaveBeenCalledWith(11);
      expect(mockDoc.text).toHaveBeenCalledWith('1.', 25, expect.any(Number));
      expect(mockDoc.text).toHaveBeenCalledWith('Email Management', 32, expect.any(Number));

      // Verify EA badge for EA task
      expect(mockDoc.setTextColor).toHaveBeenCalledWith(colors.secondary);

      // Verify owner line
      expect(mockDoc.setFontSize).toHaveBeenCalledWith(9);
      expect(mockDoc.text).toHaveBeenCalledWith('Owner: EA', 32, expect.any(Number));
      expect(mockDoc.text).toHaveBeenCalledWith('Owner: You', 32, expect.any(Number));

      // Verify returns yPosition
      expect(typeof result.yPosition).toBe('number');
      expect(result.yPosition).toBeGreaterThan(startY);
    });

    it('triggers page break when yPosition exceeds threshold', () => {
      const tasks: Task[] = Array(10)
        .fill(null)
        .map((_, i) => ({
          title: `Task ${i + 1}`,
          description: 'A task description that needs to be wrapped across multiple lines for testing purposes',
          owner: 'EA' as const,
          isEA: true,
          category: 'Admin',
        }));

      // Start near the bottom of the page
      const startY = 240;

      addTaskSection(mockDoc, 'Monthly Tasks', tasks, startY, colors);

      // Verify addPage was called for page break
      expect(mockDoc.addPage).toHaveBeenCalled();
    });
  });

  describe('addNextStepsSection', () => {
    it('renders CTA box with correct styling', () => {
      const eaTaskCount = 18;
      const startY = 200;

      const yPosition = addNextStepsSection(mockDoc, eaTaskCount, startY, colors);

      // Verify "Next Steps" header
      expect(mockDoc.setFontSize).toHaveBeenCalledWith(16);
      expect(mockDoc.text).toHaveBeenCalledWith('Next Steps', 25, startY);

      // Verify splitTextToSize was called with text mentioning task count
      expect(mockDoc.splitTextToSize).toHaveBeenCalled();
      const splitCall = (mockDoc.splitTextToSize as ReturnType<typeof vi.fn>).mock.calls[0];
      expect(splitCall[0]).toContain('18');

      expect(yPosition).toBeGreaterThan(startY);
    });
  });

  describe('addCTABox', () => {
    it('renders green CTA box with calendly URL', () => {
      const startY = 250;
      const calendlyUrl = 'calendly.com/test/call';

      const yPosition = addCTABox(mockDoc, startY, calendlyUrl, colors);

      // Verify green background
      expect(mockDoc.setFillColor).toHaveBeenCalledWith(colors.secondary);
      expect(mockDoc.rect).toHaveBeenCalledWith(25, startY, 165, 20, 'F');

      // Verify white text
      expect(mockDoc.setTextColor).toHaveBeenCalledWith('white');

      // Verify CTA text
      expect(mockDoc.text).toHaveBeenCalledWith(
        'Ready to get started? Schedule your consultation:',
        30,
        startY + 8
      );
      expect(mockDoc.text).toHaveBeenCalledWith(calendlyUrl, 30, startY + 15);

      expect(yPosition).toBe(startY + 20);
    });

    it('uses default calendly URL when not provided', () => {
      const startY = 250;

      addCTABox(mockDoc, startY, undefined, colors);

      // Verify default URL was used
      expect(mockDoc.text).toHaveBeenCalledWith(
        'calendly.com/assistantlaunch/discovery-call',
        30,
        startY + 15
      );
    });
  });

  describe('addFooterToAllPages', () => {
    it('adds footer to all pages', () => {
      // Setup multi-page document
      (mockDoc.getNumberOfPages as ReturnType<typeof vi.fn>).mockReturnValue(3);

      addFooterToAllPages(mockDoc, colors);

      // Verify setPage was called for each page
      expect(mockDoc.setPage).toHaveBeenCalledWith(1);
      expect(mockDoc.setPage).toHaveBeenCalledWith(2);
      expect(mockDoc.setPage).toHaveBeenCalledWith(3);

      // Verify footer separator line (at y=280)
      expect(mockDoc.line).toHaveBeenCalledWith(20, 280, 190, 280);

      // Verify branding text
      expect(mockDoc.text).toHaveBeenCalledWith(
        'Generated by Assistant Launch • assistantlaunch.com',
        105,
        285,
        { align: 'center' }
      );

      // Verify page numbers
      expect(mockDoc.text).toHaveBeenCalledWith('Page 1 of 3', 105, 290, { align: 'center' });
      expect(mockDoc.text).toHaveBeenCalledWith('Page 2 of 3', 105, 290, { align: 'center' });
      expect(mockDoc.text).toHaveBeenCalledWith('Page 3 of 3', 105, 290, { align: 'center' });
    });
  });
});
