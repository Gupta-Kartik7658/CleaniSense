import React from "react";

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = "" }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse bg-slate-250 dark:bg-slate-700 rounded-lg ${className}`}
    />
  );
}
