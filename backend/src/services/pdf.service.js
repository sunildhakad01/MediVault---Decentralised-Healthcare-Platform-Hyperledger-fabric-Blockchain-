/**
 * pdf.service.js – Server-side prescription PDF generation using pdfkit.
 * Returns a Buffer containing the PDF binary.
 *
 * Requires: npm install pdfkit
 */
const PDFDocument = require('pdfkit');

// ── Colour palette (matching MediVault cyan/teal design system) ───────────────
const C = {
  primary:   '#0891b2', // cyan-600
  secondary: '#0d9488', // teal-600
  dark:      '#0e7490', // cyan-700
  text:      '#111827', // gray-900
  muted:     '#6b7280', // gray-500
  light:     '#f0fdfa', // teal-50
  border:    '#a7f3d0', // emerald-200
  rowEven:   '#ffffff',
  rowOdd:    '#f9fafb', // gray-50
  amber:     '#fef3c7', // amber-50
  amberBdr:  '#fcd34d', // amber-300
  amberText: '#92400e', // amber-800
};

/**
 * generatePrescriptionPDF
 * @param {Object} options
 * @param {Object} options.prescription   – Sequelize Prescription instance / plain object
 * @param {string} options.doctorName
 * @param {string} options.doctorRegNo
 * @param {string} options.doctorSpecialization
 * @param {string} [options.patientName]
 * @param {string} [options.signatureDataUrl]  – base64 data URL for doctor signature image
 * @returns {Promise<Buffer>}
 */
