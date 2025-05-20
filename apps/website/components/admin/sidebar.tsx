"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Store,
  CreditCard,
  Settings,
  Receipt,
} from "lucide-react";

const menuItems = [
  {
    title: "Dashboard",
    href: "/admin-panel/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Merchants",
    href: "/admin-panel/merchants",
    icon: Store,
  },
  {
    title: "Subscriptions",
    href: "/admin-panel/subscriptions",
    icon: CreditCard,
  },
  {
    title: "Transactions",
    href: "/admin-panel/transactions",
    icon: Receipt,
  },
  {
    title: "Settings",
    href: "/admin-panel/settings",
    icon: Settings,
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="w-64 bg-white border-r h-screen">
      <div className="p-6">
        <h1 className="text-2xl font-bold">ReTap Admin</h1>
      </div>
      <nav className="space-y-1 px-3">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                pathname === item.href
                  ? "bg-gray-100 text-gray-900"
                  : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.title}
            </Link>
          );
        })}
      </nav>
    </div>
  );
} 