import React, { useEffect, useState } from 'react';
import { Circle, Layer, Line, Rect, Stage, Text } from 'react-konva';
import { GAME_CONFIG } from './config/gameConfig.ts';
import type { Edge, Player, Point, Triangle } from './types';
import { canDrawMoreEdges, doLinesIntersect, generateRandomPoints, isPointInTriangle } from './utils/geometry.tsx';

const PLAYERS: Player[] = [
  { name: 'Red', color: '#FF4136', backgroundColor: '#FFDDDD' },
  { name: 'Blue', color: '#0074D9', backgroundColor: '#DDEEFF' },
  { name: 'Green', color: '#2ECC40', backgroundColor: '#DDFFDD' },
  { name: 'Yellow', color: '#FFDC00', backgroundColor: '#FFFFDD' },
];

const Game = () => {
  const [numPlayers, setNumPlayers] = useState<number>(2);
  const [numPoints, setNumPoints] = useState<number>(10);

  const [points, setPoints] = useState<Point[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [triangles, setTriangles] = useState<Triangle[]>([]);

  const [selectedPointsIds, setSelectedPointsIds] = useState<number[]>([]);
  const [currentPlayer, setCurrentPlayer] = useState<number>(0);
  const [scores, setScores] = useState<number[]>(Array(numPlayers).fill(0));

  const [errorMessage, setErrorMessage] = useState<string>('');
  const [canvasSize, setCanvasSize] = useState<{ width: number; height: number }>({
    width: GAME_CONFIG.CANVAS.DEFAULT_WIDTH,
    height: GAME_CONFIG.CANVAS.DEFAULT_HEIGHT,
  });
  const [gameOver, setGameOver] = useState<boolean>(false);

  const players = [...PLAYERS].slice(0, numPlayers);

  const handleNumberOfPlayersChange = (newNumberOfPlayers: number) => {
    setNumPlayers(newNumberOfPlayers);
    setScores(Array(newNumberOfPlayers).fill(0));
    initializeGame();
  };

  const handleNumberOfPointsChange = (newNumberOfPoints: number) => {
    setNumPoints(Math.max(GAME_CONFIG.POINTS.MIN_COUNT, Math.min(newNumberOfPoints, GAME_CONFIG.POINTS.MAX_COUNT)));
    initializeGame();
  };

  const initializeGame = () => {
    const width = Math.min(window.innerWidth - 40, GAME_CONFIG.CANVAS.DEFAULT_WIDTH);
    const height = GAME_CONFIG.CANVAS.DEFAULT_HEIGHT;
    setCanvasSize({ width, height });
    setPoints(generateRandomPoints(numPoints, width, height));
    setEdges([]);
    setTriangles([]);
    setSelectedPointsIds([]);
    setCurrentPlayer(0);
    setScores(Array(numPlayers).fill(0));
    setErrorMessage('');
    setGameOver(false);
  };

  useEffect(() => {
    initializeGame();
    // eslint-disable-next-line
  }, [numPoints, numPlayers]);

  const handlePointClick = (pointId: number) => {
    if (gameOver) return;
    setErrorMessage('');
    if (selectedPointsIds.includes(pointId)) {
      setSelectedPointsIds([]);
      return;
    }
    const newSelectedPointIds = [...selectedPointsIds, pointId];
    setSelectedPointsIds(newSelectedPointIds);
    if (newSelectedPointIds.length === 2) {
      const [selectedPoint1Id, selectedPoint2Id] = newSelectedPointIds;
      const alreadyExists = edges.some(
        (edge) =>
          (edge.point1Id === selectedPoint1Id && edge.point2Id === selectedPoint2Id) ||
          (edge.point1Id === selectedPoint2Id && edge.point2Id === selectedPoint1Id)
      );
      if (alreadyExists) {
        setErrorMessage('Edge already exists.');
        setSelectedPointsIds([]);
        return;
      }

      const intersecting = edges.some((edge) => {
        const edgePoint1 = points[edge.point1Id];
        const edgePoint2 = points[edge.point2Id];
        return doLinesIntersect(points[selectedPoint1Id], points[selectedPoint2Id], edgePoint1, edgePoint2);
      });
      if (intersecting) {
        setErrorMessage('Edge intersects an existing edge.');
        setSelectedPointsIds([]);
        return;
      }

      const newEdge: Edge = { point1Id: selectedPoint1Id, point2Id: selectedPoint2Id, player: currentPlayer };
      const newEdges = [...edges, newEdge];
      setEdges(newEdges);

      const newTriangles: Triangle[] = [];
      for (const point of points) {
        const pointId = point.id;
        if (pointId !== selectedPoint1Id && pointId !== selectedPoint2Id) {
          const edgeToSelectedPoint1 = newEdges.find(
            (edge) =>
              (edge.point1Id === selectedPoint1Id && edge.point2Id === pointId) ||
              (edge.point1Id === pointId && edge.point2Id === selectedPoint1Id)
          );
          const edgeToSelectedPoint2 = newEdges.find(
            (edge) =>
              (edge.point1Id === selectedPoint2Id && edge.point2Id === pointId) ||
              (edge.point1Id === pointId && edge.point2Id === selectedPoint2Id)
          );
          if (edgeToSelectedPoint1 && edgeToSelectedPoint2) {
            const trianglePoints = [points[pointId], points[selectedPoint1Id], points[selectedPoint2Id]];
            const containsOtherPoint = points.some(
              (point) =>
                point.id !== pointId &&
                point.id !== selectedPoint1Id &&
                point.id !== selectedPoint2Id &&
                isPointInTriangle(point, trianglePoints[0], trianglePoints[1], trianglePoints[2])
            );
            if (!containsOtherPoint) {
              newTriangles.push({
                point1Id: pointId,
                point2Id: selectedPoint1Id,
                point3Id: selectedPoint2Id,
                player: currentPlayer,
              });
            }
          }
        }
      }

      if (newTriangles.length > 0) {
        setTriangles([...triangles, ...newTriangles]);
        const updatedScores = [...scores];
        updatedScores[currentPlayer] += newTriangles.length;
        setScores(updatedScores);
      } else {
        setCurrentPlayer((currentPlayer + 1) % numPlayers);
      }

      setSelectedPointsIds([]);

      if (!canDrawMoreEdges(points, newEdges)) {
        setGameOver(true);
      }
    }
  };

  const getWinnerText = () => {
    const maxScore = Math.max(...scores);
    const winners = scores.map((score, idx) => (score === maxScore ? idx : -1)).filter((idx) => idx !== -1);
    if (winners.length === scores.length) return "It's a tie!";
    if (winners.length === 1) return `Player ${players[winners[0]].name} wins!`;
    return `Tie: ${winners.map((winnerIndex) => players[winnerIndex].name).join(', ')}`;
  };

  return (
    <div style={{ textAlign: 'center' }} className="container">
      {/*Header*/}
      <div style={{ padding: '16px' }}>
        <h1>Triangulate Game</h1>
        <div>
          {scores.map((score, index) => (
            <span
              key={index.valueOf()}
              style={{
                color: currentPlayer === index ? players[index].color : undefined,
                fontWeight: currentPlayer === index ? 'bold' : undefined,
                marginRight: 8,
              }}
            >
              {players[index]?.name ?? ''}: {score}
              {index < scores.length - 1 && ' | '}
            </span>
          ))}
        </div>
      </div>

      {/*Game canvas*/}
      <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap' }}>
        <Stage
          width={canvasSize.width}
          height={canvasSize.height}
          style={{
            border: '2px solid #ccc',
            boxShadow: '0 0 10px rgba(0,0,0,0.2)',
            backgroundColor: players[currentPlayer].backgroundColor,
            padding: '10px',
          }}
        >
          <Layer>
            {triangles.map((triangle, index) => (
              <Line
                key={index.valueOf()}
                points={[
                  points[triangle.point1Id].x,
                  points[triangle.point1Id].y,
                  points[triangle.point2Id].x,
                  points[triangle.point2Id].y,
                  points[triangle.point3Id].x,
                  points[triangle.point3Id].y,
                ]}
                closed
                fill={players[triangle.player].color}
                opacity={0.3}
              />
            ))}
            {edges.map((edge, index) => (
              <Line
                key={index.valueOf()}
                points={[
                  points[edge.point1Id].x,
                  points[edge.point1Id].y,
                  points[edge.point2Id].x,
                  points[edge.point2Id].y,
                ]}
                stroke={players[edge.player].color}
                strokeWidth={3}
              />
            ))}
            {points.map((point) => (
              <React.Fragment key={point.id}>
                <Circle
                  x={point.x}
                  y={point.y}
                  radius={20}
                  fill="transparent"
                  onClick={() => handlePointClick(point.id)}
                  onTap={() => handlePointClick(point.id)}
                  onMouseEnter={(e) => {
                    const container = e.target.getStage()?.container();
                    if (container) container.style.cursor = 'pointer';
                  }}
                  onMouseLeave={(e) => {
                    const container = e.target.getStage()?.container();
                    if (container) container.style.cursor = 'default';
                  }}
                />
                <Circle
                  x={point.x}
                  y={point.y}
                  radius={12}
                  fill="#fff"
                  stroke={selectedPointsIds.includes(point.id) ? players[currentPlayer].color : '#333'}
                  strokeWidth={3}
                  listening={false}
                />
                <Circle
                  x={point.x}
                  y={point.y}
                  radius={7}
                  fill={selectedPointsIds.includes(point.id) ? players[currentPlayer].color : '#333'}
                  listening={false}
                />
              </React.Fragment>
            ))}
            {gameOver && (
              <>
                <Rect
                  x={0}
                  y={0}
                  width={canvasSize.width}
                  height={canvasSize.height}
                  fill="black"
                  opacity={0.5}
                  listening={false}
                />
                <Text
                  text={`Game Over!\n${getWinnerText()}`}
                  fontSize={36}
                  fill="#fff"
                  width={canvasSize.width}
                  height={canvasSize.height}
                  align="center"
                  verticalAlign="middle"
                  fontStyle="bold"
                  listening={false}
                />
              </>
            )}
          </Layer>
        </Stage>
      </div>

      {/*Footer*/}
      <div style={{ marginTop: 16 }}>
        <div
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', alignContent: 'center', gap: 32 }}
        >
          <label style={{ margin: 0 }}>
            #Players:{' '}
            <select
              value={numPlayers}
              onChange={(e) => handleNumberOfPlayersChange(Number(e.target.value))}
              style={{ width: 100, margin: 0 }}
            >
              {[2, 3, 4].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
          <label style={{ margin: 0 }}>
            #Points:{' '}
            <input
              type="number"
              value={numPoints}
              min={GAME_CONFIG.POINTS.MIN_COUNT}
              max={GAME_CONFIG.POINTS.MAX_COUNT}
              onChange={(e) => handleNumberOfPointsChange(Number(e.target.value))}
              style={{ width: 100, margin: 0 }}
            />
          </label>
          <button onClick={initializeGame} style={{ marginLeft: '12px' }}>
            Restart Game
          </button>
        </div>
        <div style={{ marginTop: 16 }}>
          <a
            href="https://github.com/LaisRast/triangulate-game"
            target="_blank"
            rel="noopener noreferrer"
            referrerPolicy="no-referrer"
          >
            Source Code
          </a>
        </div>
        {errorMessage && <div style={{ color: 'red', marginTop: '8px' }}>{errorMessage}</div>}
      </div>
    </div>
  );
};

export default Game;
