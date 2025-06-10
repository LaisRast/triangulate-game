import { GAME_CONFIG } from '../config/gameConfig.ts';
import type { Edge, Point } from '../types';

const determinant = (point1: Point, point2: Point, point3: Point) => {
  return (point2.x - point1.x) * (point3.y - point1.y) - (point3.x - point1.x) * (point2.y - point1.y);
};

export const generateRandomPoints = (count: number, width: number, height: number): Point[] => {
  if (count > GAME_CONFIG.POINTS.MAX_COUNT) {
    count = GAME_CONFIG.POINTS.MAX_COUNT;
  }
  if (count < GAME_CONFIG.POINTS.MIN_COUNT) {
    count = GAME_CONFIG.POINTS.MIN_COUNT;
  }
  const minDist = 40;
  const points: Point[] = [];
  while (points.length < count) {
    const candidate = {
      id: points.length,
      x: Math.random() * width * 0.9 + width * 0.05,
      y: Math.random() * height * 0.9 + height * 0.05,
    };
    if (points.every((p) => Math.hypot(p.x - candidate.x, p.y - candidate.y) >= minDist)) {
      points.push(candidate);
    }
  }
  return points;
};

export const isPointInTriangle = (
  point: Point,
  trianglePoint1: Point,
  trianglePoint2: Point,
  trianglePoint3: Point
): boolean => {
  const orientationWith12 = determinant(point, trianglePoint1, trianglePoint2);
  const orientationWith23 = determinant(point, trianglePoint2, trianglePoint3);
  const orientationWith31 = determinant(point, trianglePoint3, trianglePoint1);

  const hasPositiveOrientation = orientationWith12 > 0 || orientationWith23 > 0 || orientationWith31 > 0;
  const hasNegativeOrientation = orientationWith12 < 0 || orientationWith23 < 0 || orientationWith31 < 0;

  return !(hasPositiveOrientation && hasNegativeOrientation);
};

export const doLinesIntersect = (point1: Point, point2: Point, point3: Point, point4: Point): boolean => {
  return (
    determinant(point1, point2, point3) * determinant(point1, point2, point4) < 0 &&
    determinant(point3, point4, point1) * determinant(point3, point4, point2) < 0
  );
};

export const canDrawMoreEdges = (points: Point[], edges: Edge[]): boolean => {
  for (let point1Index = 0; point1Index < points.length; point1Index++) {
    for (let point2Index = point1Index + 1; point2Index < points.length; point2Index++) {
      if (
        edges.some(
          (edge) =>
            (edge.point1Id === point1Index && edge.point2Id === point2Index) ||
            (edge.point1Id === point2Index && edge.point2Id === point1Index)
        )
      ) {
        continue;
      }

      const intersects = edges.some((e) => {
        return doLinesIntersect(points[point1Index], points[point2Index], points[e.point1Id], points[e.point2Id]);
      });

      if (!intersects) {
        return true;
      }
    }
  }
  return false;
};
