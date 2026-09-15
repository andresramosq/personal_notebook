export const BOARD_SIZE = {
  width: 2400,
  height: 1600,
};

export const BOARD_CARD_SIZE = {
  width: 176,
  height: 120,
};

export function canPlaceBoardCard(x: number, y: number) {
  const halfWidth = BOARD_CARD_SIZE.width / 2;
  const halfHeight = BOARD_CARD_SIZE.height / 2;

  return (
    x >= halfWidth &&
    x <= BOARD_SIZE.width - halfWidth &&
    y >= halfHeight &&
    y <= BOARD_SIZE.height - halfHeight
  );
}

export function clampBoardPosition(x: number, y: number) {
  const halfWidth = BOARD_CARD_SIZE.width / 2;
  const halfHeight = BOARD_CARD_SIZE.height / 2;

  return {
    x: Math.min(Math.max(x, halfWidth), BOARD_SIZE.width - halfWidth),
    y: Math.min(Math.max(y, halfHeight), BOARD_SIZE.height - halfHeight),
  };
}
