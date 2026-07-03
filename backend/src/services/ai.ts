
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const MODEL_NAME = 'gemini-1.5-flash';

async function callGemini(prompt: string): Promise<string> {
  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not defined');
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${GEMINI_API_KEY}`;
  try {
    const response = await global.fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }]
          }
        ]
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Gemini API error: ${response.status} - ${errText}`);
    }

    const data: any = await response.json();
    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!generatedText) {
      throw new Error('Empty response from Gemini API');
    }

    return generatedText;
  } catch (error) {
    console.error('Error calling Gemini API:', error);
    throw error;
  }
}

/**
 * Generate weekly feedback for an intern
 */
export async function generateWeeklyFeedback(
  internName: string,
  reports: Array<{ completedWork: string; problemsFaced: string; hoursWorked: number }>,
  tasks: Array<{ title: string; status: string }>
): Promise<string> {
  const reportsSummary = reports
    .map((r, i) => `Day ${i + 1}: Hours Worked: ${r.hoursWorked}. Completed: ${r.completedWork}. Blockers: ${r.problemsFaced}`)
    .join('\n');
  const tasksSummary = tasks
    .map(t => `- Task: ${t.title} (${t.status})`)
    .join('\n');

  const prompt = `You are a Senior Technical Mentor at IdeaTech (PVT) LTD. Write a constructive, encouraging, and professional weekly performance review for an intern named ${internName}.
  Here is their log for this week:
  
  [DAILY REPORTS LOG]
  ${reportsSummary || 'No daily reports submitted this week.'}
  
  [TASKS STATUS]
  ${tasksSummary || 'No tasks assigned or worked on this week.'}
  
  Please provide:
  1. Technical Commendations (what they did well).
  2. Areas of Improvement (e.g. time management, code quality, addressing blockers).
  3. Actionable Next Steps.
  Keep it in structured Markdown format, under 200 words. Keep a modern, inspiring, and professional tone.`;

  try {
    if (GEMINI_API_KEY) {
      return await callGemini(prompt);
    }
  } catch (err) {
    console.warn('Falling back to rule-based weekly feedback due to Gemini API failure or absence.');
  }

  // Fallback Rule-Based Feedback
  const completedCount = tasks.filter(t => t.status === 'COMPLETED').length;
  const pendingCount = tasks.length - completedCount;
  return `### Weekly Performance Review: ${internName}
  
**Technical Commendations:**
- Great progress shown on tasks. Completed **${completedCount}** task(s) successfully this week.
- Consistently logging working hours. Average logged daily effort is **${reports.length ? (reports.reduce((acc, r) => acc + r.hoursWorked, 0) / reports.length).toFixed(1) : 0} hours**.

**Areas of Improvement:**
- Be proactive about documenting details of blockers/problems in your daily reports.
- Ensure that Git commits and demo links are updated regularly for reviewer inspection.

**Actionable Next Steps:**
- Follow up with your assigned mentor to clear any outstanding questions.
- Maintain your current learning streak and update your digital logbook daily.`;
}

/**
 * AI Performance scoring & skills insights
 */
