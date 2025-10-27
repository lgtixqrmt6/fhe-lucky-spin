import { useState } from 'react';
import { useAccount } from 'wagmi';
import { encryptUint8, generateRandomUint8 } from '@/lib/fhe';
import { CONTRACT_ADDRESSES } from '@/config/contracts';

export function DebugPanel() {
  const { address } = useAccount();
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [isEncrypting, setIsEncrypting] = useState(false);

  const testEncryption = async () => {
    if (!address) {
      alert('Please connect wallet first');
      return;
    }

    try {
      setIsEncrypting(true);
      console.log('🧪 [Debug] Starting test encryption...');

      const randomValue = generateRandomUint8();
      console.log('🎲 [Debug] Random value:', randomValue);

      const encrypted = await encryptUint8(
        randomValue,
        CONTRACT_ADDRESSES.FHELuckySpinV2,
        address
      );

      const info = {
        randomValue,
        handle: encrypted.handle,
        handleLength: encrypted.handle.length,
        proof: encrypted.proof,
        proofLength: encrypted.proof.length,
        contractAddress: CONTRACT_ADDRESSES.FHELuckySpinV2,
        userAddress: address,
      };

      console.log('✅ [Debug] Encryption test result:', info);
      setDebugInfo(info);
    } catch (error) {
      console.error('❌ [Debug] Encryption test failed:', error);
      setDebugInfo({ error: String(error) });
    } finally {
      setIsEncrypting(false);
    }
  };

  if (!address) {
    return null;
  }

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      background: 'white',
      border: '2px solid #333',
      borderRadius: '8px',
      padding: '16px',
      maxWidth: '400px',
      maxHeight: '600px',
      overflow: 'auto',
      fontSize: '12px',
      fontFamily: 'monospace',
      zIndex: 9999,
    }}>
      <h3 style={{ margin: '0 0 12px 0', fontSize: '14px' }}>🔍 FHE Debug Panel</h3>

      <button
        onClick={testEncryption}
        disabled={isEncrypting}
        style={{
          padding: '8px 16px',
          background: isEncrypting ? '#ccc' : '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: isEncrypting ? 'not-allowed' : 'pointer',
          marginBottom: '12px',
        }}
      >
        {isEncrypting ? 'Encrypting...' : 'Test Encryption'}
      </button>

      {debugInfo && (
        <div style={{ background: '#f5f5f5', padding: '12px', borderRadius: '4px' }}>
          {debugInfo.error ? (
            <div style={{ color: 'red' }}>
              <strong>Error:</strong>
              <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                {debugInfo.error}
              </pre>
            </div>
          ) : (
            <>
              <div style={{ marginBottom: '8px' }}>
                <strong>Random Value:</strong> {debugInfo.randomValue}
              </div>
              <div style={{ marginBottom: '8px' }}>
                <strong>Handle:</strong>
                <div style={{ wordBreak: 'break-all', color: '#0066cc' }}>
                  {debugInfo.handle}
                </div>
                <div style={{ fontSize: '10px', color: '#666' }}>
                  Length: {debugInfo.handleLength} chars
                  {debugInfo.handleLength === 66 ? ' ✅' : ' ❌ (should be 66)'}
                </div>
              </div>
              <div style={{ marginBottom: '8px' }}>
                <strong>Proof Length:</strong> {debugInfo.proofLength} chars
              </div>
              <div style={{ fontSize: '10px', color: '#666', marginTop: '8px' }}>
                Contract: {debugInfo.contractAddress}
                <br />
                User: {debugInfo.userAddress}
              </div>
            </>
          )}
        </div>
      )}

      <div style={{ marginTop: '12px', fontSize: '10px', color: '#666' }}>
        💡 Open browser console (F12) for detailed logs
      </div>
    </div>
  );
}
