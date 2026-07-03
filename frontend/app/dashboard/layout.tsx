"use client";

import React from "react";
import { PortalLayout } from "@/components/dashboard/PortalLayout";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PortalLayout>{children}</PortalLayout>;
}
