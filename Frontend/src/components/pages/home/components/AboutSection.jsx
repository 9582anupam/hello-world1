import React from 'react';
import { FileText, Sliders, BrainCircuit } from 'lucide-react';

const AboutSection = () => {
    return (
        <section id="about" className="py-20 bg-slate-950">
        <div className="container mx-auto px-6">
            <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">About Harmoni-AI</h2>
            <div className="w-24 h-1 bg-gradient-to-r from-cyan-500 to-indigo-600 mx-auto"></div>
            </div>
            
            <div className="max-w-4xl mx-auto text-slate-300 text-lg mb-12">
            <p>
                Harmoni-AI is a cutting-edge platform that leverages artificial intelligence to transform any content into 
                engaging, interactive assessments. Our technology analyzes your materials and generates high-quality questions, 
                quizzes, and assessments that test comprehension and critical thinking.
            </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-slate-900/80 backdrop-blur-sm p-8 rounded-xl border border-cyan-900/30 hover:shadow-cyan-500/10 hover:shadow-lg transition-all group">
                <div className="flex items-center mb-4">
                <div className="bg-gradient-to-br from-cyan-500 to-indigo-600 p-3 rounded-lg mr-4 group-hover:shadow-lg group-hover:shadow-cyan-500/20 transition-all">
                    <FileText className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-slate-100">Multi-Format Support</h3>
                </div>
                <p className="text-slate-400">
                Upload videos, documents, presentations, or paste text. Our AI works with all content types.
                </p>
            </div>
            
            <div className="bg-slate-900/80 backdrop-blur-sm p-8 rounded-xl border border-cyan-900/30 hover:shadow-cyan-500/10 hover:shadow-lg transition-all group">
                <div className="flex items-center mb-4">
                <div className="bg-gradient-to-br from-cyan-500 to-indigo-600 p-3 rounded-lg mr-4 group-hover:shadow-lg group-hover:shadow-cyan-500/20 transition-all">
                    <Sliders className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-slate-100">Customizable Assessments</h3>
                </div>
                <p className="text-slate-400">
                Tailor question types, difficulty levels, and assessment formats to meet your specific needs.
                </p>
            </div>
            
            <div className="bg-slate-900/80 backdrop-blur-sm p-8 rounded-xl border border-cyan-900/30 hover:shadow-cyan-500/10 hover:shadow-lg transition-all group">
                <div className="flex items-center mb-4">
                <div className="bg-gradient-to-br from-cyan-500 to-indigo-600 p-3 rounded-lg mr-4 group-hover:shadow-lg group-hover:shadow-cyan-500/20 transition-all">
                    <BrainCircuit className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-slate-100">AI-Powered Analysis</h3>
                </div>
                <p className="text-slate-400">
                Our advanced AI understands context, identifies key concepts, and generates relevant questions.
                </p>
            </div>
            </div>
        </div>
        </section>
    );
    };

export default AboutSection;