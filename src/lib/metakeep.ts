import { TransactionDetails } from './types';

// MetaKeep SDK will be loaded from CDN
declare global {
  interface Window {
    metakeep: any;
    Web3: any;
  }
}

// Load MetaKeep SDK from CDN
export const loadMetaKeepSDK = () => {
  return new Promise<void>((resolve, reject) => {
    if (window.metakeep) {
      console.log('MetaKeep SDK already loaded');
      resolve();
      return;
    }

    // Create script element
    const script = document.createElement('script');
    script.src = 'https://sdk.metakeep.xyz/dist/metakeep.js';
    script.async = true;
    
    // Set callbacks
    script.onload = () => {
      console.log('MetaKeep SDK loaded successfully');
      resolve();
    };
    
    script.onerror = (error) => {
      console.error('Error loading MetaKeep SDK:', error);
      reject(new Error('Failed to load MetaKeep SDK'));
    };
    
    // Append to document
    document.head.appendChild(script);
  });
};

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

// Log transaction analytics
export const logTransactionEvent = (event: string, data: any) => {
  console.log(`[Analytics] ${event}:`, data);
  
  try {
    const analyticsData = {
      timestamp: new Date().toISOString(),
      event,
      data,
    };
    
    // Record event to analytics service
    recordAnalyticsEvent(analyticsData);
  } catch (error) {
    console.error('Failed to log analytics event:', error);
  }
};

// Record analytics event to backend
export const recordAnalyticsEvent = async (data: any) => {
  try {
    // Store in localStorage for demonstration
    const analytics = JSON.parse(localStorage.getItem('txlinker_analytics') || '[]');
    analytics.push(data);
    localStorage.setItem('txlinker_analytics', JSON.stringify(analytics));
  } catch (error) {
    console.error('Failed to record analytics event:', error);
  }
};

// Get analytics data
export const getAnalyticsData = () => {
  try {
    return JSON.parse(localStorage.getItem('txlinker_analytics') || '[]');
  } catch (error) {
    console.error('Failed to get analytics data:', error);
    return [];
  }
};
