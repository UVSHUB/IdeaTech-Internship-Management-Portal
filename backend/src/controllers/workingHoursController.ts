import { Request, Response } from 'express';
import prisma from '../utils/db';

export async function saveWorkingHoursPlan(req: Request | any, res: Response) {
  try {
    const userId = req.user.id;
    const { plans } = req.body; // Array of { dayOfWeek: string, startTime: string, endTime: string }

    if (!Array.isArray(plans)) {
      return res.status(400).json({ message: 'Plans must be an array.' });
    }

    const updatedPlans = [];
    for (const plan of plans) {
      const p = await prisma.workingHoursPlan.upsert({
        where: {
          userId_dayOfWeek: {
            userId,
            dayOfWeek: plan.dayOfWeek,
          },
        },
        update: {
          startTime: plan.startTime,
          endTime: plan.endTime,
        },
        create: {
          userId,
          dayOfWeek: plan.dayOfWeek,
          startTime: plan.startTime,
          endTime: plan.endTime,
        },
      });
      updatedPlans.push(p);
    }

    return res.json({ message: 'Working hours plans saved successfully!', plans: updatedPlans });
  } catch (error: any) {
    console.error('Error saving working hours:', error);
    return res.status(500).json({ message: 'Internal server error.', error: error.message });
  }
}

export async function getWorkingHoursPlan(req: Request | any, res: Response) {
  try {
    const userId = req.params.userId || req.user.id;
    const plans = await prisma.workingHoursPlan.findMany({
      where: { userId },
    });
    return res.json(plans);
  } catch (error: any) {
    console.error('Error fetching working hours:', error);
    return res.status(500).json({ message: 'Internal server error.', error: error.message });
  }
}
