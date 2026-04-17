import { Team } from "@/lib/mock-data";

interface Props {
  team: Team;
  size?: "sm" | "md" | "lg";
}

export const TeamLogo = ({ team, size = "md" }: Props) => {
  const sizeClass = {
    sm: "h-7 w-7 text-[10px]",
    md: "h-10 w-10 text-xs",
    lg: "h-14 w-14 text-sm",
  }[size];

  return (
    <div
      className={`${sizeClass} relative rounded-md grid place-items-center font-display font-bold flex-shrink-0 clip-hex`}
      style={{
        background: `linear-gradient(135deg, hsl(${team.logoColor}) 0%, hsl(${team.logoColor.replace(/^\d+/, (m) => String((parseInt(m) + 40) % 360))}) 100%)`,
        color: "hsl(240 30% 5%)",
        boxShadow: `0 0 16px hsl(${team.logoColor} / 0.5)`,
      }}
      aria-label={team.name}
    >
      {team.tag}
    </div>
  );
};
