"use client";

import { useState, useEffect } from "react";
import { X, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

type SubscriptionAlert = {
  daysRemaining: number;
  endDate: string;
  userName: string;
};

export default function SubscriptionAlert() {
  const [alert, setAlert] = useState<SubscriptionAlert | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const checkAlert = async () => {
      try {
        const res = await fetch("/api/users/subscription-alert");
        if (res.ok) {
          const data = (await res.json()) as { alert: SubscriptionAlert | null };
          setAlert(data.alert);
        }
      } catch {
        // Silently fail
      }
    };

    void checkAlert();
    // Check every 5 minutes
    const interval = setInterval(checkAlert, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (!alert || dismissed) return null;

  return (
    <div className="bg-amber-50 border-b border-amber-200 px-4 py-2">
      <div className="flex items-center justify-between gap-2 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <AlertTriangle className="size-4 text-amber-600" />
          <span className="text-xs text-amber-800">
            Subscription Anda akan berakhir dalam{" "}
            <Badge variant="outline" className="border-amber-300 bg-amber-100 text-amber-700 text-[10px]">
              {alert.daysRemaining} hari
            </Badge>
            <span className="ml-1">({alert.endDate})</span>
          </span>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="rounded p-1 hover:bg-amber-100"
          title="Tutup"
        >
          <X className="size-3.5 text-amber-600" />
        </button>
      </div>
    </div>
  );
}
