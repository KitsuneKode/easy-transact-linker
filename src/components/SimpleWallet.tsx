import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { MetaKeep } from 'metakeep';
import Web3, { Address } from 'web3';

interface SimpleWalletProps {
  transactionDetails?: {
    contractAddress: string;
    chainId: number;
    functionInputs: { [key: string]: string };
  };
}

const SimpleWallet: React.FC<SimpleWalletProps> = ({ transactionDetails }) => {
  const [response, setResponse] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [amount, setAmount] = useState(0);
  const [toAddress, setToAddress] = useState('');
  const [metaKeep, setMetaKeep] = useState(null);
  const [web3, setWeb3] = useState(null);

  // Initialize MetaKeep SDK
  useEffect(() => {
    const initSDK = async () => {
      try {
        const chainId = transactionDetails?.chainId || 80001; // Default to Mumbai Testnet

        const metakeepInstance = new MetaKeep({
          appId: '9cc98bca-da35-4da8-8f10-655b3e51cb9e',

          chainId,
          environment: 'dev',
          rpcNodeUrls: { [chainId]: getRpcUrlForChain(chainId) },
        });

        setMetaKeep(metakeepInstance);

        console.log('Initiazing MetaKeep Web3 provider');
        const web3Provider = await metakeepInstance.ethereum;
        const web3Instance = new Web3(web3Provider);

        const accounts = await web3Instance.eth.getAccounts();
        console.log(accounts, 'accounts');
        setWeb3(web3Instance);

        console.log('MetaKeep SDK initialized successfully');
      } catch (error) {
        console.error('Failed to initialize MetaKeep SDK:', error);

        setError('Failed to initialize wallet');
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

  const sendTransaction = async () => {
    setIsLoading(true);
    setError(null);
    setResponse(null);

    try {
      const chainId = transactionDetails?.chainId;
      // const value = transactionDetails?.functionInputs.wad;
      // const toAddress = transactionDetails?.functionInputs.dst;
      const gas = transactionDetails?.functionInputs.gas;
      const maxgas = transactionDetails?.functionInputs.maxgas;
      const maxpriogas = transactionDetails?.functionInputs.maxpriogas;
      console.error('1');
      const web3Accounts = await metaKeep.getWallet();
      console.error(web3Accounts);
      const nonce = await web3.eth.getTransactionCount(
        web3Accounts['wallets']['ethAddress'],
        'latest'
      );

      const txObj = {
        type: 2,
        from: web3Accounts['wallets']['ethAddress'],
        to: toAddress,
        value: web3.utils.toWei(amount.toString(), 'ether'),
        nonce,
        data: '0x0123456789',
        gas,
        maxFeePerGas: maxgas,
        maxPriorityFeePerGas: maxpriogas,
        chainId,
      };

      const result = await metaKeep.signTransaction(txObj, 'reason');

      setResponse(JSON.stringify(result, null, 2));
      toast({
        title: 'Transaction sent',
        description: `Transaction hash: ${result.transactionHash.substring(
          0,
          10
        )}...`,
      });
    } catch (error) {
      console.error('Transaction error:', error);
      setError(error.message || 'Transaction failed');
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
        {/* {!address ? (
          <Button
            onClick={connectWallet}
            className="w-full"
            disabled={isLoading || !metaKeep}
          >
            {isLoading ? 'Connecting...' : 'Connect Wallet'}
          </Button>
        ) : (
          <div className="bg-secondary p-3 rounded-md text-sm break-all">
            <span className="font-medium">Connected:</span> {address}
          </div>
        )} */}
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
            onChange={(e) => setAmount(parseInt(e.target.value))}
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
