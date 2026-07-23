import PDFDocument from 'pdfkit';
import fs from 'fs';

export function generatePdfReport({ filePath, title, generatedAt, sections }) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 40 });
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    doc.fontSize(18).text(title, { align: 'center' });
    doc.moveDown(0.5);
    doc
      .fontSize(10)
      .fillColor('gray')
      .text(`Ngày sinh báo cáo: ${generatedAt.toLocaleString('vi-VN')}`, { align: 'center' });
    doc.fillColor('black');
    doc.moveDown();

    sections.forEach((section) => {
      doc.fontSize(14).text(section.heading, { underline: true });
      doc.moveDown(0.3);

      if (section.lines.length === 0) {
        doc.fontSize(10).fillColor('gray').text('Không có dữ liệu');
        doc.fillColor('black');
      } else {
        section.lines.forEach((line) => {
          doc.fontSize(10).text(line);
        });
      }

      doc.moveDown();
    });

    doc.end();

    stream.on('finish', () => resolve(filePath));
    stream.on('error', reject);
  });
}
