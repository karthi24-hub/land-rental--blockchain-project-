import React from 'react';
import { LeaseAgreement, LeaseStatus } from '../types';

interface Props {
  lease: LeaseAgreement;
  role: 'LANDLORD' | 'TENANT' | 'NONE';
  onPayRent: () => void;
  onTerminate: () => void;
  onConfirm: () => void;
  loading: boolean;
}

const ContractDetails: React.FC<Props> = ({ lease, role, onPayRent, onTerminate, onConfirm, loading }) => {
  const statusColors = {
    [LeaseStatus.CREATED]: 'bg-amber-100 text-amber-700 border-amber-200',
    [LeaseStatus.ACTIVE]: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    [LeaseStatus.TERMINATED]: 'bg-slate-100 text-slate-700 border-slate-200',
    [LeaseStatus.DISPUTED]: 'bg-red-100 text-red-700 border-red-200'
  };

  return (
    <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
      <div className="p-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">Rental Agreement</h3>
            <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${statusColors[lease.status] || ''}`}>
              {lease.status}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <p className="text-xs font-mono text-slate-400 select-all flex items-center gap-2">
              <i className="fas fa-link text-[10px]"></i>
              {lease.id}
            </p>
            <button
              onClick={() => alert(`DIGITAL PROOF CERTIFICATE\n--------------------------\nContract: ${lease.id}\nLandlord: ${lease.landlord}\nTenant: ${lease.tenant}\nRent: ${lease.rentAmount} ETH\nVerified by: Ethereum Blockchain`)}
              className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded hover:bg-indigo-600 hover:text-white transition-all font-bold"
            >
              <i className="fas fa-certificate mr-1"></i>
              Download Proof
            </button>
          </div>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          {role === 'TENANT' && lease.status === 'Created' && (
            <div className="flex flex-col gap-2 w-full sm:w-auto">
              <button
                onClick={onConfirm}
                disabled={loading}
                className="w-full sm:w-auto bg-amber-500 hover:bg-amber-600 text-white px-8 py-3.5 rounded-2xl font-bold shadow-lg shadow-amber-100 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-70"
              >
                <i className="fas fa-check-circle"></i>
                Confirm & Pay Deposit
              </button>
              <p className="text-[10px] text-amber-600 font-bold text-center bg-amber-50 py-1 rounded-lg border border-amber-100/50">
                <i className="fas fa-info-circle mr-1"></i>
                Switch to Tenant Wallet in MetaMask
              </p>
            </div>
          )}
          {role === 'TENANT' && lease.status === LeaseStatus.ACTIVE && (
            <button
              onClick={onPayRent}
              disabled={loading}
              className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3.5 rounded-2xl font-bold shadow-lg shadow-indigo-100 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-70"
            >
              <i className="fas fa-money-bill-wave"></i>
              Pay Rent ({lease.rentAmount} ETH)
            </button>
          )}
          {role === 'LANDLORD' && lease.status === LeaseStatus.ACTIVE && (
            <button
              onClick={onTerminate}
              disabled={loading}
              className="w-full sm:w-auto bg-white border-2 border-red-50 text-red-600 px-8 py-3.5 rounded-2xl font-bold hover:bg-red-50 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-70"
            >
              Terminate Lease
            </button>
          )}
        </div>
      </div>

      <div className="p-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Rent / Month</p>
            <p className="text-2xl font-black text-slate-900">{lease.rentAmount} <span className="text-sm font-bold text-slate-300">ETH</span></p>
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Security Locked</p>
            <p className="text-2xl font-black text-slate-900">{lease.securityDeposit} <span className="text-sm font-bold text-slate-300">ETH</span></p>
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Next Payment</p>
            <p className="text-2xl font-black text-indigo-600">
              {lease.nextPaymentDue > 0 ? new Date(lease.nextPaymentDue).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'N/A'}
            </p>
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Contract End</p>
            <p className="text-2xl font-black text-slate-900">
              {lease.leaseEnd > 0 ? new Date(lease.leaseEnd).toLocaleDateString('en-US', { year: 'numeric', month: 'short' }) : 'N/A'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 bg-slate-50/50 border border-slate-100 rounded-3xl relative group">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Landlord Address</h4>
            <div className="flex items-center justify-between">
              <p className="text-xs font-mono text-slate-600 break-all pr-8">{lease.landlord}</p>
              <i className="far fa-copy absolute right-6 text-slate-300 cursor-pointer hover:text-indigo-600 transition-colors"></i>
            </div>
          </div>
          <div className="p-6 bg-slate-50/50 border border-slate-100 rounded-3xl relative group">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Tenant Address</h4>
            <div className="flex items-center justify-between">
              <p className="text-xs font-mono text-slate-600 break-all pr-8">{lease.tenant}</p>
              <i className="far fa-copy absolute right-6 text-slate-300 cursor-pointer hover:text-indigo-600 transition-colors"></i>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContractDetails;
