import { Document, Packer, Paragraph, Table, TableCell, TableRow, TextRun, AlignmentType, WidthType, BorderStyle, PageOrientation } from 'docx';
import { ReportMetadata, ReportEntry } from './types';
import { formatDateIndonesian } from './utils';

export const exportToWord = async (metadata: ReportMetadata, entries: ReportEntry[], orientation: 'portrait' | 'landscape' = 'landscape') => {
  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            size: {
              orientation: orientation === 'landscape' ? PageOrientation.LANDSCAPE : PageOrientation.PORTRAIT,
            }
          }
        },
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: metadata.title, bold: true, size: 24 }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: metadata.school, bold: true, size: 24 }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: metadata.branch, bold: true, size: 24 }),
            ],
          }),
          new Paragraph({ text: "" }), // Empty line
          new Paragraph({
            children: [
              new TextRun({ text: "NAMA", bold: true, size: 24 }),
              new TextRun({ text: `\t: ${metadata.employeeName}`, size: 24 }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "BULAN", bold: true, size: 24 }),
              new TextRun({ text: `\t: ${metadata.reportMonth}`, size: 24 }),
            ],
          }),
          new Paragraph({ text: "" }), // Empty line
          createEntriesTable(entries),
          new Paragraph({ text: "" }), // Empty line
          createSignatures(metadata),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `Laporan_Kinerja_${metadata.employeeName.replace(/\s+/g, '_')}_${metadata.reportMonth.replace(/\s+/g, '_')}.docx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

const createEntriesTable = (entries: ReportEntry[]) => {
  const tableRows = [
    new TableRow({
      children: [
        createCell("NO", true),
        createCell("HARI", true),
        createCell("TANGGAL", true),
        createCell("WAKTU MULAI", true),
        createCell("URAIAN PEKERJAAN", true),
        createCell("FOTO", true),
        createCell("PARAF", true),
      ],
    }),
  ];

  entries.forEach((entry, index) => {
    tableRows.push(
      new TableRow({
        children: [
          createCell((index + 1).toString()),
          createCell(entry.dayName),
          createCell(formatDateIndonesian(entry.date)),
          createCell(entry.duration),
          createCell(entry.description || ''),
          createCell(entry.photo ? '[Ada Foto]' : (entry.isHoliday ? '-' : '')),
          createCell("-"),
        ],
      })
    );
  });

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: tableRows,
  });
};

const createCell = (text: string, isHeader: boolean = false) => {
  return new TableCell({
    children: [new Paragraph({ children: [new TextRun({ text, bold: isHeader, size: 22 })] })],
    shading: isHeader ? { fill: "E6F0FA" } : undefined,
  });
};

const createSignatures = (metadata: ReportMetadata) => {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
      bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
      left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
      right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
      insideHorizontal: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
      insideVertical: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
    },
    rows: [
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "KEPALA SEKOLAH", size: 22 })] })] }),
          new TableCell({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: `${metadata.reportDate}\nPELAPOR`, size: 22 })] })] }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph({ text: "" }), new Paragraph({ text: "" }), new Paragraph({ text: "" })] }),
          new TableCell({ children: [new Paragraph({ text: "" }), new Paragraph({ text: "" }), new Paragraph({ text: "" })] }),
        ]
      }),
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: metadata.principalName, bold: true, underline: {}, size: 22 })] })] }),
          new TableCell({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: metadata.reporterName, bold: true, underline: {}, size: 22 })] })] }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `NIP. ${metadata.principalNip || '-'}`, size: 22 })] })] }),
          new TableCell({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: `NIP. ${metadata.reporterNip || '-'}`, size: 22 })] })] }),
        ],
      }),
    ],
  });
};
