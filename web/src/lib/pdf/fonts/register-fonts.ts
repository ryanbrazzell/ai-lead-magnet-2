/**
 * Font Registration for jsPDF
 *
 * Registers DM Serif Display and DM Sans (Regular + Bold)
 * as custom fonts in a jsPDF document instance.
 */

import type { jsPDF } from 'jspdf';
import { DM_SERIF_DISPLAY_BASE64 } from './dm-serif-display';
import { DM_SANS_REGULAR_BASE64, DM_SANS_BOLD_BASE64 } from './dm-sans';

/**
 * Register all custom fonts on a jsPDF document.
 * Call immediately after `new jsPDF(...)`.
 */
export function registerFonts(doc: jsPDF): void {
  // DM Serif Display — headings, display text
  doc.addFileToVFS('DMSerifDisplay-Regular.ttf', DM_SERIF_DISPLAY_BASE64);
  doc.addFont('DMSerifDisplay-Regular.ttf', 'DMSerifDisplay', 'normal');

  // DM Sans Regular — body text
  doc.addFileToVFS('DMSans-Regular.ttf', DM_SANS_REGULAR_BASE64);
  doc.addFont('DMSans-Regular.ttf', 'DMSans', 'normal');

  // DM Sans Bold — emphasis, labels
  doc.addFileToVFS('DMSans-Bold.ttf', DM_SANS_BOLD_BASE64);
  doc.addFont('DMSans-Bold.ttf', 'DMSans', 'bold');
}
