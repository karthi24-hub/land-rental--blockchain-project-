import { ethers } from 'ethers';
import { RENTAL_ABI, RENTAL_BYTECODE } from '../constants';
import { agreementApi } from './apiService';

let cachedProvider: ethers.BrowserProvider | null = null;

export const getProvider = () => {
  if (typeof window !== 'undefined' && (window as any).ethereum) {
    if (!cachedProvider) {
      cachedProvider = new ethers.BrowserProvider((window as any).ethereum);
    }
    return cachedProvider;
  }
  return null;
};

export const connectWallet = async () => {
  const provider = getProvider();

  if (!provider) {
    console.warn("MetaMask not found, entering Demo Mode.");
    return {
      address: "0x71C7656EC7ab88b098defB751B7401B5f6d8976F",
      isSimulated: true,
      network: { name: 'Demo', chainId: 0 }
    };
  }

  try {
    const accounts = await provider.send("eth_requestAccounts", []);
    const network = await provider.getNetwork();
    return {
      address: accounts[0],
      isSimulated: false,
      network: { name: network.name, chainId: Number(network.chainId) }
    };
  } catch (err) {
    throw new Error("User denied account access");
  }
};

export const deployAgreement = async (data: any) => {
  const provider = getProvider();

  if (!provider) {
    console.warn("Simulating deployment in Demo Mode...");
    await new Promise(resolve => setTimeout(resolve, 2000)); // Fake blockchain delay
    const mockAddress = "0x" + Math.random().toString(16).slice(2, 42);

    // Simulate API save
    await agreementApi.create({
      contractAddress: mockAddress,
      landlord: "0x71C7656EC7ab88b098defB751B7401B5f6d8976F",
      tenant: data.tenantAddress,
      propertyAddress: data.propertyAddress,
      rentAmount: parseFloat(data.rentAmount),
      securityDeposit: parseFloat(data.deposit),
      status: 'Created'
    });

    return { contractAddress: mockAddress, hash: "0xMockHash" + Math.random().toString(16).slice(2, 10) };
  }

  const signer = await provider.getSigner();
  const factory = new ethers.ContractFactory(RENTAL_ABI, RENTAL_BYTECODE, signer);

  // Convert ETH to Wei
  const rentAmount = ethers.parseEther(data.rentAmount);
  const deposit = ethers.parseEther(data.deposit);

  // Normalize address to fixed checksum format
  const normalizedTenant = ethers.getAddress(data.tenantAddress);

  const contract = await factory.deploy(
    normalizedTenant,
    data.propertyAddress,
    rentAmount,
    deposit,
    data.durationInDays || 365
  );

  await contract.waitForDeployment();
  const contractAddress = await contract.getAddress();

  // Save to MongoDB
  await agreementApi.create({
    contractAddress,
    landlord: await signer.getAddress(),
    tenant: data.tenantAddress,
    propertyAddress: data.propertyAddress,
    rentAmount: parseFloat(data.rentAmount),
    securityDeposit: parseFloat(data.deposit),
    status: 'Created'
  });

  return { contractAddress, hash: contract.deploymentTransaction()?.hash };
};

export const confirmAgreement = async (address: string, deposit: string, rent: string) => {
  const provider = getProvider();

  if (!provider) {
    console.warn("Simulating agreement confirmation in Demo Mode...");
    await new Promise(resolve => setTimeout(resolve, 1500));
    await agreementApi.update(address, { status: 'Active' });
    return { hash: "0xMockConfirm" + Math.random().toString(16).slice(2, 10) };
  }

  if (!address) throw new Error("Contract address is missing.");

  const signer = await provider.getSigner();
  const contract = new ethers.Contract(address, RENTAL_ABI, signer);

  // Fetch data from contract to verify
  const [contractTenant, contractLandlord, contractState, cSecurity, cRent] = await Promise.all([
    contract.tenant(),
    contract.landlord(),
    contract.state(),
    contract.securityDeposit(),
    contract.rentAmount()
  ]);

  const signerAddress = await signer.getAddress();
  const totalValueNeeded = cSecurity + cRent;
  const isTenant = signerAddress.toLowerCase() === contractTenant.toLowerCase();

  console.log('--- CRITICAL DEBUG: Confirming Agreement ---');
  console.log('Signer Address (You):', signerAddress);
  console.log('Contract Tenant:', contractTenant);
  console.log('Contract Landlord:', contractLandlord);
  console.log('Contract State:', contractState.toString(), '(0=Created, 1=Active)');
  console.log('Required Value (Wei):', totalValueNeeded.toString());
  console.log('Sending Value (Wei):', (ethers.parseEther(deposit) + ethers.parseEther(rent)).toString());
  console.log('Is Signer Tenant?:', isTenant);

  if (!isTenant) {
    throw new Error(`Auth Error: Your MetaMask account (${signerAddress.slice(0, 6)}...) is NOT the Tenant specified in this contract (${contractTenant.slice(0, 6)}...). Please switch accounts.`);
  }

  if (Number(contractState) !== 0) {
    throw new Error(`State Error: Contract is already in state ${contractState}. It must be in state 0 (Created) to confirm.`);
  }

  const totalValue = ethers.parseEther(deposit) + ethers.parseEther(rent);
  const tx = await contract.confirmAgreement({ value: totalValue });
  await tx.wait();

  // Update MongoDB
  await agreementApi.update(address, { status: 'Active' });

  return tx;
};

