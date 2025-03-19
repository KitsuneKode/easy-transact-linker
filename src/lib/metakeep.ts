import { TransactionDetails } from './types';

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
export const getContractFunctions = (abi) => {
  return abi.filter((item) => item.type === 'function');
};

// Create shareable link
export const createShareableLink = (transactionDetails: TransactionDetails) => {
  const baseUrl = window.location.origin;
  const txData = encodeURIComponent(btoa(JSON.stringify(transactionDetails)));
  return `${baseUrl}/transaction/${txData}`;
};

// Decode transaction from URL
export const decodeTransactionFromUrl = (
  urlParam: string
): TransactionDetails | null => {
  try {
    const decoded = JSON.parse(atob(decodeURIComponent(urlParam)));
    return decoded as TransactionDetails;
  } catch (error) {
    console.error('Failed to decode transaction from URL:', error);
    return null;
  }
};

// Log transaction analytics
export const logTransactionEvent = (event: string, data) => {
  console.log(`[Analytics] ${event}:`, data);

  try {
    const analyticsData = {
      timestamp: new Date().toISOString(),
      event,
      data,
    };

    // Record event to analytics service
    recordAnalyticsEvent(analyticsData);

    // Also log page load events to backend
    recordPageLoadToBackend(analyticsData);
  } catch (error) {
    console.error('Failed to log analytics event:', error);
  }
};

// Record analytics event to backend
export const recordAnalyticsEvent = async (data) => {
  try {
    await fetch(
      `${
        process.env.REACT_APP_API_URL || 'http://localhost:3001'
      }/api/analytics/event`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          event: data.event,
          data: data.data,
        }),
        keepalive: true,
      }
    );
  } catch (error) {
    console.error('Failed to record analytics event to backend:', error);
  }
};

// Record page load event specifically
export const recordPageLoadToBackend = async (data) => {
  try {
    await fetch(
      `${
        process.env.REACT_APP_API_URL || 'http://localhost:3001'
      }/api/analytics/pageload`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
        keepalive: true,
      }
    );
  } catch (error) {
    console.error('Failed to record page load to backend:', error);
  }
};

// Get analytics data from backend API
export const getAnalyticsData = async () => {
  try {
    const response = await fetch(
      `${
        process.env.REACT_APP_API_URL || 'http://localhost:3001'
      }/api/analytics/pageloads`
    );
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Failed to get analytics data from backend:', error);
    return [];
  }
};
