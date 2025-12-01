// app/dashboard/page.tsx
"use client";

import * as React from "react";
import { useAccount } from "@/components/dashboard/AccountContext";
import { TopBar } from "@/components/dashboard/TopBar";



export default function OverviewPage() {
  const { accountId } = useAccount();

  
  return (
    <div className="w-full">
      <TopBar subtitle="Overview" title="Campaign Performance" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        

      </div>
    </div>
  );
}
