
export enum LeaseStatus {
  CREATED = 'CREATED',
  ACTIVE = 'ACTIVE',
  TERMINATED = 'TERMINATED',
  DISPUTED = 'DISPUTED'
}

export interface LeaseAgreement {
  id: string;
  landlord: string;
  tenant: string;
  rentAmount: string; // in ETH
  securityDeposit: string; // in ETH
  leaseStart: number; // timestamp
  leaseEnd: number; // timestamp
  status: LeaseStatus;
  balance: string;
  nextPaymentDue: number;
}

export interface Transaction {
  hash: string;
  from: string;
  to: string;
  value: string;
  timestamp: number;
  type: 'RENT' | 'DEPOSIT' | 'WITHDRAWAL' | 'REFUND';
}

export interface UserState {
  address: string | null;
  isConnected: boolean;
  role: 'LANDLORD' | 'TENANT' | 'NONE';
}
