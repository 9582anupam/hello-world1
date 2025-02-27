import React from 'react';
import { Upload, Cpu, FileQuestion, ArrowRight } from 'lucide-react';

const HowItWorkSection = () => {
  return (
    <section id="how-it-works" className="py-20 bg-slate-900">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">How It Works</h2>
          <div className="w-24 h-1 bg-gradient-to-r from-cyan-500 to-indigo-600 mx-auto"></div>
        </div>
        
        <div className="flex flex-col md:flex-row items-center justify-center max-w-5xl mx-auto">
          <div className="flex flex-col items-center text-center mb-12 md:mb-0 md:mx-6">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-cyan-500 to-indigo-600 flex items-center justify-center mb-4 shadow-lg shadow-cyan-500/20">
              <Upload className="h-10 w-10 text-white" />
            </div>
            <h3 className="text-xl font-semibold mb-2 text-slate-100">Upload Content</h3>
            <p className="text-slate-400 max-w-xs">
              Upload your videos, documents, or paste text directly into the platform.
            </p>
          </div>
          
          <ArrowRight className="hidden md:block h-8 w-8 text-cyan-500 mx-4" />
          
          <div className="flex flex-col items-center text-center mb-12 md:mb-0 md:mx-6">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-cyan-500 to-indigo-600 flex items-center justify-center mb-4 shadow-lg shadow-cyan-500/20">
              <Cpu className="h-10 w-10 text-white" />
            </div>
            <h3 className="text-xl font-semibold mb-2 text-slate-100">AI Processing</h3>
            <p className="text-slate-400 max-w-xs">
              Our AI analyzes your content, identifies key concepts and learning objectives.
            </p>
          </div>
          
          <ArrowRight className="hidden md:block h-8 w-8 text-cyan-500 mx-4" />
          
          <div className="flex flex-col items-center text-center md:mx-6">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-cyan-500 to-indigo-600 flex items-center justify-center mb-4 shadow-lg shadow-cyan-500/20">
              <FileQuestion className="h-10 w-10 text-white" />
            </div>
            <h3 className="text-xl font-semibold mb-2 text-slate-100">Generate Assessment</h3>
            <p className="text-slate-400 max-w-xs">
              Receive a fully customizable assessment with various question types and difficulty levels.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorkSection;