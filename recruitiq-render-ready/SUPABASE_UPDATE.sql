-- ============================================================
-- Run this in Supabase SQL Editor to add v2 columns
-- Go to: supabase.com → SQL Editor → New Query → Paste → Run
-- ============================================================

ALTER TABLE resume_analyses ADD COLUMN IF NOT EXISTS interview_questions JSONB DEFAULT '[]';
ALTER TABLE resume_analyses ADD COLUMN IF NOT EXISTS career_roadmap JSONB;
ALTER TABLE resume_analyses ADD COLUMN IF NOT EXISTS deep_score JSONB;
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

SELECT 'RecruitIQ v2 columns added ✅' as result;
