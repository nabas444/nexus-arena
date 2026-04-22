import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { matchesKey } from "@/hooks/use-bracket";
import { tournamentsQueryKey } from "@/hooks/use-tournaments";

export type TournamentEventKind = "bracket-regenerated" | "went-live" | "completed" | "registration-open";

export interface TournamentEvent {
  id: string;
  kind: TournamentEventKind;
  title: string;
  description: string;
  at: number; // epoch ms
}

const MAX_FEED = 12;
// Window to coalesce a burst of round-0 match inserts into a single
// "bracket regenerated" event.
const BRACKET_BURST_MS = 1500;

/**
 * Subscribes to realtime changes for a single tournament and produces:
 *  - sonner toasts when the bracket is regenerated or status flips
 *  - an in-memory feed of recent events (returned for in-page rendering)
 *
 * Initial-load events are NOT toasted — only changes that happen while the
 * page is mounted, so a viewer who opens the page does not get historical
 * spam.
 */
export function useTournamentEvents(tournamentId: string | undefined) {
  const qc = useQueryClient();
  const [events, setEvents] = useState<TournamentEvent[]>([]);

  // Track the previous status across realtime updates so we can detect
  // transitions (e.g. open -> ongoing).
  const lastStatusRef = useRef<string | null>(null);

  // Coalesce a burst of round-0 match inserts.
  const burstRef = useRef<{
    count: number;
    timer: ReturnType<typeof setTimeout> | null;
  }>({ count: 0, timer: null });

  useEffect(() => {
    if (!tournamentId) return;

    const push = (ev: Omit<TournamentEvent, "id" | "at">) => {
      const entry: TournamentEvent = {
        ...ev,
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        at: Date.now(),
      };
      setEvents((prev) => [entry, ...prev].slice(0, MAX_FEED));
    };

    const channel = supabase
      .channel(`tournament-events-${tournamentId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "tournaments",
          filter: `id=eq.${tournamentId}`,
        },
        (payload) => {
          const newStatus = (payload.new as { status?: string })?.status ?? null;
          const oldStatus =
            lastStatusRef.current ?? (payload.old as { status?: string })?.status ?? null;

          if (newStatus && newStatus !== oldStatus) {
            if (newStatus === "ongoing") {
              const title = "Tournament is LIVE";
              const description = "The bracket is locked and matches are underway.";
              toast.success(title, { description });
              push({ kind: "went-live", title, description });
            } else if (newStatus === "completed") {
              const title = "Tournament completed";
              const description = "All matches have wrapped. GG!";
              toast(title, { description });
              push({ kind: "completed", title, description });
            } else if (newStatus === "open") {
              const title = "Registration open";
              const description = "Teams can now sign up.";
              toast.success(title, { description });
              push({ kind: "registration-open", title, description });
            }
          }

          lastStatusRef.current = newStatus;
          qc.invalidateQueries({ queryKey: tournamentsQueryKey });
        },
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "matches",
          filter: `tournament_id=eq.${tournamentId}`,
        },
        (payload) => {
          const round = (payload.new as { round?: number })?.round;
          // Bracket regeneration emits a burst of round-0 inserts (the seeded
          // first-round matches). Coalesce them into one event/toast.
          if (round === 0) {
            burstRef.current.count += 1;
            if (burstRef.current.timer) clearTimeout(burstRef.current.timer);
            burstRef.current.timer = setTimeout(() => {
              const count = burstRef.current.count;
              burstRef.current.count = 0;
              burstRef.current.timer = null;
              const title = "Bracket regenerated";
              const description = `${count} opening match${count === 1 ? "" : "es"} seeded by the organizer.`;
              toast.success(title, { description });
              push({ kind: "bracket-regenerated", title, description });
              qc.invalidateQueries({ queryKey: matchesKey(tournamentId) });
            }, BRACKET_BURST_MS);
          }
          qc.invalidateQueries({ queryKey: matchesKey(tournamentId) });
        },
      )
      .subscribe();

    return () => {
      if (burstRef.current.timer) {
        clearTimeout(burstRef.current.timer);
        burstRef.current.timer = null;
        burstRef.current.count = 0;
      }
      supabase.removeChannel(channel);
    };
  }, [tournamentId, qc]);

  return events;
}
