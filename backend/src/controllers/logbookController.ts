import { Response } from 'express';
import prisma from '../utils/db';
import { AuthenticatedRequest } from '../middleware/auth';
import { generateLogbookPDF } from '../services/pdf';
import { uploadFileToSupabase, getSignedUrl } from '../utils/supabase';

/**
 * Submit Logbook Entry
 */
export async function submitLogbook(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user!.id;
    const {
      activities,
      learning,
      skillsLearned,
      challenges,
      solutions,
      attachmentUrl
    } = req.body;

    const today = new Date();
    const date = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    // Check if logbook entry already exists for today
    const existing = await prisma.logbook.findUnique({
      where: {
        userId_date: { userId, date },
      },
    });

    if (existing) {
      return res.status(400).json({ message: 'Logbook entry already submitted for today.' });
    }

    const storedAttachmentPath = req.file
      ? await uploadFileToSupabase(req.file, 'attachments')
      : (attachmentUrl || null);

    const logbook = await prisma.logbook.create({
      data: {
        userId,
        date,
        activities,
        learning,
        skillsLearned,
        challenges,
        solutions,
        attachmentUrl: storedAttachmentPath,
        status: 'PENDING',
      },
    });

    // Update lastActive and award XP (+15 XP for logging)
    await prisma.internProfile.update({
      where: { userId },
      data: {
        lastActive: today,
        xp: { increment: 15 },
      },
    });

    return res.status(201).json({
      message: 'Logbook entry submitted successfully!',
      logbook,
    });
  } catch (error: any) {
    console.error('Submit logbook error:', error);
    return res.status(500).json({ message: 'Internal server error.', error: error.message });
  }
}

/**
 * Mentor/Admin: Review Logbook & Add Comments
 */
export async function reviewLogbook(req: AuthenticatedRequest, res: Response) {
  try {
    const { logbookId } = req.params;
    const { status, mentorComments } = req.body; // status: APPROVED or REJECTED

    if (!['APPROVED', 'REJECTED'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status value.' });
    }

    const logbook = await prisma.logbook.findUnique({
      where: { id: logbookId },
    });

    if (!logbook) {
      return res.status(404).json({ message: 'Logbook entry not found.' });
    }

    const updatedLogbook = await prisma.logbook.update({
      where: { id: logbookId },
      data: {
        status,
        mentorComments,
        reviewedById: req.user!.id,
      },
    });

    // If approved, award XP (+20 XP)
    if (status === 'APPROVED') {
      await prisma.internProfile.update({
        where: { userId: logbook.userId },
        data: {
          xp: { increment: 20 },
        },
      });

      // Notify intern
      await prisma.notification.create({
        data: {
          userId: logbook.userId,
          title: '📖 Logbook Entry Approved',
          message: `Your logbook entry for ${logbook.date.toLocaleDateString()} has been approved. +20 XP awarded!`,
          type: 'INFO',
        },
      });
    }

    return res.json({
      message: `Logbook entry ${status.toLowerCase()} successfully.`,
      logbook: updatedLogbook,
    });
  } catch (error: any) {
    console.error('Review logbook error:', error);
    return res.status(500).json({ message: 'Internal server error.', error: error.message });
  }
}

/**
 * Get Chronological Logbook for Current User (Timeline)
 */
export async function getMyLogbook(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user!.id;
    const logbooks = await prisma.logbook.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
    });
    const signed = await Promise.all(
      logbooks.map(async (l) => ({ ...l, attachmentUrl: await getSignedUrl(l.attachmentUrl) }))
    );
    return res.json(signed);
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error.' });
  }
}

/**
 * Intern: Export own logbook history as a PDF
 */
export async function exportMyLogbook(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user!.id;

    const [profile, logbooks] = await Promise.all([
      prisma.internProfile.findUnique({
        where: { userId },
        include: { user: true, department: true },
      }),
      prisma.logbook.findMany({
        where: { userId },
        orderBy: { date: 'asc' },
      }),
    ]);

    if (!profile) {
      return res.status(404).json({ message: 'Intern profile not found.' });
    }

    const pdfBuffer = await generateLogbookPDF({
      name: `${profile.user.firstName} ${profile.user.lastName}`,
      internId: profile.internId || 'N/A',
      department: profile.department.name,
      entries: logbooks,
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="logbook-${profile.internId || userId}.pdf"`);
    return res.send(pdfBuffer);
  } catch (error: any) {
    console.error('Export logbook error:', error);
    return res.status(500).json({ message: 'Internal server error.', error: error.message });
  }
}

/**
 * Mentor/Admin: Get pending logbooks
 */
export async function getPendingLogbooks(req: AuthenticatedRequest, res: Response) {
  try {
    const userRole = req.user!.role;
    const userId = req.user!.id;

    let logbooks;
    if (userRole === 'MENTOR') {
      logbooks = await prisma.logbook.findMany({
        where: {
          status: 'PENDING',
          user: {
            internProfile: { mentorId: userId },
          },
        },
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              internProfile: { select: { internId: true } },
            },
          },
        },
        orderBy: { date: 'desc' },
      });
    } else {
      logbooks = await prisma.logbook.findMany({
        where: { status: 'PENDING' },
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              internProfile: { select: { internId: true } },
            },
          },
        },
        orderBy: { date: 'desc' },
      });
    }

    const signed = await Promise.all(
      logbooks.map(async (l) => ({ ...l, attachmentUrl: await getSignedUrl(l.attachmentUrl) }))
    );
    return res.json(signed);
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error.' });
  }
}
