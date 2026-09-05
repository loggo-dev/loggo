export type TidyCard = { id: string; width: number; height: number };
export type TidyCardPosition = { id: string; x: number; y: number };

const BOARD_PADDING = 24;
const CARD_GAP = 16;

export function tidyCardLayout(cards: TidyCard[], containerWidth: number): TidyCardPosition[] {
  const rightEdge = Math.max(BOARD_PADDING, containerWidth - BOARD_PADDING);
  let x = BOARD_PADDING;
  let y = BOARD_PADDING;
  let rowHeight = 0;

  return cards.map((card) => {
    const width = Math.max(1, card.width);
    const height = Math.max(1, card.height);

    if (x > BOARD_PADDING && x + width > rightEdge) {
      x = BOARD_PADDING;
      y += rowHeight + CARD_GAP;
      rowHeight = 0;
    }

    const position = { id: card.id, x, y };
    x += width + CARD_GAP;
    rowHeight = Math.max(rowHeight, height);
    return position;
  });
}
