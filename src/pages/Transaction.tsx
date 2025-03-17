import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  decodeTransactionFromUrl, 
  loadMetaKeepSDK, 
  initializeMetaKeep, 
  getWallet, 
  executeTransaction 
} from '@/lib/metakeep';
import { TransactionDetails } from '@/lib/types';
import Header from '@/components/Header';
import TransactionDetailsComponent from '@/components/TransactionDetails';
import AnimatedBackground from '@/components/AnimatedBackground';
import { Button } from '@/components/ui/button';
import { toast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft, Check } from 'lucide-react';

// MetaKeep client ID for embedded wallet
const METAKEEP_CLIENT_ID = 'YOUR_METAKEEP_CLIENT_ID'; // Replace with actual client ID

const Transaction: React.FC = () => {
  const { txData } = useParams<{ txData: string }>();
  const navigate = useNavigate();
  
  const [transaction, setTransaction] = useState<TransactionDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [executing, setExecuting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [metakeep, setMetakeep] = useState<any>(null);
  const [wallet, setWallet] = useState<any>(null);
  
  // Decode transaction data from URL
  useEffect(() => {
    const initPage = async () => {
      if (!txData) {
        setError('Invalid transaction data');
        setLoading(false);
        return;
      }
      
      try {
        // Load MetaKeep SDK
        await loadMetaKeepSDK();
        
        // Decode transaction data
        const decoded = decodeTransactionFromUrl(txData);
        if (!decoded) {
          throw new Error('Failed to decode transaction data');
        }
        
        setTransaction(decoded);
        
        // Initialize MetaKeep SDK
        const metakeepInstance = await initializeMetaKeep(
          METAKEEP_CLIENT_ID,
          decoded.chainId,
          decoded.rpcUrl
        );
        
        if (!metakeepInstance) {
          throw new Error('Failed to initialize MetaKeep SDK');
        }
        
        setMetakeep(metakeepInstance);
      } catch (err: any) {
        console.error('Error initializing transaction page:', err);
        setError(err.message || 'Failed to load transaction');
      } finally {
        setLoading(false);
      }
    };
    
    initPage();
  }, [txData]);
  
  // Handle transaction execution
  const handleExecuteTransaction = async () => {
    if (!transaction || !metakeep) return;
    
    setExecuting(true);
    setError(null);
    
    try {
      // Get wallet if not already connected
      let walletInstance = wallet;
      if (!walletInstance) {
        walletInstance = await getWallet(metakeep);
        if (!walletInstance) {
          throw new Error('Failed to connect wallet');
        }
        setWallet(walletInstance);
      }
      
      // Execute transaction
      const result = await executeTransaction(metakeep, transaction);
      
      console.log('Transaction result:', result);
      
      setSuccess(true);
      toast({
        title: "Transaction successful!",
        description: "Your transaction has been successfully executed",
      });
    } catch (err: any) {
      console.error('Transaction execution error:', err);
      setError(err.message || 'Transaction failed');
      toast({
        title: "Transaction failed",
        description: err.message || "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setExecuting(false);
    }
  };
  
  // Connect wallet
  const handleConnectWallet = async () => {
    if (!metakeep) return;
    
    try {
      const walletInstance = await getWallet(metakeep);
      if (!walletInstance) {
        throw new Error('Failed to connect wallet');
      }
      
      setWallet(walletInstance);
      toast({
        title: "Wallet connected",
        description: "Your wallet is now connected",
      });
    } catch (err: any) {
      console.error('Wallet connection error:', err);
      toast({
        title: "Connection failed",
        description: err.message || "Failed to connect wallet",
        variant: "destructive",
      });
    }
  };
  
  // Go back to home page
  const handleGoBack = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen flex flex-col">
      <AnimatedBackground />
      <Header />
      
      <main className="flex-1 container px-4 py-8 max-w-4xl">
        <Button 
          variant="ghost" 
          onClick={handleGoBack}
          className="mb-6 flex items-center space-x-2 group"
        >
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
          <span>Back to home</span>
        </Button>
        
        <h1 className="text-3xl font-bold mb-8 animate-fade-in">
          Execute Transaction
        </h1>
        
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p>Loading transaction details...</p>
          </div>
        ) : error && !transaction ? (
          <div className="glass-panel p-8 text-center">
            <p className="text-destructive text-lg mb-4">{error}</p>
            <Button onClick={handleGoBack}>Return to Home</Button>
          </div>
        ) : transaction ? (
          <div className="space-y-6">
            <TransactionDetailsComponent transaction={transaction} />
            
            <div className="glass-panel p-6 animate-slide-up shadow-lg">
              {success ? (
                <div className="flex flex-col items-center py-6">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                    <Check className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Transaction Successful</h3>
                  <p className="text-muted-foreground mb-6">Your transaction has been executed successfully</p>
                  <Button onClick={handleGoBack}>Return to Home</Button>
                </div>
              ) : (
                <div className="space-y-6">
                  <h3 className="text-xl font-medium">Ready to Execute</h3>
                  <p className="text-muted-foreground">
                    This transaction will be executed with the embedded wallet on this page.
                    Make sure you understand what this transaction will do before proceeding.
                  </p>
                  
                  {wallet ? (
                    <Button 
                      onClick={handleExecuteTransaction} 
                      disabled={executing}
                      className="w-full py-6 text-lg transition-all duration-300 hover:shadow-md"
                    >
                      {executing ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Executing Transaction...
                        </>
                      ) : 'Execute Transaction'}
                    </Button>
                  ) : (
                    <Button 
                      onClick={handleConnectWallet}
                      className="w-full py-6 text-lg transition-all duration-300 hover:shadow-md"
                    >
                      Connect Wallet to Continue
                    </Button>
                  )}
                  
                  {error && (
                    <div className="p-3 bg-destructive/10 text-destructive rounded-md text-sm">
                      {error}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : null}
      </main>
      
      <footer className="py-6 text-center text-sm text-muted-foreground">
        <p>Powered by TransactLinker using MetaKeep embedded wallets</p>
      </footer>
    </div>
  );
};

export default Transaction;
