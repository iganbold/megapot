'use client';

import { PrivyProvider } from '@privy-io/react-auth';
import { WagmiProvider } from '@privy-io/wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import { createConfig, http } from 'wagmi';
import { base } from 'wagmi/chains';
import { config } from '@/lib/config';

// Base mainnet configuration using Wagmi's built-in chain info
const wagmiConfig = createConfig({
  chains: [base],
  transports: {
    [base.id]: http(), // Uses Wagmi's default Base RPC
  },
});

// Create a query client with error handling
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

interface PrivyProviderWrapperProps {
  children: ReactNode;
}

export function PrivyProviderWrapper({ children }: PrivyProviderWrapperProps) {
  // Show helpful message if Privy App ID is missing
  if (!config.privyAppId || config.privyAppId === 'your_privy_app_id_here') {
    console.warn('🚨 Please set NEXT_PUBLIC_PRIVY_APP_ID in your .env.local file. Get it from https://console.privy.io');
  }

  return (
    <PrivyProvider
      appId={config.privyAppId || 'clxxxxxxxxxxxxxxxxxxx'}
      config={{
        // Simplified appearance configuration
        appearance: {
          theme: 'light',
          accentColor: '#676FFF',
        },
        // Enable wallet and email login
        loginMethods: ['wallet', 'email'],
        // Configure embedded wallets
        embeddedWallets: {
          createOnLogin: 'users-without-wallets',
        },
        // Configure external wallets (MetaMask is enabled by default)
        externalWallets: {
          coinbaseWallet: {
            connectionOptions: 'smartWalletOnly',
          },
          ...(config.walletConnectProjectId && config.walletConnectProjectId !== 'your-walletconnect-project-id' && {
            walletConnect: {
              enabled: true,
            },
          }),
        },
        // Base mainnet only (uses Wagmi's built-in chain config)
        supportedChains: [base],
        // WalletConnect configuration if available
        ...(config.walletConnectProjectId && config.walletConnectProjectId !== 'your-walletconnect-project-id' && {
          walletConnectCloudProjectId: config.walletConnectProjectId,
        }),
      }}
    >
      <QueryClientProvider client={queryClient}>
        <WagmiProvider config={wagmiConfig}>
          {children}
        </WagmiProvider>
      </QueryClientProvider>
    </PrivyProvider>
  );
} 