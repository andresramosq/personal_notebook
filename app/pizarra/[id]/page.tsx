import { notFound } from "next/navigation";
import { BoardShell } from "@/components/board-shell";
import { getBoardWithLinks } from "@/lib/boards";

type PizarraPageProps = {
  params: Promise<{ id: string }>;
};

export default async function PizarraPage({ params }: PizarraPageProps) {
  const { id } = await params;
  const board = await getBoardWithLinks(id);

  if (!board) {
    notFound();
  }

  return (
    <BoardShell boardId={board.id} isHome={false} initialLinks={board.links} />
  );
}
