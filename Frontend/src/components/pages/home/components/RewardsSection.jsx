import React from 'react';
import { Coins, Trophy, Gift, TrendingUp, ArrowRight } from 'lucide-react';

const RewardsSection = () => {
    return (
        <section id="rewards" className="py-20 bg-slate-950">
        <div className="container mx-auto px-6">
            <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Monetization & Rewards</h2>
            <div className="w-24 h-1 bg-gradient-to-r from-cyan-500 to-indigo-600 mx-auto"></div>
            </div>
            
            <div className="grid md:grid-cols-2 gap-12 max-w-5xl mx-auto">
            <div className="bg-slate-900 rounded-xl p-8 relative overflow-hidden border border-cyan-900/30 shadow-lg">
                <div className="absolute top-0 right-0 w-40 h-40 bg-cyan-600/10 rounded-full -mr-20 -mt-20"></div>
                <div className="absolute bottom-0 left-0 w-40 h-40 bg-indigo-600/10 rounded-full -ml-20 -mb-20"></div>
                
                <h3 className="text-2xl font-semibold mb-6 flex items-center text-slate-100">
                <Coins className="h-7 w-7 text-cyan-500 mr-3" />
                Token Economy
                </h3>
                
                <ul className="space-y-4">
                <li className="flex items-start">
                    <div className="bg-gradient-to-br from-cyan-500 to-indigo-600 p-1 rounded-full mr-3 mt-1">
                    <TrendingUp className="h-4 w-4 text-white" />
                    </div>
                    <p className="text-slate-300">Earn tokens when others use your assessments</p>
                </li>
                <li className="flex items-start">
                    <div className="bg-gradient-to-br from-cyan-500 to-indigo-600 p-1 rounded-full mr-3 mt-1">
                    <Gift className="h-4 w-4 text-white" />
                    </div>
                    <p className="text-slate-300">Spend tokens to access premium features and templates</p>
                </li>
                <li className="flex items-start">
                    <div className="bg-gradient-to-br from-cyan-500 to-indigo-600 p-1 rounded-full mr-3 mt-1">
                    <Trophy className="h-4 w-4 text-white" />
                    </div>
                    <p className="text-slate-300">Convert tokens to real rewards through our partner network</p>
                </li>
                </ul>
                
                <div className="mt-8 pt-6 border-t border-slate-800">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-slate-400">Basic Creation</span>
                    <span className="text-cyan-400">5 tokens</span>
                </div>
                <div className="flex items-center justify-between mb-2">
                    <span className="text-slate-400">Advanced Features</span>
                    <span className="text-cyan-400">15 tokens</span>
                </div>
                <div className="flex items-center justify-between">
                    <span className="text-slate-400">Premium Templates</span>
                    <span className="text-cyan-400">25 tokens</span>
                </div>
                </div>
            </div>
            
            <div className="bg-slate-900 rounded-xl p-8 relative overflow-hidden border border-cyan-900/30 shadow-lg">
                <div className="absolute top-0 right-0 w-40 h-40 bg-cyan-600/10 rounded-full -mr-20 -mt-20"></div>
                <div className="absolute bottom-0 left-0 w-40 h-40 bg-indigo-600/10 rounded-full -ml-20 -mb-20"></div>
                
                <h3 className="text-2xl font-semibold mb-6 flex items-center text-slate-100">
                <Trophy className="h-7 w-7 text-cyan-500 mr-3" />
                Creator Rewards
                </h3>
                
                <div className="space-y-6">
                <div>
                    <h4 className="text-lg font-medium mb-2 text-cyan-300">Popular Content Bonus</h4>
                    <p className="text-slate-400">
                    Earn additional tokens when your assessments reach high usage milestones.
                    </p>
                </div>
                
                <div>
                    <h4 className="text-lg font-medium mb-2 text-cyan-300">Quality Multipliers</h4>
                    <p className="text-slate-400">
                    High-rated assessments earn token multipliers, incentivizing quality content.
                    </p>
                </div>
                
                <div>
                    <h4 className="text-lg font-medium mb-2 text-cyan-300">Subscription Revenue Share</h4>
                    <p className="text-slate-400">
                    Top creators earn a share of subscription revenue from premium users.
                    </p>
                </div>
                </div>
                
                <button className="w-full mt-8 py-3 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-600 hover:to-indigo-700 text-white font-bold rounded-lg shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40 flex items-center justify-center">
                Join Now
                <ArrowRight className="ml-2 h-5 w-5" />
                </button>
            </div>
            </div>
        </div>
        </section>
    );
};

export default RewardsSection;