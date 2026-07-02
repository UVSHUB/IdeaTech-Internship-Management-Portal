import { Response } from 'express';
import prisma from '../utils/db';
import { AuthenticatedRequest } from '../middleware/auth';

// ==========================================
// TASK CONTROLLERS
// ==========================================

/**
 * Create a Task (Admin / Team Lead)
 */
export async function createTask(req: AuthenticatedRequest, res: Response) {
  try {
    const { title, description, priority, assigneeId, projectId, dueDate } = req.body;

    const task = await prisma.task.create({
      data: {
        title,
        description,
        priority: priority || 'MEDIUM',
        assigneeId,
        projectId: projectId || null,
        createdById: req.user!.id,
        dueDate: new Date(dueDate),
        status: 'PENDING',
      },
    });

    // Notify assignee
    await prisma.notification.create({
      data: {
        userId: assigneeId,
        title: '📋 New Task Assigned',
        message: `You have been assigned task: "${title}". Due date: ${new Date(dueDate).toLocaleDateString()}`,
        type: 'TASK',
      },
    });

    return res.status(201).json({
      message: 'Task created and assigned successfully.',
      task,
    });
  } catch (error: any) {
    console.error('Create task error:', error);
    return res.status(500).json({ message: 'Internal server error.', error: error.message });
  }
}

/**
 * Intern: Update Task Progress and Status (Working/Completed)
 */
export async function updateTaskStatus(req: AuthenticatedRequest, res: Response) {
  try {
    const { taskId } = req.params;
    const { status, progress } = req.body; // status: WORKING, COMPLETED

    const task = await prisma.task.findUnique({ where: { id: taskId } });

    if (!task) {
      return res.status(404).json({ message: 'Task not found.' });
    }

    // Ensure only the assignee can update progress
    if (task.assigneeId !== req.user!.id && req.user!.role === 'INTERN') {
      return res.status(403).json({ message: 'You can only update tasks assigned to you.' });
    }

    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: {
        status: status || task.status,
        progress: progress !== undefined ? parseFloat(progress) : task.progress,
      },
    });

    // Notify project members or creator if marked completed
    if (status === 'COMPLETED') {
      await prisma.notification.create({
        data: {
          userId: task.createdById,
          title: '✅ Task Marked Completed',
          message: `Intern marked task "${task.title}" as completed. Needs review.`,
          type: 'TASK',
        },
      });
    }

    return res.json({
      message: 'Task status updated.',
      task: updatedTask,
    });
  } catch (error: any) {
    return res.status(500).json({ message: 'Internal server error.', error: error.message });
  }
}

/**
 * Mentor/Admin/TL: Review Task Submission (Approve / Reject)
 */
export async function reviewTask(req: AuthenticatedRequest, res: Response) {
  try {
    const { taskId } = req.params;
    const { approval } = req.body; // approval: 'APPROVED' or 'REJECTED'

    const task = await prisma.task.findUnique({ where: { id: taskId } });
    if (!task) {
      return res.status(404).json({ message: 'Task not found.' });
    }

    let nextStatus: 'COMPLETED' | 'REJECTED' = 'COMPLETED';
    if (approval === 'REJECTED') {
      nextStatus = 'REJECTED';
    }

    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: {
        status: nextStatus,
        progress: approval === 'APPROVED' ? 100 : task.progress,
      },
    });

    if (approval === 'APPROVED') {
      // Award XP (+30 XP)
      await prisma.internProfile.update({
        where: { userId: task.assigneeId },
        data: {
          xp: { increment: 30 },
        },
      });

      // Notification
      await prisma.notification.create({
        data: {
          userId: task.assigneeId,
          title: '🏆 Task Approved!',
          message: `Your work on "${task.title}" has been approved. +30 XP awarded!`,
          type: 'INFO',
        },
      });
    } else {
      await prisma.notification.create({
        data: {
          userId: task.assigneeId,
          title: '❌ Task Work Rejected',
          message: `Your work on "${task.title}" was rejected. Please review requirements and try again.`,
          type: 'WARNING',
        },
      });
    }

    return res.json({
      message: `Task marked as ${nextStatus.toLowerCase()}.`,
      task: updatedTask,
    });
  } catch (error: any) {
    return res.status(500).json({ message: 'Internal server error.', error: error.message });
  }
}

/**
 * Get Tasks (Filtered by role / assignee)
 */
export async function getTasks(req: AuthenticatedRequest, res: Response) {
  try {
    const { role, id } = req.user!;
    const { status, projectId } = req.query;

    const whereClause: any = {};
    if (role === 'INTERN') {
      whereClause.assigneeId = id;
    }
    if (status) {
      whereClause.status = status;
    }
    if (projectId) {
      whereClause.projectId = projectId;
    }

    const tasks = await prisma.task.findMany({
      where: whereClause,
      include: {
        project: { select: { name: true } },
        assignee: { select: { firstName: true, lastName: true } },
        createdBy: { select: { firstName: true, lastName: true } },
      },
      orderBy: { dueDate: 'asc' },
    });

    return res.json(tasks);
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error.' });
  }
}

// ==========================================
// PROJECT CONTROLLERS
// ==========================================

/**
 * Create a Project
 */
export async function createProject(req: AuthenticatedRequest, res: Response) {
  try {
    const { name, description, githubUrl } = req.body;

    const project = await prisma.project.create({
      data: {
        name,
        description,
        githubUrl,
      },
    });

    return res.status(201).json({
      message: 'Project created successfully.',
      project,
    });
  } catch (error: any) {
    return res.status(500).json({ message: 'Internal server error.', error: error.message });
  }
}

/**
 * Add Project Member
 */
export async function addProjectMember(req: AuthenticatedRequest, res: Response) {
  try {
    const { projectId, userId } = req.body;

    const member = await prisma.projectMember.create({
      data: {
        projectId,
        userId,
      },
    });

    return res.status(201).json({
      message: 'Member added to project.',
      member,
    });
  } catch (error: any) {
    return res.status(500).json({ message: 'Internal server error.', error: error.message });
  }
}

/**
 * Get Projects
 */
export async function getProjects(req: AuthenticatedRequest, res: Response) {
  try {
    const projects = await prisma.project.findMany({
      include: {
        members: {
          include: {
            user: {
              select: { firstName: true, lastName: true, role: true },
            },
          },
        },
        tasks: true,
      },
    });

    return res.json(projects);
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error.' });
  }
}
