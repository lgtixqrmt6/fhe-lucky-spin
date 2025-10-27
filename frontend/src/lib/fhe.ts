import { getAddress, toHex } from 'viem';

declare global {
  interface Window {
    relayerSDK?: {
      initSDK: () => Promise<void>;
      createInstance: (config: Record<string, unknown>) => Promise<any>;
      SepoliaConfig: Record<string, unknown>;
    };
    ethereum?: any;
    okxwallet?: { provider?: any };
    coinbaseWalletExtension?: any;
  }
}

let fheInstance: any = null;
let fheInstancePromise: Promise<any> | null = null;
let sdkPromise: Promise<any> | null = null;

const SDK_URL = 'https://cdn.zama.ai/relayer-sdk-js/0.2.0/relayer-sdk-js.umd.cjs';

const resolveProvider = (provider?: any) => {
  if (typeof window === 'undefined') {
    return undefined;
  }

  return (
    provider ||
    window.ethereum ||
    window.okxwallet?.provider ||
    window.okxwallet ||
    window.coinbaseWalletExtension
  );
};

const loadSdk = async (): Promise<any> => {
  if (typeof window === 'undefined') {
    throw new Error('FHE SDK requires browser environment');
  }

  // If SDK already loaded, return immediately
  if (window.relayerSDK) {
    console.log('✅ [FHE SDK] SDK already loaded from window');
    return window.relayerSDK;
  }

  // Wait for SDK to finish loading
  if (!sdkPromise) {
    sdkPromise = new Promise((resolve, reject) => {
      const checkSDK = () => {
        if (window.relayerSDK) {
          console.log('✅ [FHE SDK] SDK loaded successfully');
          resolve(window.relayerSDK);
        } else {
          // If preloaded in HTML but not ready yet, keep waiting
          setTimeout(checkSDK, 100);
        }
      };

      // Start checking
      checkSDK();

      // Set timeout
      setTimeout(() => {
        if (!window.relayerSDK) {
          reject(new Error('FHE SDK failed to load within timeout'));
        }
      }, 10000);
    });
  }

  return sdkPromise;
};

export async function getFhevmInstance(provider?: any): Promise<any> {
  if (fheInstance) {
    console.log('✅ [FHE Instance] Using cached instance');
    return fheInstance;
  }

  if (fheInstancePromise) {
    console.log('⏳ [FHE Instance] Waiting for existing initialization...');
    return fheInstancePromise;
  }

  fheInstancePromise = (async () => {
    console.log('🚀 [FHE Instance] Starting FHE instance initialization...');

    if (typeof window === 'undefined') {
      throw new Error('FHE SDK requires browser environment');
    }

    const ethereumProvider = resolveProvider(provider);
    if (!ethereumProvider) {
      console.error('❌ [FHE Instance] No Ethereum provider found');
      throw new Error('Ethereum provider not found. Please connect your wallet first.');
    }
    console.log('✅ [FHE Instance] Ethereum provider found');

    const sdk = await loadSdk();
    if (!sdk) {
      console.error('❌ [FHE Instance] SDK not available after load');
      throw new Error('FHE SDK not available');
    }
    console.log('✅ [FHE Instance] SDK loaded successfully');

    console.log('⏳ [FHE Instance] Calling sdk.initSDK()...');
    // Check if already initialized to avoid duplicate initialization
    if (sdk.__initialized__ !== true) {
      await sdk.initSDK();
      sdk.__initialized__ = true;
      console.log('✅ [FHE Instance] SDK initialized');
    } else {
      console.log('✅ [FHE Instance] SDK already initialized');
    }

    const config = {
      ...sdk.SepoliaConfig,
      network: ethereumProvider,
    };
    console.log('⏳ [FHE Instance] Creating instance with config:', config);

    fheInstance = await sdk.createInstance(config);
    console.log('✅ [FHE Instance] Instance created successfully');
    return fheInstance;
  })();

  try {
    return await fheInstancePromise;
  } finally {
    fheInstancePromise = null;
  }
}

export async function encryptUint8(
  value: number,
  contractAddress: `0x${string}`,
  userAddress: `0x${string}`,
  provider?: any
): Promise<{ handle: `0x${string}`; proof: `0x${string}` }> {
  console.log(`🔒 [Encrypt] Starting uint8 encryption for value: ${value}`);

  const instance = await getFhevmInstance(provider);
  const checksumContract = getAddress(contractAddress);
  const checksumUser = getAddress(userAddress);

  console.log('📝 [Encrypt] Creating encrypted input for:', { checksumContract, checksumUser });
  const input = instance.createEncryptedInput(checksumContract, checksumUser);

  input.add8(value);
  console.log('⏳ [Encrypt] Calling input.encrypt()...');

  const { handles, inputProof } = await input.encrypt();
  console.log('📦 [Encrypt] Raw encryption result:', {
    handles,
    handlesLength: handles?.length,
    inputProof,
    inputProofLength: inputProof?.length,
  });

  if (!handles?.length) {
    console.error('❌ [Encrypt] No handles returned from encryption');
    throw new Error('Encryption failed: handle not returned');
  }

  // Use toHex directly without padding (matching fhe-lending)
  const handleHex = toHex(handles[0] as Uint8Array);
  const proofHex = toHex(inputProof as Uint8Array);

  console.log('🔍 [Encrypt] Handle hex:', handleHex, 'Length:', handleHex.length);
  console.log('🔍 [Encrypt] Proof hex length:', proofHex.length);

  const result = {
    handle: handleHex as `0x${string}`,
    proof: proofHex as `0x${string}`,
  };

  console.log('✅ [Encrypt] Encryption successful:', result);
  return result;
}

export function generateRandomUint8(): number {
  return Math.floor(Math.random() * 256);
}
