import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding MongoDB database...');

  // Hash default password
  const defaultPasswordHash = await bcrypt.hash('password123', 10);

  // 1. Create Departments
  const engDept = await prisma.department.upsert({
    where: { name: 'Engineering' },
    update: {},
    create: { 
      id: '60d5ec49f30f513904a43e51', 
      name: 'Engineering' 
    },
  });

  const qaDept = await prisma.department.upsert({
    where: { name: 'Quality Assurance' },
    update: {},
    create: { 
      id: '60d5ec49f30f513904a43e52', 
      name: 'Quality Assurance' 
    },
  });

  const designDept = await prisma.department.upsert({
    where: { name: 'UI/UX Design' },
    update: {},
    create: { 
      id: '60d5ec49f30f513904a43e53', 
      name: 'UI/UX Design' 
    },
  });

  console.log('Created departments.');

  // 2. Create Users
  // Super Admin
  const admin = await prisma.user.upsert({
    where: { email: 'admin@ideatech.lk' },
    update: {},
    create: {
      id: '60d5ec49f30f513904a43e61',
      email: 'admin@ideatech.lk',
      passwordHash: defaultPasswordHash,
      firstName: 'Samantha',
      lastName: 'Perera',
      role: 'SUPER_ADMIN',
    },
  });

  // HR Manager
  const hr = await prisma.user.upsert({
    where: { email: 'hr@ideatech.lk' },
    update: {},
    create: {
      id: '60d5ec49f30f513904a43e62',
      email: 'hr@ideatech.lk',
      passwordHash: defaultPasswordHash,
      firstName: 'Dilani',
      lastName: 'Silva',
      role: 'HR_MANAGER',
    },
  });

  // Team Leader
  const tl = await prisma.user.upsert({
    where: { email: 'tl@ideatech.lk' },
    update: {},
    create: {
      id: '60d5ec49f30f513904a43e63',
      email: 'tl@ideatech.lk',
      passwordHash: defaultPasswordHash,
      firstName: 'Roshan',
      lastName: 'Fernando',
      role: 'TEAM_LEADER',
    },
  });

  // Mentor
  const mentor = await prisma.user.upsert({
    where: { email: 'mentor@ideatech.lk' },
    update: {},
    create: {
      id: '60d5ec49f30f513904a43e64',
      email: 'mentor@ideatech.lk',
      passwordHash: defaultPasswordHash,
      firstName: 'Kasun',
      lastName: 'Jayawardena',
      role: 'MENTOR',
    },
  });

  console.log('Created admin, hr, tl, mentor users.');

  // Active Intern
  const activeInternUser = await prisma.user.upsert({
    where: { email: 'intern@ideatech.lk' },
    update: {},
    create: {
      id: '60d5ec49f30f513904a43e65',
      email: 'intern@ideatech.lk',
      passwordHash: defaultPasswordHash,
      firstName: 'Lahiru',
      lastName: 'Bandara',
      role: 'INTERN',
    },
  });

  // Intern Profile
  const activeInternProfile = await prisma.internProfile.upsert({
    where: { userId: activeInternUser.id },
    update: {},
    create: {
      id: '60d5ec49f30f513904a43f01',
      userId: activeInternUser.id,
      internId: 'IT-2026-0001',
      nic: '200112345678',
      dob: new Date('2001-05-15'),
      university: 'University of Moratuwa',
      degree: 'B.Sc. Eng Hons (Computer Science & Engineering)',
      year: 3,
      skills: 'React, Node.js, TypeScript, PostgreSQL, Git',
      cvUrl: '/uploads/cv/sample-cv.pdf',
      portfolio: 'https://lahiru.dev',
      github: 'https://github.com/lahiru-b',
      linkedin: 'https://linkedin.com/in/lahiru-b',
      mobileNumber: '+94771234567',
      address: 'No 45, Temple Road, Maharagama',
      emergencyContact: '+94719876543 (Father)',
      positionApplied: 'Full Stack Developer',
      departmentId: engDept.id,
      preferredTech: 'Next.js & Express',
      availability: 'Immediate (Full-Time)',
      status: 'ACTIVE',
      level: 1,
      xp: 45,
      streak: 3,
      completionProgress: 15.5,
      remainingDays: 142,
      mentorId: mentor.id,
      teamLeaderId: tl.id,
    },
  });

  // Pending Candidate
  const candidateUser = await prisma.user.upsert({
    where: { email: 'candidate@ideatech.lk' },
    update: {},
    create: {
      id: '60d5ec49f30f513904a43e66',
      email: 'candidate@ideatech.lk',
      passwordHash: defaultPasswordHash,
      firstName: 'Priya',
      lastName: 'Ramanathan',
      role: 'INTERN',
    },
  });

  await prisma.internProfile.upsert({
    where: { userId: candidateUser.id },
    update: {},
    create: {
      id: '60d5ec49f30f513904a43f02',
      userId: candidateUser.id,
      nic: '200287654321',
      dob: new Date('2002-09-20'),
      university: 'University of Kelaniya',
      degree: 'Bachelor of Software Engineering',
      year: 2,
      skills: 'Python, Django, JavaScript',
      cvUrl: '/uploads/cv/priya-cv.pdf',
      positionApplied: 'Backend Developer Intern',
      departmentId: engDept.id,
      preferredTech: 'Node.js',
      availability: 'August 2026',
      status: 'PENDING',
    },
  });

  console.log('Created active and pending interns.');

  // 3. Create Sample Project
  const project = await prisma.project.upsert({
    where: { name: 'IdeaTech Core Portal Development' },
    update: {},
    create: {
      id: '60d5ec49f30f513904a43e71',
      name: 'IdeaTech Core Portal Development',
      description: 'Building the state-of-the-art internship portal dashboard.',
      githubUrl: 'https://github.com/ideatech-pvt/itimp',
      status: 'Active',
    },
  });

  // Assign project members
  await prisma.projectMember.upsert({
    where: { projectId_userId: { projectId: project.id, userId: activeInternUser.id } },
    update: {},
    create: {
      projectId: project.id,
      userId: activeInternUser.id,
    },
  });

  await prisma.projectMember.upsert({
    where: { projectId_userId: { projectId: project.id, userId: tl.id } },
    update: {},
    create: {
      projectId: project.id,
      userId: tl.id,
    },
  });

  console.log('Created project and assigned members.');

  // 4. Create Sample Tasks
  await prisma.task.create({
    data: {
      title: 'Design Dashboard Layout',
      description: 'Create Figma mockup and write Next.js tailwind setup for dashboard.',
      priority: 'HIGH',
      status: 'COMPLETED',
      dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      progress: 100,
      projectId: project.id,
      assigneeId: activeInternUser.id,
      createdById: tl.id,
    },
  });

  await prisma.task.create({
    data: {
      title: 'Integrate Prisma Schema',
      description: 'Write models for attendance, warnings, and logbooks, and map relationships.',
      priority: 'MEDIUM',
      status: 'WORKING',
      dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      progress: 50,
      projectId: project.id,
      assigneeId: activeInternUser.id,
      createdById: tl.id,
    },
  });

  await prisma.task.create({
    data: {
      title: 'Setup Automated Warnings cron',
      description: 'Configure daily checks for missing reports or checkouts.',
      priority: 'LOW',
      status: 'PENDING',
      dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      progress: 0,
      projectId: project.id,
      assigneeId: activeInternUser.id,
      createdById: tl.id,
    },
  });

  console.log('Created tasks.');

  // 5. Create Sample Attendance records
  const checkInTime = new Date();
  checkInTime.setDate(checkInTime.getDate() - 1);
  checkInTime.setHours(9, 5, 0); // 9:05 AM yesterday

  const checkOutTime = new Date(checkInTime);
  checkOutTime.setHours(17, 30, 0); // 5:30 PM yesterday

  await prisma.attendance.create({
    data: {
      userId: activeInternUser.id,
      date: new Date(checkInTime.getFullYear(), checkInTime.getMonth(), checkInTime.getDate()),
      checkIn: checkInTime,
      checkOut: checkOutTime,
      workingHours: 8.42,
      status: 'PRESENT',
    },
  }).catch(() => {});

  console.log('Created sample attendance history.');

  console.log('🎉 MongoDB Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
