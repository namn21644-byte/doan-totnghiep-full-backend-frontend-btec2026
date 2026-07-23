import ExcelJS from 'exceljs';

export async function generateXlsxReport({ filePath, sheets }) {
  const workbook = new ExcelJS.Workbook();

  sheets.forEach((sheetDef) => {
    const sheet = workbook.addWorksheet(sheetDef.name);
    sheet.columns = sheetDef.columns;
    sheetDef.rows.forEach((row) => sheet.addRow(row));
    sheet.getRow(1).font = { bold: true };
  });

  await workbook.xlsx.writeFile(filePath);
  return filePath;
}
