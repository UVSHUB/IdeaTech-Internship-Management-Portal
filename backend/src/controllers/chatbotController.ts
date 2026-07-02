import { Response } from 'express';
import prisma from '../utils/db';
import { AuthenticatedRequest } from '../middleware/auth';
import { getChatbotResponse, generateWeeklyFeedback } from '../services/ai';

/**
 * AI Support Chatbot
 */
export async function chatSupport(req: AuthenticatedRequest, res: Response) {
  try {
    const { message } = req.body;
    const userId = req.user!.id;

    const profile = await prisma.internProfile.findUnique({
      where: { userId },
      include: { department: true },
    });

    const internDetails = {
      name: `${req.user!.firstName} ${req.user!.lastName}`,
      level: profile ? profile.level : 1,
      department: profile ? profile.department.name : 'Engineering',
      status: profile ? profile.status : 'ACTIVE',
    };

    const reply = await getChatbotResponse(message, internDetails);

    return res.json({ reply });
  } catch (error: any) {
    console.error('Chatbot error:', error);
    return res.status(500).json({ message: 'Internal server error.', error: error.message });
  }
}

/**
 * Generate AI Weekly Feedback
 */
export async function triggerWeeklyFeedback(req: AuthenticatedRequest, res: Response) {
  try {
    const { internId } = req.params; // Target intern user ID

    const intern = await prisma.internProfile.findUnique({
      where: { userId: internId },
      include: { user: true },
    });

    if (!intern) {
      return res.status(404).json({ message: 'Intern profile not found.' });
    }

    // Get reports from the past 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const reports = await prisma.dailyReport.findMany({
      where: {
        userId: internId,
        createdAt: { gte: sevenDaysAgo },
      },
      select: {
        completedWork: true,
        problemsFaced: true,
        hoursWorked: true,
      },
    });

    const tasks = await prisma.task.findMany({
      where: {
        assigneeId: internId,
        updatedAt: { gte: sevenDaysAgo },
      },
      select: {
        title: true,
        status: true,
      },
    });

    const feedback = await generateWeeklyFeedback(
      `${intern.user.firstName} ${intern.user.lastName}`,
      reports,
      tasks
    );

    return res.json({ feedback });
  } catch (error: any) {
    console.error('Feedback trigger error:', error);
    return res.status(500).json({ message: 'Internal server error.', error: error.message });
  }
}
