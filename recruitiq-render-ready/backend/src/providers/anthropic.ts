import { GoogleGenerativeAI } from '@google/generative-ai';
import { AnalysisResult, JobMatchResult } from '../types';

if (!process.env.GEMINI_API_KEY) {
  console.warn('⚠️  GEMINI_API_KEY is not set in .env');
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export interface AIProvider {
  analyzeResume(resumeText: string): Promise<AnalysisResult>;
  matchResumeToJob(
    resumeText: string,
    jobDescription: string
  ): Promise<JobMatchResult>;
  generateInterviewQuestions(
    resumeText: string,
    jobDescription: string,
    count: number
  ): Promise<any[]>;
  generateCareerRoadmap(
    resumeText: string,
    targetRole: string
  ): Promise<any>;
  generateResumeScore(resumeText: string): Promise<any>;
}

/*
 * Gemini model fallback list.
 *
 * GEMINI_MODEL in .env will be tried first.
 * If it fails, the models below are tried in order.
 */
const MODELS = [
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
];

/*
 * Repair truncated JSON by closing open brackets.
 */
const repairJSON = (text: string): string => {
  let s = text.trim().replace(/,\s*$/, '');

  const opens: string[] = [];
  let inString = false;
  let escape = false;

  for (const ch of s) {
    if (escape) {
      escape = false;
      continue;
    }

    if (ch === '\\' && inString) {
      escape = true;
      continue;
    }

    if (ch === '"') {
      inString = !inString;
      continue;
    }

    if (inString) continue;

    if (ch === '{') {
      opens.push('}');
    } else if (ch === '[') {
      opens.push(']');
    } else if (ch === '}' || ch === ']') {
      opens.pop();
    }
  }

  if (inString) {
    s += '"';
  }

  for (const close of opens.reverse()) {
    s += close;
  }

  return s;
};

/*
 * Safely extract JSON from Gemini output.
 */
const cleanJSON = (text: string): string => {
  let cleaned = text
    .replace(/```json\s*/gi, '')
    .replace(/```\s*/g, '')
    .trim();

  const firstObject = cleaned.indexOf('{');
  const firstArray = cleaned.indexOf('[');

  let start = -1;

  if (firstObject === -1) {
    start = firstArray;
  } else if (firstArray === -1) {
    start = firstObject;
  } else {
    start = Math.min(firstObject, firstArray);
  }

  if (start > 0) {
    cleaned = cleaned.substring(start);
  }

  return cleaned.trim();
};

/*
 * Call Gemini with automatic model fallback.
 */
const callGemini = async (prompt: string): Promise<string> => {
  const override = process.env.GEMINI_MODEL?.trim();

  const modelsToTry = override
    ? [
        override,
        ...MODELS.filter((model) => model !== override),
      ]
    : MODELS;

  let lastError: any = null;

  for (const modelName of modelsToTry) {
    try {
      console.log(`🤖 Trying model: ${modelName}`);

      const model = genAI.getGenerativeModel({
        model: modelName,
      });

      const result = await model.generateContent({
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.1,
          maxOutputTokens: 8192,
        },
      });

      const text = result.response.text();

      console.log(`✅ Model ${modelName} worked`);

      process.env.GEMINI_MODEL = modelName;

      let cleaned = cleanJSON(text);

      try {
        JSON.parse(cleaned);
      } catch {
        console.warn('⚠️ JSON appears incomplete — attempting repair...');

        cleaned = repairJSON(cleaned);

        try {
          JSON.parse(cleaned);
        } catch {
          console.warn('⚠️ JSON repair was unsuccessful. Trying next model...');

          lastError = new Error(
            `Gemini returned invalid JSON from model ${modelName}`
          );

          continue;
        }
      }

      return cleaned;
    } catch (e: any) {
      const msg = e?.message || String(e);

      if (
        msg.includes('fetch failed') ||
        msg.includes('ECONNREFUSED') ||
        msg.includes('ETIMEDOUT') ||
        msg.includes('ENOTFOUND') ||
        msg.includes('EAI_AGAIN')
      ) {
        throw new Error(
          'Cannot connect to Google AI API. Please check your internet connection and GEMINI_API_KEY.'
        );
      }

      console.warn(`⚠️ Model ${modelName} failed, trying next...`);
      console.warn(`   Reason: ${msg.substring(0, 300)}`);

      lastError = e;
    }
  }

  throw (
    lastError ||
    new Error(
      'No Gemini model is available. Please check your GEMINI_API_KEY and GEMINI_MODEL.'
    )
  );
};


