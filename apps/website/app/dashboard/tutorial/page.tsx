"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CreditCard } from "lucide-react";
import { useRouter } from "next/navigation";

export default function TutorialPage() {
  const [isPlaying, setIsPlaying] = useState(false);
  const router = useRouter();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Tutorial</h1>
        <p className="text-muted-foreground">
          Learn how to use ReTap effectively
        </p>
      </div>

      <div className="flex flex-col items-center justify-center space-y-6">
        <div className="relative w-full max-w-4xl aspect-video bg-black rounded-lg overflow-hidden">
          {isPlaying ? (
            <video
              className="w-full h-full"
              controls
              autoPlay
              src="/tutorial.mp4"
            >
              Your browser does not support the video tag.
            </video>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
              <div className="text-center space-y-4">
                <div className="w-20 h-20 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                  <CreditCard className="w-10 h-10 text-primary" />
                </div>
                <p className="text-white text-lg">Scopri i nostri piani</p>
              </div>
            </div>
          )}
        </div>

        {!isPlaying && (
          <Button
            size="lg"
            onClick={() => router.push('/checkout')}
            className="flex items-center gap-2"
          >
            <CreditCard className="w-4 h-4" />
            Abbonati ora
          </Button>
        )}
      </div>
    </div>
  );
} 