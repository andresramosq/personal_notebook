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
      key={pageData.board.id}
      boardId={pageData.board.id}
      boardName={pageData.board.name}
      isHome
      backHref={null}
      initialLinks={pageData.links}
    />
  );
}
