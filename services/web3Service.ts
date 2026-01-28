import { ethers } from 'ethers';
import { RENTAL_ABI, RENTAL_BYTECODE } from '../constants';
import { agreementApi } from './apiService';

export const getProvider = () => {
  if (typeof window !== 'undefined' && (window as any).ethereum) {
    return new ethers.BrowserProvider((window as any).ethereum);
  }
  return null;
};

export const connectWallet = async () => {
  const provider = getProvider();

  if (!provider) {
    console.warn("MetaMask not found, entering Demo Mode.");
    return {
      address: "0x71C7656EC7ab88b098defB751B7401B5f6d8976F",
      isSimulated: true
    };
  }

  try {
    const accounts = await provider.send("eth_requestAccounts", []);
    return { address: accounts[0], isSimulated: false };
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

  // Use BigInt math to avoid floating point issues
  const totalValue = ethers.parseEther(deposit) + ethers.parseEther(rent);

  console.log('--- Debug: Confirming Agreement ---');
  console.log('Contract Address:', address);
  console.log('Signer Address:', await signer.getAddress());
  console.log('Sending Total Value:', ethers.formatEther(totalValue), 'ETH');

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

export const getBalance = async (address: string) => {
  const provider = getProvider();
  if (!provider) return "0";
  const balance = await provider.getBalance(address);
  return ethers.formatEther(balance);
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
