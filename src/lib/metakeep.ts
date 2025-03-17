import { TransactionDetails } from './types';

// MetaKeep SDK will be loaded from CDN
declare global {
  interface Window {
    metakeep: any;
  }
}

// Initialize MetaKeep SDK
export const initializeMetaKeep = async (clientId: string, chainId: number, rpcUrl: string) => {
  if (!window.metakeep) {
    console.error('MetaKeep SDK not loaded');
    return null;
  }

  try {
    const metakeep = await window.metakeep.init({
      clientId,
      chain: {
        id: chainId,
        rpcUrl,
      },
    });
    return metakeep;
  } catch (error) {
    console.error('Failed to initialize MetaKeep SDK:', error);
    return null;
  }
};

// Get the user's wallet
export const getWallet = async (metakeep: any) => {
  try {
    const wallet = await metakeep.connect();
    return wallet;
  } catch (error) {
    console.error('Failed to connect wallet:', error);
    return null;
  }
};

// Parse ABI string to JSON
export const parseABI = (abiString: string) => {
  try {
    const parsedABI = JSON.parse(abiString);
    return parsedABI;
  } catch (error) {
    console.error('Failed to parse ABI:', error);
    return null;
  }
};

// Get contract functions from ABI
export const getContractFunctions = (abi: any[]) => {
  return abi.filter((item) => item.type === 'function');
};

// Prepare transaction data
export const prepareTransaction = async (
  metakeep: any,
  transactionDetails: TransactionDetails
) => {
  const { contractAddress, functionName, functionInputs, abi } = transactionDetails;
  
  try {
    const parsedABI = parseABI(abi);
    if (!parsedABI) throw new Error('Invalid ABI');
    
    const functionABI = parsedABI.find(
      (item: any) => item.type === 'function' && item.name === functionName
    );
    
    if (!functionABI) throw new Error(`Function ${functionName} not found in ABI`);
    
    // Prepare function arguments in correct order based on ABI
    const args = functionABI.inputs.map((input: any) => {
      const value = functionInputs[input.name];
      // Convert value to appropriate type
      if (input.type.includes('int')) {
        return value; // Web3 will handle conversion
      }
      return value;
    });
    
    // Create contract instance
    const contract = metakeep.contract(parsedABI, contractAddress);
    
    // Prepare transaction
    return {
      contract,
      method: functionName,
      args,
      functionABI,
    };
  } catch (error) {
    console.error('Failed to prepare transaction:', error);
    throw error;
  }
};

// Execute transaction
export const executeTransaction = async (
  metakeep: any,
  transactionDetails: TransactionDetails
) => {
  try {
    const { contract, method, args } = await prepareTransaction(
      metakeep,
      transactionDetails
    );
    
    // Execute transaction
    const result = await contract.methods[method](...args).send();
    return result;
  } catch (error) {
    console.error('Transaction failed:', error);
    throw error;
  }
};

// Create shareable link
export const createShareableLink = (transactionDetails: TransactionDetails) => {
  const baseUrl = window.location.origin;
  const txData = encodeURIComponent(btoa(JSON.stringify(transactionDetails)));
  return `${baseUrl}/transaction/${txData}`;
};

// Decode transaction from URL
export const decodeTransactionFromUrl = (urlParam: string): TransactionDetails | null => {
  try {
    const decoded = JSON.parse(atob(decodeURIComponent(urlParam)));
    return decoded as TransactionDetails;
  } catch (error) {
    console.error('Failed to decode transaction from URL:', error);
    return null;
  }
};

// Load MetaKeep SDK from CDN
export const loadMetaKeepSDK = () => {
  return new Promise<void>((resolve, reject) => {
    if (window.metakeep) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://unpkg.com/@metakeep/metakeep-web@latest/dist/metakeep.min.js';
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load MetaKeep SDK'));
    
    document.head.appendChild(script);
  });
};
