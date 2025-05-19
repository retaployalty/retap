"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export function Navbar() {
  return (
    <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-sm border-b z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="text-2xl font-bold text-primary">
          ReTap
        </Link>
        
        <div className="hidden md:flex items-center space-x-8">
          <Link href="#overview" className="text-gray-600 hover:text-primary transition-colors">
            Overview
          </Link>
          <Link href="#features" className="text-gray-600 hover:text-primary transition-colors">
            Features
          </Link>
          <Link href="#how-it-works" className="text-gray-600 hover:text-primary transition-colors">
            How it works
          </Link>
          <Link href="#pricing" className="text-gray-600 hover:text-primary transition-colors">
            Pricing
          </Link>
        </div>

        <div className="flex items-center space-x-4">
          <Button asChild variant="default">
            <Link href="/auth" target="_blank" rel="noopener noreferrer">Get Started</Link>
          </Button>
        </div>
      </div>
    </nav>
  );
} 