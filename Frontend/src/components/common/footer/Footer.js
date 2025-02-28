import React from 'react';
import { Brain, Twitter, Linkedin, Github, Instagram } from 'lucide-react';

const Footer = () => {
    return (
        <footer className="bg-slate-950 pt-16 pb-8 border-t border-cyan-900/30">
        <div className="container mx-auto px-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
            <div>
                <div className="flex items-center mb-4">
                <Brain className="h-8 w-8 text-cyan-500" />
                <span className="ml-2 text-xl font-bold bg-gradient-to-r from-cyan-400 to-indigo-500 bg-clip-text text-transparent">Harmoni-AI</span>
                </div>
                <p className="text-slate-400 mb-4">
                Transform any content into engaging assessments with the power of AI.
                </p>
                <div className="flex space-x-4">
                <a href="/terms-of-service" className="text-slate-400 hover:text-cyan-400 transition-colors">
                    <Twitter className="h-5 w-5" />
                </a>
                <a href="/terms-of-service" className="text-slate-400 hover:text-cyan-400 transition-colors">
                    <Linkedin className="h-5 w-5" />
                </a>
                <a href="/terms-of-service" className="text-slate-400 hover:text-cyan-400 transition-colors">
                    <Github className="h-5 w-5" />
                </a>
                <a href="/terms-of-service" className="text-slate-400 hover:text-cyan-400 transition-colors">
                    <Instagram className="h-5 w-5" />
                </a>
                </div>
            </div>
            
            <div>
                <h3 className="text-lg font-semibold mb-4 text-slate-100">Product</h3>
                <ul className="space-y-2">
                <li><a href="/terms-of-service" className="text-slate-400 hover:text-cyan-400 transition-colors">Features</a></li>
                <li><a href="/terms-of-service" className="text-slate-400 hover:text-cyan-400 transition-colors">Pricing</a></li>
                <li><a href="/terms-of-service" className="text-slate-400 hover:text-cyan-400 transition-colors">Testimonials</a></li>
                <li><a href="/terms-of-service" className="text-slate-400 hover:text-cyan-400 transition-colors">FAQ</a></li>
                </ul>
            </div>
            
            <div>
                <h3 className="text-lg font-semibold mb-4 text-slate-100">Resources</h3>
                <ul className="space-y-2">
                <li><a href="/terms-of-service" className="text-slate-400 hover:text-cyan-400 transition-colors">Documentation</a></li>
                <li><a href="/terms-of-service" className="text-slate-400 hover:text-cyan-400 transition-colors">Blog</a></li>
                <li><a href="/terms-of-service" className="text-slate-400 hover:text-cyan-400 transition-colors">Community</a></li>
                <li><a href="/terms-of-service" className="text-slate-400 hover:text-cyan-400 transition-colors">Support</a></li>
                </ul>
            </div>
            
            <div>
                <h3 className="text-lg font-semibold mb-4 text-slate-100">Company</h3>
                <ul className="space-y-2">
                <li><a href="/terms-of-service" className="text-slate-400 hover:text-cyan-400 transition-colors">About Us</a></li>
                <li><a href="/terms-of-service" className="text-slate-400 hover:text-cyan-400 transition-colors">Careers</a></li>
                <li><a href="/terms-of-service" className="text-slate-400 hover:text-cyan-400 transition-colors">Privacy Policy</a></li>
                <li><a href="/terms-of-service" className="text-slate-400 hover:text-cyan-400 transition-colors">Terms of Service</a></li>
                </ul>
            </div>
            </div>
            
            <div className="pt-8 border-t border-slate-800 text-center text-slate-500 text-sm">
            <p>&copy; {new Date().getFullYear()} Harmoni-AI. All rights reserved.</p>
            </div>
        </div>
        </footer>
    );
};

export default Footer;