export async function analyzePerformanceInsights(
  internName: string,
  stats: {
    attendanceRate: number;
    reportSubmissionRate: number;
    taskCompletionRate: number;
    avgHoursWorked: number;
    warningCount: number;
  }
): Promise<{ score: number; feedback: string; recommendation: string }> {
  // Base calculation
  let score = Math.round(
    stats.attendanceRate * 0.2 +
    stats.reportSubmissionRate * 0.3 +
    stats.taskCompletionRate * 0.3 +
    (Math.min(stats.avgHoursWorked, 8) / 8) * 20
  );
  
  // Warning penalties
  score = Math.max(0, score - stats.warningCount * 10);

  const prompt = `Analyze the following performance statistics of intern ${internName}:
  - Attendance Rate: ${stats.attendanceRate}%
  - Report Submission Rate: ${stats.reportSubmissionRate}%
  - Task Completion Rate: ${stats.taskCompletionRate}%
  - Avg Daily Working Hours: ${stats.avgHoursWorked}
  - Active Warnings: ${stats.warningCount}
  
  Based on this, generate a performance score between 0 and 100 (where the base calculated is ${score}), a brief 2-sentence summary feedback, and a short 1-sentence development recommendation. Return it in JSON format exactly like:
  {
    "score": <number>,
    "feedback": "<text>",
    "recommendation": "<text>"
  }`;

  try {
    if (GEMINI_API_KEY) {
      const response = await callGemini(prompt);
      // Attempt to parse JSON from Markdown code blocks
      const cleanJson = response.replace(/```json/g, '').replace(/```/g, '').trim();
      return JSON.parse(cleanJson);
    }
  } catch (err) {
    console.warn('Falling back to rule-based performance analysis due to Gemini API failure or absence.');
  }

  let feedback = `Intern shows high discipline with ${stats.attendanceRate}% attendance. Daily reports are logged regularly.`;
  let recommendation = `Keep up the great work and focus on building advanced projects next.`;

  if (score < 50) {
    feedback = `Performance is critically low (score: ${score}/100) due to low task completion (${stats.taskCompletionRate}%) and warnings.`;
    recommendation = `Immediately schedule a sync with your Mentor to resolve blockers and avoid auto-termination rules.`;
  } else if (score < 75) {
    feedback = `Performance is moderate. Daily report submission is at ${stats.reportSubmissionRate}%, which can be improved.`;
    recommendation = `Focus on consistent logging of daily activities and meeting task deadlines.`;
  }

  return { score, feedback, recommendation };
}

/**
 * Intern Support Chatbot
 */
export async function getChatbotResponse(
  message: string,
  internDetails: { name: string; level: number; department: string; status: string }
): Promise<string> {
  const prompt = `You are "IdeaTech Assistant" (ITA), an AI support assistant for remote interns at IdeaTech (PVT) LTD.
  You are chatting with ${internDetails.name}, a Level ${internDetails.level} Intern in the ${internDetails.department} Department.
  Their status is currently "${internDetails.status}".
  
  Answer their query professionally and helpfully in 1-2 paragraphs. Keep rules in mind:
  - Interns must submit daily reports before midnight.
  - Leaves must be requested in advance.
  - Inactivity of 5 consecutive days triggers auto-termination.
  - In case of emergencies, contact HR Manager.
  
  Intern query: "${message}"`;

  try {
    if (GEMINI_API_KEY) {
      return await callGemini(prompt);
    }
  } catch (err) {
    console.warn('Falling back to rule-based chatbot due to Gemini API failure or absence.');
  }

  // Fallback chatbot rules
  const lowercaseMsg = message.toLowerCase();
  if (lowercaseMsg.includes('report') || lowercaseMsg.includes('logbook')) {
    return `Hi ${internDetails.name}, as a reminder, daily reports and digital logbooks must be submitted by midnight each working day. If you face any blockers, please outline them clearly so your Mentor can guide you.`;
  }
  if (lowercaseMsg.includes('leave') || lowercaseMsg.includes('vacation') || lowercaseMsg.includes('medical')) {
    return `To request a leave, please navigate to the "Leave Requests" section in your portal. You can choose the reason (Medical, Exam, Personal) and upload the supporting documents. HR will review it and notify you.`;
  }
  if (lowercaseMsg.includes('terminate') || lowercaseMsg.includes('warning') || lowercaseMsg.includes('suspend')) {
    return `IdeaTech rules enforce automated warnings for missing attendance or reports. If an account is inactive for 5 consecutive days, it is suspended and a termination process is initiated. If you've received warnings by mistake, please contact HR.`;
  }
  if (lowercaseMsg.includes('level') || lowercaseMsg.includes('xp') || lowercaseMsg.includes('badge')) {
    return `You are currently Level ${internDetails.level}. You earn XP by checking in daily, submitting reports, completing tasks on time, and attending meetings. Graduating to higher levels unlocks senior roles and badges!`;
  }

  return `Hello ${internDetails.name}! I am the IdeaTech Assistant. How can I help you today? You can ask me about attendance rules, daily reports, task deadlines, levels/XP, or leave requests.`;
}

