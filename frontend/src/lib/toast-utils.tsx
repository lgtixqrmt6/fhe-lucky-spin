import { toast } from "sonner";
import { ExternalLink } from "lucide-react";

// Sepolia block explorer base URL for transaction links
const SEPOLIA_EXPLORER = "https://sepolia.etherscan.io/tx";

/**
 * Show transaction pending toast with hash link
 */
export const toastTxPending = (hash: `0x${string}`) => {
  toast.loading(
    <div className="flex items-center gap-2">
      <span>Transaction submitted...</span>
      <a
        href={`${SEPOLIA_EXPLORER}/${hash}`}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 text-primary hover:underline"
        onClick={(e) => e.stopPropagation()}
      >
        View
        <ExternalLink className="h-3 w-3" />
      </a>
    </div>,
    {
      id: hash,
      duration: Infinity
    }
  );
};

/**
 * Show transaction success toast with hash link
 */
export const toastTxSuccess = (hash: `0x${string}`, message: string) => {
  toast.success(
    <div className="flex flex-col gap-1">
      <div className="font-semibold">{message}</div>
      <a
        href={`${SEPOLIA_EXPLORER}/${hash}`}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
        onClick={(e) => e.stopPropagation()}
      >
        View on Etherscan
        <ExternalLink className="h-3 w-3" />
      </a>
    </div>,
    {
      id: hash,
      duration: 5000
    }
  );
};

/**
 * Show transaction error toast with hash link (if available)
 */
export const toastTxError = (hash: `0x${string}` | undefined, error: Error | string) => {
  const message = typeof error === 'string' ? error : (error.message || "Transaction failed");

  // Parse common error messages
  let displayMessage = message;
  if (message.includes("User rejected")) {
    displayMessage = "Transaction rejected by user";
  } else if (message.includes("insufficient funds")) {
    displayMessage = "Insufficient funds for transaction";
  } else if (message.includes("execution reverted")) {
    displayMessage = "Transaction reverted on chain";
  }

  toast.error(
    <div className="flex flex-col gap-1">
      <div className="font-semibold">Transaction Failed</div>
      <div className="text-sm text-muted-foreground">{displayMessage}</div>
      {hash && (
        <a
          href={`${SEPOLIA_EXPLORER}/${hash}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          View on Etherscan
          <ExternalLink className="h-3 w-3" />
        </a>
      )}
    </div>,
    {
      id: hash || `error-${Date.now()}`,
      duration: 7000
    }
  );
};

/**
 * Show user rejected toast
 */
export const toastUserRejected = () => {
  toast.error("Transaction rejected by user", {
    duration: 3000
  });
};

/**
 * Show encryption in progress toast
 */
export const toastEncrypting = () => {
  toast.loading("Encrypting spin data with FHE...", {
    id: "encrypting",
    duration: Infinity
  });
};

/**
 * Dismiss encryption toast
 */
export const dismissEncryptingToast = () => {
  toast.dismiss("encrypting");
};

/**
 * Show spin success toast
 */
export const toastSpinSuccess = (hash: `0x${string}`) => {
  toastTxSuccess(hash, "Spin completed! 🎰");
};

/**
 * Show claim success toast
 */
export const toastClaimSuccess = (hash: `0x${string}`, prizeName: string) => {
  toastTxSuccess(hash, `Prize claimed: ${prizeName} 🎁`);
};

/**
 * Dismiss toast by hash/id
 */
export const dismissTxToast = (hash: `0x${string}`) => {
  toast.dismiss(hash);
};
