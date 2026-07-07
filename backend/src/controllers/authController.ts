import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../utils/db';
import { AuthenticatedRequest } from '../middleware/auth';
import { generateIDCardPDF } from '../services/pdf';
import { sendEmail } from '../services/mail';
import { uploadCvToSupabase } from '../utils/supabase';

const JWT_SECRET = process.env.JWT_SECRET || 'ideatech_secret_key_for_jwt_2026_itimp';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

/**
 * Handle Intern Application Form Submission (Registration)
 */
export async function registerIntern(req: Request, res: Response) {
  try {
    const {
      email,
      password,
      firstName,
      lastName,
      nic,
      dob,
      university,
      degree,
      year,
      skills,
      portfolio,
      github,
      linkedin,
      mobileNumber,
      address,
      emergencyContact,
      positionApplied,
      departmentName, // Frontend sends "Engineering", "QA", etc.
      preferredTech,
      availability,
    } = req.body;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'Email is already registered.' });
    }

    // Resolve Department or create if it doesn't exist
    let department = await prisma.department.findUnique({
      where: { name: departmentName },
    });
    if (!department) {
      department = await prisma.department.create({
        data: { name: departmentName },
      });
    }

    // Encrypt password
    const passwordHash = await bcrypt.hash(password, 10);

    // Upload CV to Supabase Storage (private bucket) before creating DB records
    let cvPath = '';
    if (req.file) {
      cvPath = await uploadCvToSupabase(req.file);
    }

    // Create User & Intern Profile (PENDING status)
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email,
          passwordHash,
          firstName,
          lastName,
          role: 'INTERN',
        },
      });

      const profile = await tx.internProfile.create({
        data: {
          userId: user.id,
          nic,
          dob: new Date(dob),
          university,
          degree,
          year: parseInt(year),
          skills,
          cvUrl: cvPath, // Storage path within the Supabase 'ITIMP CV' bucket
          portfolio,
          github,
          linkedin,
          mobileNumber,
          address,
          emergencyContact,
          positionApplied,
          departmentId: department.id,
          preferredTech,
          availability,
          status: 'PENDING',
        },
      });

      return { user, profile };
    });

    return res.status(201).json({
      message: 'Application submitted successfully! Awaiting admin approval.',
      userId: result.user.id,
    });
  } catch (error: any) {
    console.error('Error during registration:', error);
    return res.status(500).json({ message: 'Internal server error.', error: error.message });
  }
}

/**
 * User Login (All Roles)
 */
