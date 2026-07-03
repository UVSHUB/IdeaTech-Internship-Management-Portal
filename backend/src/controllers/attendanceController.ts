import { Response } from 'express';
import prisma from '../utils/db';
import { AuthenticatedRequest } from '../middleware/auth';

/**
 * Normalizes a date object to midnight local time
 */
function normalizeDate(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/**
 * Intern Check-In
 */
export async function checkIn(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user!.id;
    const now = new Date();
    const today = normalizeDate(now);

    // Check if already checked in today
    const existing = await prisma.attendance.findUnique({
      where: {
        userId_date: { userId, date: today },
      },
    });

    if (existing) {
      return res.status(400).json({ message: 'Already checked in for today.' });
    }

    // Determine status (always PRESENT for flexible work-from-home interns)
    const status = 'PRESENT';

    const attendance = await prisma.attendance.create({
      data: {
        userId,
        date: today,
        checkIn: now,
        status,
      },
    });

    // Update lastActive and increase XP (+5 for check-in)
    await prisma.internProfile.update({
      where: { userId },
      data: {
        lastActive: now,
        xp: { increment: 5 },
      },
    });

    return res.status(201).json({
      message: `Checked in successfully as ${status}.`,
      attendance,
    });
  } catch (error: any) {
    console.error('Check-in error:', error);
    return res.status(500).json({ message: 'Internal server error.', error: error.message });
  }
}

/**
 * Intern Check-Out
 */
export async function checkOut(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user!.id;
    const now = new Date();
    const today = normalizeDate(now);

    // Find today's attendance record
    const attendance = await prisma.attendance.findUnique({
      where: {
        userId_date: { userId, date: today },
      },
    });

    if (!attendance) {
      return res.status(400).json({ message: 'No check-in record found for today.' });
    }

    if (attendance.checkOut) {
      return res.status(400).json({ message: 'Already checked out for today.' });
    }

    // Calculate working hours
    const checkInTime = new Date(attendance.checkIn).getTime();
    const checkOutTime = now.getTime();
    const diffMs = checkOutTime - checkInTime;
    const workingHours = parseFloat((diffMs / (1000 * 60 * 60)).toFixed(2)); // hours

    // If working hours are less than 4, mark as HALF_DAY
    let status = attendance.status;
    if (workingHours < 4) {
      status = 'HALF_DAY';
    }

    const updatedAttendance = await prisma.attendance.update({
      where: { id: attendance.id },
      data: {
        checkOut: now,
        workingHours,
        status,
      },
    });

    // Award XP (+10 for completing checkout)
    await prisma.internProfile.update({
      where: { userId },
      data: {
        lastActive: now,
        xp: { increment: 10 },
      },
    });

    return res.json({
      message: 'Checked out successfully.',
      attendance: updatedAttendance,
    });
  } catch (error: any) {
    console.error('Check-out error:', error);
    return res.status(500).json({ message: 'Internal server error.', error: error.message });
  }
}

/**
 * Get Intern's Personal Attendance History & Stats
 */
export async function getMyAttendance(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user!.id;

    const history = await prisma.attendance.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
    });

    // Calculate stats
    const totalDays = history.length;
    const presentDays = history.filter(h => h.status === 'PRESENT').length;
    const lateDays = history.filter(h => h.status === 'LATE').length;
    const halfDays = history.filter(h => h.status === 'HALF_DAY').length;
    const totalHours = history.reduce((acc, h) => acc + (h.workingHours || 0), 0);

    return res.json({
      stats: {
        totalDays,
        presentDays,
        lateDays,
        halfDays,
        totalHours: parseFloat(totalHours.toFixed(1)),
        attendanceRate: totalDays ? Math.round(((presentDays + lateDays + halfDays * 0.5) / totalDays) * 100) : 100,
      },
      history,
    });
  } catch (error) {
    console.error('Get attendance error:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
}

/**
 * Admin/HR: Get All Interns Attendance Analytics
 */
export async function getAttendanceReports(req: AuthenticatedRequest, res: Response) {
  try {
    const reports = await prisma.attendance.findMany({
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            internProfile: {
              select: { internId: true, positionApplied: true },
            },
          },
        },
      },
      orderBy: { date: 'desc' },
      take: 200,
    });

    return res.json(reports);
  } catch (error) {
    console.error('Get attendance reports error:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
}
