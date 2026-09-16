import { AppShell } from "@/components/layout/app-shell";
import { listBoards } from "@/lib/boards";

export default async function Home() {
  const boards = await listBoards();

  return <AppShell initialBoards={boards} />;
}
