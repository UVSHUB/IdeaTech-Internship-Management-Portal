import { Router, Request, Response } from 'express';
import upload, { uploadCv } from '../utils/upload';
import { getSignedCvUrl } from '../utils/supabase';
import { authenticateToken, authorizeRoles } from '../middleware/auth';
import prisma from '../utils/db';

import {
  registerIntern,
  login,
  approveIntern,
  rejectIntern,
  googleLogin,
  registerStaff,
} from '../controllers/authController';

import {
  checkIn,
  checkOut,
  getMyAttendance,
  getAttendanceReports,
} from '../controllers/attendanceController';

import {
  submitReport,
  reviewReport,
  getMyReports,
  getPendingReports,
} from '../controllers/reportController';

import {
  submitLogbook,
  reviewLogbook,
  getMyLogbook,
  getPendingLogbooks,
} from '../controllers/logbookController';

import {
  createTask,
  updateTaskStatus,
  reviewTask,
  getTasks,
  createProject,
  addProjectMember,
  getProjects,
} from '../controllers/taskController';

import {
  createMeeting,
  joinMeeting,
  gradeParticipation,
  getMeetings,
  updateAttendance,
} from '../controllers/meetingController';

import {
  applyLeave,
  reviewLeave,
  getMyLeaves,
  getAllLeaves,
} from '../controllers/leaveController';

import {
  generateCertificates,
  verifyCertificate,
  getMyCertificates,
} from '../controllers/certificateController';

import {
  getDashboardStats,
  getInternStats,
} from '../controllers/analyticsController';

import {
  chatSupport,
  triggerWeeklyFeedback,
  getProjectAIAdvice,
} from '../controllers/chatbotController';

import { fetchUserCommits } from '../controllers/githubController';
import { generateWeeklyScorecard, getWeeklyScorecards } from '../controllers/scorecardController';
import { saveWorkingHoursPlan, getWorkingHoursPlan } from '../controllers/workingHoursController';
import { getDailyStandupDigest, getInactivityAudit, awardBadge } from '../controllers/adminAnalyticsController';

const router = Router();

// ==========================================
// PUBLIC ROUTES
// ==========================================
router.post('/auth/login', login);
router.post('/auth/google-login', googleLogin);
router.post('/auth/register-intern', uploadCv.single('cv'), registerIntern);
router.get('/certificates/verify/:key', verifyCertificate);

// Fetch departments (useful for apply form dropdown)
router.get('/departments', async (req: Request, res: Response) => {
  try {
    const departments = await prisma.department.findMany();
    return res.json(departments);
  } catch (error) {
    return res.status(500).json({ message: 'Error retrieving departments.' });
  }
});

// ==========================================
// AUTHENTICATED ROUTES
// ==========================================
router.use(authenticateToken as any);

router.post(
  '/auth/register-staff',
  authorizeRoles(['SUPER_ADMIN']),
  registerStaff as any
);

// Auth - Admin approvals
router.post(
  '/auth/approve/:profileId',
  authorizeRoles(['SUPER_ADMIN', 'HR_MANAGER']),
  approveIntern as any
);
router.post(
  '/auth/reject/:profileId',
  authorizeRoles(['SUPER_ADMIN', 'HR_MANAGER']),
  rejectIntern as any
);
router.get(
  '/auth/pending-applications',
  authorizeRoles(['SUPER_ADMIN', 'HR_MANAGER']),
  async (req: Request, res: Response) => {
    try {
      const applications = await prisma.internProfile.findMany({
        where: { status: 'PENDING' },
        include: {
          user: {
            select: { firstName: true, lastName: true, email: true },
          },
          department: true,
        },
      });

      const applicationsWithSignedCvUrls = await Promise.all(
        applications.map(async (app) => ({
          ...app,
          cvUrl: (await getSignedCvUrl(app.cvUrl)) || app.cvUrl,
        }))
      );

      return res.json(applicationsWithSignedCvUrls);
    } catch (error) {
      return res.status(500).json({ message: 'Error retrieving application forms.' });
    }
  }
);

// Attendance
router.post('/attendance/checkin', authorizeRoles(['INTERN']), checkIn as any);
router.post('/attendance/checkout', authorizeRoles(['INTERN']), checkOut as any);
router.get('/attendance/my', authorizeRoles(['INTERN']), getMyAttendance as any);
router.get(
  '/attendance/reports',
  authorizeRoles(['SUPER_ADMIN', 'HR_MANAGER', 'TEAM_LEADER', 'PROJECT_MANAGER', 'MENTOR']),
  getAttendanceReports as any
);

