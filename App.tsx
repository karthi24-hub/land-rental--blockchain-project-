import React, { useState, useCallback, useEffect } from 'react';
import { UserState, LeaseAgreement, LeaseStatus, Transaction } from './types';
import {
  connectWallet,
  getLeaseData,
  deployAgreement,
  confirmAgreement,
  payRent,
  getBalance,
  getNetwork,
  switchToGanache,
  getAgreementTransactions
} from './services/web3Service';
import ContractForm from './components/ContractForm';
import ContractDetails from './components/ContractDetails';
import TransactionHistory from './components/TransactionHistory';
import PrototypeExplanation from './components/PrototypeExplanation';

const App: React.FC = () => {
  const [user, setUser] = useState<UserState & { isSimulated?: boolean, network?: { name: string, chainId: number } }>({
    address: null,
    isConnected: false,
    role: 'NONE',
    isSimulated: false,
    network: undefined
  });
  const [activeLease, setActiveLease] = useState<LeaseAgreement | null>(null);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<'DASHBOARD' | 'CREATE'>('DASHBOARD');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [balance, setBalance] = useState<string>("0");

  const fetchBalance = async (address: string) => {
    try {
      console.log(`fetchBalance: Requesting balance for ${address}`);
      const bal = await getBalance(address);
      console.log(`fetchBalance: Result for ${address} is ${bal} ETH`);
      setBalance(bal);
    } catch (e) {
      console.error("fetchBalance: Error in App.tsx:", e);
    }
  };

  const handleConnect = async () => {
    setLoading(true);
    try {
      const { address, isSimulated, network } = await connectWallet();
      const lease = await getLeaseData(address);
      let role: 'LANDLORD' | 'TENANT' | 'NONE' = address.toLowerCase().endsWith('f') || address.toLowerCase().endsWith('1')
        ? 'LANDLORD'
        : 'TENANT';

      if (lease) {
        if (lease.landlord.toLowerCase() === address.toLowerCase()) role = 'LANDLORD';
        else if (lease.tenant.toLowerCase() === address.toLowerCase()) role = 'TENANT';
        setActiveLease(lease as any);

        // Fetch transaction history
        if (!isSimulated) {
          getAgreementTransactions(lease.id).then((txs: any) => {
            setTransactions(txs);
          });
        }
      }

      setUser({ address, isConnected: true, role, isSimulated, network });
      if (address) {
        fetchBalance(address);
      }
    } catch (error) {
      alert("Connection failed: " + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setUser({ address: null, isConnected: false, role: 'NONE', isSimulated: false, network: undefined });
    setActiveLease(null);
    setTransactions([]);
    setView('DASHBOARD');
  };

  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).ethereum) {
      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length > 0) {
          handleConnect(); // Re-trigger connection logic to update address/balance
        } else {
          handleLogout();
        }
      };

      (window as any).ethereum.on('accountsChanged', handleAccountsChanged);
      (window as any).ethereum.on('chainChanged', () => window.location.reload());
      return () => {
        (window as any).ethereum.removeListener('accountsChanged', handleAccountsChanged);
        (window as any).ethereum.removeListener('chainChanged', () => window.location.reload());
      };
    }
  }, [handleConnect]);

  const onCreateAgreement = async (data: any) => {
    setLoading(true);
    try {
      const { contractAddress, hash } = await deployAgreement(data);
      alert(`Contract deployed successfully at ${contractAddress}`);

      // Delay to allow database to index
      await new Promise(r => setTimeout(r, 1500));

      const lease = await getLeaseData(user.address!);
      if (lease) {
        setActiveLease(lease as any);
      }

      setTransactions(prev => [{
        hash: hash || 'pending',
        from: user.address!,
        to: 'Network',
        value: '0',
        timestamp: Date.now(),
        type: 'DEPOSIT'
      }, ...prev]);

      setView('DASHBOARD');
      if (user.address) fetchBalance(user.address);
    } catch (error: any) {
      const message = error.response?.data?.error || error.message;
      alert("Deployment failed: " + message);
    } finally {
      setLoading(false);
    }
  };

  const onConfirmAgreement = async () => {
    if (!activeLease) return;
    setLoading(true);
    try {
      const tx = await confirmAgreement(activeLease.id, activeLease.securityDeposit, activeLease.rentAmount);

      const lease = await getLeaseData(user.address!);
      setActiveLease(lease as any);

      // Refresh user balance after payment
      if (user.address) fetchBalance(user.address);

      setTransactions(prev => [{
        hash: tx.hash,
        from: user.address!,
        to: activeLease.id,
        value: (parseFloat(activeLease.securityDeposit) + parseFloat(activeLease.rentAmount)).toFixed(4),
        timestamp: Date.now(),
        type: 'DEPOSIT'
      }, ...prev]);
    } catch (error) {
      alert("Confirmation failed: " + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const onPayRent = async () => {
    if (!activeLease) return;
    setLoading(true);
    try {
      const tx = await payRent(activeLease.id, activeLease.rentAmount);

      const lease = await getLeaseData(user.address!);
      setActiveLease(lease as any);

      setTransactions(prev => [{
        hash: tx.hash,
        from: user.address!,
        to: activeLease.landlord,
        value: activeLease.rentAmount,
        timestamp: Date.now(),
        type: 'RENT'
      }, ...prev]);

      if (user.address) fetchBalance(user.address);
    } catch (error) {
      alert("Payment failed: " + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const onTerminate = async () => {
    alert("Termination is handled via contract. Access control applies.");
  };

  const isWrongNetwork = user.isConnected && !user.isSimulated && user.network?.chainId !== 1337 && user.network?.chainId !== 5777;

  return (
    <div className="min-h-screen flex flex-col">
      {user.isConnected && user.isSimulated && (
        <div className="bg-amber-500 text-white text-center py-1.5 px-4 text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2">
          <i className="fas fa-vial"></i>
          Simulator Mode: No real ETH is being used. Install MetaMask for real transactions.
        </div>
      )}

      {isWrongNetwork && (
        <div className="bg-red-600 text-white py-3 px-4 text-sm font-bold flex items-center justify-center gap-4 animate-in slide-in-from-top duration-500">
          <div className="flex items-center gap-2">
            <i className="fas fa-exclamation-circle text-lg animat-pulse"></i>
            <span>WRONG NETWORK DETECTED: You are currently on {user.network?.name || 'an unknown network'}.</span>
          </div>
          <button
            onClick={switchToGanache}
            className="bg-white text-red-600 px-4 py-1 rounded-full text-xs hover:bg-red-50 transition-colors shadow-sm"
          >
            Switch to Ganache (1337)
          </button>
        </div>
      )}

      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => setView('DASHBOARD')}>
              <div className="bg-indigo-600 p-2 rounded-lg text-white shadow-lg shadow-indigo-200">
                <i className="fas fa-file-contract text-xl"></i>
              </div>
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600">
                BlockLease
              </span>
            </div>

            <div className="flex items-center gap-4">
              {user.isConnected && (parseFloat(balance) === 0 || isWrongNetwork) && !user.isSimulated && (
                <div className="bg-red-50 text-red-600 px-4 py-2 rounded-xl text-[10px] font-bold border border-red-100 flex items-center gap-2">
                  <i className="fas fa-exclamation-triangle"></i>
                  {isWrongNetwork ? 'WRONG NETWORK' : 'LOW BALANCE: Check Ganache'}
                </div>
              )}

              {user.isConnected ? (
                <div className="flex items-center gap-3">
                  <div className="hidden md:block text-right">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter leading-none mb-1">
                      {user.isSimulated ? 'TESTNET WALLET' : (user.network?.name || 'LOCAL')}
                    </p>
                    <p className="text-sm font-semibold text-slate-900">{user.address?.slice(0, 6)}...{user.address?.slice(-4)}</p>
                  </div>
                  <button onClick={handleLogout} className="w-10 h-10 rounded-full flex items-center justify-center text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all">
                    <i className="fas fa-sign-out-alt"></i>
                  </button>
                </div>
              ) : (
                <button onClick={handleConnect} disabled={loading} className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-full font-semibold transition-all shadow-md flex items-center gap-2 active:scale-95 disabled:opacity-70">
                  {loading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-wallet"></i>}
                  Connect Wallet
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>

      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {!user.isConnected ? (
          <div className="flex flex-col items-center justify-center min-h-[70vh] text-center">
            <div className="max-w-3xl">
              <h1 className="text-6xl font-extrabold text-slate-900 mb-6 leading-tight tracking-tight">
                Secure Rental Agreements <br />
                <span className="text-indigo-600 underline decoration-indigo-200 decoration-4">on the Blockchain</span>
              </h1>
              <p className="text-xl text-slate-600 mb-10 leading-relaxed max-w-2xl mx-auto">
                Secure your rental property with code, not promises. Automate deposits, rent, and lease terms on the Ethereum blockchain.
              </p>
              <button onClick={handleConnect} className="px-10 py-4 bg-indigo-600 text-white rounded-2xl font-bold text-lg hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 flex items-center justify-center gap-3">
                Get Started
                <i className="fas fa-arrow-right text-sm"></i>
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            <PrototypeExplanation isSimulated={user.isSimulated || false} />
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-3xl font-bold text-slate-900 tracking-tight">
                  {view === 'CREATE' ? 'Deploy New Contract' : 'My Lease Portfolio'}
                </h2>
                <div className="flex items-center gap-4 mt-1">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${user.isSimulated ? 'bg-amber-400' : 'bg-emerald-400 animate-pulse'}`}></span>
                    <p className="text-slate-500 text-sm font-medium">Connected as <span className="text-indigo-600 font-bold">{user.role}</span></p>
                  </div>
                  <button
                    onClick={() => {
                      if (user.address) {
                        fetchBalance(user.address);
                        getLeaseData(user.address).then(l => setActiveLease(l as any));
                      }
                    }}
                    className="text-[10px] font-bold bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded hover:bg-indigo-100 transition-colors uppercase tracking-widest flex items-center gap-1"
                  >
                    <i className="fas fa-sync-alt"></i>
                    Refresh Data
                  </button>
                  <button
                    onClick={() => setUser(prev => ({ ...prev, role: prev.role === 'LANDLORD' ? 'TENANT' : 'LANDLORD' }))}
                    className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded hover:bg-indigo-100 hover:text-indigo-600 transition-colors uppercase tracking-widest"
                  >
                    Switch Role (Dev Mode)
                  </button>
                </div>
              </div>
              {user.role === 'LANDLORD' && (
                <button
                  onClick={() => setView(view === 'CREATE' ? 'DASHBOARD' : 'CREATE')}
                  className="bg-white border-2 border-indigo-600 text-indigo-600 px-6 py-2.5 rounded-xl font-bold hover:bg-indigo-600 hover:text-white transition-all flex items-center gap-2 active:scale-95"
                >
                  <i className={`fas ${view === 'CREATE' ? 'fa-arrow-left' : 'fa-plus'}`}></i>
                  {view === 'CREATE' ? 'Back to Dashboard' : 'New Rental Agreement'}
                </button>
              )}
            </div>

            {view === 'CREATE' ? (
              <ContractForm onSubmit={onCreateAgreement} loading={loading} />
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                  {activeLease ? (
                    <>
                      <ContractDetails
                        lease={activeLease}
                        role={user.role}
                        onPayRent={onPayRent}
                        onTerminate={onTerminate}
                        onConfirm={onConfirmAgreement}
                        loading={loading}
                      />
                      <TransactionHistory transactions={transactions} />
                    </>
                  ) : (
                    <div className="bg-white p-16 rounded-[2.5rem] shadow-sm border border-slate-100 text-center">
                      <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-8 text-slate-200">
                        <i className="fas fa-file-signature text-4xl"></i>
                      </div>
                      <h3 className="text-2xl font-bold text-slate-900 mb-3">No active lease found</h3>
                      <p className="text-slate-500 mb-4 max-w-sm mx-auto leading-relaxed">
                        No digital agreements found for: <br />
                        <code className="text-[10px] bg-slate-100 px-2 py-1 rounded mt-2 block break-all font-mono">{user.address}</code>
                      </p>
                      <p className="text-slate-400 text-xs mb-10 italic">
                        If you just deployed, try clicking the "Refresh Data" button above.
                      </p>
                      {user.role === 'LANDLORD' && (
                        <button onClick={() => setView('CREATE')} className="bg-indigo-600 text-white px-8 py-3 rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100">
                          Create First Agreement
                        </button>
                      )}
                    </div>
                  )}
                </div>

                <div className="space-y-6">
                  <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 p-8 rounded-[2.5rem] text-white shadow-2xl shadow-indigo-200 relative overflow-hidden group">
                    <h3 className="text-indigo-100 text-xs font-bold mb-4 uppercase tracking-[0.2em]">Wallet Balance</h3>
                    <div className="flex items-baseline gap-2 mb-8">
                      <span className="text-5xl font-extrabold tracking-tighter">
                        {parseFloat(balance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                      </span>
                      <span className="text-xl font-medium opacity-70">ETH</span>
                    </div>
                  </div>
                  <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
                    <h3 className="text-xl font-bold text-slate-900 mb-6">Agreement Health</h3>
                    <div className="space-y-5">
                      <div className="flex gap-4 items-start p-4 bg-amber-50 rounded-2xl border border-amber-100/50">
                        <div className="bg-amber-100 p-2.5 rounded-xl text-amber-600">
                          <i className="fas fa-calendar-check"></i>
                        </div>
                        <div>
                          <p className="text-sm font-bold text-amber-900 leading-none">Status</p>
                          <p className="text-xs text-amber-700 mt-2 font-medium">All systems operational</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {loading && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center">
          <div className="bg-white p-8 rounded-3xl shadow-2xl flex flex-col items-center">
            <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="font-bold text-slate-800">Broadcasting Transaction...</p>
            <p className="text-sm text-slate-500 mt-1">Waiting for block confirmation</p>
          </div>
        </div>
      )}

      <footer className="bg-white border-t border-slate-100 py-16">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-slate-400 text-xs font-medium uppercase tracking-widest">
            BlockLease Protocol • Secure Multi-Sig Infrastructure
          </p>
        </div>
      </footer>
    </div>
  );
};

export default App;
