import { Router } from 'express';
import { supabase } from '../utils/db';

const router = Router();

// GET /api/stats — public, no auth required
router.get('/', async (req, res) => {
  try {
    const [usersResult, analysesResult] = await Promise.all([
      supabase.from('users').select('*', { count: 'exact', head: true }),
      supabase.from('resume_analyses').select('*', { count: 'exact', head: true }),
    ]);

    if (usersResult.error) throw usersResult.error;
    if (analysesResult.error) throw analysesResult.error;

    res.json({
      registeredUsers: usersResult.count ?? 0,
      resumeAnalyses:  analysesResult.count ?? 0,
    });
  } catch (error: any) {
    console.error('Stats error:', error);
    res.status(500).json({ error: 'Could not fetch stats' });
  }
});

export default router;
