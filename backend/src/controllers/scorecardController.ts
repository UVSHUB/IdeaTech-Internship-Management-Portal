import { Request, Response } from 'express';
import prisma from '../utils/db';
import { analyzePerformanceInsights } from '../services/ai';

export async function generateWeeklyScorecard(req: Request | any, res: Response) {
  try {
    const { userId } = req.params;

    // Verify user role is INTERN
    const intern = await prisma.user.findUnique({
      where: { id: userId },
      include: { internProfile: true },
    });

    if (!intern || intern.role !== 'INTERN') {
      return res.status(404).json({ message: 'Intern user not found.' });
    }

    const today = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(today.getDate() - 7);

    // 1. Calculate Attendance Rate (number of PRESENT days in the last 7 days)
    const attendances = await prisma.attendance.findMany({
      where: {
        userId,
        date: { gte: sevenDaysAgo, lte: today },
      },
    });
    const presentDays = attendances.filter(a => a.status === 'PRESENT').length;
    const attendanceRate = Math.min(100, Math.round((presentDays / 7) * 100));

    // 2. Report Submission Rate
    const dailyReports = await prisma.dailyReport.findMany({
      where: {
        userId,
        date: { gte: sevenDaysAgo, lte: today },
      },
    });
    const reportSubmissionRate = Math.min(100, Math.round((dailyReports.length / 7) * 100));

    // 3. Task Completion Rate
    const tasks = await prisma.task.findMany({
      where: { assigneeId: userId },
    });
    const completedTasks = tasks.filter(t => t.status === 'COMPLETED').length;
    const taskCompletionRate = tasks.length > 0 ? Math.min(100, Math.round((completedTasks / tasks.length) * 100)) : 100;

    // 4. Avg daily hours
    const avgHours = dailyReports.length > 0 ? dailyReports.reduce((acc, r) => acc + r.hoursWorked, 0) / dailyReports.length : 0;

    // 5. Warnings
    const warningCount = await prisma.warning.count({
      where: { userId },
    });

    // Run AI Analysis
    const internName = `${intern.firstName} ${intern.lastName}`;
    const analysis = await analyzePerformanceInsights(internName, {
      attendanceRate,
      reportSubmissionRate,
      taskCompletionRate,
      avgHoursWorked: Math.round(avgHours * 10) / 10,
      warningCount,
    });

    // Save report in DB
    const report = await prisma.weeklyPerformanceReport.create({
      data: {
        userId,
        weekStart: sevenDaysAgo,
        weekEnd: today,
        score: analysis.score,
        summary: analysis.feedback,
        areasOfImp: analysis.recommendation,
      },
    });

    return res.status(201).json({
      message: 'Weekly scorecard generated successfully by Gemini AI!',
      report,
    });
  } catch (error: any) {
    console.error('Error generating weekly scorecard:', error);
    return res.status(500).json({ message: 'Internal server error.', error: error.message });
  }
}

export async function getWeeklyScorecards(req: Request | any, res: Response) {
  try {
    const userId = req.params.userId || req.user.id;
    const scorecards = await prisma.weeklyPerformanceReport.findMany({
      where: { userId },
      orderBy: { generatedAt: 'desc' },
    });
    return res.json(scorecards);
  } catch (error: any) {
    console.error('Error fetching scorecards:', error);
    return res.status(500).json({ message: 'Internal server error.', error: error.message });
  }
}
