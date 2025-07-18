import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { logTransactionEvent } from '@/lib/metakeep';
import { MetaKeep } from 'metakeep';
import React, { useEffect, useState } from 'react';
import Web3 from 'web3';

interface SimpleWalletProps {
  transactionDetails?: {
    contractAddress: string;
    chainId: number;
    functionName: string;
    functionInputs: { [key: string]: string };
  };
}

const SimpleWallet: React.FC<SimpleWalletProps> = ({ transactionDetails }) => {
  const [response, setResponse] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [metaKeep, setMetaKeep] = useState(null);
  const [web3, setWeb3] = useState<Web3>(null);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);

  // Initialize MetaKeep SDK
  useEffect(() => {
    const initSDK = async () => {
      try {
        const chainId = transactionDetails?.chainId || 80001; // Default to Mumbai Testnet

        const metakeepInstance = new MetaKeep({
          appId: '9cc98bca-da35-4da8-8f10-655b3e51cb9e',
          chainId,
          rpcNodeUrls: { [chainId]: getRpcUrlForChain(chainId) },
        });

        setMetaKeep(metakeepInstance);

        console.log('Initializing MetaKeep Web3 provider');
        const web3Provider = await metakeepInstance.ethereum;
        const web3Instance = new Web3(web3Provider);

        //@ts-ignore
        const accounts = await web3Instance.eth.getAccounts();
        console.log(accounts, 'accounts');
        
        if (accounts && accounts.length > 0) {
          setWalletAddress(accounts[0]);
          
          // Log wallet connection event
          logTransactionEvent('wallet_connected', {
            address: accounts[0],
            chainId: chainId
          });
        }
        
        setWeb3(web3Instance);

        console.log('MetaKeep SDK initialized successfully');
      } catch (error) {
        console.error('Failed to initialize MetaKeep SDK:', error);
        setError('Failed to initialize wallet');
        
        // Log wallet initialization error
        logTransactionEvent('wallet_init_error', {
          error: (error as Error).message,
          chainId: transactionDetails?.chainId
        });
      }
    };

    const setup = async () => {
      await initSDK();
    };

    setup();
  }, [transactionDetails]);

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

  const safeBigIntToJSON = (obj: any): any => {
    return JSON.parse(JSON.stringify(obj, (_, value) => 
      typeof value === 'bigint' ? value.toString() : value
    ));
  };

  const sendTransaction = async () => {
    setIsLoading(true);
    setError(null);
    setResponse(null);

    // Log transaction execution start
    logTransactionEvent('transaction_execution_start', {
      to: transactionDetails?.functionInputs._to,
      value: transactionDetails?.functionInputs._value,
      chainId: transactionDetails?.chainId
    });

    try {
      const to = transactionDetails?.functionInputs._to;
      const value = transactionDetails?.functionInputs._value;
      const gas = transactionDetails?.functionInputs.gas;
      const maxgas = transactionDetails?.functionInputs.maxgas;
      const maxpriogas = transactionDetails?.functionInputs.maxpriogas;
      const web3Accounts = await metaKeep.getWallet();

      
      const nonceValue = await web3.eth.getTransactionCount(
        web3Accounts['wallet']['ethAddress'],
        'latest'
      );
      

      const txObj = {
        to,
        from: web3Accounts['wallet']['ethAddress'],
        value: "0x2710",
        nonce: "0x1",
        data: "0x0123456789",
        gas: 23,
        maxFeePerGas: 1000,
        maxPriorityFeePerGas: 999,
        chainId: 137,
      };

      console.log(txObj);
      const result = await metaKeep.signTransaction(txObj, `invoking the function ${transactionDetails?.functionName}`);
      

      // const result = await web3.eth.sendTransaction(txObj, web3Accounts['wallet']['ethAddress'] )
      console.log(result);
      
      const safeResult = safeBigIntToJSON(result);
      
      setResponse(JSON.stringify(safeResult, null, 2));
      
      logTransactionEvent('transaction_success', {
        to,
        value,
        chainId: transactionDetails?.chainId,
        transactionHash: safeResult.transactionHash
      });
      
      toast({
        title: 'Transaction sent',
        description: `Transaction hash: ${safeResult.transactionHash.substring(
          0,
          10
        )}...`,
      });
    } catch (error) {
      console.error('Transaction error:', error.message);
      setError(error.message || 'Transaction failed');
      
      logTransactionEvent('transaction_error', {
        to: transactionDetails?.functionInputs._to,
        value: transactionDetails?.functionInputs._value,
        chainId: transactionDetails?.chainId,
        error: (error as Error).message
      });
      
      toast({
        title: 'Transaction failed',
        description: error.message || 'Failed to send transaction',
        variant: 'destructive',
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
        {walletAddress && (
          <div className="bg-secondary p-3 rounded-md text-sm break-all">
            <span className="font-medium">Connected:</span> {walletAddress}
          </div>
        )}
        
        <div className="space-y-2">
          <Label htmlFor="to-address">Recipient Address</Label>
          <Input
            id="to-address"
            placeholder="0x..."
            disabled
            value={transactionDetails.functionInputs._to}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="amount">Amount (in ETH/MATIC)</Label>
          <Input
            id="amount"
            disabled
            value={transactionDetails.functionInputs._value}
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
          disabled={isLoading}
        >
          {isLoading ? 'Processing...' : 'Send Transaction'}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default SimpleWallet;