/**
 * AI Project Health & Sprint advice
 */
export async function analyzeProjectSprint(
  projectName: string,
  projectDesc: string,
  members: Array<{ name: string; role: string }>,
  tasks: Array<{ title: string; priority: string; status: string; assigneeName: string }>
): Promise<string> {
  const membersSummary = members.map(m => `- ${m.name} (${m.role})`).join('\n');
  const tasksSummary = tasks.map(t => `- Task: ${t.title} [Priority: ${t.priority}, Status: ${t.status}, Assigned to: ${t.assigneeName}]`).join('\n');

  const prompt = `You are a Senior Project Manager and Agile Coach at IdeaTech (PVT) LTD.
  Analyze the current progress of this Work-from-Home intern project:
  
  [PROJECT DETAILS]
  Name: ${projectName}
  Description: ${projectDesc || 'No description supplied.'}
  
  [TEAM MEMBERS]
  ${membersSummary || 'No members assigned.'}
  
  [TASKS IN SPRINT]
  ${tasksSummary || 'No tasks assigned.'}
  
  Please provide:
  1. Sprint Health Score (out of 100) and brief status.
  2. Potential Risks (e.g. bottleneck members, high priority tasks pending, communication gap).
  3. Actionable Recommendations for the team to complete this sprint successfully while working from home.
  
  Format in clean, professional Markdown. Limit to 200 words. Tone should be expert, constructive, and motivating.`;

  try {
    if (GEMINI_API_KEY) {
      return await callGemini(prompt);
    }
  } catch (err) {
    console.warn('Falling back to rule-based project sprint advice due to Gemini API failure or absence.');
  }

  // Fallback Rule-Based Sprint Review
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'COMPLETED').length;
  const completionRate = totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return `### AI Project Sprint Review: ${projectName}
  
**Sprint Health Score:** **${completionRate}%** (Based on tasks completed: ${completedTasks}/${totalTasks})

**Potential Risks:**
- Working-from-home communication issues might delay outstanding tasks.
- Ensure that high-priority items are unblocked by mentors.

**Actionable Recommendations:**
- Schedule a short daily standup on Google Meet to sync on task progress.
- Make sure completed tasks are committed to the GitHub repository and reviewed quickly.`;
}

export async function summarizeDailyStandups(
  reports: Array<{ internName: string; completedWork: string; problemsFaced: string; hoursWorked: number }>
): Promise<string> {
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  const summaryInput = reports
    .map(r => `- Intern: ${r.internName} (${r.hoursWorked} hrs). Completed: ${r.completedWork}. Blockers: ${r.problemsFaced || 'None'}`)
    .join('\n');

  const prompt = `You are a Senior engineering manager. Generate a concise, bulleted daily standup digest for the WFH team based on today's reports:
  
  ${summaryInput || 'No daily reports submitted today.'}
  
  Provide:
  1. Key Accomplishments (executive high-level overview).
  2. Priority Alerts & Blockers (list names and specific impediments to resolve).
  3. Overall Project Status.
  
  Keep it clean, in markdown formatting, and under 200 words.`;

  try {
    if (GEMINI_API_KEY) {
      return await callGemini(prompt);
    }
  } catch (err) {
    console.warn('AI Daily standup digest fallback triggered.');
  }

  return `### Daily Standup Summary (Rule-Based Fallback)
  
**Key Accomplishments:**
- Active progress logged by **${reports.length}** interns today.
- Cumulative WFH effort today is **${reports.reduce((acc, r) => acc + r.hoursWorked, 0)} hours**.

**Priority Alerts & Blockers:**
${reports.filter(r => r.problemsFaced && r.problemsFaced.toLowerCase() !== 'none').map(r => `- **${r.internName}**: ${r.problemsFaced}`).join('\n') || '- No blockers logged today.'}

**Overall Project Status:**
- Team is actively developing milestones. Ensure blocker requests are unblocked by team leaders.`;
}
