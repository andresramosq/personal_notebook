import { BoardShell } from "@/components/board-shell";
import { getBoardPageData, getOrCreateRootBoard } from "@/lib/boards";

export default async function Home() {
  const rootBoard = await getOrCreateRootBoard();
  const pageData = await getBoardPageData(rootBoard.id);

  if (!pageData) {
    return null;
  }

  return (
    <BoardShell
      boardId={pageData.board.id}
      boardName={pageData.board.name}
      backHref={null}
      initialLinks={pageData.links}
    />
  );
}
