import { Header } from "@/components/Header";
import { SimpleSlotMachine } from "@/components/SimpleSlotMachine";
import { Card } from "@/components/ui/card";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8 md:py-12">
        {/* Hero Section */}
        <div className="text-center mb-12 animate-float">
          <h2 className="text-4xl md:text-6xl font-bold mb-4 bg-gradient-gold bg-clip-text text-transparent">
            Welcome to Lucky Slots
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            Connect your wallet and start your lucky journey! Pull the lever and win amazing rewards!
          </p>
        </div>

        {/* Slot Machine Section */}
        <div className="flex justify-center mb-12">
          <SimpleSlotMachine />
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          <Card className="p-6 text-center bg-card/50 backdrop-blur border-2 border-primary/20 hover:border-primary/40 transition-all duration-300 hover:shadow-glow">
            <div className="text-4xl mb-3">💰</div>
            <h3 className="text-xl font-bold mb-2 text-primary">Fair & Transparent</h3>
            <p className="text-muted-foreground">
              Built on blockchain technology, all results are transparent and verifiable
            </p>
          </Card>

          <Card className="p-6 text-center bg-card/50 backdrop-blur border-2 border-secondary/20 hover:border-secondary/40 transition-all duration-300 hover:shadow-glow">
            <div className="text-4xl mb-3">🎁</div>
            <h3 className="text-xl font-bold mb-2 text-secondary">Amazing Rewards</h3>
            <p className="text-muted-foreground">
              Multiple prize tiers with rewards up to 5000 Points
            </p>
          </Card>

          <Card className="p-6 text-center bg-card/50 backdrop-blur border-2 border-accent/20 hover:border-accent/40 transition-all duration-300 hover:shadow-glow">
            <div className="text-4xl mb-3">⚡</div>
            <h3 className="text-xl font-bold mb-2 text-accent">Instant Results</h3>
            <p className="text-muted-foreground">
              Encrypted results recorded on blockchain immediately
            </p>
          </Card>
        </div>

        {/* How to Play */}
        <Card className="max-w-3xl mx-auto mt-12 p-8 bg-card/50 backdrop-blur border-2 border-primary/30">
          <h3 className="text-2xl font-bold mb-6 text-center bg-gradient-gold bg-clip-text text-transparent">
            How to Play
          </h3>
          <ol className="space-y-4">
            <li className="flex items-start gap-4">
              <span className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-gold flex items-center justify-center text-primary-foreground font-bold">
                1
              </span>
              <p className="text-foreground pt-1">
                Click "Connect Wallet" in the top right corner to connect your wallet
              </p>
            </li>
            <li className="flex items-start gap-4">
              <span className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-gold flex items-center justify-center text-primary-foreground font-bold">
                2
              </span>
              <p className="text-foreground pt-1">
                Make sure you have enough ETH in your wallet for gas fees
              </p>
            </li>
            <li className="flex items-start gap-4">
              <span className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-gold flex items-center justify-center text-primary-foreground font-bold">
                3
              </span>
              <p className="text-foreground pt-1">
                Click "PULL THE LEVER" button and watch the reels spin
              </p>
            </li>
            <li className="flex items-start gap-4">
              <span className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-gold flex items-center justify-center text-primary-foreground font-bold">
                4
              </span>
              <p className="text-foreground pt-1">
                Your results are secured with FHE encryption and recorded on the blockchain
              </p>
            </li>
          </ol>
        </Card>
      </main>

      {/* Footer */}
      <footer className="w-full py-8 mt-12 border-t border-border/50 bg-card/30 backdrop-blur">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>© 2024 Lucky Slots. Powered by Blockchain Technology.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
