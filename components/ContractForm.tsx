import React, { useState } from 'react';

interface Props {
  onSubmit: (data: any) => void;
  loading: boolean;
}

const ContractForm: React.FC<Props> = ({ onSubmit, loading }) => {
  const [formData, setFormData] = useState({
    tenantAddress: '0xc738e91207e38317f81b74c9d21401b5f6d8975f',
    propertyAddress: '123 Blockchain Ave, Ethereum City',
    rentAmount: '1.2',
    deposit: '2.4',
    duration: '12',
    startDate: new Date().toISOString().split('T')[0],
    autoWithdraw: true
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
      <div className="p-8 border-b border-slate-100 bg-slate-50/50">
        <h3 className="text-xl font-bold text-slate-900">Agreement Parameters</h3>
        <p className="text-slate-500 text-sm">Define the terms that will be immutable once the agreement is deployed.</p>
      </div>

      <form onSubmit={handleSubmit} className="p-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2 col-span-1 md:col-span-2">
            <label className="block text-sm font-bold text-slate-700 flex justify-between items-center">
              Tenant Wallet Address
              <button
                type="button"
                onClick={async () => {
                  const accounts = await (window as any).ethereum.request({ method: 'eth_requestAccounts' });
                  if (accounts[0]) setFormData({ ...formData, tenantAddress: accounts[0] });
                }}
                className="text-[10px] bg-indigo-50 text-indigo-600 px-2 py-1 rounded hover:bg-indigo-600 hover:text-white transition-all font-black uppercase tracking-tighter"
              >
                Use Current Wallet
              </button>
            </label>
            <input
              type="text"
              placeholder="0x..."
              className="w-full px-5 py-4 rounded-2xl border-2 border-slate-100 focus:border-indigo-500 transition-all outline-none font-mono text-sm"
              value={formData.tenantAddress}
              onChange={(e) => setFormData({ ...formData, tenantAddress: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2 col-span-1 md:col-span-2">
            <label className="block text-sm font-bold text-slate-700">Property Address / ID</label>
            <input
              type="text"
              placeholder="123 Blockchain Ave..."
              className="w-full px-5 py-4 rounded-2xl border-2 border-slate-100 focus:border-indigo-500 transition-all outline-none"
              value={formData.propertyAddress}
              onChange={(e) => setFormData({ ...formData, propertyAddress: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-bold text-slate-700">Monthly Rent (ETH)</label>
            <div className="relative">
              <input
                type="number"
                step="0.01"
                className="w-full pl-5 pr-14 py-4 rounded-2xl border-2 border-slate-100 focus:border-indigo-500 transition-all outline-none"
                value={formData.rentAmount}
                onChange={(e) => setFormData({ ...formData, rentAmount: e.target.value })}
                required
              />
              <span className="absolute right-5 top-4.5 text-slate-400 font-bold">ETH</span>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-bold text-slate-700">Security Deposit (ETH)</label>
            <div className="relative">
              <input
                type="number"
                step="0.01"
                className="w-full pl-5 pr-14 py-4 rounded-2xl border-2 border-slate-100 focus:border-indigo-500 transition-all outline-none"
                value={formData.deposit}
                onChange={(e) => setFormData({ ...formData, deposit: e.target.value })}
                required
              />
              <span className="absolute right-5 top-4.5 text-slate-400 font-bold">ETH</span>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-bold text-slate-700">Lease Duration (Months)</label>
            <select
              className="w-full px-5 py-4 rounded-2xl border-2 border-slate-100 focus:border-indigo-500 outline-none appearance-none bg-white"
              value={formData.duration}
              onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
            >
              <option value="6">6 Months</option>
              <option value="12">12 Months</option>
              <option value="24">24 Months</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-bold text-slate-700">Start Date</label>
            <input
              type="date"
              className="w-full px-5 py-4 rounded-2xl border-2 border-slate-100 focus:border-indigo-500 outline-none"
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              required
            />
          </div>
        </div>

        <div className="p-5 bg-indigo-50/50 border border-indigo-100 rounded-3xl flex items-start gap-4">
          <input
            type="checkbox"
            checked={formData.autoWithdraw}
            onChange={(e) => setFormData({ ...formData, autoWithdraw: e.target.checked })}
            className="mt-1 w-6 h-6 rounded-lg border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
          />
          <div>
            <p className="text-sm font-bold text-indigo-900">Enable Auto-Payment Forwarding</p>
            <p className="text-xs text-indigo-600/70 mt-1">If enabled, the smart contract will immediately push rent to your cold wallet.</p>
          </div>
        </div>

        <div className="pt-4">
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-5 rounded-[2rem] font-bold text-lg transition-all shadow-xl shadow-indigo-100 flex items-center justify-center gap-3 active:scale-95 disabled:opacity-70"
          >
            <i className="fas fa-rocket text-sm"></i>
            Deploy & Broadcast Agreement
          </button>
        </div>
      </form>
    </div>
  );
};

export default ContractForm;