class GeminiProvider implements AIProvider {

  /*
   * ==========================================
   * RESUME ATS ANALYSIS
   * ==========================================
   */
  async analyzeResume(resumeText: string): Promise<AnalysisResult> {

    const raw = await callGemini(`
You are a strict ATS resume analyst.

Analyze ONLY the resume text provided below.

Do NOT invent, assume, or hallucinate any information.

Every score, keyword, strength, weakness, recommendation,
and summary must come directly from what is written in the resume.

RESUME TO ANALYZE:
---
${resumeText.substring(0, 4000)}
---

Return ONLY valid JSON using this exact structure:

{
  "overall_score": <integer 0-100, sum of all 6 breakdown scores>,

  "breakdown": {
    "keywords": <integer 0-25, based on industry keywords actually present>,
    "skills": <integer 0-20, based on skills actually listed>,
    "experience": <integer 0-20, based on experience actually described>,
    "formatting": <integer 0-15, based on actual resume structure>,
    "education": <integer 0-10, based on education actually mentioned>,
    "job_relevance": <integer 0-10, based on overall relevance>
  },

  "strengths": [
    "<specific strength found in THIS resume>",
    "<specific strength found in THIS resume>",
    "<specific strength found in THIS resume>"
  ],

  "weaknesses": [
    "<specific weakness found in THIS resume>",
    "<specific weakness found in THIS resume>",
    "<specific weakness found in THIS resume>"
  ],

  "recommendations": [
    "<specific actionable recommendation for THIS resume>",
    "<specific actionable recommendation for THIS resume>",
    "<specific actionable recommendation for THIS resume>",
    "<specific actionable recommendation for THIS resume>"
  ],

  "missing_keywords": [
    "<keyword genuinely missing from this resume>"
  ],

  "matched_keywords": [
    "<keyword actually found in this resume>"
  ],

  "ats_compatible": <true if resume has clear sections and proper formatting, false otherwise>,

  "summary": "<2-3 sentences about THIS specific resume based only on what is written>",

  "sections": {
    "contact": <true if contact info present>,
    "summary": <true if professional summary present>,
    "experience": <true if work experience present>,
    "education": <true if education actually mentioned>,
    "skills": <true if skills section present>
  }
}

CRITICAL:
- Return ONLY JSON.
- Use ONLY information from the resume.
- Do not use example names.
- Do not invent skills.
- Do not invent experience.
- Do not inflate scores without evidence.
- Keep every score consistent with the actual resume.
`);

    return JSON.parse(raw) as AnalysisResult;
  }


  /*
   * ==========================================
   * RESUME → JOB MATCH
   * ==========================================
   */
  async matchResumeToJob(
    resumeText: string,
    jobDescription: string
  ): Promise<JobMatchResult> {

    const raw = await callGemini(`
You are a strict recruiter and ATS job-matching system.

Compare ONLY the actual resume against the actual job description.

Do NOT invent skills or experience.

Every matched or missing skill must be verifiable
from the texts provided.

RESUME:
---
${resumeText.substring(0, 3000)}
---

JOB DESCRIPTION:
---
${jobDescription.substring(0, 2000)}
---

Return ONLY valid JSON using this exact structure:

{
  "match_percentage": <integer 0-100, honest match based on actual overlap>,

  "matched_skills": [
    "<skill present in BOTH resume and job description>"
  ],

  "missing_skills": [
    "<skill required in job but NOT found in resume>"
  ],

  "matched_keywords": [
    "<keyword present in both resume and job description>"
  ],

  "missing_keywords": [
    "<keyword in job but not in resume>"
  ],

  "experience_match": "<honest paragraph explaining how this resume matches the job>",

  "recommendations": [
    "<specific recommendation based on actual gaps>",
    "<specific recommendation>",
    "<specific recommendation>"
  ]
}

CRITICAL:
- Return ONLY valid JSON.
- Do not invent candidate experience.
- Do not invent skills.
- Do not assume a skill just because it is related to another skill.
- Base everything on the actual resume and job description.
`);

    return JSON.parse(raw) as JobMatchResult;
  }


