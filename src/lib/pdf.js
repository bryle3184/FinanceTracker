// @ts-check
/**
 * PDF export for the insights month view.
 *
 * Approach: render a clean, print-only report into the current DOM and call
 * `window.print()`. The browser's "Save as PDF" produces vector-quality SVG
 * charts, works offline, and needs no extra dependency.
 */

/**
 * The `/print-report` route renders a report view (hidden on screen, visible
 * on print). This function merely triggers the browser print dialog after a
 * tiny delay to let React paint the report.
 */
export function printReport() {
  window.print();
}