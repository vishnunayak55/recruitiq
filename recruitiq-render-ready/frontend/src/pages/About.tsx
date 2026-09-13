import React from 'react';
import { Link } from 'react-router-dom';
import { BrainCircuit, Target, Zap, Shield, Users } from 'lucide-react';

const About = () => {
  return (
    <div className="min-h-screen bg-[#0a0a0f] pt-20 pb-16 px-4">
      <div className="max-w-3xl mx-auto">

        {/* Hero */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 mb-6">
            <BrainCircuit size={28} className="text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">About RecruitIQ</h1>
          <p className="text-zinc-400 text-lg max-w-2xl mx-auto leading-relaxed">
            RecruitIQ is an AI-powered resume analysis platform that helps job seekers understand exactly how their resume performs against ATS systems and real job requirements.
          </p>
        </div>

        {/* Mission */}
        <div className="bg-white/[0.02] border border-white/8 rounded-2xl p-8 mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">Our Mission</h2>
          <p className="text-zinc-400 leading-relaxed">
            Every year, millions of qualified candidates get filtered out by Applicant Tracking Systems before a human ever reads their resume. We built RecruitIQ to give every job seeker the same insights that career coaches charge thousands of rupees to provide — powered by AI, available to everyone.
          </p>
        </div>

        {/* Values */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          {[
            {
              icon: <Target size={20} className="text-indigo-400" />,
              title: 'Precision Analysis',
              desc: 'We use Claude AI to deliver specific, actionable feedback — not generic advice. Every recommendation is tailored to your actual resume content.',
            },
            {
              icon: <Zap size={20} className="text-blue-400" />,
              title: 'Instant Results',
              desc: 'No waiting. Upload your resume and get a comprehensive ATS score, keyword analysis, and improvement plan in seconds.',
            },
            {
              icon: <Shield size={20} className="text-emerald-400" />,
              title: 'Privacy First',
              desc: 'Your resume data is yours. We never share or sell your data to recruiters or third parties. Your files are processed securely and you can delete them anytime.',
            },
            {
              icon: <Users size={20} className="text-violet-400" />,
              title: 'Built for Everyone',
              desc: "Whether you're a fresher, mid-level professional, or career changer — RecruitIQ adapts its analysis to your experience level and target role.",
            },
          ].map((v) => (
            <div key={v.title} className="bg-white/[0.02] border border-white/8 rounded-2xl p-6 hover:border-white/15 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center mb-4">
                {v.icon}
              </div>
              <h3 className="text-white font-semibold mb-2">{v.title}</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">{v.desc}</p>
            </div>
          ))}
        </div>

        {/* Privacy note */}
        <div className="bg-white/[0.02] border border-white/8 rounded-2xl p-8 mb-12">
          <h2 className="text-xl font-bold text-white mb-3">Your Data & Privacy</h2>
          <p className="text-zinc-400 text-sm leading-relaxed mb-3">
            Your resume is used only to generate the analysis you request. Results are stored securely in your account and you can delete them at any time from your history.
          </p>
          <p className="text-zinc-500 text-sm leading-relaxed">
            RecruitIQ does not sell or share your resume data with third parties, recruiters, or employers.
          </p>
        </div>

        {/* CTA */}
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-2">Analyze your resume for free</h2>
          <p className="text-zinc-500 text-sm mb-6">No credit card required. Free plan available.</p>
          <div className="flex gap-4 justify-center">
            <Link to="/analyzer" className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl transition-colors">
              Analyze My Resume
            </Link>
            <Link to="/pricing" className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold rounded-xl transition-colors">
              View Pricing
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
};

export default About;
