import { useState, useEffect } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt, useWatchContractEvent, useBalance } from 'wagmi';
import { parseAbi } from 'viem';
import MultiSigWalletAbi from '../abis/MultiSigWallet.json';

// Get contract address from environment or use a default for development
const CONTRACT_ADDRESS = (import.meta.env.VITE_CONTRACT_ADDRESS || '0x5FbDB2315678afecb367f032d93F642f64180aa3') as `0x${string}`;

const multiSigAbi = parseAbi([
  'function getOwners() view returns (address[])',
  'function required() view returns (uint256)',
  'function isOwner(address) view returns (bool)',
  'function getTransactionCount() view returns (uint256)',
  'function transactions(uint256) view returns (address destination, uint256 value, bytes data, bool executed)',
  'function confirmations(uint256, address) view returns (bool)',
  'function submitTransaction(address to, uint256 value, bytes calldata data)',
  'function confirmTransaction(uint256 transactionId)',
  'function revokeConfirmation(uint256 transactionId)',
  'function executeTransaction(uint256 transactionId)',
  'event Submission(uint256 indexed transactionId)',
  'event Confirmation(address indexed owner, uint256 indexed transactionId)',
  'event Revocation(address indexed owner, uint256 indexed transactionId)',
  'event ExecutionSuccess(uint256 indexed transactionId)',
  'event ExecutionFailure(uint256 indexed transactionId)',
]);

interface Transaction {
  destination: string;
  value: bigint;
  data: string;
  executed: boolean;
}

