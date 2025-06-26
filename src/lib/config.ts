export const config = {
  privyAppId: process.env.NEXT_PUBLIC_PRIVY_APP_ID || '',
  megapotSubgraphUrl: process.env.NEXT_PUBLIC_MEGAPOT_SUBGRAPH_URL || '',
  walletConnectProjectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '',
  basescanApiKey: process.env.NEXT_PUBLIC_BASESCAN_API_KEY || '',
  megapotProxyContractAddress: process.env.NEXT_PUBLIC_MEGAPOT_PROXY_CONTRACT_ADDRESS || '0xbEDd4F2beBE9E3E636161E644759f3cbe3d51B95',
  megapotMainnetTestContractAddress: process.env.NEXT_PUBLIC_MEGAPOT_MAINNET_TEST_CONTRACT_ADDRESS || '',
} as const; 