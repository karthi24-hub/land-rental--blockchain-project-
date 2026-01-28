
import React from 'react';
import { Transaction } from '../types';

interface Props {
  transactions: Transaction[];
}

const TransactionHistory: React.FC<Props> = ({ transactions }) => {
  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="p-8 border-b border-slate-100 flex justify-between items-center">
        <h3 className="text-xl font-bold text-slate-900">Payment History</h3>
        <a href="#" className="text-sm font-semibold text-indigo-600 hover:underline">View on Etherscan</a>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50/50">
              <th className="px-8 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Type</th>
              <th className="px-8 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Amount</th>
              <th className="px-8 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Date</th>
              <th className="px-8 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Hash</th>
              <th className="px-8 py-4 text-right text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {transactions.map((tx, idx) => (
              <tr key={idx} className="hover:bg-slate-50/30 transition-colors">
                <td className="px-8 py-5">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${tx.type === 'RENT' ? 'bg-blue-100 text-blue-600' : 'bg-emerald-100 text-emerald-600'}`}>
                      <i className={`fas ${tx.type === 'RENT' ? 'fa-receipt' : 'fa-lock'}`}></i>
                    </div>
                    <span className="font-bold text-slate-800">{tx.type}</span>
                  </div>
                </td>
                <td className="px-8 py-5">
                  <span className="font-bold text-slate-900">{tx.value} ETH</span>
                </td>
                <td className="px-8 py-5 text-sm text-slate-500">
                  {new Date(tx.timestamp).toLocaleDateString()}
                </td>
                <td className="px-8 py-5 font-mono text-xs text-slate-400">
                  {tx.hash.slice(0, 10)}...
                </td>
                <td className="px-8 py-5 text-right">
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600">
                    <i className="fas fa-check-circle"></i>
                    Confirmed
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TransactionHistory;
