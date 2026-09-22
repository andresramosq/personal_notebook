export type Note = {
  id: string;
  x: number;
  y: number;
  content: string;
};

export type BoardState = {
  notes: Note[];
};
