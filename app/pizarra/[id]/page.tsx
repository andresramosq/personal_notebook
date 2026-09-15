import { notFound } from "next/navigation";
import { BoardShell } from "@/components/board-shell";
import { getBackHref, getBoardPageData } from "@/lib/boards";

type PizarraPageProps = {
  params: Promise<{ id: string }>;
};

export default async function PizarraPage({ params }: PizarraPageProps) {
  const { id } = await params;
  const pageData = await getBoardPageData(id);

  if (!pageData) {
    notFound();
  }

  return (
    <BoardShell
      boardId={pageData.board.id}
      boardName={pageData.board.name}
      backHref={getBackHref(pageData.parentBoard)}
      initialLinks={pageData.links}
    />
  );
}