// Daily Reports
router.post('/reports/submit', authorizeRoles(['INTERN']), upload.single('screenshot'), submitReport as any);
router.post(
  '/reports/review/:reportId',
  authorizeRoles(['SUPER_ADMIN', 'MENTOR', 'TEAM_LEADER', 'PROJECT_MANAGER']),
  reviewReport as any
);
router.get('/reports/my', authorizeRoles(['INTERN']), getMyReports as any);
router.get(
  '/reports/pending',
  authorizeRoles(['SUPER_ADMIN', 'MENTOR', 'TEAM_LEADER', 'PROJECT_MANAGER']),
  getPendingReports as any
);

// Logbooks
router.post('/logbook/submit', authorizeRoles(['INTERN']), upload.single('attachment'), submitLogbook as any);
router.post(
  '/logbook/review/:logbookId',
  authorizeRoles(['SUPER_ADMIN', 'MENTOR']),
  reviewLogbook as any
);
router.get('/logbook/my', authorizeRoles(['INTERN']), getMyLogbook as any);
router.get(
  '/logbook/pending',
  authorizeRoles(['SUPER_ADMIN', 'MENTOR']),
  getPendingLogbooks as any
);

// Tasks & Projects
router.post('/tasks', authorizeRoles(['SUPER_ADMIN', 'TEAM_LEADER', 'PROJECT_MANAGER']), createTask as any);
router.get('/tasks', getTasks as any);
router.post('/tasks/update/:taskId', authorizeRoles(['INTERN']), updateTaskStatus as any);
router.post(
  '/tasks/review/:taskId',
  authorizeRoles(['SUPER_ADMIN', 'TEAM_LEADER', 'PROJECT_MANAGER', 'MENTOR']),
  reviewTask as any
);

router.post('/projects', authorizeRoles(['SUPER_ADMIN']), createProject as any);
router.get('/projects', getProjects as any);
router.post('/projects/member', authorizeRoles(['SUPER_ADMIN', 'TEAM_LEADER', 'PROJECT_MANAGER']), addProjectMember as any);

// Meetings
router.post(
  '/meetings',
  authorizeRoles(['SUPER_ADMIN', 'TEAM_LEADER', 'PROJECT_MANAGER', 'MENTOR']),
  createMeeting as any
);
router.get('/meetings', getMeetings as any);
router.post('/meetings/join/:meetingId', authorizeRoles(['INTERN']), joinMeeting as any);
router.post(
  '/meetings/grade/:meetingId/:userId',
  authorizeRoles(['SUPER_ADMIN', 'TEAM_LEADER', 'PROJECT_MANAGER', 'MENTOR']),
  gradeParticipation as any
);
router.post(
  '/meetings/attendance/:meetingId',
  authorizeRoles(['SUPER_ADMIN', 'TEAM_LEADER', 'PROJECT_MANAGER', 'MENTOR']),
  updateAttendance as any
);

// Leaves
router.post('/leaves/apply', authorizeRoles(['INTERN']), upload.single('document'), applyLeave as any);
router.post('/leaves/review/:leaveId', authorizeRoles(['SUPER_ADMIN', 'HR_MANAGER']), reviewLeave as any);
router.get('/leaves/my', authorizeRoles(['INTERN']), getMyLeaves as any);
router.get('/leaves/all', authorizeRoles(['SUPER_ADMIN', 'HR_MANAGER']), getAllLeaves as any);

// Certificates
router.post('/certificates/generate', authorizeRoles(['SUPER_ADMIN', 'HR_MANAGER']), generateCertificates as any);
router.get('/certificates/my', authorizeRoles(['INTERN']), getMyCertificates as any);

// Analytics
router.get(
  '/analytics/dashboard',
  authorizeRoles(['SUPER_ADMIN', 'HR_MANAGER']),
  getDashboardStats as any
);
router.get('/analytics/intern', authorizeRoles(['INTERN']), getInternStats as any);

// AI Chatbot & Feedback triggers
router.post('/chatbot/chat', authorizeRoles(['INTERN']), chatSupport as any);
router.get(
  '/chatbot/feedback/:internId',
  authorizeRoles(['SUPER_ADMIN', 'MENTOR', 'TEAM_LEADER', 'PROJECT_MANAGER']),
  triggerWeeklyFeedback as any
);
router.get(
  '/projects/:projectId/ai-advise',
  authorizeRoles(['SUPER_ADMIN', 'MENTOR', 'TEAM_LEADER', 'PROJECT_MANAGER']),
  getProjectAIAdvice as any
);