export async function login(req: Request, res: Response) {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { email },
      include: { 
        internProfile: true,
        projectMembers: { include: { project: true } }
      },
    });

    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: 'Your account has been deactivated. Please contact an administrator.' });
    }

    // If intern, check status
    if (user.role === 'INTERN' && user.internProfile) {
      if (user.internProfile.status === 'PENDING') {
        return res.status(403).json({ message: 'Your application is pending admin approval.' });
      }
      if (user.internProfile.status === 'TERMINATED') {
        return res.status(403).json({ message: 'Your internship has been terminated.' });
      }
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    // Generate JWT
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
      },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    // Track active timestamp if Intern (asynchronously without awaiting)
    if (user.role === 'INTERN' && user.internProfile) {
      prisma.internProfile.update({
        where: { id: user.internProfile.id },
        data: { lastActive: new Date() },
      }).catch(err => console.error('Failed to update lastActive:', err));
    }

    // Audit Log (asynchronously without awaiting)
    prisma.activityLog.create({
      data: {
        userId: user.id,
        action: 'LOGIN',
        details: `User logged in successfully as ${user.role}.`,
      },
    }).catch(err => console.error('Failed to create activity log:', err));

    return res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
        internProfile: user.internProfile,
        projectMembers: user.projectMembers,
      },
    });
  } catch (error) {
    console.error('Error during login:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
}

/**
 * Admin: Approve Intern Application & Generate ID
 */
export async function approveIntern(req: AuthenticatedRequest, res: Response) {
  try {
    const { profileId } = req.params;
    const { mentorId, teamLeaderId } = req.body;

    const profile = await prisma.internProfile.findUnique({
      where: { id: profileId },
      include: { user: true, department: true },
    });

    if (!profile) {
      return res.status(404).json({ message: 'Intern profile not found.' });
    }

    if (profile.status !== 'PENDING') {
      return res.status(400).json({ message: 'Intern is already processed.' });
    }

    // 1. Generate unique Intern ID (e.g. IT-2026-0001)
    const year = new Date().getFullYear();
    const prefix = `IT-${year}-`;
    const count = await prisma.internProfile.count({
      where: {
        internId: {
          startsWith: prefix,
        },
      },
    });
    const nextId = String(count + 1).padStart(4, '0');
    const internId = `${prefix}${nextId}`;

    const verificationUrl = `${FRONTEND_URL}/verify/${internId}`;

    // 2. Generate PDF ID Card
    const idCardBuffer = await generateIDCardPDF({
      name: `${profile.user.firstName} ${profile.user.lastName}`,
      internId,
      department: profile.department.name,
      position: profile.positionApplied,
      issueDate: new Date().toLocaleDateString(),
      expiryDate: new Date(new Date().setMonth(new Date().getMonth() + 6)).toLocaleDateString(), // 6 Months duration
      verificationUrl,
    });

    // Save ID Card locally in a real app (using Cloudinary or local disk for simplicity here)
    const relativeIdCardPath = `/uploads/idcards/${internId}.pdf`;

    // Write file to uploads (we can do it dynamically or in memory)
    const fs = require('fs');
    const path = require('path');
    const uploadsDir = path.join(__dirname, '../../../uploads/idcards');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    fs.writeFileSync(path.join(uploadsDir, `${internId}.pdf`), idCardBuffer);

    // 3. Update profile to ACTIVE
    await prisma.internProfile.update({
      where: { id: profileId },
      data: {
        internId,
        status: 'ACTIVE',
        idCardUrl: relativeIdCardPath,
        mentorId: mentorId || null,
        teamLeaderId: teamLeaderId || null,
      },
    });

    // 4. Create Notification
    await prisma.notification.create({
      data: {
        userId: profile.userId,
        title: '🎉 Application Approved!',
        message: `Welcome to IdeaTech! Your Intern ID is ${internId}. You can now download your digital ID card in your dashboard.`,
        type: 'INFO',
      },
    });

    // 5. Send Welcome Email
    await sendEmail({
      to: profile.user.email,
      subject: `🎉 Application Approved & Welcome to IdeaTech! ID: ${internId}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
          <h2 style="color: #3b82f6; text-align: center;">Welcome to IdeaTech (PVT) LTD!</h2>
          <p>Dear ${profile.user.firstName},</p>
          <p>We are thrilled to inform you that your application for the position of <strong>${profile.positionApplied}</strong> in the <strong>${profile.department.name}</strong> Department has been <strong>approved</strong>!</p>
          <div style="background: linear-gradient(135deg, #3b82f6 0%, #a855f7 100%); color: white; padding: 20, 15px; border-radius: 6px; margin: 20px 0; text-align: center;">
            <span style="font-size: 14px;">YOUR ASSIGNED INTERN ID</span><br/>
            <strong style="font-size: 24px; letter-spacing: 2px;">${internId}</strong>
          </div>
          <p>Your portal account is now active. You can log in with your email and password to access your dashboard, record daily attendance, log reports, and download your Digital ID Card.</p>
          <p>Please review our work from home policies on the portal to avoid automated warning escalations.</p>
          <br/>
          <p>Best regards,<br/><strong>IdeaTech HR Team</strong></p>
        </div>
      `,
    });

    // Audit Log
    await prisma.activityLog.create({
      data: {
        userId: req.user!.id,
        action: 'APPROVE_INTERN',
        details: `Approved intern ${profile.user.firstName} ${profile.user.lastName}. Intern ID ${internId} generated.`,
      },
    });

    return res.json({
      message: 'Intern application approved successfully!',
      internId,
      idCardUrl: relativeIdCardPath,
    });
  } catch (error: any) {
    console.error('Approval error:', error);
    return res.status(500).json({ message: 'Internal server error.', error: error.message });
  }
}

/**
 * Admin: Reject Intern Application
 */
export async function rejectIntern(req: AuthenticatedRequest, res: Response) {
  try {
    const { profileId } = req.params;

    const profile = await prisma.internProfile.findUnique({
      where: { id: profileId },
      include: { user: true },
    });

    if (!profile) {
      return res.status(404).json({ message: 'Intern profile not found.' });
    }

    if (profile.status !== 'PENDING') {
      return res.status(400).json({ message: 'Intern is already processed.' });
    }

    // Delete User and Profile or mark as Terminated/Rejected. Deleting is simpler for mock applications
    await prisma.$transaction(async (tx) => {
      await tx.internProfile.delete({ where: { id: profileId } });
      await tx.user.delete({ where: { id: profile.userId } });
    });

    // Send Rejection Email
    await sendEmail({
      to: profile.user.email,
      subject: `IdeaTech Application Status Update`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
          <h2>Application Review Update</h2>
          <p>Dear ${profile.user.firstName},</p>
          <p>Thank you for your interest in the internship program at <strong>IdeaTech (PVT) LTD</strong>.</p>
          <p>After careful review of your application and profile details, we regret to inform you that we will not be moving forward with your application at this time.</p>
          <p>We appreciate the time you took to apply and wish you the best in your future academic and professional endeavors.</p>
          <br/>
          <p>Best regards,<br/><strong>IdeaTech HR Team</strong></p>
        </div>
      `,
    });

    return res.json({ message: 'Intern application rejected and removed.' });
  } catch (error: any) {
    console.error('Rejection error:', error);
    return res.status(500).json({ message: 'Internal server error.', error: error.message });
  }
}

/**
 * Admin: Register Staff Member (Team Lead, PM, Mentor)
 */
export async function registerStaff(req: Request, res: Response) {
  try {
    const { email, password, firstName, lastName, role } = req.body;

    if (!['TEAM_LEADER', 'PROJECT_MANAGER', 'MENTOR', 'HR_MANAGER'].includes(role)) {
      return res.status(400).json({ message: 'Invalid staff role specified.' });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'Email is already registered.' });
    }

    const bcrypt = require('bcryptjs');
    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        firstName,
        lastName,
        role: role as any,
      },
    });

    return res.status(201).json({
      message: `${role.replace('_', ' ')} registered successfully!`,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    });
  } catch (error: any) {
    console.error('Register staff error:', error);
    return res.status(500).json({ message: 'Internal server error.', error: error.message });
  }
}

const STAFF_ROLES = ['SUPER_ADMIN', 'HR_MANAGER', 'TEAM_LEADER', 'PROJECT_MANAGER', 'MENTOR'];

/**
 * Super Admin: Change a staff member's role
 */
export async function updateUserRole(req: AuthenticatedRequest, res: Response) {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    if (!STAFF_ROLES.includes(role)) {
      return res.status(400).json({ message: 'Invalid staff role specified.' });
    }

    const target = await prisma.user.findUnique({ where: { id: userId } });
    if (!target) {
      return res.status(404).json({ message: 'User not found.' });
    }
    if (target.role === 'INTERN' || !STAFF_ROLES.includes(target.role)) {
      return res.status(400).json({ message: 'This endpoint only manages staff accounts.' });
    }
    if (target.id === req.user!.id) {
      return res.status(400).json({ message: 'You cannot change your own role.' });
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { role },
    });

    return res.json({
      message: `Role updated to ${role.replace('_', ' ')} successfully.`,
      user: { id: updated.id, role: updated.role },
    });
  } catch (error: any) {
    console.error('Update user role error:', error);
    return res.status(500).json({ message: 'Internal server error.', error: error.message });
  }
}

/**
 * Super Admin: Activate or deactivate a staff member's account
 */
export async function updateUserStatus(req: AuthenticatedRequest, res: Response) {
  try {
    const { userId } = req.params;
    const { isActive } = req.body;

    if (typeof isActive !== 'boolean') {
      return res.status(400).json({ message: 'isActive must be a boolean.' });
    }

    const target = await prisma.user.findUnique({ where: { id: userId } });
    if (!target) {
      return res.status(404).json({ message: 'User not found.' });
    }
    if (target.id === req.user!.id) {
      return res.status(400).json({ message: 'You cannot change your own account status.' });
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { isActive },
    });

    return res.json({
      message: `Account ${isActive ? 'activated' : 'deactivated'} successfully.`,
      user: { id: updated.id, isActive: updated.isActive },
    });
  } catch (error: any) {
    console.error('Update user status error:', error);
    return res.status(500).json({ message: 'Internal server error.', error: error.message });
  }
}
