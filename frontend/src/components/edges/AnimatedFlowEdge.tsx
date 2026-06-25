"use client";

import { memo } from "react";
import { EdgeProps, getBezierPath } from "reactflow";

interface AnimatedFlowEdgeData {
  color?: "mint" | "gold" | "crimson" | "idle";
  particleCount?: number;
  speed?: number;
  active?: boolean;
}

function AnimatedFlowEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
}: EdgeProps<AnimatedFlowEdgeData>) {
  const color = data?.color || "idle";
  const particleCount = data?.particleCount || 4;
  const speed = data?.speed || 2;
  const active = data?.active !== false;

  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
  });

  const colorMap = {
    mint: { stroke: "#10b981", glow: "rgba(16,185,129,0.6)", particle: "#34d399" },
    gold: { stroke: "#f59e0b", glow: "rgba(245,158,11,0.6)", particle: "#fbbf24" },
    crimson: { stroke: "#ef4444", glow: "rgba(239,68,68,0.6)", particle: "#f87171" },
    idle: { stroke: "#27272a", glow: "transparent", particle: "#3f3f46" },
  };

  const c = colorMap[color];
  const isActive = active && color !== "idle";

  return (
    <g className="react-flow__edge-path-group">
      {/* Glow layer */}
      {isActive && (
        <path
          d={edgePath}
          fill="none"
          stroke={c.glow}
          strokeWidth={8}
          strokeLinecap="round"
          style={{ filter: `blur(4px)` }}
        />
      )}

      {/* Base path */}
      <path
        id={`edge-path-${id}`}
        d={edgePath}
        fill="none"
        stroke={c.stroke}
        strokeWidth={isActive ? 2.5 : 1.5}
        strokeLinecap="round"
        style={{
          transition: "stroke 0.3s ease, stroke-width 0.3s ease",
          opacity: isActive ? 1 : 0.4,
        }}
      />

      {/* Animated particles */}
      {isActive &&
        Array.from({ length: particleCount }).map((_, i) => {
          const delay = (i / particleCount) * speed;
          const size = 3 + Math.random() * 2;
          return (
            <circle
              key={`${id}-particle-${i}`}
              r={size}
              fill={c.particle}
              style={{
                filter: `drop-shadow(0 0 ${size + 2}px ${c.glow})`,
              }}
            >
              <animateMotion
                dur={`${speed}s`}
                begin={`${delay}s`}
                repeatCount="indefinite"
                path={edgePath}
              />
              <animate
                attributeName="opacity"
                values="0;1;1;0"
                keyTimes="0;0.1;0.8;1"
                dur={`${speed}s`}
                begin={`${delay}s`}
                repeatCount="indefinite"
              />
              <animate
                attributeName="r"
                values={`${size * 0.5};${size};${size * 1.2};${size * 0.5}`}
                keyTimes="0;0.3;0.7;1"
                dur={`${speed}s`}
                begin={`${delay}s`}
                repeatCount="indefinite"
              />
            </circle>
          );
        })}

      {/* Leading bright particle */}
      {isActive && (
        <circle r={5} fill="white" opacity={0.9} style={{ filter: `drop-shadow(0 0 8px ${c.stroke})` }}>
          <animateMotion
            dur={`${speed * 0.8}s`}
            repeatCount="indefinite"
            path={edgePath}
          />
          <animate
            attributeName="opacity"
            values="0.9;0.5;0.9"
            dur={`${speed * 0.8}s`}
            repeatCount="indefinite"
          />
        </circle>
      )}
    </g>
  );
}

export default memo(AnimatedFlowEdge);
