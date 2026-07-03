import { Request, Response } from 'express';
import prisma from '../utils/db';
import { summarizeDailyStandups } from '../services/ai';

export async function getDailyStandupDigest(req: Request | any, res: Response) {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const reports = await prisma.dailyReport.findMany({
      where: {
        date: { gte: todayStart },
      },
      include: {
        user: true,
      },
    });

    const formattedReports = reports.map((r) => ({
      internName: `${r.user.firstName} ${r.user.lastName}`,
      completedWork: r.completedWork,
      problemsFaced: r.problemsFaced,
      hoursWorked: r.hoursWorked,
    }));

    const digest = await summarizeDailyStandups(formattedReports);
    return res.json({ digest });
  } catch (error: any) {
    console.error('Error standup digest:', error);
    return res.status(500).json({ message: 'Internal server error.', error: error.message });
  }
}

export async function getInactivityAudit(req: Request | any, res: Response) {
  try {
    const fortyEightHoursAgo = new Date();
    fortyEightHoursAgo.setHours(fortyEightHoursAgo.getHours() - 48);

    const inactiveProfiles = await prisma.internProfile.findMany({
      where: {
        status: 'ACTIVE',
        lastActive: { lt: fortyEightHoursAgo },
      },
      include: {
        user: {
          select: { firstName: true, lastName: true, email: true },
        },
      },
    });

    return res.json(inactiveProfiles);
  } catch (error: any) {
    console.error('Error inactivity audit:', error);
    return res.status(500).json({ message: 'Internal server error.', error: error.message });
  }
}

export async function awardBadge(req: Request | any, res: Response) {
  try {
    const { userId, badgeName } = req.body;

    if (!userId || !badgeName) {
      return res.status(400).json({ message: 'userId and badgeName are required.' });
    }

    const intern = await prisma.internProfile.findUnique({
      where: { userId },
    });

    if (!intern) {
      return res.status(404).json({ message: 'Intern profile not found.' });
    }

    // Append badge if not already added
    const currentBadges = intern.badges || [];
    if (!currentBadges.includes(badgeName)) {
      currentBadges.push(badgeName);
    }

    const updatedProfile = await prisma.internProfile.update({
      where: { userId },
      data: {
        badges: currentBadges,
        xp: { increment: 50 }, // Reward with +50 XP
      },
    });

    // Notify user
    await prisma.notification.create({
      data: {
        userId,
        title: '🏆 New Badge Awarded!',
        message: `Congratulations! You have been awarded the "${badgeName}" badge by the Admin, earning you +50 XP!`,
        type: 'SUCCESS',
      },
    });

    return res.json({
      message: 'Badge successfully awarded!',
      badges: updatedProfile.badges,
      xp: updatedProfile.xp,
    });
  } catch (error: any) {
    console.error('Error awarding badge:', error);
    return res.status(500).json({ message: 'Internal server error.', error: error.message });
  }
}
