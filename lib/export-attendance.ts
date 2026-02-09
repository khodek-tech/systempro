import ExcelJS from 'exceljs';
import { AttendanceRecord } from '@/types';

export async function exportAttendanceToXls(
  data: AttendanceRecord[],
  filename?: string
) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Docházka');

  // Define columns
  sheet.columns = [
    { header: 'Datum', key: 'date', width: 14 },
    { header: 'Prodejna', key: 'store', width: 20 },
    { header: 'Zaměstnanec', key: 'user', width: 22 },
    { header: 'Příchod', key: 'in', width: 10 },
    { header: 'Odchod', key: 'out', width: 10 },
    { header: 'Absence', key: 'abs', width: 14 },
    { header: 'Hodiny', key: 'hrs', width: 10 },
    { header: 'Hotovost', key: 'cash', width: 14 },
    { header: 'Karta', key: 'card', width: 14 },
    { header: 'Partner', key: 'partner', width: 14 },
    { header: 'Toky', key: 'flows', width: 14 },
    { header: 'Odvedeno', key: 'collected', width: 14 },
    { header: 'Poznámka', key: 'saleNote', width: 20 },
  ];

  // Style header row
  const headerRow = sheet.getRow(1);
  headerRow.font = { bold: true };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFF1F5F9' },
  };

  // Add data rows
  for (const record of data) {
    sheet.addRow({
      date: record.date,
      store: record.store,
      user: record.user,
      in: record.in,
      out: record.out,
      abs: record.abs || '-',
      hrs: record.hrs,
      cash: record.cash,
      card: record.card,
      partner: record.partner,
      flows: record.flows,
      collected: record.collected || '-',
      saleNote: record.saleNote,
    });
  }

  // Generate file and trigger download
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename || 'dochazka.xlsx';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