// General User Profile management (Fetch active notifications or user details)
router.get('/users/me', async (req: Request | any, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: { 
        internProfile: { include: { department: true } },
        projectMembers: { include: { project: true } }
      },
    });
    return res.json(user);
  } catch (error) {
    return res.status(500).json({ message: 'Error retrieving user details.' });
  }
});

router.get('/users/notifications', async (req: Request | any, res: Response) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user.id, isRead: false },
      orderBy: { createdAt: 'desc' },
    });
    return res.json(notifications);
  } catch (error) {
    return res.status(500).json({ message: 'Error retrieving notifications.' });
  }
});

router.post('/users/notifications/read', async (req: Request | any, res: Response) => {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.user.id, isRead: false },
      data: { isRead: true },
    });
    return res.json({ message: 'Notifications marked as read.' });
  } catch (error) {
    return res.status(500).json({ message: 'Error updating notifications.' });
  }
});

// Admin list of active users to help with assignments
router.get(
  '/users/list',
  authorizeRoles(['SUPER_ADMIN', 'HR_MANAGER', 'TEAM_LEADER', 'PROJECT_MANAGER']),
  async (req: Request, res: Response) => {
    try {
      const users = await prisma.user.findMany({
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          role: true,
          internProfile: { select: { xp: true, internId: true } },
          certificates: {
            select: { id: true, certificateType: true, serialNumber: true, issuedAt: true, pdfUrl: true },
          },
        },
      });
      return res.json(users);
    } catch (error) {
      return res.status(500).json({ message: 'Error listing users.' });
    }
  }
);

// Trigger warning check manually (Admin utility)
router.post(
  '/admin/trigger-checks',
  authorizeRoles(['SUPER_ADMIN']),
  async (req: Request, res: Response) => {
    try {
      const { checkDailyViolations, checkInactivityAndTerminate } = require('../services/automation');
      await checkDailyViolations();
      await checkInactivityAndTerminate();
      return res.json({ message: 'Warning and termination checks executed successfully.' });
    } catch (error: any) {
      return res.status(500).json({ message: 'Checks failed.', error: error.message });
    }
  }
);

// GitHub Commit Tracking
router.get(
  '/github/commits/:userId?',
  authorizeRoles(['SUPER_ADMIN', 'HR_MANAGER', 'TEAM_LEADER', 'PROJECT_MANAGER', 'MENTOR', 'INTERN']),
  fetchUserCommits as any
);

// AI Weekly Scorecards
router.post(
  '/weekly-scorecard/generate/:userId',
  authorizeRoles(['SUPER_ADMIN', 'HR_MANAGER', 'TEAM_LEADER', 'PROJECT_MANAGER', 'MENTOR']),
  generateWeeklyScorecard as any
);
router.get(
  '/weekly-scorecard/my/:userId?',
  authorizeRoles(['SUPER_ADMIN', 'HR_MANAGER', 'TEAM_LEADER', 'PROJECT_MANAGER', 'MENTOR', 'INTERN']),
  getWeeklyScorecards as any
);

// Flexible Working Hours Planner
router.post(
  '/working-hours/plan',
  authorizeRoles(['INTERN']),
  saveWorkingHoursPlan as any
);
router.get(
  '/working-hours/plan/:userId?',
  authorizeRoles(['SUPER_ADMIN', 'HR_MANAGER', 'TEAM_LEADER', 'PROJECT_MANAGER', 'MENTOR', 'INTERN']),
  getWorkingHoursPlan as any
);

// Admin Command & WFH Analytics Routes
router.get(
  '/analytics/daily-digest',
  authorizeRoles(['SUPER_ADMIN', 'HR_MANAGER', 'TEAM_LEADER', 'PROJECT_MANAGER']),
  getDailyStandupDigest as any
);
router.get(
  '/analytics/inactivity-audit',
  authorizeRoles(['SUPER_ADMIN', 'HR_MANAGER', 'TEAM_LEADER', 'PROJECT_MANAGER']),
  getInactivityAudit as any
);
router.post(
  '/analytics/award-badge',
  authorizeRoles(['SUPER_ADMIN', 'HR_MANAGER', 'TEAM_LEADER', 'PROJECT_MANAGER']),
  awardBadge as any
);

export default router;
