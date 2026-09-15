import { BoardShell } from "@/components/board-shell";
import { formatBoardLinks, getBoardWithLinks, getOrCreateRootBoard } from "@/lib/boards";

export default async function Home() {
  const board = await getOrCreateRootBoard();
  const boardWithLinks = await getBoardWithLinks(board.id);

  return (
    <BoardShell
      boardId={board.id}
      boardName={board.name}
      backHref={null}
      initialLinks={formatBoardLinks(boardWithLinks?.links ?? [])}
    />
  );
}
