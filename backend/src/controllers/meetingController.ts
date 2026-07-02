import { Response } from 'express';
import prisma from '../utils/db';
import { AuthenticatedRequest } from '../middleware/auth';

/**
 * Schedule a Meeting (Admin / Team Lead / Mentor)
 */
export async function createMeeting(req: AuthenticatedRequest, res: Response) {
  try {
    const { title, agenda, meetingTime, platform, link } = req.body;

    const meeting = await prisma.meeting.create({
      data: {
        title,
        agenda,
        meetingTime: new Date(meetingTime),
        platform: platform || 'Google Meet',
        link,
        createdById: req.user!.id,
      },
    });

    // Notify all active interns about the meeting
    const interns = await prisma.internProfile.findMany({
      where: { status: { in: ['ACTIVE', 'WARNING'] } },
    });

    for (const intern of interns) {
      await prisma.notification.create({
        data: {
          userId: intern.userId,
          title: '📅 New Meeting Scheduled',
          message: `Sprint meeting: "${title}" is scheduled at ${new Date(meetingTime).toLocaleString()}. Platform: ${platform}`,
          type: 'MEETING',
        },
      });

      // Prepare empty attendance record
      await prisma.meetingAttendance.create({
        data: {
          meetingId: meeting.id,
          userId: intern.userId,
        },
      }).catch(() => {}); // ignore duplicates
    }

    return res.status(201).json({
      message: 'Meeting scheduled successfully.',
      meeting,
    });
  } catch (error: any) {
    return res.status(500).json({ message: 'Internal server error.', error: error.message });
  }
}

/**
 * Intern: Join Meeting (Mark Attendance & Detect Late)
 */
export async function joinMeeting(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user!.id;
    const { meetingId } = req.params;

    const meeting = await prisma.meeting.findUnique({ where: { id: meetingId } });
    if (!meeting) {
      return res.status(404).json({ message: 'Meeting not found.' });
    }

    const now = new Date();
    const startTime = new Date(meeting.meetingTime).getTime();
    const joinedTime = now.getTime();
    
    // Late threshold: 5 minutes (300,000 ms)
    const isLate = (joinedTime - startTime) > 5 * 60 * 1000;

    const attendance = await prisma.meetingAttendance.upsert({
      where: {
        meetingId_userId: { meetingId, userId },
      },
      update: {
        joinedAt: now,
        late: isLate,
        participationScore: isLate ? 5.0 : 8.0, // base starter scores
      },
      create: {
        meetingId,
        userId,
        joinedAt: now,
        late: isLate,
        participationScore: isLate ? 5.0 : 8.0,
      },
    });

    // Increment XP (+10 XP for attending meeting)
    await prisma.internProfile.update({
      where: { userId },
      data: {
        xp: { increment: 10 },
      },
    });

    return res.json({
      message: `Joined meeting. Attendance status logged: ${isLate ? 'Late' : 'On-time'}.`,
      link: meeting.link,
      attendance,
    });
  } catch (error: any) {
    return res.status(500).json({ message: 'Internal server error.', error: error.message });
  }
}

/**
 * Mentor/TL: Grade Intern Meeting Participation
 */
export async function gradeParticipation(req: AuthenticatedRequest, res: Response) {
  try {
    const { meetingId, userId } = req.params;
    const { score } = req.body; // score: 0 to 10

    const grade = parseFloat(score);
    if (isNaN(grade) || grade < 0 || grade > 10) {
      return res.status(400).json({ message: 'Score must be a number between 0 and 10.' });
    }

    const attendance = await prisma.meetingAttendance.update({
      where: {
        meetingId_userId: { meetingId, userId },
      },
      data: {
        participationScore: grade,
      },
    });

    // Award bonus XP if participation is high (>= 8)
    if (grade >= 8) {
      await prisma.internProfile.update({
        where: { userId },
        data: { xp: { increment: 15 } },
      });

      await prisma.notification.create({
        data: {
          userId,
          title: '🌟 High Meeting Participation',
          message: `You received a high score of ${grade}/10 for meeting participation. +15 XP awarded!`,
          type: 'INFO',
        },
      });
    }

    return res.json({
      message: 'Participation graded successfully.',
      attendance,
    });
  } catch (error: any) {
    return res.status(500).json({ message: 'Internal server error.', error: error.message });
  }
}

/**
 * Get Meetings list and attendees
 */
export async function getMeetings(req: AuthenticatedRequest, res: Response) {
  try {
    const { role, id } = req.user!;

    const meetings = await prisma.meeting.findMany({
      include: {
        attendance: {
          include: {
            user: {
              select: { firstName: true, lastName: true },
            },
          },
        },
      },
      orderBy: { meetingTime: 'desc' },
    });

    // If intern, filter their own specific attendance state
    if (role === 'INTERN') {
      const formatted = meetings.map(m => {
        const myAttend = m.attendance.find(a => a.userId === id);
        return {
          id: m.id,
          title: m.title,
          agenda: m.agenda,
          meetingTime: m.meetingTime,
          platform: m.platform,
          link: m.link,
          minutes: m.minutes,
          recordingUrl: m.recordingUrl,
          myAttendance: myAttend || null,
        };
      });
      return res.json(formatted);
    }

    return res.json(meetings);
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error.' });
  }
}
