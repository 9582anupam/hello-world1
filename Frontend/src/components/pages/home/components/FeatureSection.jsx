import React from 'react';
import { Users, Coins, BarChart3, Image, Shield, Sparkles } from 'lucide-react';

const FeatureCard = ({ icon, title, description }) => {
    return (
        <div className="bg-gradient-to-br from-slate-900 to-slate-950 p-6 rounded-xl shadow-lg border border-cyan-900/20 hover:shadow-cyan-500/20 hover:border-cyan-500/30 hover:transform hover:scale-105 transition-all duration-300">
        <div className="bg-gradient-to-br from-cyan-500 to-indigo-600 w-14 h-14 rounded-lg flex items-center justify-center mb-4 shadow-md">
            {icon}
        </div>
        <h3 className="text-xl font-semibold mb-2 text-slate-100">{title}</h3>
        <p className="text-slate-400">{description}</p>
        </div>
    );
    };

    const FeaturesSection = () => {
    const features = [
        {
        icon: <Users className="h-7 w-7 text-white" />,
        title: "Dual User Roles",
        description: "Separate interfaces for content creators and assessment takers with role-specific features."
        },
        {
        icon: <Coins className="h-7 w-7 text-white" />,
        title: "Token Economy",
        description: "Earn and spend tokens for creating, sharing, and taking assessments in our ecosystem."
        },
        {
        icon: <BarChart3 className="h-7 w-7 text-white" />,
        title: "Advanced Analytics",
        description: "Detailed insights into assessment performance, user engagement, and learning progress."
        },
        {
        icon: <Image className="h-7 w-7 text-white" />,
        title: "Rich Media Integration",
        description: "Include images, videos, and interactive elements in your assessments for better engagement."
        },
        {
        icon: <Shield className="h-7 w-7 text-white" />,
        title: "Secure & Private",
        description: "Enterprise-grade security with customizable privacy settings for all your content."
        },
        {
        icon: <Sparkles className="h-7 w-7 text-white" />,
        title: "AI Enhancement",
        description: "Continuous improvement of assessments based on user performance and feedback."
        }
    ];

    return (
        <section id="features" className="py-20 bg-slate-950">
        <div className="container mx-auto px-6">
            <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Powerful Features</h2>
            <div className="w-24 h-1 bg-gradient-to-r from-cyan-500 to-indigo-600 mx-auto"></div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
                <FeatureCard 
                key={index}
                icon={feature.icon}
                title={feature.title}
                description={feature.description}
                />
            ))}
            </div>
        </div>
        </section>
    );
    };

export default FeaturesSection;