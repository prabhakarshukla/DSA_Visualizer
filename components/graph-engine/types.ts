import type React from "react";

export type Point = {
  x: number;
  y: number;
};

export type EdgeGeometry = {
  path: string;
  arrowPoints: string;
  label: Point;
};

export type GraphStatisticItem = {
  label: string;
  value: React.ReactNode;
  tone?: "default" | "accent" | "warning" | "success";
};

export type GraphLegendItem = {
  label: string;
  description?: string;
  indicatorClassName: string;
  indicatorType?: "dot" | "line" | "ring";
};
