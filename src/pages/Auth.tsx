import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Loader2, Zap } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useAuth } from "@/hooks/use-auth";

const GoogleIcon = () => (
  <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden>
    <path
      fill="#EA4335"
      d="M12 10.2v3.9h5.5c-.24 1.5-1.74 4.4-5.5 4.4-3.31 0-6-2.74-6-6.1S8.69 6.3 12 6.3c1.88 0 3.14.8 3.86 1.49l2.63-2.54C16.86 3.74 14.66 2.8 12 2.8 6.97 2.8 2.9 6.86 2.9 11.9S6.97 21 12 21c6.93 0 8.99-4.84 8.99-8.78 0-.59-.06-1.04-.14-1.5H12z"
    />
  </svg>
);

const Auth = () => {
  const navigate = useNavigate();
  const { session, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [handle, setHandle] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (session) navigate("/tournaments", { replace: true });
  }, [session, navigate]);

  if (loading) return null;
  if (session) return <Navigate to="/tournaments" replace />;

  const signIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) {
      toast.error("Sign in failed", { description: error.message });
      return;
    }
    toast.success("Welcome back");
  };

  const signUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: handle ? { handle } : undefined,
      },
    });
    setBusy(false);
    if (error) {
      toast.error("Sign up failed", { description: error.message });
      return;
    }
    toast.success("Check your inbox", { description: "Confirm your email to start hosting." });
  };

  const signInWithGoogle = async () => {
    setBusy(true);
    const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (result.error) {
      toast.error("Google sign-in failed", { description: result.error.message });
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen grid place-items-center px-4 py-10">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md space-y-6"
      >
        <Link to="/" className="flex items-center gap-2.5 justify-center">
          <div className="h-10 w-10 rounded-md bg-gradient-primary grid place-items-center shadow-[var(--glow-primary)]">
            <Zap className="h-5 w-5 text-primary-foreground" strokeWidth={2.5} />
          </div>
          <div className="leading-none">
            <div className="font-display text-xl font-bold tracking-wider">
              NEXUS<span className="text-gradient">ARENA</span>
            </div>
            <div className="font-mono text-[10px] text-muted-foreground tracking-[0.2em]">v2.5 // ENTRY</div>
          </div>
        </Link>

        <div className="glass rounded-xl p-6 space-y-5 border border-border">
          <div className="text-center space-y-1">
            <h1 className="font-display text-2xl font-bold">Enter the arena</h1>
            <p className="text-sm text-muted-foreground">Sign in to host and manage tournaments.</p>
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full h-11 font-semibold"
            onClick={signInWithGoogle}
            disabled={busy}
          >
            <GoogleIcon />
            <span className="ml-2">Continue with Google</span>
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
            <div className="relative flex justify-center">
              <span className="bg-card px-3 text-[10px] font-mono tracking-[0.3em] text-muted-foreground">OR EMAIL</span>
            </div>
          </div>

          <Tabs defaultValue="signin">
            <TabsList className="grid grid-cols-2 w-full">
              <TabsTrigger value="signin">Sign in</TabsTrigger>
              <TabsTrigger value="signup">Sign up</TabsTrigger>
            </TabsList>

            <TabsContent value="signin" className="pt-4">
              <form onSubmit={signIn} className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="si-email">Email</Label>
                  <Input id="si-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="si-pw">Password</Label>
                  <Input id="si-pw" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
                </div>
                <Button
                  type="submit"
                  disabled={busy}
                  className="w-full h-11 bg-gradient-primary text-primary-foreground border-transparent shadow-[var(--glow-primary)] font-bold"
                >
                  {busy && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Sign in
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup" className="pt-4">
              <form onSubmit={signUp} className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="su-handle">Handle</Label>
                  <Input
                    id="su-handle"
                    placeholder="vex0r"
                    value={handle}
                    onChange={(e) => setHandle(e.target.value.replace(/[^a-zA-Z0-9_]/g, "").toLowerCase())}
                    maxLength={24}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="su-email">Email</Label>
                  <Input id="su-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="su-pw">Password</Label>
                  <Input id="su-pw" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} />
                </div>
                <Button
                  type="submit"
                  disabled={busy}
                  className="w-full h-11 bg-gradient-primary text-primary-foreground border-transparent shadow-[var(--glow-primary)] font-bold"
                >
                  {busy && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Create account
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </div>
      </motion.div>
    </div>
  );
};

export default Auth;
