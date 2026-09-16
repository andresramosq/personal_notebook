import { Layout } from "lucide-react";

type BoardIconProps = {
  className?: string;
};

export function BoardIcon({ className = "size-4 shrink-0" }: BoardIconProps) {
  return <Layout className={className} strokeWidth={1.5} />;
}
