import { Request, Response } from 'express';
import crypto from 'crypto';
import prisma from '../utils/db';
import { AuthenticatedRequest } from '../middleware/auth';
import { generateCertificatePDF } from '../services/pdf';
import { sendEmail } from '../services/mail';
import { uploadBufferToSupabase, getSignedUrl } from '../utils/supabase';

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

/**
 * Admin: Complete Internship & Generate Certificate
 */
export async function generateCertificates(req: AuthenticatedRequest, res: Response) {
  try {
    const { userId } = req.body; // Intern user ID
    const { certificateType } = req.body; // COMPLETION, EXPERIENCE, or RECOMMENDATION

    const intern = await prisma.internProfile.findUnique({
      where: { userId },
      include: { user: true, department: true },
    });

    if (!intern) {
      return res.status(404).json({ message: 'Intern profile not found.' });
    }

    // Set status to COMPLETED
    await prisma.internProfile.update({
      where: { id: intern.id },
      data: { status: 'COMPLETED' },
    });

    // Generate unique serial number
    const year = new Date().getFullYear();
    const certCount = await prisma.certificate.count();
    const serialNumber = `IT-CERT-${year}-${String(certCount + 1).padStart(4, '0')}`;

    // Create a verification hash
    const verificationHash = crypto
      .createHash('sha256')
      .update(`${intern.internId}-${serialNumber}-${Date.now()}`)
      .digest('hex')
      .substring(0, 16);

    const verificationUrl = `${FRONTEND_URL}/verify/${verificationHash}`;

    // Generate the PDF
    const pdfBuffer = await generateCertificatePDF({
      name: `${intern.user.firstName} ${intern.user.lastName}`,
      internId: intern.internId || 'N/A',
      department: intern.department.name,
      position: intern.positionApplied,
      startDate: intern.createdAt.toLocaleDateString(),
      endDate: new Date().toLocaleDateString(),
      serialNumber,
      verificationUrl,
      certificateType,
    });

    // Upload the certificate PDF to Supabase Storage; store the object path in the DB
    const storedPdfPath = await uploadBufferToSupabase(
      pdfBuffer,
      `certificates/${serialNumber}.pdf`,
      'application/pdf'
    );

    // Save Certificate record in database
    const certificate = await prisma.certificate.create({
      data: {
        userId,
        certificateType,
        serialNumber,
        verificationHash,
        pdfUrl: storedPdfPath,
      },
    });

    // Notify Intern
    await prisma.notification.create({
      data: {
        userId,
        title: '🎓 Internship Certificate Ready!',
        message: `Congratulations! Your official ${certificateType.toLowerCase()} certificate is ready for download.`,
        type: 'INFO',
      },
    });

    // Send Completion Email
    await sendEmail({
      to: intern.user.email,
      subject: `🎓 Congratulations on completing your Internship at IdeaTech!`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
          <h2 style="color: #3b82f6; text-align: center;">Congratulations, ${intern.user.firstName}!</h2>
          <p>We are proud to share that your internship at <strong>IdeaTech (PVT) LTD</strong> is officially complete.</p>
          <p>Your <strong>${certificateType.toLowerCase()}</strong> is ready and available in your portal dashboard. It has been signed, registered, and issued under Serial Number: <strong>${serialNumber}</strong>.</p>
          <p>We appreciate all your contributions during these months and wish you great success in your career. Keep in touch!</p>
          <br/>
          <p>Warmest congratulations,<br/><strong>IdeaTech Management Board</strong></p>
        </div>
      `,
    });

    return res.status(201).json({
      message: 'Certificate generated successfully.',
      certificate: { ...certificate, pdfUrl: await getSignedUrl(certificate.pdfUrl) },
    });
  } catch (error: any) {
    console.error('Cert generation error:', error);
    return res.status(500).json({ message: 'Internal server error.', error: error.message });
  }
}

/**
 * Public Route: Verify Certificate via QR Code Hash or Serial
 */
export async function verifyCertificate(req: Request, res: Response) {
  try {
    const { key } = req.params; // Can be verificationHash or serialNumber

    const certificate = await prisma.certificate.findFirst({
      where: {
        OR: [
          { verificationHash: key },
          { serialNumber: key },
        ],
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            internProfile: {
              select: {
                internId: true,
                positionApplied: true,
                createdAt: true,
              },
            },
          },
        },
      },
    });

    if (!certificate) {
      return res.status(404).json({ verified: false, message: 'Invalid certificate credential.' });
    }

    return res.json({
      verified: true,
      serialNumber: certificate.serialNumber,
      certificateType: certificate.certificateType,
      issuedAt: certificate.issuedAt,
      internName: `${certificate.user.firstName} ${certificate.user.lastName}`,
      internId: certificate.user.internProfile?.internId,
      position: certificate.user.internProfile?.positionApplied,
      startDate: certificate.user.internProfile?.createdAt,
      pdfUrl: await getSignedUrl(certificate.pdfUrl),
    });
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error.' });
  }
}

/**
 * Get current user's generated certificates
 */
export async function getMyCertificates(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user!.id;
    const certificates = await prisma.certificate.findMany({
      where: { userId },
      orderBy: { issuedAt: 'desc' },
    });
    const signed = await Promise.all(
      certificates.map(async (c) => ({ ...c, pdfUrl: await getSignedUrl(c.pdfUrl) }))
    );
    return res.json(signed);
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error.' });
  }
}
