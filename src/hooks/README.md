# Hooks Architecture

## Overview

The jackpot hooks have been refactored to follow modern React and Web3 best practices, separating concerns for better maintainability, testability, and performance.

## Structure

### `useCurrentJackpot()` - Main Hook
The primary hook that combines data fetching and calculations. This is what components should use.

```ts
const { formattedJackpot, timeLeft, price, odds, isLoading, error } = useCurrentJackpot();
```

### `useJackpotData()` - Data Fetching
Pure data fetching hook using `useReadContracts` for efficient batched calls.

- ✅ Single network request instead of 8 separate calls
- ✅ Automatic retry and caching via TanStack Query
- ✅ Multi-network support via config
- ✅ Type-safe data transformation

### Business Logic - `src/lib/jackpot-calculations.ts`
Pure functions for jackpot calculations, separated from React hooks.

- ✅ Easy to unit test
- ✅ Reusable across different contexts
- ✅ Clear input/output types
- ✅ No side effects

## Benefits of Refactoring

| Before | After |
|--------|-------|
| 8 separate `useReadContract` calls | 1 batched `useReadContracts` call |
| Hardcoded contract address | Multi-network config support |
| Business logic mixed with data fetching | Separated concerns |
| Hard to test calculations | Pure functions, easy testing |
| Basic error handling | Comprehensive error states |
| No caching optimization | Optimized caching strategy |

## Configuration

Contract addresses are configured in `src/lib/config.ts`:

```ts
export const CONTRACTS = {
  [base.id]: {
    jackpot: '0xbEDd4F2beBE9E3E636161E644759f3cbe3d51B95',
  },
  [baseSepolia.id]: {
    jackpot: process.env.NEXT_PUBLIC_JACKPOT_TESTNET_ADDRESS || '0x...',
  },
};
```

## Usage Examples

### Basic Usage
```tsx
function JackpotDisplay() {
  const { formattedJackpot, isLoading, error } = useCurrentJackpot();
  
  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  
  return <div>Jackpot: {formattedJackpot} USDC</div>;
}
```

### Advanced Usage
```tsx
function JackpotStats() {
  const { 
    formattedJackpot, 
    timeLeft, 
    price, 
    odds, 
    contractAddress,
    hasData 
  } = useCurrentJackpot();
  
  return (
    <div>
      <div>Contract: {contractAddress}</div>
      <div>Jackpot: {formattedJackpot} USDC</div>
      <div>Time: {timeLeft}s</div>
      <div>Price: {price} USDC</div>
      <div>Odds: 1 in {odds}</div>
    </div>
  );
}
```

## Future Improvements

- Add Zod validation for contract data
- Implement optimistic updates for better UX
- Add retry logic with exponential backoff
- Create error boundary components
- Add performance monitoring 