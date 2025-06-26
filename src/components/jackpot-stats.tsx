"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCurrentJackpot } from "@/hooks/useCurrentJackpot";
import { useEffect, useState } from "react";

export default function JackpotStats() {
  const { isLoading, formattedJackpot, timeLeft, price, odds } = useCurrentJackpot();

  // Live countdown state
  const [liveTimeLeft, setLiveTimeLeft] = useState(timeLeft);

  useEffect(() => {
    setLiveTimeLeft(timeLeft); // Reset when timeLeft from hook changes
    if (timeLeft <= 0) return;
    const interval = setInterval(() => {
      setLiveTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [timeLeft]);

  // Format liveTimeLeft as hh:mm:ss
  const hours = Math.floor(liveTimeLeft / 3600);
  const minutes = Math.floor((liveTimeLeft % 3600) / 60);
  const seconds = liveTimeLeft % 60;

  return (
    <Card className="max-w-md mx-auto my-8 shadow-lg">
      <CardHeader>
        <CardTitle>Current Jackpot</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Loading...</div>
        ) : (
          <>
            <div className="text-4xl font-bold mb-2 text-center">{formattedJackpot} <span className="text-lg font-medium">USDC</span></div>
            <div className="mb-2 text-center">Time Remaining: <span className="font-mono">{`${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`}</span></div>
            <div className="mb-2 text-center">Ticket Price: <span className="font-semibold">{price} USDC</span></div>
            <div className="text-center">Odds of winning: <span className="font-semibold">1 in {odds}</span></div>
          </>
        )}
      </CardContent>
    </Card>
  );
} 