interface TeamLogoTeam {
  name: string;
  tag: string;
  logoColor?: string;
  logo_color?: string;
}

interface Props {
  team: TeamLogoTeam;
  size?: "sm" | "md" | "lg";
}

export const TeamLogo = ({ team, size = "md" }: Props) => {
  const sizeClass = {
    sm: "h-7 w-7 text-[10px]",
    md: "h-10 w-10 text-xs",
    lg: "h-14 w-14 text-sm",
  }[size];

  const color = team.logoColor ?? team.logo_color ?? "270 80% 60%";

  return (
    <div
      className={`${sizeClass} relative rounded-md grid place-items-center font-display font-bold flex-shrink-0 clip-hex`}
      style={{
        background: `linear-gradient(135deg, hsl(${color}) 0%, hsl(${color.replace(
          /^\d+/,
          (m) => String((parseInt(m) + 40) % 360)
        )}) 100%)`,
        color: "hsl(240 30% 5%)",
        boxShadow: `0 0 16px hsl(${color} / 0.5)`,
      }}
      aria-label={team.name}
    >
      {team.tag}
    </div>
  );
};
