import {
  Document, Packer, Paragraph, TextRun, HeadingLevel,
  AlignmentType, BorderStyle, TableRow, TableCell, Table,
  WidthType, ShadingType, convertInchesToTwip, Footer, PageNumber,
} from 'docx';
import { readFileSync, writeFileSync } from 'fs';

const md = readFileSync('../BUSINESS_PLAN.md', 'utf8');
const lines = md.split('\n');

const children = [];
let tableRows = [];
let inTable = false;
let tableHeaders = [];

function addTable() {
  if (tableRows.length === 0) return;
  const allRows = [tableHeaders, ...tableRows];
  const colCount = tableHeaders.length;
  const colWidth = Math.floor(9000 / colCount);

  const table = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: allRows.map((row, ri) =>
      new TableRow({
        children: row.map((cell) =>
          new TableCell({
            width: { size: colWidth, type: WidthType.DXA },
            shading: ri === 0 ? { type: ShadingType.SOLID, color: '2563EB', fill: '2563EB' } : undefined,
            children: [new Paragraph({
              children: [new TextRun({ text: cell.trim(), bold: ri === 0, color: ri === 0 ? 'FFFFFF' : '000000', size: 20, font: 'Calibri' })],
            })],
          })
        ),
      })
    ),
  });
  children.push(table, new Paragraph({ text: '' }));
  inTable = false;
  tableRows = [];
  tableHeaders = [];
}

let i = 0;
while (i < lines.length) {
  const line = lines[i];

  // Table detection
  if (line.includes('|') && line.trim().startsWith('|')) {
    const cells = line.split('|').filter(c => c.trim() !== '');
    if (cells.every(c => /^[\s\-:]+$/.test(c))) { i++; continue; } // separator row
    if (!inTable) { tableHeaders = cells.map(c => c.trim()); inTable = true; }
    else { tableRows.push(cells.map(c => c.trim())); }
    i++; continue;
  } else if (inTable) { addTable(); }

  // Blank line
  if (line.trim() === '') { i++; continue; }

  // Horizontal rule
  if (line.trim() === '---') {
    children.push(new Paragraph({ text: '', spacing: { after: 200 } }));
    i++; continue;
  }

  // Headings
  const h1 = line.match(/^# (.+)/);
  const h2 = line.match(/^## (.+)/);
  const h3 = line.match(/^### (.+)/);
  const h4 = line.match(/^#### (.+)/);

  if (h1) {
    children.push(new Paragraph({
      heading: HeadingLevel.HEADING_1,
      children: [new TextRun({ text: h1[1], bold: true, size: 36, font: 'Calibri', color: '1E3A5F' })],
      spacing: { before: 400, after: 200 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: '2563EB' } },
    }));
    i++; continue;
  }
  if (h2) {
    children.push(new Paragraph({
      heading: HeadingLevel.HEADING_2,
      children: [new TextRun({ text: h2[1], bold: true, size: 28, font: 'Calibri', color: '2563EB' })],
      spacing: { before: 360, after: 160 },
    }));
    i++; continue;
  }
  if (h3) {
    children.push(new Paragraph({
      heading: HeadingLevel.HEADING_3,
      children: [new TextRun({ text: h3[1], bold: true, size: 24, font: 'Calibri', color: '1E40AF' })],
      spacing: { before: 280, after: 120 },
    }));
    i++; continue;
  }
  if (h4) {
    children.push(new Paragraph({
      heading: HeadingLevel.HEADING_4,
      children: [new TextRun({ text: h4[1], bold: true, size: 22, font: 'Calibri', color: '374151' })],
      spacing: { before: 200, after: 100 },
    }));
    i++; continue;
  }

  // List items
  const listMatch = line.match(/^(\s*)[-*] (.+)/);
  if (listMatch) {
    const indent = Math.floor(listMatch[1].length / 2);
    children.push(new Paragraph({
      children: [new TextRun({ text: listMatch[2], size: 21, font: 'Calibri' })],
      bullet: { level: indent },
      spacing: { after: 60 },
    }));
    i++; continue;
  }

  // Numbered list
  const numMatch = line.match(/^(\d+)\. (.+)/);
  if (numMatch) {
    children.push(new Paragraph({
      children: [new TextRun({ text: `${numMatch[1]}. ${numMatch[2]}`, size: 21, font: 'Calibri' })],
      spacing: { after: 60 },
    }));
    i++; continue;
  }

  // Regular paragraph with inline formatting
  const runs = [];
  let remaining = line;
  const boldItalic = /\*\*\*(.+?)\*\*\*/g;
  const bold = /\*\*(.+?)\*\*/g;
  const italic = /\*(.+?)\*/g;

  // Simple approach: split by formatting markers
  const parts = remaining.split(/(\*\*\*.+?\*\*\*|\*\*.+?\*\*|\*.+?\*|`.+?`)/g);
  for (const part of parts) {
    if (part.startsWith('***') && part.endsWith('***')) {
      runs.push(new TextRun({ text: part.slice(3, -3), bold: true, italics: true, size: 21, font: 'Calibri' }));
    } else if (part.startsWith('**') && part.endsWith('**')) {
      runs.push(new TextRun({ text: part.slice(2, -2), bold: true, size: 21, font: 'Calibri' }));
    } else if (part.startsWith('*') && part.endsWith('*')) {
      runs.push(new TextRun({ text: part.slice(1, -1), italics: true, size: 21, font: 'Calibri' }));
    } else if (part.startsWith('`') && part.endsWith('`')) {
      runs.push(new TextRun({ text: part.slice(1, -1), size: 20, font: 'Courier New' }));
    } else {
      runs.push(new TextRun({ text: part, size: 21, font: 'Calibri' }));
    }
  }

  if (runs.length > 0) {
    children.push(new Paragraph({
      children: runs,
      spacing: { after: 80 },
    }));
  }

  i++;
}

if (inTable) addTable();

const doc = new Document({
  creator: 'CampusConnect Team',
  title: 'CampusConnect Business Plan 2026',
  description: 'Comprehensive business plan for CampusConnect campus social commerce platform',
  styles: {
    default: {
      document: { run: { font: 'Calibri', size: 21 } },
    },
  },
  sections: [{
    properties: {
      page: {
        margin: { top: convertInchesToTwip(1), bottom: convertInchesToTwip(1), left: convertInchesToTwip(1), right: convertInchesToTwip(1) },
      },
    },
    footers: {
      default: new Footer({
        children: [new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({ text: 'CampusConnect Business Plan 2026 | Confidential', size: 16, color: '999999', font: 'Calibri' }),
          ],
        })],
      }),
    },
    children,
  }],
});

const buffer = await Packer.toBuffer(doc);
writeFileSync('../CampusConnect_Business_Plan_2026.docx', buffer);
console.log('Done! Saved to CampusConnect_Business_Plan_2026.docx');
