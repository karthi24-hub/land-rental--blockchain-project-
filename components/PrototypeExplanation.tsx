import React from 'react';

interface Props {
    isSimulated: boolean;
}

const PrototypeExplanation: React.FC<Props> = ({ isSimulated }) => {
    return (
        <div className="bg-gradient-to-br from-indigo-50 to-violet-50 border border-indigo-100 rounded-[2rem] p-8 mb-8 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 text-indigo-200/50 group-hover:text-indigo-300 transition-colors">
                <i className="fas fa-brain text-6xl rotate-12"></i>
            </div>

            <div className="relative z-10 max-w-3xl">
                <h3 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-3">
                    <span className="bg-indigo-600 text-white w-8 h-8 rounded-lg flex items-center justify-center text-sm shadow-lg shadow-indigo-200">
                        <i className="fas fa-info"></i>
                    </span>
                    {isSimulated ? 'Understanding the Demo' : 'Blockchain Live Connection'}
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                    <div className="space-y-4">
                        <div className="flex gap-4">
                            <div className="w-10 h-10 shrink-0 bg-white rounded-xl shadow-sm border border-indigo-100 flex items-center justify-center text-indigo-600">
                                <i className="fas fa-microchip"></i>
                            </div>
                            <div>
                                <h4 className="font-bold text-slate-800">Smart Contracts</h4>
                                <p className="text-slate-500 leading-relaxed">The "Lawyer" in our system. It's code on the blockchain that holds deposits and enforces rent rules automatically.</p>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <div className="w-10 h-10 shrink-0 bg-white rounded-xl shadow-sm border border-emerald-100 flex items-center justify-center text-emerald-600">
                                <i className={`fas ${isSimulated ? 'fa-shield-alt' : 'fa-check-circle'}`}></i>
                            </div>
                            <div>
                                <h4 className="font-bold text-slate-800">{isSimulated ? 'Demo Mode Enabled' : 'Real-Time Sync'}</h4>
                                <p className="text-slate-500 leading-relaxed">
                                    {isSimulated
                                        ? 'MetaMask isn\'t connected, so we are simulating the blockchain logic safely.'
                                        : 'System is successfully connected to your Ganache node. Transactions are real!'}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex gap-4">
                            <div className="w-10 h-10 shrink-0 bg-white rounded-xl shadow-sm border border-indigo-100 flex items-center justify-center text-indigo-600">
                                <i className="fas fa-database"></i>
                            </div>
                            <div>
                                <h4 className="font-bold text-slate-800">Off-Chain Storage</h4>
                                <p className="text-slate-500 leading-relaxed">We use MongoDB for property photos and descriptions to keep blockchain transactions fast and cheap.</p>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <div className="w-10 h-10 shrink-0 bg-white rounded-xl shadow-sm border border-indigo-100 flex items-center justify-center text-indigo-600">
                                <i className="fas fa-link"></i>
                            </div>
                            <div>
                                <h4 className="font-bold text-slate-800">Immutability</h4>
                                <p className="text-slate-500 leading-relaxed">Once an agreement is "deployed", the terms are written in stone. No one can change the rent amount secretly.</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-8 pt-6 border-t border-indigo-100/50 flex flex-wrap gap-4 items-center justify-between">
                    <p className="text-xs font-bold text-indigo-400 uppercase tracking-widest flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse"></span>
                        System Architecture Protocol v1.0.4
                    </p>
                    <div className="flex gap-2">
                        <span className="px-3 py-1 bg-white rounded-full border border-indigo-100 text-[10px] font-bold text-indigo-600 uppercase">Solidity ^0.8.x</span>
                        <span className="px-3 py-1 bg-white rounded-full border border-indigo-100 text-[10px] font-bold text-indigo-600 uppercase">React 19</span>
                        <span className="px-3 py-1 bg-white rounded-full border border-indigo-100 text-[10px] font-bold text-indigo-600 uppercase">Ethers.js v6</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PrototypeExplanation;
