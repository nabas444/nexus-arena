import { NavLink, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Trophy, Swords, LayoutGrid, Radio, Users, Bell, Search, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

const navItems = [
  { to: "/", label: "Hub", icon: LayoutGrid },
  { to: "/tournaments", label: "Tournaments", icon: Trophy },
  { to: "/bracket/tour1", label: "Bracket", icon: Swords },
  { to: "/match-day", label: "Match Day", icon: Radio },
  { to: "/leaderboard", label: "Rankings", icon: Users },
];

export const AppShell = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  return (
    <div className="relative min-h-screen text-foreground">
      {/* Topbar */}
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/70 backdrop-blur-xl">
        <div className="container flex h-16 items-center justify-between gap-4">
          <NavLink to="/" className="flex items-center gap-2.5 group">
            <div className="relative">
              <div className="h-9 w-9 rounded-md bg-gradient-primary grid place-items-center shadow-[var(--glow-primary)] group-hover:scale-105 transition-transform">
                <Zap className="h-5 w-5 text-primary-foreground" strokeWidth={2.5} />
              </div>
            </div>
            <div className="leading-none">
              <div className="font-display text-lg font-bold tracking-wider">
                NEXUS<span className="text-gradient">ARENA</span>
              </div>
              <div className="font-mono text-[10px] text-muted-foreground tracking-[0.2em]">v2.5 // LIVE</div>
            </div>
          </NavLink>

          {/* Primary nav */}
          <nav className="hidden md:flex items-center gap-1 glass rounded-full p-1">
            {navItems.map(({ to, label, icon: Icon }) => {
              const active = location.pathname === to || (to !== "/" && location.pathname.startsWith(to));
              return (
                <NavLink
                  key={to}
                  to={to}
                  className={`relative px-4 py-1.5 rounded-full text-sm font-semibold tracking-wide transition-colors flex items-center gap-2 ${
                    active ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {active && (
                    <motion.div
                      layoutId="active-pill"
                      className="absolute inset-0 rounded-full bg-gradient-primary shadow-[var(--glow-primary)]"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-2">
                    <Icon className="h-4 w-4" />
                    {label}
                  </span>
                </NavLink>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="hover:bg-muted/60" aria-label="Search">
              <Search className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="relative hover:bg-muted/60" aria-label="Notifications">
              <Bell className="h-4 w-4" />
              <span className="absolute top-2 right-2 h-1.5 w-1.5 rounded-full bg-accent shadow-[0_0_8px_hsl(var(--accent))]" />
            </Button>
            <div className="hidden sm:flex items-center gap-2 pl-2 ml-1 border-l border-border">
              <div className="h-8 w-8 rounded-full bg-gradient-accent grid place-items-center font-display text-xs font-bold">
                VX
              </div>
              <div className="hidden lg:block leading-tight">
                <div className="text-xs font-semibold">Vex0r</div>
                <div className="text-[10px] font-mono text-muted-foreground">RANK #142</div>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile nav */}
        <nav className="md:hidden border-t border-border/60 overflow-x-auto">
          <div className="flex gap-1 px-3 py-2 min-w-max">
            {navItems.map(({ to, label, icon: Icon }) => {
              const active = location.pathname === to || (to !== "/" && location.pathname.startsWith(to));
              return (
                <NavLink
                  key={to}
                  to={to}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition ${
                    active ? "bg-gradient-primary text-primary-foreground shadow-[var(--glow-primary)]" : "text-muted-foreground"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                </NavLink>
              );
            })}
          </div>
        </nav>
      </header>

      <main className="relative z-10">{children}</main>

      {/* Footer ticker */}
      <footer className="border-t border-border/60 mt-16 bg-background/60 backdrop-blur">
        <div className="container py-6 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-muted-foreground font-mono">
          <div className="flex items-center gap-2">
            <span className="live-dot" /> SERVERS NOMINAL · 142,503 SPECTATORS ONLINE
          </div>
          <div>NEXUS ARENA © 2025 — POWERED BY THE GRID</div>
        </div>
      </footer>
    </div>
  );
};
