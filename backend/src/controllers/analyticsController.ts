import { Response } from 'express';
import prisma from '../utils/db';
import { AuthenticatedRequest } from '../middleware/auth';

/**
 * Get Dashboard Analytics (Admin / HR)
 */
export async function getDashboardStats(req: AuthenticatedRequest, res: Response) {
  try {
    // 1. Intern Counts
    const totalInterns = await prisma.internProfile.count();
    const activeInterns = await prisma.internProfile.count({ where: { status: 'ACTIVE' } });
    const warningInterns = await prisma.internProfile.count({ where: { status: 'WARNING' } });
    const suspendedInterns = await prisma.internProfile.count({ where: { status: 'SUSPENDED' } });
    const terminatedInterns = await prisma.internProfile.count({ where: { status: 'TERMINATED' } });
    const completedInterns = await prisma.internProfile.count({ where: { status: 'COMPLETED' } });

    // 2. Attendance rates
    const attendanceStats = await prisma.attendance.groupBy({
      by: ['status'],
      _count: true,
    });
    
    // 3. Task completions
    const totalTasks = await prisma.task.count();
    const completedTasks = await prisma.task.count({ where: { status: 'COMPLETED' } });

    // 4. Department distributions
    const departmentDistribution = await prisma.internProfile.groupBy({
      by: ['departmentId'],
      _count: true,
    });
    const departments = await prisma.department.findMany();
    const formattedDeptDist = departmentDistribution.map(item => {
      const dept = departments.find(d => d.id === item.departmentId);
      return {
        name: dept ? dept.name : 'Unknown',
        count: item._count,
      };
    });

    // 5. University distributions
    const universityDistribution = await prisma.internProfile.groupBy({
      by: ['university'],
      _count: true,
      orderBy: {
        _count: {
          id: 'desc',
        },
      },
      take: 5,
    });
    const formattedUniDist = universityDistribution.map(item => ({
      name: item.university,
      count: item._count,
    }));

    // 6. Recent activity audits
    const recentAudits = await prisma.activityLog.findMany({
      include: {
        user: { select: { firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    return res.json({
      counts: {
        total: totalInterns,
        active: activeInterns,
        warning: warningInterns,
        suspended: suspendedInterns,
        terminated: terminatedInterns,
        completed: completedInterns,
      },
      tasks: {
        total: totalTasks,
        completed: completedTasks,
        completionRate: totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 100,
      },
      attendance: attendanceStats.reduce((acc: any, curr) => {
        acc[curr.status] = curr._count;
        return acc;
      }, { PRESENT: 0, LATE: 0, HALF_DAY: 0, ABSENT: 0 }),
      departments: formattedDeptDist,
      universities: formattedUniDist,
      activityLogs: recentAudits,
    });
  } catch (error: any) {
    console.error('Analytics fetch error:', error);
    return res.status(500).json({ message: 'Internal server error.', error: error.message });
  }
}

/**
 * Intern Dashboard: Get Intern Personal Analytics & Gamification Details
 */
export async function getInternStats(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user!.id;

    const intern = await prisma.internProfile.findUnique({
      where: { userId },
      include: { department: true },
    });

    if (!intern) {
      return res.status(404).json({ message: 'Intern profile not found.' });
    }

    // Fetch metrics
    const attendanceHistory = await prisma.attendance.findMany({ where: { userId } });
    const reportCount = await prisma.dailyReport.count({ where: { userId, status: 'APPROVED' } });
    const logbookCount = await prisma.logbook.count({ where: { userId, status: 'APPROVED' } });
    const taskCount = await prisma.task.count({ where: { assigneeId: userId } });
    const taskCompleted = await prisma.task.count({ where: { assigneeId: userId, status: 'COMPLETED' } });
    const warnings = await prisma.warning.findMany({ where: { userId } });

    // Level progression XP calculator (e.g. Next level requires level * 100 XP)
    const currentXp = intern.xp;
    const currentLevel = intern.level;
    const xpForNextLevel = currentLevel * 100;
    const progressToNext = parseFloat(((currentXp % 100) / 100 * 100).toFixed(1));

    // Determine earned badges based on achievements
    const badges = [];
    if (intern.streak >= 5) badges.push({ name: '🔥 5-Day Streak', desc: 'Active for 5 days consecutively' });
    if (intern.streak >= 15) badges.push({ name: '⚡ Super Active', desc: 'Active for 15 days consecutively' });
    if (reportCount >= 10) badges.push({ name: '📝 Journal Writer', desc: '10 approved daily reports' });
    if (taskCompleted >= 5) badges.push({ name: '🏆 Goal Getter', desc: 'Completed 5 assigned sprint tasks' });
    if (currentLevel >= 3) badges.push({ name: '🎓 Contributor', desc: 'Graduated to level 3' });
    if (currentLevel >= 5) badges.push({ name: '🚀 Senior Intern', desc: 'Graduated to level 5' });

    // Append custom badges awarded by admin
    const customBadges = (intern.badges || []).map((b: string) => ({ name: b.startsWith('🏆') ? b : `🏆 ${b}`, desc: 'Awarded by Admin' }));
    const allBadges = [...badges, ...customBadges];

    return res.json({
      level: currentLevel,
      xp: currentXp,
      xpForNextLevel,
      xpProgress: progressToNext,
      streak: intern.streak,
      completionProgress: intern.completionProgress,
      remainingDays: intern.remainingDays,
      warningCount: intern.warningCount,
      badges: allBadges,
      warnings: warnings.map(w => ({ date: w.date, type: w.type, reason: w.reason })),
      stats: {
        attendanceCount: attendanceHistory.length,
        approvedReports: reportCount,
        approvedLogbooks: logbookCount,
        tasksAssigned: taskCount,
        tasksCompleted: taskCompleted,
      },
    });
  } catch (error: any) {
    return res.status(500).json({ message: 'Internal server error.', error: error.message });
  }
}
