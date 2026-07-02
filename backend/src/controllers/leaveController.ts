import { Response } from 'express';
import prisma from '../utils/db';
import { AuthenticatedRequest } from '../middleware/auth';

/**
 * Apply for Leave
 */
export async function applyLeave(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user!.id;
    const { reason, startDate, endDate, description, documentUrl } = req.body;

    const leave = await prisma.leaveRequest.create({
      data: {
        userId,
        reason,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        description,
        documentUrl: req.file ? `/uploads/leaves/${req.file.filename}` : (documentUrl || null),
        status: 'PENDING',
      },
    });

    // Notify HR
    const hrs = await prisma.user.findMany({ where: { role: 'HR_MANAGER' } });
    for (const hr of hrs) {
      await prisma.notification.create({
        data: {
          userId: hr.id,
          title: '📝 New Leave Request',
          message: `Intern applied for ${reason} leave from ${new Date(startDate).toLocaleDateString()} to ${new Date(endDate).toLocaleDateString()}`,
          type: 'INFO',
        },
      });
    }

    return res.status(201).json({
      message: 'Leave request submitted successfully.',
      leave,
    });
  } catch (error: any) {
    console.error('Apply leave error:', error);
    return res.status(500).json({ message: 'Internal server error.', error: error.message });
  }
}

/**
 * HR/Admin: Review Leave Request (Approve/Reject)
 */
export async function reviewLeave(req: AuthenticatedRequest, res: Response) {
  try {
    const { leaveId } = req.params;
    const { status } = req.body; // status: APPROVED or REJECTED

    if (!['APPROVED', 'REJECTED'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status.' });
    }

    const leave = await prisma.leaveRequest.findUnique({ where: { id: leaveId } });
    if (!leave) {
      return res.status(404).json({ message: 'Leave request not found.' });
    }

    const updatedLeave = await prisma.leaveRequest.update({
      where: { id: leaveId },
      data: {
        status,
        reviewedById: req.user!.id,
      },
    });

    // If approved, we could optionally pre-fill attendance records as 'LEAVE'
    // For simplicity, we just notify the intern
    await prisma.notification.create({
      data: {
        userId: leave.userId,
        title: `Leave Request ${status}`,
        message: `Your leave request from ${new Date(leave.startDate).toLocaleDateString()} to ${new Date(leave.endDate).toLocaleDateString()} has been ${status.toLowerCase()}.`,
        type: status === 'APPROVED' ? 'INFO' : 'WARNING',
      },
    });

    return res.json({
      message: `Leave request ${status.toLowerCase()} successfully.`,
      leave: updatedLeave,
    });
  } catch (error: any) {
    return res.status(500).json({ message: 'Internal server error.', error: error.message });
  }
}

/**
 * Get Current User's Leaves
 */
export async function getMyLeaves(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user!.id;
    const leaves = await prisma.leaveRequest.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    return res.json(leaves);
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error.' });
  }
}

/**
 * HR/Admin: Get All Leave Requests
 */
export async function getAllLeaves(req: AuthenticatedRequest, res: Response) {
  try {
    const leaves = await prisma.leaveRequest.findMany({
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            internProfile: { select: { internId: true, positionApplied: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return res.json(leaves);
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error.' });
  }
}
