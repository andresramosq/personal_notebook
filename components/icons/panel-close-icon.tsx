import { PanelLeftClose } from "lucide-react";

type IconProps = {
  className?: string;
};

export function PanelCloseIcon({ className = "size-5" }: IconProps) {
  return <PanelLeftClose className={className} strokeWidth={1.5} />;
}
