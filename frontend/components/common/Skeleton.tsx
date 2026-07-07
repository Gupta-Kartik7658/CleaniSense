import React from "react";

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = "" }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse rounded-[18px] bg-[color:var(--surface-muted)] ${className}`}
    />
  );
}
