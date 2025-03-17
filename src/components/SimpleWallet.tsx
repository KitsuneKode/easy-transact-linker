import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';

interface SimpleWalletProps {
  transactionDetails?: {
    contractAddress: string;
    chainId: number;
  };
}

const SimpleWallet: React.FC<SimpleWalletProps> = ({ transactionDetails }) => {
  const [address, setAddress] = useState<string>('');
  const [toAddress, setToAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [response, setResponse] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [metaKeep, setMetaKeep] = useState<any>(null);
  const [web3, setWeb3] = useState<any>(null);

  // Initialize MetaKeep SDK
  useEffect(() => {
    const initSDK = async () => {
      try {
        if (!window.metakeep) {
          toast({
            title: "MetaKeep SDK not loaded",
            description: "Please wait for the SDK to load or refresh the page",
            variant: "destructive",
          });
          return;
        }

        const chainId = transactionDetails?.chainId || 80001; // Default to Mumbai Testnet
        
        const metakeepInstance = await window.metakeep.init({
          clientId: "2452849e-d6e9-40ef-bbfd-5dfdc7ce1728", // Default testing client ID
          chain: {
            id: chainId,
            rpcUrl: getRpcUrlForChain(chainId),
          }
        });
        
        setMetaKeep(metakeepInstance);
        
        // Create Web3 instance from MetaKeep provider
        if (metakeepInstance && metakeepInstance.ethereum) {
          const web3Instance = new window.Web3(metakeepInstance.ethereum);
          setWeb3(web3Instance);
        }
        
        console.log("MetaKeep SDK initialized successfully");
      } catch (error) {
        console.error("Failed to initialize MetaKeep SDK:", error);
        setError("Failed to initialize wallet");
      }
    };

    // Load Web3.js if needed
    const loadWeb3 = () => {
      if (window.Web3) return Promise.resolve();
      
      return new Promise<void>((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/web3@1.8.0/dist/web3.min.js';
        script.async = true;
        
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Failed to load Web3.js'));
        
        document.head.appendChild(script);
      });
    };

    const setup = async () => {
      try {
        await loadWeb3();
        await initSDK();
      } catch (error) {
        console.error("Setup failed:", error);
      }
    };
    
    setup();
  }, [transactionDetails]);

  // Get RPC URL based on chain ID
  const getRpcUrlForChain = (chainId: number): string => {
    switch (chainId) {
      case 1: 
        return 'https://ethereum.publicnode.com';
      case 5:
        return 'https://goerli.infura.io/v3/';
      case 137:
        return 'https://polygon-rpc.com';
      case 80001:
        return 'https://rpc.ankr.com/polygon_mumbai';
      case 42161:
        return 'https://arb1.arbitrum.io/rpc';
      case 43114:
        return 'https://api.avax.network/ext/bc/C/rpc';
      case 56:
        return 'https://bsc-dataseed.binance.org';
      default:
        return 'https://rpc.ankr.com/polygon_mumbai';
    }
  };

  // Connect wallet
  const connectWallet = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      if (!metaKeep) {
        throw new Error("MetaKeep SDK not initialized");
      }
      
      const addresses = await metaKeep.connect();
      if (addresses && addresses.length > 0) {
        setAddress(addresses[0]);
        toast({
          title: "Wallet connected",
          description: `Connected with address: ${addresses[0].substring(0, 8)}...`,
        });
      }
    } catch (error: any) {
      console.error("Connection error:", error);
      setError(error.message || "Failed to connect wallet");
      toast({
        title: "Connection failed",
        description: error.message || "Failed to connect wallet",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Send transaction
  const sendTransaction = async () => {
    setIsLoading(true);
    setError(null);
    setResponse(null);
    
    try {
      if (!metaKeep || !web3) {
        throw new Error("MetaKeep SDK or Web3 not initialized");
      }
      
      if (!address) {
        await connectWallet();
      }
      
      if (!toAddress || !amount) {
        throw new Error("Recipient address and amount are required");
      }
      
      // Check if address is valid
      if (!web3.utils.isAddress(toAddress)) {
        throw new Error("Invalid recipient address");
      }
      
      const nonce = await web3.eth.getTransactionCount(address, "latest");
      const chainId = transactionDetails?.chainId || 80001;
      
      const txObj = {
        from: address,
        to: toAddress,
        data: "",
        value: web3.utils.toWei(amount.toString(), "ether"),
        nonce,
        gas: 350000,
        maxFeePerGas: 50000000000,
        maxPriorityFeePerGas: 50000000000,
        chainId,
      };
      
      const result = await web3.eth.sendTransaction(txObj);
      
      setResponse(JSON.stringify(result, null, 2));
      toast({
        title: "Transaction sent",
        description: `Transaction hash: ${result.transactionHash.substring(0, 10)}...`,
      });
    } catch (error: any) {
      console.error("Transaction error:", error);
      setError(error.message || "Transaction failed");
      toast({
        title: "Transaction failed",
        description: error.message || "Failed to send transaction",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Send Transaction</CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {!address ? (
          <Button 
            onClick={connectWallet} 
            className="w-full" 
            disabled={isLoading || !metaKeep}
          >
            {isLoading ? "Connecting..." : "Connect Wallet"}
          </Button>
        ) : (
          <div className="bg-secondary p-3 rounded-md text-sm break-all">
            <span className="font-medium">Connected:</span> {address}
          </div>
        )}
        
        <div className="space-y-2">
          <Label htmlFor="to-address">Recipient Address</Label>
          <Input
            id="to-address"
            placeholder="0x..."
            value={toAddress}
            onChange={(e) => setToAddress(e.target.value)}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="amount">Amount (in ETH/MATIC)</Label>
          <Input
            id="amount"
            type="number"
            step="0.0001"
            min="0"
            placeholder="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>
        
        {error && (
          <div className="p-3 bg-destructive/10 text-destructive rounded-md text-sm">
            {error}
          </div>
        )}
        
        {response && (
          <div className="p-3 bg-secondary rounded-md text-xs font-mono overflow-auto max-h-40">
            {response}
          </div>
        )}
      </CardContent>
      
      <CardFooter>
        <Button 
          onClick={sendTransaction} 
          className="w-full"
          disabled={isLoading || !address || !toAddress || !amount}
        >
          {isLoading ? "Processing..." : "Send Transaction"}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default SimpleWallet;
