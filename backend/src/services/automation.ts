import prisma from '../utils/db';
import { sendEmail } from './mail';
import { generateCertificatePDF } from './pdf';

/**
 * Automate warnings and termination checking.
 * Can be triggered via cron or as an administrative hook.
 */

// Rules:
// 1. Missing attendance on a weekday -> Warning
// 2. Missing daily report -> Warning
// 3. Missing logbook entry -> Warning
// 4. Inactive for 5 consecutive days -> Suspension & Auto-termination

export async function checkDailyViolations() {
  console.log('🤖 Running Automated Warning Checks...');
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  
  // Skip weekends for daily warning checks
  const day = yesterday.getDay();
  if (day === 0 || day === 6) {
    console.log('Skipping weekend daily warning checks.');
    return;
  }

  // Normalize yesterday date to midnight
  const targetDate = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());

  // Get all active interns
  const interns = await prisma.internProfile.findMany({
    where: { status: { in: ['ACTIVE', 'WARNING'] } },
    include: { user: true },
  });

  for (const intern of interns) {
    const userId = intern.userId;
    const warningsToApply: Array<{ type: string; reason: string }> = [];

    // 1. Check Attendance
    const attendance = await prisma.attendance.findFirst({
      where: {
        userId,
        date: targetDate,
      },
    });
    if (!attendance || attendance.status === 'ABSENT') {
      warningsToApply.push({
        type: 'NO_ATTENDANCE',
        reason: `Missing check-in on ${targetDate.toLocaleDateString()}`,
      });
    }

    // 2. Check Daily Report
    const report = await prisma.dailyReport.findFirst({
      where: {
        userId,
        date: targetDate,
      },
    });
    if (!report) {
      warningsToApply.push({
        type: 'NO_DAILY_REPORT',
        reason: `Missing daily report submission on ${targetDate.toLocaleDateString()}`,
      });
    }

    // 3. Check Logbook
    const logbook = await prisma.logbook.findFirst({
      where: {
        userId,
        date: targetDate,
      },
    });
    if (!logbook) {
      warningsToApply.push({
        type: 'NO_LOGBOOK',
        reason: `Missing logbook logging on ${targetDate.toLocaleDateString()}`,
      });
    }

    // Apply warnings & notify
    for (const warn of warningsToApply) {
      await prisma.warning.create({
        data: {
          userId,
          type: warn.type,
          reason: warn.reason,
        },
      });

      // Increment warning count in profile
      await prisma.internProfile.update({
        where: { id: intern.id },
        data: {
          warningCount: { increment: 1 },
          status: 'WARNING',
        },
      });

      // Send Warning Notification
      await prisma.notification.create({
        data: {
          userId,
          title: `⚠️ Rule Violation Warning: ${warn.type}`,
          message: warn.reason,
          type: 'WARNING',
        },
      });

      // Send email
      await sendEmail({
        to: intern.user.email,
        subject: `⚠️ Warning Alert: Rule Violation at IdeaTech Portal`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
            <h2 style="color: #e53e3e; text-align: center;">Rule Violation Warning</h2>
            <p>Dear ${intern.user.firstName},</p>
            <p>This email is to notify you that the system has registered a rule violation on your internship profile.</p>
            <div style="background-color: #fffaf0; border-left: 4px solid #dd6b20; padding: 15px; margin: 20px 0;">
              <strong>Violation Type:</strong> ${warn.type}<br/>
              <strong>Reason:</strong> ${warn.reason}
            </div>
            <p>Each violation increases your warning count. If you accumulate multiple warnings or remain inactive for 5 consecutive days, the system will automatically suspend your account and issue a termination notice.</p>
            <p>Please log in to your dashboard to resolve this blocker or contact your Mentor immediately.</p>
            <br/>
            <p>Best Regards,<br/><strong>IdeaTech HR Automation System</strong></p>
          </div>
        `,
      });
    }
  }

  console.log(`Automated warning check finished. Processed ${interns.length} interns.`);
}

export async function checkInactivityAndTerminate() {
  console.log('🤖 Running Automated Termination Checks...');
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - 5); // 5 days ago

  // Get active/warning interns
  const interns = await prisma.internProfile.findMany({
    where: { status: { in: ['ACTIVE', 'WARNING'] } },
    include: { user: true },
  });

  for (const intern of interns) {
    const userId = intern.userId;

    // Check if there was any checkin, report, or logbook entry in the last 5 days
    const lastAttendance = await prisma.attendance.findFirst({
      where: { userId, date: { gte: cutoffDate } },
      orderBy: { date: 'desc' },
    });

    const lastReport = await prisma.dailyReport.findFirst({
      where: { userId, date: { gte: cutoffDate } },
      orderBy: { date: 'desc' },
    });

    const lastLogbook = await prisma.logbook.findFirst({
      where: { userId, date: { gte: cutoffDate } },
      orderBy: { date: 'desc' },
    });

    // Check last active field
    const lastActiveDate = intern.lastActive;

    const isActiveRecently = 
      (lastAttendance && lastAttendance.checkIn >= cutoffDate) ||
      (lastReport && lastReport.createdAt >= cutoffDate) ||
      (lastLogbook && lastLogbook.createdAt >= cutoffDate) ||
      (lastActiveDate >= cutoffDate);

    if (!isActiveRecently) {
      // INACTIVE FOR 5 DAYS -> AUTO TERMINATE
      console.log(`🚨 Intern ${intern.internId} (${intern.user.firstName}) has been inactive for 5 days. Terminating...`);

      // Update Intern Status & User status
      await prisma.internProfile.update({
        where: { id: intern.id },
        data: {
          status: 'TERMINATED',
        },
      });

      // Log Warning
      await prisma.warning.create({
        data: {
          userId,
          type: 'AUTO_TERMINATION',
          reason: 'Inactive for 5 consecutive days without attendance, daily reports, or logbook updates.',
        },
      });

      // Audit Log
      await prisma.activityLog.create({
        data: {
          userId,
          action: 'AUTO_TERMINATION',
          details: 'System automatically terminated internship due to 5 days inactivity.',
        },
      });

      // Create System Notification
      await prisma.notification.create({
        data: {
          userId,
          title: '🚨 Internship Terminated',
          message: 'Your internship has been suspended and terminated due to 5 days of absolute inactivity.',
          type: 'WARNING',
        },
      });

      // Get HR managers to notify
      const hrManagers = await prisma.user.findMany({
        where: { role: 'HR_MANAGER' },
      });

      for (const hr of hrManagers) {
        await prisma.notification.create({
          data: {
            userId: hr.id,
            title: `🚨 Auto-Termination: ${intern.user.firstName} ${intern.user.lastName}`,
            message: `Intern ${intern.internId} has been auto-terminated due to 5 days of inactivity.`,
            type: 'WARNING',
          },
        });
      }

      // Send Email to Intern
      await sendEmail({
        to: intern.user.email,
        subject: `🚨 NOTICE OF TERMINATION - IdeaTech (PVT) LTD`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
            <h2 style="color: #e53e3e; text-align: center;">Official Notification of Internship Termination</h2>
            <p>Dear ${intern.user.firstName} ${intern.user.lastName},</p>
            <p>We regret to inform you that your internship at <strong>IdeaTech (PVT) LTD</strong> has been terminated, effective immediately.</p>
            <div style="background-color: #fff5f5; border-left: 4px solid #e53e3e; padding: 15px; margin: 20px 0;">
              <strong>Reason:</strong> Inactive for 5 consecutive days. The system registered no activity, daily reports, logbook records, or attendance logs during this period.
            </div>
            <p>Under our remote work guidelines, daily reporting is a mandatory condition of this internship. As you have failed to maintain communications and record submissions for 5 days, your portal account has been suspended.</p>
            <p>A formal termination letter has been filed in your portal records. If you have extreme extenuating circumstances, you may appeal this decision by contacting the HR department at <a href="mailto:hr@ideatech.lk">hr@ideatech.lk</a> within 3 working days.</p>
            <br/>
            <p>Sincerely,<br/><strong>IdeaTech HR Administration Department</strong></p>
          </div>
        `,
      });
    }
  }

  console.log('Automated termination check finished.');
}
