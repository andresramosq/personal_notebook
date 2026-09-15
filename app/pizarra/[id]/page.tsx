import { notFound } from "next/navigation";
import { BoardShell } from "@/components/board-shell";
import {
  formatBoardLinks,
  getBackHref,
  getBoardWithLinks,
  getParentBoard,
} from "@/lib/boards";

type PizarraPageProps = {
  params: Promise<{ id: string }>;
};

export default async function PizarraPage({ params }: PizarraPageProps) {
  const { id } = await params;
  const board = await getBoardWithLinks(id);

  if (!board) {
    notFound();
  }

  const parentBoard = await getParentBoard(board.id);

  return (
    <BoardShell
      boardId={board.id}
      boardName={board.name}
      backHref={getBackHref(parentBoard)}
      initialLinks={formatBoardLinks(board.links)}
    />
  );
}