export const payRent = async (address: string, amount: string) => {
  const provider = getProvider();

  if (!provider) {
    console.warn("Simulating rent payment in Demo Mode...");
    await new Promise(resolve => setTimeout(resolve, 1500));
    return { hash: "0xMockRentPay" + Math.random().toString(16).slice(2, 10) };
  }

  const signer = await provider.getSigner();
  const contract = new ethers.Contract(address, RENTAL_ABI, signer);

  const rentValue = ethers.parseEther(amount);

  const tx = await contract.payRent({ value: rentValue });
  await tx.wait();

  return tx;
};

export const getLeaseDataFromChain = async (address: string) => {
  const provider = getProvider();
  if (!provider) return null;

  const contract = new ethers.Contract(address, RENTAL_ABI, provider);

  const rentAmount = await contract.rentAmount();
  const deposit = await contract.securityDeposit();
  const status = await contract.state();
  const landlord = await contract.landlord();
  const tenant = await contract.tenant();
  const rentDueDate = await contract.rentDueDate();
  const leaseEnd = await contract.leaseEndTime();

  const statusMap = ['Created', 'Active', 'Terminated', 'Completed'];

  return {
    id: address,
    landlord,
    tenant,
    rentAmount: ethers.formatEther(rentAmount),
    securityDeposit: ethers.formatEther(deposit),
    status: statusMap[Number(status)],
    nextPaymentDue: Number(rentDueDate) * 1000,
    leaseEnd: Number(leaseEnd) * 1000
  };
};

export const getNetwork = async () => {
  const provider = getProvider();
  if (!provider) return null;
  const network = await provider.getNetwork();
  return { name: network.name, chainId: Number(network.chainId) };
};

export const getBalance = async (address: string) => {
  const provider = getProvider();
  if (!provider) return "0";
  try {
    const balance = await provider.getBalance(address);
    return ethers.formatEther(balance);
  } catch (err) {
    console.error("getBalance error:", err);
    return "0";
  }
};

export const switchToGanache = async () => {
  if (typeof window !== 'undefined' && (window as any).ethereum) {
    try {
      await (window as any).ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [{
          chainId: '0x539', // 1337
          chainName: 'Ganache Local',
          nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
          rpcUrls: ['http://127.0.0.1:7545'], // Default Ganache RPC
          blockExplorerUrls: null
        }]
      });
    } catch (err) {
      console.error("Failed to add/switch network:", err);
    }
  }
};

export const getLeaseData = async (userAddress: string) => {
  try {
    console.log("Fetching lease data for:", userAddress);
    const res = await agreementApi.getByAddress(userAddress);

    if (res.data) {
      console.log("Found lease in DB:", res.data);
      // Normalize DB data to ensure UI displays correctly even if chain sync fails
      const baseData = {
        ...res.data,
        id: res.data.contractAddress,
        leaseEnd: res.data.endDate ? new Date(res.data.endDate).getTime() : 0,
        nextPaymentDue: res.data.startDate ? new Date(res.data.startDate).getTime() + (30 * 24 * 60 * 60 * 1000) : 0
      };

      try {
        // Sync with chain if we have a contract address
        const chainData = await getLeaseDataFromChain(res.data.contractAddress);
        return { ...baseData, ...chainData };
      } catch (chainErr) {
        console.warn("Chain sync failed, showing DB data only:", chainErr);
        return baseData;
      }
    }


    console.log("No lease found in DB for address:", userAddress);
    return null;
  } catch (err) {
    console.error("Error fetching lease data from API:", err);
    return null;
  }
};

export const getAgreementTransactions = async (contractAddress: string) => {
  const provider = getProvider();
  if (!provider) return [];

  try {
    const contract = new ethers.Contract(contractAddress, RENTAL_ABI, provider);

    // Get current block to limit range if needed, but for now we query from genesis (or contract creation)
    // However, querying from block 0 can be slow on mainnet. On local/testnet it's fine.
    // Ideally we should know the deployment block.

    const filterActive = contract.filters.ContractActive();
    const filterRent = contract.filters.RentPaid();
    const filterRefund = contract.filters.SecurityDepositRefunded();

    const [activeEvents, rentEvents, refundEvents] = await Promise.all([
      contract.queryFilter(filterActive),
      contract.queryFilter(filterRent),
      contract.queryFilter(filterRefund)
    ]);

    const txs: any[] = [];

    // Process ContractActive (Initial Payment)
    for (const event of activeEvents) {
      if ('getTransaction' in event) { // Setup for Ethers v6 events
        const tx = await event.getTransaction();
        const block = await event.getBlock();
        txs.push({
          hash: event.transactionHash,
          from: tx.from,
          to: contractAddress,
          value: ethers.formatEther(tx.value),
          timestamp: (block.timestamp * 1000),
          type: 'DEPOSIT'
        });
      }
    }

    // Process RentPaid
    for (const event of rentEvents) {
      const block = await event.getBlock();
      // args: [tenant, amount, date]
      const args = (event as any).args;
      txs.push({
        hash: event.transactionHash,
        from: args[0],
        to: contractAddress,
        value: ethers.formatEther(args[1]),
        timestamp: (block.timestamp * 1000), // block timestamp is usually seconds
        type: 'RENT'
      });
    }

    // Process Refunds
    for (const event of refundEvents) {
      const block = await event.getBlock();
      // args: [tenant, amount]
      const args = (event as any).args;
      txs.push({
        hash: event.transactionHash,
        from: contractAddress,
        to: args[0],
        value: ethers.formatEther(args[1]),
        timestamp: (block.timestamp * 1000),
        type: 'REFUND'
      });
    }

    return txs.sort((a, b) => b.timestamp - a.timestamp);
  } catch (err) {
    console.error("Error fetching transactions:", err);
    return [];
  }
};

