import { useState } from "react";
import { Loader2, Check, X, Mail } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { TeamLogo } from "@/components/TeamLogo";
import { useMyInvites } from "@/hooks/use-teams";
import { supabase } from "@/integrations/supabase/client";

export const InvitesPanel = ({ userId }: { userId: string }) => {
  const { invites } = useMyInvites(userId);
  const [busy, setBusy] = useState<string | null>(null);

  const respond = async (id: string, status: "accepted" | "declined") => {
    setBusy(id);
    const { error } = await supabase.from("team_invites").update({ status }).eq("id", id);
    setBusy(null);
    if (error) return toast.error(error.message);
    toast.success(status === "accepted" ? "Joined team" : "Invite declined");
  };

  if (invites.length === 0) return null;

  return (
    <div className="glass rounded-xl p-5 border border-primary/40 space-y-3">
      <div className="flex items-center gap-2">
        <Mail className="h-4 w-4 text-primary" />
        <span className="font-mono text-[10px] tracking-[0.25em] text-primary">
          // {invites.length} TEAM INVITE{invites.length === 1 ? "" : "S"}
        </span>
      </div>
      <div className="space-y-2">
        {invites.map((inv: any) => (
          <div key={inv.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/40 border border-border">
            {inv.team && <TeamLogo team={inv.team} size="sm" />}
            <div className="flex-1 min-w-0">
              <div className="font-semibold truncate">{inv.team?.name ?? "Team"}</div>
              <div className="font-mono text-[10px] text-muted-foreground">[{inv.team?.tag}]</div>
            </div>
            <Button
              size="sm"
              onClick={() => respond(inv.id, "accepted")}
              disabled={busy === inv.id}
              className="bg-gradient-primary text-primary-foreground border-transparent"
            >
              {busy === inv.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => respond(inv.id, "declined")} disabled={busy === inv.id}>
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
};
