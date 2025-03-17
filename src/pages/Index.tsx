import React, { useEffect } from 'react';
import Header from '@/components/Header';
import DeveloperForm from '@/components/DeveloperForm';
import AnimatedBackground from '@/components/AnimatedBackground';
import { loadMetaKeepSDK } from '@/lib/metakeep';

const Index: React.FC = () => {
  // Load MetaKeep SDK and Web3 when the page loads
  useEffect(() => {
    const loadSDKs = async () => {
      try {
        // Load MetaKeep SDK
        await loadMetaKeepSDK();
        console.log('MetaKeep SDK loaded successfully');
        
        // Load Web3.js
        if (!window.Web3) {
          const script = document.createElement('script');
          script.src = 'https://cdn.jsdelivr.net/npm/web3@1.8.0/dist/web3.min.js';
          script.async = true;
          document.head.appendChild(script);
          console.log('Web3.js loading...');
        }
      } catch (error) {
        console.error('Failed to load dependencies:', error);
      }
    };
    
    loadSDKs();
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <AnimatedBackground />
      <Header />
      
      <main className="flex-1 container px-4 py-12 max-w-6xl">
        <div className="text-center mb-12 space-y-4 animate-fade-in">
          <div className="inline-block">
            <span className="bg-primary/10 text-primary text-xs px-4 py-1.5 rounded-full font-medium">
              Web3 Developer Tool
            </span>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/80">
            Transaction Linker
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Create and share smart contract transactions with embedded wallets
          </p>
        </div>
        
        <div className="mt-8">
          <DeveloperForm />
        </div>
      </main>
      
      <footer className="py-6 text-center text-sm text-muted-foreground">
        <p>Built with MetaKeep embedded wallet technology</p>
      </footer>
    </div>
  );
};

export default Index;