export function useMultiSig() {
  const { address } = useAccount();
  const [refetchTrigger, setRefetchTrigger] = useState(0);
  const { writeContractAsync } = useWriteContract();

  // Read contract balance
  const { data: balance, refetch: refetchBalance } = useBalance({
    address: CONTRACT_ADDRESS,
  });

  // Read owners
  const { data: owners, refetch: refetchOwners } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: multiSigAbi,
    functionName: 'getOwners',
  });

  // Read required confirmations
  const { data: required, refetch: refetchRequired } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: multiSigAbi,
    functionName: 'required',
  });

  // Check if current user is owner
  const { data: isOwner, refetch: refetchIsOwner } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: multiSigAbi,
    functionName: 'isOwner',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });

  // Get transaction count
  const { data: transactionCount, refetch: refetchTxCount } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: multiSigAbi,
    functionName: 'getTransactionCount',
  });

  // Transaction cache
  const [transactionCache, setTransactionCache] = useState<Map<number, Transaction>>(new Map());
  const [confirmationCache, setConfirmationCache] = useState<Map<string, boolean>>(new Map());

  // Function to get a specific transaction
  const getTransaction = (txId: number): Transaction | undefined => {
    return transactionCache.get(txId);
  };

  // Function to get confirmation status
  const getConfirmations = (txId: number): boolean => {
    if (!address) return false;
    const key = `${txId}-${address}`;
    return confirmationCache.get(key) || false;
  };

  // Function to get confirmation count
  const getConfirmationCount = (txId: number): number => {
    if (!owners) return 0;
    let count = 0;
    for (const owner of owners as string[]) {
      const key = `${txId}-${owner}`;
      if (confirmationCache.get(key)) {
        count++;
      }
    }
    return count;
  };

  // Fetch transaction details
  useEffect(() => {
    const fetchTransactions = async () => {
      if (!transactionCount) return;

      const count = Number(transactionCount);
      const newCache = new Map<number, Transaction>();

      for (let i = 0; i < count; i++) {
        try {
          const result = await fetch('http://localhost:8545', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              jsonrpc: '2.0',
              method: 'eth_call',
              params: [
                {
                  to: CONTRACT_ADDRESS,
                  data: `0x9ace38c2${i.toString(16).padStart(64, '0')}`, // transactions(uint256)
                },
                'latest',
              ],
              id: 1,
            }),
          });

          const data = await result.json();
          if (data.result) {
            const decoded = decodeTransaction(data.result);
            newCache.set(i, decoded);
          }
        } catch (error) {
          console.error(`Error fetching transaction ${i}:`, error);
        }
      }

      setTransactionCache(newCache);
    };

    fetchTransactions();
  }, [transactionCount, refetchTrigger]);

  // Fetch confirmations
  useEffect(() => {
    const fetchConfirmations = async () => {
      if (!transactionCount || !owners) return;

      const count = Number(transactionCount);
      const newCache = new Map<string, boolean>();

      for (let txId = 0; txId < count; txId++) {
        for (const owner of owners as string[]) {
          try {
            const ownerAddress = (owner as string).toLowerCase().replace('0x', '').padStart(64, '0');
            const result = await fetch('http://localhost:8545', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                jsonrpc: '2.0',
                method: 'eth_call',
                params: [
                  {
                    to: CONTRACT_ADDRESS,
                    data: `0x784547a7${txId.toString(16).padStart(64, '0')}${ownerAddress}`, // confirmations(uint256,address)
                  },
                  'latest',
                ],
                id: 1,
              }),
            });

            const data = await result.json();
            if (data.result) {
              const confirmed = data.result !== '0x0000000000000000000000000000000000000000000000000000000000000000';
              newCache.set(`${txId}-${owner}`, confirmed);
            }
          } catch (error) {
            console.error(`Error fetching confirmation for tx ${txId}, owner ${owner}:`, error);
          }
        }
      }

      setConfirmationCache(newCache);
    };

    fetchConfirmations();
  }, [transactionCount, owners, refetchTrigger]);

  // Watch for events to trigger refetch
  useWatchContractEvent({
    address: CONTRACT_ADDRESS,
    abi: multiSigAbi,
    eventName: 'Submission',
    onLogs() {
      refetchAll();
    },
  });

  useWatchContractEvent({
    address: CONTRACT_ADDRESS,
    abi: multiSigAbi,
    eventName: 'Confirmation',
    onLogs() {
      refetchAll();
    },
  });

  useWatchContractEvent({
    address: CONTRACT_ADDRESS,
    abi: multiSigAbi,
    eventName: 'Revocation',
    onLogs() {
      refetchAll();
    },
  });

  useWatchContractEvent({
    address: CONTRACT_ADDRESS,
    abi: multiSigAbi,
    eventName: 'ExecutionSuccess',
    onLogs() {
      refetchAll();
    },
  });

  const refetchAll = () => {
    refetchBalance();
    refetchOwners();
    refetchRequired();
    refetchIsOwner();
    refetchTxCount();
    setRefetchTrigger(prev => prev + 1);
  };

  // Write functions
  const submitTransaction = async (to: string, value: bigint, data: string) => {
    const hash = await writeContractAsync({
      address: CONTRACT_ADDRESS,
      abi: multiSigAbi,
      functionName: 'submitTransaction',
      args: [to as `0x${string}`, value, data as `0x${string}`],
    });

    // Wait for transaction and refetch
    setTimeout(refetchAll, 2000);
    return hash;
  };

  const confirmTransaction = async (txId: number) => {
    const hash = await writeContractAsync({
      address: CONTRACT_ADDRESS,
      abi: multiSigAbi,
      functionName: 'confirmTransaction',
      args: [BigInt(txId)],
    });

    setTimeout(refetchAll, 2000);
    return hash;
  };

  const revokeConfirmation = async (txId: number) => {
    const hash = await writeContractAsync({
      address: CONTRACT_ADDRESS,
      abi: multiSigAbi,
      functionName: 'revokeConfirmation',
      args: [BigInt(txId)],
    });

    setTimeout(refetchAll, 2000);
    return hash;
  };

  const executeTransaction = async (txId: number) => {
    const hash = await writeContractAsync({
      address: CONTRACT_ADDRESS,
      abi: multiSigAbi,
      functionName: 'executeTransaction',
      args: [BigInt(txId)],
    });

    setTimeout(refetchAll, 2000);
    return hash;
  };

  return {
    // State
    balance: balance?.value,
    owners: owners as string[] | undefined,
    required,
    isOwner: isOwner as boolean | undefined,
    transactionCount,
    isLoading: false,
    
    // Functions
    getTransaction,
    getConfirmations,
    getConfirmationCount,
    submitTransaction,
    confirmTransaction,
    revokeConfirmation,
    executeTransaction,
    refetch: refetchAll,
  };
}

// Helper function to decode transaction data from eth_call result
function decodeTransaction(hexData: string): Transaction {
  // Remove 0x prefix
  const data = hexData.slice(2);
  
  // Each parameter is 32 bytes (64 hex chars)
  const destination = '0x' + data.slice(24, 64); // address (20 bytes, right-padded)
  const value = BigInt('0x' + data.slice(64, 128));
  
  // Data offset
  const dataOffset = parseInt(data.slice(128, 192), 16) * 2;
  const dataLength = parseInt(data.slice(dataOffset, dataOffset + 64), 16) * 2;
  const txData = '0x' + data.slice(dataOffset + 64, dataOffset + 64 + dataLength);
  
  // Executed flag
  const executed = data.slice(192, 256) !== '0'.repeat(64);

  return {
    destination,
    value,
    data: txData || '0x',
    executed,
  };
}
