import { ConnectButton } from '@rainbow-me/rainbowkit';

export const Header = () => {
  return (
    <header className="w-full py-6 px-4 md:px-8">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gradient-gold flex items-center justify-center shadow-glow">
            <span className="text-2xl">🎰</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-gold bg-clip-text text-transparent drop-shadow-lg">
            Lucky Slots
          </h1>
        </div>
        
        <ConnectButton />
      </div>
    </header>
  );
};
