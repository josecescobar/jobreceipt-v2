import React from 'react';
import SvgOrig, {
  Line as LineOrig,
  Ellipse as EllipseOrig,
  Rect as RectOrig,
  Text as SvgTextOrig,
  Path as PathOrig,
  Defs as DefsOrig,
  Marker as MarkerOrig,
  Polygon as PolygonOrig,
} from 'react-native-svg';
import type { Annotation } from '@jobreceipt/shared';

// Workaround for react-native-svg JSX type incompatibility with @types/react 18.3.x
// See: https://github.com/software-mansion/react-native-svg/issues/1986
const Svg = SvgOrig as unknown as React.ComponentType<any>;
const Line = LineOrig as unknown as React.ComponentType<any>;
const Ellipse = EllipseOrig as unknown as React.ComponentType<any>;
const Rect = RectOrig as unknown as React.ComponentType<any>;
const SvgText = SvgTextOrig as unknown as React.ComponentType<any>;
const Path = PathOrig as unknown as React.ComponentType<any>;
const Defs = DefsOrig as unknown as React.ComponentType<any>;
const Marker = MarkerOrig as unknown as React.ComponentType<any>;
const Polygon = PolygonOrig as unknown as React.ComponentType<any>;

interface MarkupCanvasProps {
  annotations: Annotation[];
  currentAnnotation: Annotation | null;
  width: number;
  height: number;
}

function renderAnnotation(
  annotation: Annotation,
  width: number,
  height: number,
  index: number,
) {
  const { type, color, strokeWidth, data, id } = annotation;

  switch (type) {
    case 'arrow': {
      const x1 = (data.startX ?? 0) * width;
      const y1 = (data.startY ?? 0) * height;
      const x2 = (data.endX ?? 0) * width;
      const y2 = (data.endY ?? 0) * height;
      const markerId = `arrowhead-${id}-${index}`;
      return (
        <React.Fragment key={`arrow-${id}-${index}`}>
          <Defs>
            <Marker
              id={markerId}
              viewBox="0 0 10 10"
              refX="10"
              refY="5"
              markerWidth="8"
              markerHeight="8"
              orient="auto-start-reverse"
            >
              <Polygon points="0,0 10,5 0,10" fill={color} />
            </Marker>
          </Defs>
          <Line
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke={color}
            strokeWidth={strokeWidth}
            markerEnd={`url(#${markerId})`}
          />
        </React.Fragment>
      );
    }

    case 'circle': {
      const cx = (data.cx ?? 0) * width;
      const cy = (data.cy ?? 0) * height;
      const rx = (data.rx ?? 0) * width;
      const ry = (data.ry ?? 0) * height;
      return (
        <Ellipse
          key={`circle-${id}-${index}`}
          cx={cx}
          cy={cy}
          rx={Math.abs(rx)}
          ry={Math.abs(ry)}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
        />
      );
    }

    case 'rectangle': {
      const x = (data.x ?? 0) * width;
      const y = (data.y ?? 0) * height;
      const w = (data.width ?? 0) * width;
      const h = (data.height ?? 0) * height;
      // Handle negative width/height by computing top-left
      const rectX = w < 0 ? x + w : x;
      const rectY = h < 0 ? y + h : y;
      return (
        <Rect
          key={`rect-${id}-${index}`}
          x={rectX}
          y={rectY}
          width={Math.abs(w)}
          height={Math.abs(h)}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
        />
      );
    }

    case 'text': {
      const tx = (data.x ?? 0) * width;
      const ty = (data.y ?? 0) * height;
      const fontSize = data.fontSize ?? 16;
      return (
        <SvgText
          key={`text-${id}-${index}`}
          x={tx}
          y={ty}
          fill={color}
          fontSize={fontSize}
          fontWeight="bold"
        >
          {data.text ?? ''}
        </SvgText>
      );
    }

    case 'freehand': {
      const points = data.points ?? [];
      if (points.length < 2) return null;
      const d = points
        .map((p, i) => {
          const px = p.x * width;
          const py = p.y * height;
          return i === 0 ? `M ${px},${py}` : `L ${px},${py}`;
        })
        .join(' ');
      return (
        <Path
          key={`freehand-${id}-${index}`}
          d={d}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      );
    }

    default:
      return null;
  }
}

export function MarkupCanvas({
  annotations,
  currentAnnotation,
  width,
  height,
}: MarkupCanvasProps) {
  const allAnnotations = currentAnnotation
    ? [...annotations, currentAnnotation]
    : annotations;

  return (
    <Svg
      width={width}
      height={height}
      style={{ position: 'absolute', top: 0, left: 0 }}
    >
      {allAnnotations.map((annotation, index) =>
        renderAnnotation(annotation, width, height, index),
      )}
    </Svg>
  );
}