  /*
   * ==========================================
   * INTERVIEW QUESTIONS
   * ==========================================
   */
  async generateInterviewQuestions(
    resumeText: string,
    jobDescription: string,
    count: number
  ): Promise<any[]> {

    const safeCount = Math.max(1, Math.min(Number(count) || 5, 20));

    const raw = await callGemini(`
You are a senior technical interviewer. Generate ${safeCount} UNIQUE interview questions
that are SPECIFICALLY tailored to this candidate's actual resume.

STRICT RULES:
- Read the resume carefully and extract: actual skills, tools, projects, experience, and education.
- Every question MUST reference something actually written in the resume.
- Do NOT ask generic questions like "Tell me about yourself" or "Where do you see yourself in 5 years".
- Do NOT repeat similar questions.
- Mix question types: technical (based on their actual skills), behavioral (based on their actual experience), situational (based on their actual projects).
- Difficulty should progress: start easy, get harder.

RESUME:
---
${resumeText.substring(0, 3000)}
---

JOB DESCRIPTION (if provided, tailor questions to this role):
---
${jobDescription ? jobDescription.substring(0, 1000) : 'Not provided — base questions only on resume'}
---

Return ONLY a valid JSON array with exactly ${safeCount} items.

Each item must follow this exact format:
[
  {
    "id": 1,
    "type": "technical",
    "difficulty": "easy",
    "question": "<specific question referencing an actual skill/project/tool from the resume>",
    "why_asked": "<explain why this question is relevant to THIS candidate specifically>",
    "tip": "<specific tip for answering this question based on their resume>"
  }
]

Allowed types: technical, behavioral, situational
Allowed difficulties: easy, medium, hard

CRITICAL:
- Every question must be UNIQUE and different from the others.
- Every question must reference something ACTUALLY in the resume.
- Return ONLY valid JSON array — no markdown, no extra text.
- Generate exactly ${safeCount} questions, no more, no less.
`);

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.slice(0, safeCount) : [];
  }


