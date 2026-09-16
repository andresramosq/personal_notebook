import { PanelLeftOpen } from "lucide-react";

type IconProps = {
  className?: string;
};

export function PanelOpenIcon({ className = "size-5" }: IconProps) {
  return <PanelLeftOpen className={className} strokeWidth={1.5} />;
}
