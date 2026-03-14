import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "./button";

export interface PatternLockProps {
  value?: string;
  onChange?: (pattern: string) => void;
  className?: string;
  readOnly?: boolean;
}

interface Point {
  row: number;
  col: number;
}

const POINTS: Point[] = [
  { row: 0, col: 0 }, { row: 0, col: 1 }, { row: 0, col: 2 },
  { row: 1, col: 0 }, { row: 1, col: 1 }, { row: 1, col: 2 },
  { row: 2, col: 0 }, { row: 2, col: 1 }, { row: 2, col: 2 },
];

const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));

export function PatternLock({ value, onChange, className, readOnly = false }: PatternLockProps) {
  const [selectedPoints, setSelectedPoints] = React.useState<number[]>([]);
  const [isDrawing, setIsDrawing] = React.useState(false);
  const [cursor, setCursor] = React.useState<{ x: number; y: number } | null>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (value) {
      try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) setSelectedPoints(parsed);
      } catch {
        const points = value.split(",").map(Number).filter((n) => !isNaN(n) && n >= 0 && n < 9);
        setSelectedPoints(points);
      }
    } else {
      setSelectedPoints([]);
    }
  }, [value]);

  const indexToPoint = (index: number): Point => POINTS[index];

  const getPointPosition = (index: number) => {
    const p = indexToPoint(index);
    const step = 100 / 3;
    const center = step / 2;
    return { top: `${p.row * step + center}%`, left: `${p.col * step + center}%` };
  };

  const getPointCenterSvg = (index: number) => {
    const p = indexToPoint(index);
    const step = 100 / 3;
    const center = step / 2;
    return { x: p.col * step + center, y: p.row * step + center };
  };

  const getIntermediateIfAny = (a: number, b: number): number | null => {
    const pa = indexToPoint(a);
    const pb = indexToPoint(b);
    const dr = pb.row - pa.row;
    const dc = pb.col - pa.col;
    if (dr === 0 && Math.abs(dc) === 2) return pa.row * 3 + (pa.col + dc / 2);
    if (dc === 0 && Math.abs(dr) === 2) return (pa.row + dr / 2) * 3 + pa.col;
    if (Math.abs(dr) === 2 && Math.abs(dc) === 2) return (pa.row + dr / 2) * 3 + (pa.col + dc / 2);
    return null;
  };

  const commitPoints = (points: number[]) => {
    setSelectedPoints(points);
    if (onChange) onChange(points.length ? JSON.stringify(points) : "");
  };

  const addPoint = (next: number) => {
    if (selectedPoints.includes(next)) return;
    const last = selectedPoints[selectedPoints.length - 1];
    let updated = [...selectedPoints];
    if (typeof last === "number") {
      const mid = getIntermediateIfAny(last, next);
      if (mid !== null && !updated.includes(mid)) updated.push(mid);
    }
    updated.push(next);
    commitPoints(updated);
  };

  const getLocalXY = (clientX: number, clientY: number) => {
    const rect = containerRef.current!.getBoundingClientRect();
    const x = clamp(clientX - rect.left, 0, rect.width);
    const y = clamp(clientY - rect.top, 0, rect.height);
    return { x, y, rect };
  };

  const findNearestPoint = (clientX: number, clientY: number) => {
    if (!containerRef.current) return null;
    const { x, y, rect } = getLocalXY(clientX, clientY);
    const px = (x / rect.width) * 100;
    const py = (y / rect.height) * 100;
    const hitRadius = 12;
    let best: { idx: number; d2: number } | null = null;
    for (let i = 0; i < 9; i++) {
      const c = getPointCenterSvg(i);
      const dx = px - c.x;
      const dy = py - c.y;
      const d2 = dx * dx + dy * dy;
      if (d2 <= hitRadius * hitRadius) {
        if (!best || d2 < best.d2) best = { idx: i, d2 };
      }
    }
    return best?.idx ?? null;
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (readOnly || !containerRef.current) return;
    containerRef.current.setPointerCapture(e.pointerId);
    setIsDrawing(true);
    const nearest = findNearestPoint(e.clientX, e.clientY);
    if (nearest !== null) commitPoints([nearest]);
    else commitPoints([]);
    const { x, y, rect } = getLocalXY(e.clientX, e.clientY);
    setCursor({ x: (x / rect.width) * 100, y: (y / rect.height) * 100 });
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (readOnly || !isDrawing || !containerRef.current) return;
    const { x, y, rect } = getLocalXY(e.clientX, e.clientY);
    setCursor({ x: (x / rect.width) * 100, y: (y / rect.height) * 100 });
    const nearest = findNearestPoint(e.clientX, e.clientY);
    if (nearest !== null) addPoint(nearest);
  };

  const handlePointerUp = () => {
    if (readOnly) return;
    setIsDrawing(false);
    setCursor(null);
  };

  const handleClear = () => {
    commitPoints([]);
    setCursor(null);
    setIsDrawing(false);
  };

  const isSelected = (idx: number) => selectedPoints.includes(idx);
  const lastSelected = selectedPoints.length ? selectedPoints[selectedPoints.length - 1] : null;

  return (
    <div className={cn("space-y-3 w-full", className)}>
      <div className="flex justify-center w-full">
        <div
          ref={containerRef}
          className={cn(
            "relative aspect-square w-full max-w-[250px] rounded bg-transparent select-none touch-none",
            readOnly ? "cursor-default" : "cursor-pointer"
          )}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onPointerLeave={handlePointerUp}
        >
          {/* Líneas (Grosor mantenido en 4) */}
          <svg className="absolute inset-0 h-full w-full pointer-events-none" viewBox="0 0 100 100">
            {selectedPoints.map((idx, i) => {
              if (i === 0) return null;
              const a = getPointCenterSvg(selectedPoints[i - 1]);
              const b = getPointCenterSvg(idx);
              return <line key={`line-${i}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="hsl(var(--primary))" strokeWidth="4" strokeLinecap="round" />;
            })}
            {isDrawing && cursor && lastSelected !== null && (
              <line x1={getPointCenterSvg(lastSelected).x} y1={getPointCenterSvg(lastSelected).y} x2={cursor.x} y2={cursor.y} stroke="hsl(var(--primary))" strokeWidth="4" strokeLinecap="round" opacity="0.6" />
            )}
          </svg>

          {/* Puntos (Tamaños aumentados) */}
          {POINTS.map((_, index) => {
            const pos = getPointPosition(index);
            const active = isSelected(index);
            const isStartNode = selectedPoints.length > 0 && selectedPoints[0] === index;

            return (
              <div
                key={index}
                className={cn(
                  "absolute -translate-x-1/2 -translate-y-1/2 rounded-full border-2 transition-all duration-200",
                  active
                    ? isStartNode
                      ? "h-7 w-7 bg-green-500 border-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]" // Aumentado a h-7 w-7 (28px)
                      : "h-7 w-7 bg-primary border-primary shadow-[0_0_10px_rgba(59,130,246,0.5)]" // Aumentado a h-7 w-7 (28px)
                    : "h-6 w-6 bg-transparent border-muted-foreground/30" // Aumentado a h-6 w-6 (24px)
                )}
                style={{ top: pos.top, left: pos.left }}
              >
                {active && (
                  <div className="absolute left-1/2 top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white" /> // Aumentado ligeramente el punto interno
                )}
              </div>
            );
          })}
        </div>
      </div>

      {!readOnly && (
        <div className="space-y-1">
          <Button type="button" variant="ghost" size="sm" onClick={handleClear} className="w-full h-8 text-xs text-muted-foreground hover:text-foreground">
            Limpiar
          </Button>
          <div className="h-4 flex items-center justify-center">
            <p className={cn("text-[10px] text-center text-muted-foreground transition-opacity duration-300", selectedPoints.length > 0 ? "opacity-100" : "opacity-0")}>
              Patrón de {selectedPoints.length} punto{selectedPoints.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}