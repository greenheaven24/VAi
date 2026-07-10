export interface Point {
  x: number;
  y: number;
}

export interface Annotation {
  id: number;
  image: number;
  points: Point[];
  label: string;
  color: string;
  created_at: string;
}

export interface AnnotationInput {
  image: number;
  points: Point[];
  label?: string;
  color?: string;
}
