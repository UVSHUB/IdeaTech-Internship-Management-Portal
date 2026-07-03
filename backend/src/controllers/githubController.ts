import { Request, Response } from 'express';
import prisma from '../utils/db';

export async function fetchUserCommits(req: Request | any, res: Response) {
  try {
    const userId = req.params.userId || req.user.id;

    // Load user and github profile
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { internProfile: true },
    });

    if (!user || !user.internProfile || !user.internProfile.github) {
      return res.status(404).json({ message: 'No GitHub profile configured for this user.' });
    }

    // Extract username from github link if full URL is stored
    let githubUsername = user.internProfile.github.trim();
    if (githubUsername.includes('github.com/')) {
      githubUsername = githubUsername.split('github.com/').pop()?.split('/')[0] || githubUsername;
    }

    const githubRes = await fetch(`https://api.github.com/users/${githubUsername}/events`, {
      headers: { 'User-Agent': 'IdeaTech-Internship-Portal' },
    });

    if (!githubRes.ok) {
      console.error(`GitHub API returned status ${githubRes.status}`);
      // Return cached database commits as fallback
      const cachedCommits = await prisma.githubCommit.findMany({
        where: { userId },
        orderBy: { date: 'desc' },
        take: 15,
      });
      return res.json(cachedCommits);
    }

    const events = await githubRes.json();
    if (!Array.isArray(events)) {
      const cachedCommits = await prisma.githubCommit.findMany({
        where: { userId },
        orderBy: { date: 'desc' },
        take: 15,
      });
      return res.json(cachedCommits);
    }

    const pushEvents = events.filter((e: any) => e.type === 'PushEvent');
    
    // Register commits in DB in a non-blocking way
    for (const event of pushEvents) {
      if (event.payload?.commits) {
        for (const c of event.payload.commits) {
          try {
            await prisma.githubCommit.upsert({
              where: { sha: c.sha },
              update: {},
              create: {
                userId,
                sha: c.sha,
                message: c.message,
                htmlUrl: `https://github.com/${event.repo.name}/commit/${c.sha}`,
                date: new Date(event.created_at),
              },
            });
          } catch (upsertErr) {
            // Silence duplicate errors
          }
        }
      }
    }

    // Return the latest commits
    const latestCommits = await prisma.githubCommit.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
      take: 15,
    });

    return res.json(latestCommits);
  } catch (error: any) {
    console.error('Error fetching commits:', error);
    return res.status(500).json({ message: 'Internal server error.', error: error.message });
  }
}
