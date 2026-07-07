import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';

interface LogbookEntryData {
  date: Date;
  activities: string;
  learning: string;
  skillsLearned: string;
  challenges?: string | null;
  solutions?: string | null;
  status: string;
  mentorComments?: string | null;
}

/**
 * Generate a Digital ID Card PDF
 */
export async function generateIDCardPDF(data: {
  name: string;
  internId: string;
  department: string;
  position: string;
  issueDate: string;
  expiryDate: string;
  verificationUrl: string;
}): Promise<Buffer> {
  return new Promise(async (resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: [250, 400], margin: 0 }); // Custom ID Card size
      const chunks: Buffer[] = [];
      
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', err => reject(err));

      // 1. Draw Background (Dark Glassmorphism Card Style)
      // Top header gradient simulator (blue to purple)
      doc.rect(0, 0, 250, 110).fill('#0F172A'); // Slate 900
      
      // Bottom section
      doc.rect(0, 110, 250, 290).fill('#1E293B'); // Slate 800

      // Blue + Purple accent lines
      doc.rect(0, 108, 125, 3).fill('#3B82F6'); // Blue
      doc.rect(125, 108, 125, 3).fill('#A855F7'); // Purple

      // 2. Company Logo & Title
      doc.fillColor('#FFFFFF');
      doc.fontSize(14).font('Helvetica-Bold').text('IDEATECH', 20, 25, { characterSpacing: 1 });
      doc.fontSize(7).font('Helvetica').fillColor('#94A3B8').text('(PVT) LTD', 20, 42);
      
      doc.fillColor('#FFFFFF');
      doc.fontSize(10).font('Helvetica-Bold').text('INTERNSHIP PORTAL', 20, 60, { characterSpacing: 1 });

      // 3. User Mock Photo Placeholder (Standard circle with letter avatar)
      doc.circle(125, 160, 40).fill('#3B82F6');
      
      // Draw letter overlay
      const initial = data.name.charAt(0).toUpperCase();
      doc.fillColor('#FFFFFF');
      doc.fontSize(32).font('Helvetica-Bold').text(initial, 112, 138);

      // 4. User Details
      doc.fillColor('#FFFFFF');
      doc.fontSize(14).font('Helvetica-Bold').text(data.name, 10, 215, { align: 'center', width: 230 });
      
      doc.fillColor('#94A3B8');
      doc.fontSize(9).font('Helvetica').text(data.position, 10, 232, { align: 'center', width: 230 });

      doc.fillColor('#3B82F6');
      doc.fontSize(11).font('Helvetica-Bold').text(data.internId, 10, 248, { align: 'center', width: 230 });

      // Info Table
      doc.fillColor('#64748B');
      doc.fontSize(7).font('Helvetica-Bold').text('DEPARTMENT', 25, 275);
      doc.fillColor('#FFFFFF');
      doc.fontSize(8).font('Helvetica').text(data.department, 25, 285);

      doc.fillColor('#64748B');
      doc.fontSize(7).font('Helvetica-Bold').text('ISSUE DATE', 25, 305);
      doc.fillColor('#FFFFFF');
      doc.fontSize(8).font('Helvetica').text(data.issueDate, 25, 315);

      doc.fillColor('#64748B');
      doc.fontSize(7).font('Helvetica-Bold').text('EXPIRY DATE', 25, 335);
      doc.fillColor('#FFFFFF');
      doc.fontSize(8).font('Helvetica').text(data.expiryDate, 25, 345);

      // 5. Generate and Embed QR Code
      const qrBuffer = await QRCode.toBuffer(data.verificationUrl, {
        margin: 1,
        width: 80,
        color: {
          dark: '#0F172A',
          light: '#FFFFFF'
        }
      });
      doc.image(qrBuffer, 145, 275, { width: 80 });

      // Footer
      doc.fillColor('#475569');
      doc.fontSize(6).font('Helvetica').text('Scan QR to verify ID validity online.', 0, 375, { align: 'center', width: 250 });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Generate Internship Certificate, Experience or Recommendation Letter PDF
 */
export async function generateCertificatePDF(data: {
  name: string;
  internId: string;
  department: string;
  position: string;
  startDate: string;
  endDate: string;
  serialNumber: string;
  verificationUrl: string;
  certificateType: 'COMPLETION' | 'EXPERIENCE' | 'RECOMMENDATION';
}): Promise<Buffer> {
  return new Promise(async (resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 40 });
      const chunks: Buffer[] = [];
      
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', err => reject(err));

      // Page dimensions: 842 x 595
      // 1. Draw elegant double border
      doc.rect(20, 20, 802, 555).lineWidth(3).stroke('#3B82F6');
      doc.rect(26, 26, 790, 543).lineWidth(1).stroke('#A855F7');

      // Top corner gradients/blobs simulation
      doc.circle(0, 0, 150).fill('#0F172A');
      doc.circle(842, 0, 150).fill('#0F172A');
      doc.circle(421, 595, 200).fill('#0F172A');

      // Re-apply border color to make sure it overlays cleanly
      doc.rect(20, 20, 802, 555).lineWidth(2).stroke('#3B82F6');

      // 2. Company Heading
      doc.fillColor('#1E293B');
      doc.fontSize(28).font('Helvetica-Bold').text('IDEATECH (PVT) LTD', 40, 55, { align: 'center' });
      doc.fillColor('#64748B');
      doc.fontSize(10).font('Helvetica').text('No. 128, High Level Road, Colombo, Sri Lanka | info@ideatech.lk', 40, 90, { align: 'center' });

      // 3. Document Title
      let title = 'CERTIFICATE OF COMPLETION';
      let subtitle = 'This is proudly presented to';
      let content = `This is to certify that Mr./Ms. ${data.name} (Intern ID: ${data.internId}) has successfully completed their Work From Home Internship at IdeaTech (PVT) LTD as a ${data.position} in the ${data.department} Department. The internship was held from ${data.startDate} to ${data.endDate}. During this period, the intern demonstrated exceptional commitment, technical skill, and collaborative spirit.`;

      if (data.certificateType === 'EXPERIENCE') {
        title = 'EXPERIENCE CERTIFICATE';
        subtitle = 'TO WHOM IT MAY CONCERN';
        content = `This is to certify that Mr./Ms. ${data.name} (Intern ID: ${data.internId}) was employed as a ${data.position} Intern in the ${data.department} Department at IdeaTech (PVT) LTD for a period of six months from ${data.startDate} to ${data.endDate}. Throughout the internship, they completed tasks with professional quality and adhered to all remote work guidelines, demonstrating strong coding skills, daily logging hygiene, and consistent participation in team sprints.`;
      } else if (data.certificateType === 'RECOMMENDATION') {
        title = 'LETTER OF RECOMMENDATION';
        subtitle = 'RECOMMENDATION LETTER';
        content = `It is my pleasure to write this letter of recommendation for Mr./Ms. ${data.name} (Intern ID: ${data.internId}) who worked under my supervision as a ${data.position} Intern at IdeaTech (PVT) LTD from ${data.startDate} to ${data.endDate}. They consistently proved to be a highly competent developer, demonstrating excellent communication, prompt delivery of tasks, and an impressive capacity to learn new concepts quickly. I strongly recommend them for any future technical opportunities.`;
      }

      doc.fillColor('#3B82F6');
      doc.fontSize(24).font('Helvetica-Bold').text(title, 40, 140, { align: 'center', characterSpacing: 2 });
      
      doc.fillColor('#475569');
      doc.fontSize(12).font('Helvetica-Oblique').text(subtitle, 40, 180, { align: 'center' });

      // 4. Intern Name
      doc.fillColor('#0F172A');
      doc.fontSize(26).font('Helvetica-Bold').text(data.name, 40, 210, { align: 'center' });

      // Horizontal separator line
      doc.moveTo(250, 245).lineTo(592, 245).lineWidth(1).stroke('#E2E8F0');

      // 5. Body Text
      doc.fillColor('#334155');
      doc.fontSize(12).font('Helvetica').text(content, 120, 270, {
        align: 'center',
        width: 602,
        lineGap: 6
      });

      // 6. Signatures & Date
      // Date
      doc.fillColor('#475569');
      doc.fontSize(10).font('Helvetica-Bold').text('DATE OF ISSUE', 100, 420);
      doc.fillColor('#0F172A');
      doc.fontSize(11).font('Helvetica').text(new Date().toLocaleDateString(), 100, 435);
      
      // Verification Serial
      doc.fillColor('#475569');
      doc.fontSize(10).font('Helvetica-Bold').text('SERIAL NUMBER', 100, 465);
      doc.fillColor('#3B82F6');
      doc.fontSize(10).font('Helvetica-Bold').text(data.serialNumber, 100, 480);

      // Signature (HR Director)
      doc.moveTo(600, 420).lineTo(740, 420).lineWidth(1).stroke('#64748B');
      doc.fillColor('#475569');
      doc.fontSize(10).font('Helvetica-Bold').text('HR DIRECTOR', 600, 430);
      doc.fillColor('#0F172A');
      doc.fontSize(9).font('Helvetica').text('IdeaTech (PVT) LTD', 600, 445);

      // Signature (Managing Director)
      doc.moveTo(600, 490).lineTo(740, 490).lineWidth(1).stroke('#64748B');
      doc.fillColor('#475569');
      doc.fontSize(10).font('Helvetica-Bold').text('MANAGING DIRECTOR', 600, 500);

      // 7. QR Verification Block (Center Bottom)
      const qrBuffer = await QRCode.toBuffer(data.verificationUrl, {
        margin: 1,
        width: 90,
        color: {
          dark: '#0F172A',
          light: '#FFFFFF'
        }
      });
      doc.image(qrBuffer, 376, 420, { width: 90 });
      doc.fillColor('#64748B');
      doc.fontSize(8).font('Helvetica').text('Scan to Verify Legitimacy', 40, 515, { align: 'center', width: 842 - 80 });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Generate a Digital Logbook Export PDF for an Intern
 */
export async function generateLogbookPDF(data: {
  name: string;
  internId: string;
  department: string;
  entries: LogbookEntryData[];
}): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 40 });
      const chunks: Buffer[] = [];

      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', err => reject(err));

      // Header
      doc.fillColor('#1E293B');
      doc.fontSize(20).font('Helvetica-Bold').text('IDEATECH (PVT) LTD', { align: 'center' });
      doc.fontSize(13).font('Helvetica-Bold').fillColor('#3B82F6').text('DIGITAL LOGBOOK EXPORT', { align: 'center' });
      doc.moveDown(0.5);

      doc.fillColor('#334155');
      doc.fontSize(10).font('Helvetica-Bold').text(`Intern: ${data.name} (${data.internId})`);
      doc.font('Helvetica').text(`Department: ${data.department}`);
      doc.text(`Generated: ${new Date().toLocaleString()}`);
      doc.text(`Total Entries: ${data.entries.length}`);
      doc.moveDown();

      doc.moveTo(40, doc.y).lineTo(555, doc.y).lineWidth(1).stroke('#CBD5E1');
      doc.moveDown();

      if (data.entries.length === 0) {
        doc.fontSize(11).fillColor('#64748B').text('No logbook entries recorded.', { align: 'center' });
      }

      for (const entry of data.entries) {
        if (doc.y > 700) {
          doc.addPage();
        }

        doc.fontSize(11).font('Helvetica-Bold').fillColor('#0F172A')
          .text(new Date(entry.date).toLocaleDateString(), { continued: true })
          .fillColor(entry.status === 'APPROVED' ? '#059669' : entry.status === 'REJECTED' ? '#DC2626' : '#D97706')
          .font('Helvetica-Bold')
          .text(`   [${entry.status}]`, { align: 'left' });

        doc.fontSize(9).font('Helvetica-Bold').fillColor('#475569').text('Activities: ', { continued: true });
        doc.font('Helvetica').fillColor('#1E293B').text(entry.activities);

        doc.fontSize(9).font('Helvetica-Bold').fillColor('#475569').text('Learning: ', { continued: true });
        doc.font('Helvetica').fillColor('#1E293B').text(entry.learning);

        doc.fontSize(9).font('Helvetica-Bold').fillColor('#475569').text('Skills: ', { continued: true });
        doc.font('Helvetica').fillColor('#1E293B').text(entry.skillsLearned);

        if (entry.challenges) {
          doc.fontSize(9).font('Helvetica-Bold').fillColor('#475569').text('Challenges: ', { continued: true });
          doc.font('Helvetica').fillColor('#1E293B').text(entry.challenges);
        }

        if (entry.solutions) {
          doc.fontSize(9).font('Helvetica-Bold').fillColor('#475569').text('Solutions: ', { continued: true });
          doc.font('Helvetica').fillColor('#1E293B').text(entry.solutions);
        }

        if (entry.mentorComments) {
          doc.fontSize(9).font('Helvetica-BoldOblique').fillColor('#3B82F6').text(`Mentor Comments: "${entry.mentorComments}"`);
        }

        doc.moveDown(0.4);
        doc.moveTo(40, doc.y).lineTo(555, doc.y).lineWidth(0.5).stroke('#E2E8F0');
        doc.moveDown(0.6);
      }

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}