  /*
   * ==========================================
   * CAREER ROADMAP
   * ==========================================
   */
  async generateCareerRoadmap(
    resumeText: string,
    targetRole: string
  ): Promise<any> {

    const raw = await callGemini(`
Create a detailed career roadmap for someone who wants to become a "${targetRole}".

Analyze the resume to identify current skill level and gaps.
Then generate a structured roadmap from Beginner → Intermediate → Advanced.

RESUME:
${resumeText.substring(0, 2000)}

TARGET ROLE:
${targetRole}

Return ONLY valid JSON using this exact structure:

{
  "current_level": "<actual current role or level from resume>",

  "target_role": "${targetRole}",

  "estimated_time": "<realistic total timeline e.g. 6-12 months>",

  "gap_analysis": "<specific gaps identified by comparing resume to target role requirements>",

  "milestones": [
    {
      "phase": 1,
      "level": "Beginner",
      "title": "Foundation — Core Concepts",
      "duration": "1-2 months",
      "skills_to_learn": [
        "<fundamental skill 1 needed for ${targetRole}>",
        "<fundamental skill 2>",
        "<fundamental skill 3>"
      ],
      "actions": [
        "<concrete beginner action e.g. Complete Python basics course>",
        "<build a simple project>",
        "<action>"
      ],
      "resources": [
        { "name": "GeeksforGeeks", "url": "https://www.geeksforgeeks.org", "type": "article" },
        { "name": "freeCodeCamp", "url": "https://www.freecodecamp.org", "type": "course" },
        { "name": "W3Schools", "url": "https://www.w3schools.com", "type": "reference" },
        { "name": "YouTube", "url": "https://www.youtube.com", "type": "video" }
      ]
    },

    {
      "phase": 2,
      "level": "Intermediate",
      "title": "Building — Real Projects",
      "duration": "2-3 months",
      "skills_to_learn": [
        "<intermediate skill 1 for ${targetRole}>",
        "<intermediate skill 2>",
        "<intermediate skill 3>"
      ],
      "actions": [
        "<build a real project using the skills>",
        "<contribute to open source or build portfolio>",
        "<action>"
      ],
      "resources": [
        { "name": "GeeksforGeeks", "url": "https://www.geeksforgeeks.org", "type": "article" },
        { "name": "Coursera", "url": "https://www.coursera.org", "type": "course" },
        { "name": "Udemy", "url": "https://www.udemy.com", "type": "course" },
        { "name": "GitHub", "url": "https://www.github.com", "type": "practice" }
      ]
    },

    {
      "phase": 3,
      "level": "Advanced",
      "title": "Mastery — Industry Ready",
      "duration": "2-4 months",
      "skills_to_learn": [
        "<advanced skill 1 for ${targetRole}>",
        "<advanced skill 2>",
        "<advanced skill 3>"
      ],
      "actions": [
        "<build a production-level project>",
        "<apply for jobs or internships>",
        "<action>"
      ],
      "resources": [
        { "name": "GeeksforGeeks", "url": "https://www.geeksforgeeks.org", "type": "article" },
        { "name": "LeetCode", "url": "https://www.leetcode.com", "type": "practice" },
        { "name": "Official Documentation", "url": "https://www.google.com", "type": "docs" },
        { "name": "Medium", "url": "https://www.medium.com", "type": "article" }
      ]
    }
  ],

  "certifications": [
    "<relevant certification for ${targetRole} e.g. AWS, Google, Meta>",
    "<certification 2>"
  ],

  "salary_range": "<realistic salary range in INR for ${targetRole} in India>",

  "key_companies": [
    "<top company hiring for ${targetRole} in India>"
  ],

  "top_skills_needed": [
    "<most important skill for ${targetRole}>",
    "<skill 2>",
    "<skill 3>",
    "<skill 4>",
    "<skill 5>"
  ]
}

CRITICAL:
- Return ONLY valid JSON.
- Make the roadmap specific to "${targetRole}" — not generic.
- Resources must include GeeksforGeeks, freeCodeCamp, and other real learning sites.
- Skills must progress logically from beginner to advanced.
- Base current level on the actual resume content.
- Do not invent current skills not in the resume.
`);

    return JSON.parse(raw);
  }


  /*
   * ==========================================
   * RESUME WRITING QUALITY SCORE
   * ==========================================
   */
  async generateResumeScore(resumeText: string): Promise<any> {

    const raw = await callGemini(`
Score this specific resume on multiple writing quality dimensions.

Base all scores ONLY on what is actually written.

RESUME:
${resumeText.substring(0, 3000)}

Return ONLY valid JSON using this exact structure:

{
  "impact_score": <integer 0-100, based on how impactful the resume language is>,

  "clarity_score": <integer 0-100, based on how clear and readable the resume is>,

  "relevance_score": <integer 0-100, based on how relevant the content is>,

  "grammar_score": <integer 0-100, based on grammar and language quality>,

  "quantification_score": <integer 0-100, based on use of numbers and metrics>,

  "action_verbs_score": <integer 0-100, based on strength of action verbs used>,

  "suggestions": {
    "impact": "<specific suggestion based on actual resume content>",

    "clarity": "<specific suggestion based on actual resume content>",

    "quantification": "<specific suggestion referencing actual resume sections>",

    "action_verbs": "<specific suggestion with examples from the actual resume>"
  },

  "best_line": "<actual best written line copied from the resume>",

  "worst_line": "<actual weakest line copied from the resume>",

  "rewritten_worst_line": "<improved version of that specific line>"
}

CRITICAL:
- Return ONLY valid JSON.
- Quote actual lines from the resume.
- Do not invent resume content.
`);

    return JSON.parse(raw);
  }
}


export const aiProvider: AIProvider = new GeminiProvider();
