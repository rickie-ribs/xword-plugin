import { jsPDF } from 'jspdf';
import { clueFor } from '../model/clues';
import { computeNumbering } from '../model/numbering';
import type { Direction, Puzzle, Slot } from '../model/types';

/**
 * F7 PDF in the NYT submission layout (their 2020 sample): page 1 is the contact block at the top
 * left and the filled grid, nothing else; the following pages list Across then Down in one
 * column, each entry as number and clue at the left and its answer in a second column. A clue
 * left blank prints just the number. Circles are drawn, shaded squares print grey, and a rebus
 * square prints its whole string, shrunk to fit.
 */
const PAGE = { width: 612, height: 792, margin: 36 };
const GRID = { top: 212, size: 23 };
const SHADE_GREY = 192;
const CLUE = { top: 67, bottom: 720, answerX: 390, wrapWidth: 330, indent: 14, line: 12, gap: 12 };

export function answerOf(puzzle: Puzzle, slot: Slot): string {
  return slot.cells.map(([r, c]) => puzzle.cells[r]![c]!.value || '_').join('');
}

function drawGrid(doc: jsPDF, puzzle: Puzzle, numbers: (number | null)[][], top: number): number {
  const size = Math.min(GRID.size, (PAGE.width - 2 * PAGE.margin) / puzzle.cols);
  const left = (PAGE.width - size * puzzle.cols) / 2;
  doc.setLineWidth(0.75);
  doc.setDrawColor(0);
  puzzle.cells.forEach((row, r) =>
    row.forEach((cell, c) => {
      const x = left + c * size;
      const y = top + r * size;
      if (cell.block) {
        doc.setFillColor(0, 0, 0);
        doc.rect(x, y, size, size, 'FD');
        return;
      }
      if (cell.shaded) doc.setFillColor(SHADE_GREY, SHADE_GREY, SHADE_GREY);
      else doc.setFillColor(255, 255, 255);
      doc.rect(x, y, size, size, 'FD');
      if (cell.circled) doc.circle(x + size / 2, y + size / 2, size / 2 - 0.5, 'S');
      const number = numbers[r]![c];
      if (number) {
        doc.setFont('times', 'normal');
        doc.setFontSize(size * 0.28);
        doc.text(String(number), x + 1.5, y + size * 0.28);
      }
      if (cell.value) {
        doc.setFont('times', 'bold');
        let fontSize = size * 0.6;
        doc.setFontSize(fontSize);
        const width = doc.getTextWidth(cell.value);
        if (width > size - 3) {
          fontSize *= (size - 3) / width;
          doc.setFontSize(fontSize);
        }
        doc.text(cell.value, x + size / 2, y + size * 0.82, { align: 'center' });
      }
    }),
  );
  return top + size * puzzle.rows;
}

export function toPdf(puzzle: Puzzle, contact: string[] = []): ArrayBuffer {
  const doc = new jsPDF({ unit: 'pt', format: 'letter' });
  const { numbers, slots } = computeNumbering(puzzle);

  doc.setFont('times', 'bold');
  doc.setFontSize(14);
  contact.forEach((line, i) => doc.text(line, PAGE.margin, 72 + i * 16));
  drawGrid(doc, puzzle, numbers, GRID.top);

  doc.addPage();
  let y = CLUE.top;
  // Moves to the top of a new page when `height` more points would overrun the bottom margin.
  function room(height: number) {
    if (y + height > CLUE.bottom) {
      doc.addPage();
      y = CLUE.top;
    }
  }
  function section(label: string, direction: Direction) {
    room(2 * CLUE.line + CLUE.gap);
    doc.setFont('times', 'normal');
    doc.setFontSize(12);
    doc.text(label, PAGE.margin, y);
    y += CLUE.line + CLUE.gap;
    for (const slot of slots.filter((s) => s.direction === direction)) {
      const text = clueFor(puzzle, slot)?.text.trim() ?? '';
      doc.setFont('times', 'normal');
      doc.setFontSize(12);
      const lines: string[] = doc.splitTextToSize(`${slot.number} ${text}`.trim(), CLUE.wrapWidth);
      room(lines.length * CLUE.line);
      lines.forEach((line, i) => doc.text(line, PAGE.margin + (i ? CLUE.indent : 0), y + i * CLUE.line));
      doc.text(answerOf(puzzle, slot), CLUE.answerX, y);
      y += (lines.length - 1) * CLUE.line + CLUE.line + CLUE.gap;
    }
  }
  section('ACROSS', 'across');
  y += 2 * CLUE.line;
  section('DOWN', 'down');

  return doc.output('arraybuffer');
}
