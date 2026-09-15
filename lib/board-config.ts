export const DEFAULT_BOARD_SIZE = {
  width: 1280,
  height: 720,
};

export const BOARD_CARD_SIZE = {
  width: 176,
  height: 120,
};

export type BoardSize = {
  width: number;
  height: number;
};

export function canPlaceBoardCard(
  x: number,
  y: number,
  boardSize: BoardSize = DEFAULT_BOARD_SIZE,
) {
  const halfWidth = BOARD_CARD_SIZE.width / 2;
  const halfHeight = BOARD_CARD_SIZE.height / 2;

  return (
    x >= halfWidth &&
    x <= boardSize.width - halfWidth &&
    y >= halfHeight &&
    y <= boardSize.height - halfHeight
  );
}

export function clampBoardPosition(
  x: number,
  y: number,
  boardSize: BoardSize = DEFAULT_BOARD_SIZE,
) {
  const halfWidth = BOARD_CARD_SIZE.width / 2;
  const halfHeight = BOARD_CARD_SIZE.height / 2;

  return {
    x: Math.min(Math.max(x, halfWidth), boardSize.width - halfWidth),
    y: Math.min(Math.max(y, halfHeight), boardSize.height - halfHeight),
  };
}

export function isPointInsideBoard(
  x: number,
  y: number,
  boardSize: BoardSize = DEFAULT_BOARD_SIZE,
) {
  return x >= 0 && x <= boardSize.width && y >= 0 && y <= boardSize.height;
}
