"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Menu, X } from "lucide-react";

export function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  return (
    <nav className="fixed top-0 w-full bg-white/95 backdrop-blur-sm border-b z-50">
      <div className="container mx-auto px-4 h-20 flex items-center justify-between">
        <Link href="/" className="flex items-center" onClick={closeMenu}>
          <img src="/retapLogo.png" alt="ReTap logo" className="h-16 sm:h-20 md:h-24 lg:h-28 w-auto" style={{maxHeight: '112px'}} />
        </Link>
        
        {/* Desktop Navigation */}
        <div className="hidden lg:flex items-center space-x-8">
          <Link href="#home" className="text-gray-600 hover:text-[#FF3131] transition-colors text-base font-medium">
            Home
          </Link>
          <Link href="#how-it-works" className="text-gray-600 hover:text-[#FF3131] transition-colors text-base font-medium">
            How it works
          </Link>
          <Link href="#features" className="text-gray-600 hover:text-[#FF3131] transition-colors text-base font-medium">
            Features
          </Link>
          <Link href="#pricing" className="text-gray-600 hover:text-[#FF3131] transition-colors text-base font-medium">
            Pricing
          </Link>
          <Link href="#faq" className="text-gray-600 hover:text-[#FF3131] transition-colors text-base font-medium">
            FAQ
          </Link>
        </div>

        {/* Desktop Buttons */}
        <div className="hidden lg:flex items-center space-x-6">
          <Link href="/auth" className="text-[#1A1A1A] font-medium hover:text-[#FF3131] transition-colors text-base">
            Merchant Login
          </Link>
          <Button asChild variant="default" className="h-12 px-6 rounded-lg font-medium text-base shadow flex items-center justify-center bg-[#1A1A1A] hover:bg-[#FF3131] text-white">
            <Link href="/auth" target="_blank" rel="noopener noreferrer">Get Started</Link>
          </Button>
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={toggleMenu}
          className="lg:hidden p-2 rounded-md text-gray-600 hover:text-[#FF3131] hover:bg-gray-100 transition-colors"
          aria-label="Toggle menu"
        >
          {isMenuOpen ? <X className="h-7 w-7" /> : <Menu className="h-7 w-7" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="lg:hidden bg-white border-t border-gray-200 shadow-lg">
          <div className="px-4 py-6 space-y-4">
            {/* Mobile Navigation Links */}
            <div className="space-y-3">
              <Link 
                href="#home" 
                className="block text-gray-600 hover:text-[#FF3131] transition-colors text-lg font-medium py-3"
                onClick={closeMenu}
              >
                Home
              </Link>
              <Link 
                href="#how-it-works" 
                className="block text-gray-600 hover:text-[#FF3131] transition-colors text-lg font-medium py-3"
                onClick={closeMenu}
              >
                How it works
              </Link>
              <Link 
                href="#features" 
                className="block text-gray-600 hover:text-[#FF3131] transition-colors text-lg font-medium py-3"
                onClick={closeMenu}
              >
                Features
              </Link>
              <Link 
                href="#pricing" 
                className="block text-gray-600 hover:text-[#FF3131] transition-colors text-lg font-medium py-3"
                onClick={closeMenu}
              >
                Pricing
              </Link>
              <Link 
                href="#faq" 
                className="block text-gray-600 hover:text-[#FF3131] transition-colors text-lg font-medium py-3"
                onClick={closeMenu}
              >
                FAQ
              </Link>
            </div>
            
            {/* Mobile Buttons */}
            <div className="pt-4 border-t border-gray-200 space-y-3">
              <Link 
                href="/auth" 
                className="block text-[#1A1A1A] font-medium hover:text-[#FF3131] transition-colors text-lg py-3"
                onClick={closeMenu}
              >
                Merchant Login
              </Link>
              <Button asChild variant="default" className="w-full h-14 rounded-lg font-medium text-lg shadow flex items-center justify-center bg-[#1A1A1A] hover:bg-[#FF3131] text-white">
                <Link href="/auth" target="_blank" rel="noopener noreferrer" onClick={closeMenu}>
                  Get Started
                </Link>
              </Button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
} 