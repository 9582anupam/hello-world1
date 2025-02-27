import { useState, useEffect } from 'react';
import { ArrowRight } from 'lucide-react';

const HeroSection = () => {
    const [eyePosition, setEyePosition] = useState({ x: 0, y: 0 });
    const [headRotation, setHeadRotation] = useState({ x: 0, y: 0 });

    useEffect(() => {
        const handleMouseMove = (e) => {
        // Calculate mouse position relative to the window
        const mouseX = e.clientX;
        const mouseY = e.clientY;
        
        // Calculate the center of the window
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;
        
        // Calculate the normalized position (-1 to 1)
        const normalizedX = (mouseX - centerX) / centerX;
        const normalizedY = (mouseY - centerY) / centerY;
        
        // Set eye position (limited movement)
        setEyePosition({
            x: normalizedX * 10,
            y: normalizedY * 5
        });
        
        // Set head rotation (subtle movement)
        setHeadRotation({
            x: normalizedY * 5,
            y: -normalizedX * 10
        });
        };

        window.addEventListener('mousemove', handleMouseMove);
        return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        };
    }, []);

    return (
        <section className="relative -mt-10 sm:-mt-2 py-16 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-indigo-950/30 to-slate-950 z-0"></div>
        
        {/* Animated Gradient Orbs */}
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-cyan-500/20 rounded-full filter blur-3xl animate-pulse z-0"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/20 rounded-full filter blur-3xl animate-pulse z-0" style={{ animationDelay: '2s' }}></div>
        
        <div className="container mx-auto px-6 relative z-10">
            <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-indigo-500 leading-tight">
                Transform Any Content into Engaging Assessments with AI
            </h1>
            <p className="text-xl md:text-2xl text-slate-300 mb-10">
                Generate interactive quizzes and assessments from videos, text, and more
            </p>
            <button className="px-8 py-4 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-600 hover:to-indigo-700 text-white font-bold rounded-full shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40 transform transition-all hover:scale-100 flex items-center mx-auto">
                Start Generating Assessments
                <ArrowRight className="ml-2 h-5 w-5" />
            </button>
            </div>
            
            {/* Interactive Robot */}
            <div className="mt-16 flex justify-center">
            <div className="relative w-64 h-64">
                {/* Robot Head */}
                <div 
                className="w-48 h-56 bg-gradient-to-b from-slate-700 to-slate-900 rounded-t-3xl mx-auto relative"
                style={{ 
                    transform: `rotateX(${headRotation.x}deg) rotateY(${headRotation.y}deg)`,
                    transformStyle: 'preserve-3d',
                    transition: 'transform 0.1s ease-out'
                }}
                >
                {/* Robot Face */}
                <div className="absolute top-8 left-0 right-0 bottom-0 flex flex-col items-center">
                    {/* Eyes Container */}
                    <div className="flex space-x-8 mb-6">
                    {/* Left Eye */}
                    <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center border-2 border-cyan-500/50">
                        <div 
                        className="w-5 h-5 rounded-full bg-cyan-400"
                        style={{ 
                            transform: `translate(${eyePosition.x}px, ${eyePosition.y}px)`,
                            boxShadow: '0 0 10px 2px rgba(34, 211, 238, 0.5)'
                        }}
                        ></div>
                    </div>
                    {/* Right Eye */}
                    <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center border-2 border-cyan-500/50">
                        <div 
                        className="w-5 h-5 rounded-full bg-cyan-400"
                        style={{ 
                            transform: `translate(${eyePosition.x}px, ${eyePosition.y}px)`,
                            boxShadow: '0 0 10px 2px rgba(34, 211, 238, 0.5)'
                        }}
                        ></div>
                    </div>
                    </div>
                    
                    {/* Mouth */}
                    <div className="w-20 h-3 bg-slate-800 rounded-lg relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-indigo-500 opacity-70"></div>
                    {/* Sound Wave Animation */}
                    <div className="flex justify-between px-1">
                        {[...Array(6)].map((_, i) => (
                        <div 
                            key={i} 
                            className="w-1 bg-cyan-300" 
                            style={{ 
                            height: `${Math.sin(Date.now() / (500 + i * 100)) * 50 + 50}%`,
                            animation: `soundWave ${1 + i * 0.2}s infinite ease-in-out alternate`,
                            animationDelay: `${i * 0.1}s`
                            }}
                        ></div>
                        ))}
                    </div>
                    </div>
                    
                    {/* Antenna */}
                    <div className="absolute -top-12 left-1/2 transform -translate-x-1/2">
                    <div className="w-1 h-8 bg-slate-600"></div>
                    <div className="w-3 h-3 rounded-full bg-cyan-500 -mt-1 mx-auto animate-pulse"></div>
                    </div>
                </div>
                </div>
                
                {/* Robot Body */}
                <div className="w-56 h-16 bg-gradient-to-b from-slate-800 to-slate-900 rounded-b-lg mx-auto -mt-2 relative overflow-hidden">
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-cyan-500 to-indigo-500"></div>
                <div className="flex justify-center space-x-6 pt-4">
                    {[...Array(3)].map((_, i) => (
                    <div key={i} className="w-6 h-6 rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center">
                        <div className="w-3 h-3 rounded-full bg-cyan-400 animate-pulse" style={{ animationDelay: `${i * 0.3}s` }}></div>
                    </div>
                    ))}
                </div>
                </div>
            </div>
            </div>
        </div>
        
        {/* CSS Animation for sound wave */}
        <style>
            {`
            @keyframes soundWave {
                0% { height: 20%; }
                100% { height: 80%; }
            }
            `}
        </style>
        </section>
    );
};

export default HeroSection;