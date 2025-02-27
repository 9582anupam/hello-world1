import React from 'react';
import { GraduationCap, Building, Users } from 'lucide-react';

const AudienceSection = () => {
    return (
        <section id="audience" className="py-20 bg-slate-900">
        <div className="container mx-auto px-6">
            <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Who It's For</h2>
            <div className="w-24 h-1 bg-gradient-to-r from-cyan-500 to-indigo-600 mx-auto"></div>
            </div>
            
            <div className="grid md:grid-cols-3 gap-10 max-w-5xl mx-auto">
            <div className="bg-gradient-to-b from-slate-900 to-slate-950 rounded-2xl p-8 text-center shadow-lg border border-cyan-900/20 hover:shadow-cyan-500/20 hover:border-cyan-500/30 transition-all">
                <div className="w-20 h-20 bg-gradient-to-br from-cyan-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-cyan-500/20">
                <GraduationCap className="h-10 w-10 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-4 text-slate-100">Educators</h3>
                <p className="text-slate-400">
                Teachers, professors, and trainers who want to create engaging assessments without spending hours on manual question creation.
                </p>
            </div>
            
            <div className="bg-gradient-to-b from-slate-900 to-slate-950 rounded-2xl p-8 text-center shadow-lg border border-cyan-900/20 hover:shadow-cyan-500/20 hover:border-cyan-500/30 transition-all">
                <div className="w-20 h-20 bg-gradient-to-br from-cyan-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-cyan-500/20">
                <Building className="h-10 w-10 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-4 text-slate-100">Organizations</h3>
                <p className="text-slate-400">
                Companies and institutions looking to improve training effectiveness and knowledge retention through interactive assessments.
                </p>
            </div>
            
            <div className="bg-gradient-to-b from-slate-900 to-slate-950 rounded-2xl p-8 text-center shadow-lg border border-cyan-900/20 hover:shadow-cyan-500/20 hover:border-cyan-500/30 transition-all">
                <div className="w-20 h-20 bg-gradient-to-br from-cyan-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-cyan-500/20">
                <Users className="h-10 w-10 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-4 text-slate-100">Students</h3>
                <p className="text-slate-400">
                Learners who want to test their knowledge, prepare for exams, and identify areas for improvement through targeted assessments.
                </p>
            </div>
            </div>
        </div>
        </section>
    );
};

export default AudienceSection;