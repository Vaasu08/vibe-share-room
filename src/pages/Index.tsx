import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Music, Users, Headphones, Radio, ArrowRight, Sparkles } from "lucide-react";
import { toast } from "sonner";

const Index = () => {
  const navigate = useNavigate();
  const [roomCode, setRoomCode] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);

  const generateRoomCode = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code = "";
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  const handleCreateRoom = async () => {
    setIsCreating(true);
    const code = generateRoomCode();
    // Simulate creation delay
    await new Promise((resolve) => setTimeout(resolve, 500));
    toast.success("Room created successfully!");
    navigate(`/room/${code}?host=true`);
  };

  const handleJoinRoom = () => {
    if (!roomCode.trim()) {
      toast.error("Please enter a room code");
      return;
    }
    setIsJoining(true);
    navigate(`/room/${roomCode.toUpperCase()}`);
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Ambient background effects */}
      <div className="absolute inset-0 bg-gradient-radial pointer-events-none" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse-slow" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl animate-pulse-slow delay-1000" />
      
      {/* Floating music elements */}
      <div className="absolute top-20 right-20 text-primary/20 animate-float">
        <Music className="w-16 h-16" />
      </div>
      <div className="absolute bottom-32 left-20 text-primary/10 animate-float delay-500">
        <Headphones className="w-20 h-20" />
      </div>
      <div className="absolute top-1/2 right-32 text-primary/15 animate-float delay-1000">
        <Radio className="w-12 h-12" />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-12 min-h-screen flex flex-col items-center justify-center">
        {/* Header */}
        <div className="text-center mb-16 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm text-primary font-medium">Real-time music experience</span>
          </div>
          
          <h1 className="font-display text-5xl md:text-7xl font-bold mb-6">
            <span className="text-foreground">Music</span>
            <span className="gradient-text"> Rooms</span>
          </h1>
          
          <p className="text-muted-foreground text-lg md:text-xl max-w-xl mx-auto leading-relaxed">
            Create a room, invite friends, and listen to music together in perfect sync.
            Talk, chat, and vibe — all in real time.
          </p>
        </div>

        {/* Action Cards */}
        <div className="grid md:grid-cols-2 gap-6 w-full max-w-2xl animate-fade-in" style={{ animationDelay: "0.2s" }}>
          {/* Create Room Card */}
          <div className="glass-card p-8 hover:border-primary/30 transition-all duration-300 group">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
              <Radio className="w-7 h-7 text-primary" />
            </div>
            <h2 className="font-display text-2xl font-semibold text-foreground mb-3">
              Create a Room
            </h2>
            <p className="text-muted-foreground mb-6">
              Start a new listening session and become the host. Share the code with friends.
            </p>
            <Button 
              variant="hero" 
              size="lg" 
              className="w-full"
              onClick={handleCreateRoom}
              disabled={isCreating}
            >
              {isCreating ? (
                "Creating..."
              ) : (
                <>
                  Create Room
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </Button>
          </div>

          {/* Join Room Card */}
          <div className="glass-card p-8 hover:border-primary/30 transition-all duration-300 group">
            <div className="w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center mb-6 group-hover:bg-secondary/80 transition-colors">
              <Users className="w-7 h-7 text-foreground" />
            </div>
            <h2 className="font-display text-2xl font-semibold text-foreground mb-3">
              Join a Room
            </h2>
            <p className="text-muted-foreground mb-4">
              Enter a room code to join an existing session.
            </p>
            <div className="space-y-3">
              <Input
                placeholder="Enter room code"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                className="text-center text-lg font-mono tracking-widest uppercase"
                maxLength={6}
                onKeyDown={(e) => e.key === "Enter" && handleJoinRoom()}
              />
              <Button 
                variant="glass" 
                size="lg" 
                className="w-full"
                onClick={handleJoinRoom}
                disabled={isJoining}
              >
                {isJoining ? "Joining..." : "Join Room"}
              </Button>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="mt-20 grid grid-cols-3 gap-8 max-w-lg animate-fade-in" style={{ animationDelay: "0.4s" }}>
          <div className="text-center">
            <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center mx-auto mb-3">
              <Music className="w-6 h-6 text-primary" />
            </div>
            <p className="text-sm text-muted-foreground">Synced Playback</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center mx-auto mb-3">
              <Headphones className="w-6 h-6 text-primary" />
            </div>
            <p className="text-sm text-muted-foreground">Voice Chat</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center mx-auto mb-3">
              <Users className="w-6 h-6 text-primary" />
            </div>
            <p className="text-sm text-muted-foreground">Real-time Chat</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