const generatePrescriptionPDF = ({
  prescription,
  doctorName,
  doctorRegNo,
  doctorSpecialization,
  patientName,
  signatureDataUrl,
}) =>
  new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50, size: 'A4', autoFirstPage: true });
      const buffers = [];

      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end',  () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      const PAGE_W   = 595;
      const MARGIN   = 50;
      const CONTENT  = PAGE_W - MARGIN * 2; // 495

      // ── Header ──────────────────────────────────────────────────────────────
      doc
        .font('Helvetica-Bold')
        .fontSize(26)
        .fillColor(C.primary)
        .text('MediVault', MARGIN, 45);

      doc
        .font('Helvetica')
        .fontSize(10)
        .fillColor(C.muted)
        .text('Digital Health Management Platform', MARGIN, 75);

      // Rx badge (top-right)
      doc
        .font('Helvetica-Bold')
        .fontSize(16)
        .fillColor(C.dark)
        .text('℞', PAGE_W - MARGIN - 60, 45, { width: 60, align: 'right' });

      const rxId   = prescription.id || '—';
      const dateStr = prescription.createdAt
        ? new Date(prescription.createdAt).toLocaleDateString('en-IN', {
            day: '2-digit', month: '2-digit', year: 'numeric',
          })
        : new Date().toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });

      doc
        .font('Helvetica')
        .fontSize(9)
        .fillColor(C.muted)
        .text(`ID: ${rxId}`, PAGE_W - MARGIN - 150, 65, { width: 150, align: 'right' })
        .text(`Date: ${dateStr}`, PAGE_W - MARGIN - 150, 78, { width: 150, align: 'right' });

      // Divider
      doc.moveTo(MARGIN, 98).lineTo(PAGE_W - MARGIN, 98)
        .strokeColor(C.primary).lineWidth(2).stroke();

      // ── Doctor & Patient boxes ───────────────────────────────────────────────
      const BOX_TOP = 112;
      const BOX_H   = 85;
      const HALF    = (CONTENT - 10) / 2; // 242.5

      // Doctor box
      doc.roundedRect(MARGIN, BOX_TOP, HALF, BOX_H, 6)
        .fillColor(C.light).strokeColor(C.border).lineWidth(1).fillAndStroke();
      doc.font('Helvetica-Bold').fontSize(8).fillColor(C.primary)
        .text('DOCTOR DETAILS', MARGIN + 12, BOX_TOP + 10);
      doc.font('Helvetica-Bold').fontSize(10).fillColor(C.text)
        .text(doctorName || 'Dr. —', MARGIN + 12, BOX_TOP + 23, { width: HALF - 24 });
      doc.font('Helvetica').fontSize(9).fillColor('#374151')
        .text(`Reg. No: ${doctorRegNo || '—'}`, MARGIN + 12, BOX_TOP + 40)
        .text(`Specialization: ${doctorSpecialization || '—'}`, MARGIN + 12, BOX_TOP + 55);

      // Patient box
      const P_X = MARGIN + HALF + 10;
      doc.roundedRect(P_X, BOX_TOP, HALF, BOX_H, 6)
        .fillColor(C.light).strokeColor(C.border).lineWidth(1).fillAndStroke();
      doc.font('Helvetica-Bold').fontSize(8).fillColor(C.primary)
        .text('PATIENT DETAILS', P_X + 12, BOX_TOP + 10);
      if (patientName) {
        doc.font('Helvetica-Bold').fontSize(10).fillColor(C.text)
          .text(patientName, P_X + 12, BOX_TOP + 23, { width: HALF - 24 });
        doc.font('Helvetica').fontSize(9).fillColor('#374151')
          .text(`Patient ID: ${prescription.patientId || '—'}`, P_X + 12, BOX_TOP + 40);
      } else {
        doc.font('Helvetica').fontSize(9).fillColor('#374151')
          .text(`Patient ID: ${prescription.patientId || '—'}`, P_X + 12, BOX_TOP + 28);
      }
      if (prescription.appointmentId) {
        doc.font('Helvetica').fontSize(9).fillColor('#374151')
          .text(`Appointment: ${prescription.appointmentId}`, P_X + 12, BOX_TOP + 55);
      }

      // ── Medicines table ──────────────────────────────────────────────────────
      let y = BOX_TOP + BOX_H + 18;

      doc.font('Helvetica-Bold').fontSize(10).fillColor(C.primary)
        .text('PRESCRIBED MEDICINES', MARGIN, y);
      y += 16;

      // Column x-positions and widths  [x, width]
      const cols = [
        { x: MARGIN,       w: 22,  label: '#'            },
        { x: MARGIN + 22,  w: 130, label: 'Medicine'     },
        { x: MARGIN + 152, w: 65,  label: 'Dose'         },
        { x: MARGIN + 217, w: 65,  label: 'Frequency'    },
        { x: MARGIN + 282, w: 65,  label: 'Duration'     },
        { x: MARGIN + 347, w: 148, label: 'Instructions' },
      ];

      // Header row
      const THEAD_H = 22;
      doc.rect(MARGIN, y, CONTENT, THEAD_H).fillColor(C.primary).fill();
      cols.forEach((col) => {
        doc.font('Helvetica-Bold').fontSize(8).fillColor('#ffffff')
          .text(col.label, col.x + 3, y + 7, { width: col.w - 6, ellipsis: true });
      });
      y += THEAD_H;

      // Data rows
      const medicines = Array.isArray(prescription.medicines) ? prescription.medicines : [];
      medicines.forEach((m, i) => {
        const ROW_H = 20;
        doc.rect(MARGIN, y, CONTENT, ROW_H)
          .fillColor(i % 2 === 0 ? C.rowEven : C.rowOdd)
          .fill();
        doc.rect(MARGIN, y, CONTENT, ROW_H)
          .strokeColor('#e5e7eb').lineWidth(0.5).stroke();

        const vals = [
          String(i + 1),
          m.name        || '—',
          m.dose        || '—',
          m.frequency   || '—',
          m.duration    || '—',
          m.instructions || '—',
        ];
        cols.forEach((col, ci) => {
          doc.font('Helvetica').fontSize(8).fillColor(C.text)
            .text(vals[ci], col.x + 3, y + 6, { width: col.w - 6, ellipsis: true });
        });
        y += ROW_H;
      });

      y += 14;

      // ── Special instructions ─────────────────────────────────────────────────
      if (prescription.specialInstructions) {
        doc.font('Helvetica-Bold').fontSize(10).fillColor(C.primary)
          .text('SPECIAL INSTRUCTIONS', MARGIN, y);
        y += 14;

        const siText = String(prescription.specialInstructions);
        const siH    = Math.max(36, doc.heightOfString(siText, { width: CONTENT - 20 }) + 16);
        doc.roundedRect(MARGIN, y, CONTENT, siH, 5)
          .fillColor('#f9fafb').strokeColor('#e5e7eb').lineWidth(1).fillAndStroke();
        doc.font('Helvetica').fontSize(9).fillColor('#374151')
          .text(siText, MARGIN + 10, y + 8, { width: CONTENT - 20 });
        y += siH + 12;
      }

      // ── Follow-up date ───────────────────────────────────────────────────────
      if (prescription.followUpDate) {
        doc.roundedRect(MARGIN, y, CONTENT, 30, 5)
          .fillColor(C.amber).strokeColor(C.amberBdr).lineWidth(1).fillAndStroke();
        doc.font('Helvetica-Bold').fontSize(10).fillColor(C.amberText)
          .text(`Follow-up Date: ${prescription.followUpDate}`, MARGIN + 10, y + 9, { width: CONTENT - 20 });
        y += 42;
      }

      // ── Digital signature ────────────────────────────────────────────────────
      if (signatureDataUrl && signatureDataUrl.startsWith('data:image')) {
        try {
          // Strip the data:image/xxx;base64, prefix and decode
          const base64Data = signatureDataUrl.replace(/^data:image\/\w+;base64,/, '');
          const imgBuffer  = Buffer.from(base64Data, 'base64');
          doc.image(imgBuffer, MARGIN, y, { fit: [150, 60], align: 'left' });
          doc.font('Helvetica').fontSize(8).fillColor(C.muted)
            .text('Doctor\'s Signature', MARGIN, y + 64);
          y += 80;
        } catch (_) {
          // Ignore bad image data
        }
      }

      // ── Footer ───────────────────────────────────────────────────────────────
      const FOOTER_Y = 790;
      doc.moveTo(MARGIN, FOOTER_Y).lineTo(PAGE_W - MARGIN, FOOTER_Y)
        .strokeColor('#e5e7eb').lineWidth(1).stroke();
      doc.font('Helvetica').fontSize(9).fillColor(C.muted)
        .text(
          `Generated by MediVault  |  Prescription ID: ${rxId}  |  ${dateStr}`,
          MARGIN, FOOTER_Y + 6,
          { width: CONTENT, align: 'center' },
        );

      doc.end();
    } catch (err) {
      reject(err);
    }
  });

module.exports = { generatePrescriptionPDF };
