import { Response } from 'express';
import prisma from '../utils/db';
import { AuthenticatedRequest } from '../middleware/auth';

/**
 * Submit Daily Report
 */
export async function submitReport(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user!.id;
    const {
      todayTasks,
      completedWork,
      problemsFaced,
      hoursWorked,
      githubLink,
      commitLink,
      demoLink,
      screenshotUrl
    } = req.body;

    const today = new Date();
    const date = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    // Check if report already exists for today
    const existing = await prisma.dailyReport.findUnique({
      where: {
        userId_date: { userId, date },
      },
    });

    if (existing) {
      return res.status(400).json({ message: 'Daily report already submitted for today.' });
    }

    const report = await prisma.dailyReport.create({
      data: {
        userId,
        date,
        todayTasks,
        completedWork,
        problemsFaced,
        hoursWorked: parseFloat(hoursWorked),
        githubLink,
        commitLink,
        demoLink,
        screenshotUrl: req.file ? `/uploads/screenshots/${req.file.filename}` : (screenshotUrl || null),
        status: 'PENDING',
      },
    });

    // Update lastActive and award XP (+15 XP for submitting daily report)
    await prisma.internProfile.update({
      where: { userId },
      data: {
        lastActive: today,
        xp: { increment: 15 },
      },
    });

    return res.status(201).json({
      message: 'Daily report submitted successfully! Awaiting review.',
      report,
    });
  } catch (error: any) {
    console.error('Submit report error:', error);
    return res.status(500).json({ message: 'Internal server error.', error: error.message });
  }
}

/**
 * Mentor/Admin: Review Daily Report (Approve/Reject)
 */
export async function reviewReport(req: AuthenticatedRequest, res: Response) {
  try {
    const { reportId } = req.params;
    const { status, remarks } = req.body; // status: APPROVED or REJECTED

    if (!['APPROVED', 'REJECTED'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status value.' });
    }

    const report = await prisma.dailyReport.findUnique({
      where: { id: reportId },
    });

    if (!report) {
      return res.status(404).json({ message: 'Daily report not found.' });
    }

    const updatedReport = await prisma.dailyReport.update({
      where: { id: reportId },
      data: {
        status,
        remarks,
        reviewedById: req.user!.id,
      },
    });

    // If approved, award XP (+20 XP) and update intern completion progress
    if (status === 'APPROVED') {
      const intern = await prisma.internProfile.findUnique({
        where: { userId: report.userId },
      });

      if (intern) {
        // Calculate new streak
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayNormalized = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());
        
        const hadYesterday = await prisma.dailyReport.findFirst({
          where: {
            userId: report.userId,
            date: yesterdayNormalized,
            status: 'APPROVED',
          },
        });

        const newStreak = hadYesterday ? intern.streak + 1 : 1;

        // Level system: 100 XP per level
        const newXp = intern.xp + 20;
        const newLevel = Math.floor(newXp / 100) + 1;

        // Completion percentage (e.g. 180 days total, each approved report is 1/180 of progress)
        const totalDuration = 180;
        const approvedCount = await prisma.dailyReport.count({
          where: { userId: report.userId, status: 'APPROVED' },
        });
        const completionProgress = parseFloat(Math.min((approvedCount / totalDuration) * 100, 100).toFixed(1));

        await prisma.internProfile.update({
          where: { userId: report.userId },
          data: {
            xp: newXp,
            level: newLevel > intern.level ? newLevel : intern.level,
            streak: newStreak,
            completionProgress,
          },
        });

        // Notify intern
        await prisma.notification.create({
          data: {
            userId: report.userId,
            title: '✅ Daily Report Approved',
            message: `Your daily report for ${report.date.toLocaleDateString()} was approved. +20 XP awarded!`,
            type: 'INFO',
          },
        });
      }
    } else {
      // Notify intern of rejection
      await prisma.notification.create({
        data: {
          userId: report.userId,
          title: '❌ Daily Report Rejected',
          message: `Your daily report for ${report.date.toLocaleDateString()} was rejected. Remarks: ${remarks || 'None'}`,
          type: 'WARNING',
        },
      });
    }

    return res.json({
      message: `Daily report ${status.toLowerCase()} successfully.`,
      report: updatedReport,
    });
  } catch (error: any) {
    console.error('Review report error:', error);
    return res.status(500).json({ message: 'Internal server error.', error: error.message });
  }
}

/**
 * Get Intern's own reports
 */
export async function getMyReports(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user!.id;
    const reports = await prisma.dailyReport.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
    });
    return res.json(reports);
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error.' });
  }
}

/**
 * Mentor/Admin: Get reports pending approval
 */
export async function getPendingReports(req: AuthenticatedRequest, res: Response) {
  try {
    const userRole = req.user!.role;
    const userId = req.user!.id;

    let reports;
    if (userRole === 'MENTOR') {
      // Get reports of interns assigned to this mentor
      reports = await prisma.dailyReport.findMany({
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
      // Admin/HR see all pending reports
      reports = await prisma.dailyReport.findMany({
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

    return res.json(reports);
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error.' });
  }
}
