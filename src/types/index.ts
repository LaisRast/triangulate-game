export interface Point {
  id: number;
  x: number;
  y: number;
}

export interface Edge {
  point1Id: number;
  point2Id: number;
  player: number;
}

export interface Triangle {
  point1Id: number;
  point2Id: number;
  point3Id: number;
  player: number;
}

export interface Player {
  name: string;
  color: string;
  backgroundColor: string;
}
