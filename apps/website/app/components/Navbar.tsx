"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export function Navbar() {
  return (
    <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-sm border-b z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center">
          <img src="/retapLogo.png" alt="ReTap logo" className="h-32 w-auto" style={{maxHeight:128}} />
        </Link>
        
        <div className="hidden md:flex items-center space-x-8">
          <Link href="#home" className="text-gray-600 hover:text-[#FF3131] transition-colors">
            Home
          </Link>
          <Link href="#features" className="text-gray-600 hover:text-[#FF3131] transition-colors">
            Features
          </Link>
          <Link href="#how-it-works" className="text-gray-600 hover:text-[#FF3131] transition-colors">
            How it works
          </Link>
          <Link href="#pricing" className="text-gray-600 hover:text-[#FF3131] transition-colors">
            Pricing
          </Link>
          <Link href="#faq" className="text-gray-600 hover:text-[#FF3131] transition-colors">
            FAQ
          </Link>
        </div>

        <div className="flex items-center space-x-4">
          <Button asChild variant="default" className="h-12 px-5 rounded-lg font-medium text-base shadow flex items-center justify-center bg-[#1A1A1A] hover:bg-[#FF3131] text-white">
            <Link href="/auth" target="_blank" rel="noopener noreferrer">Get Started</Link>
          </Button>
        </div>
      </div>
    </nav>
  );
} 