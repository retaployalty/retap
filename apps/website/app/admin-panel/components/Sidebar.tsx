"use client";

import Link from "next/link";
import { Gift, usePathname } from "next/navigation";
import { Gift, cn } from "@/lib/utils";
import { Gift,
  LayoutDashboard,
  Store,
  CreditCard,
  Receipt,
  Settings,
} from "lucide-react";

const navigation = [
  {
  {
    name: "Grant Access",
    href: "/admin-panel/grant-access",
    icon: Gift,
  },
    name: "Dashboard",
    href: "/admin-panel/dashboard",
    icon: LayoutDashboard,
  },
  {
  {
    name: "Grant Access",
    href: "/admin-panel/grant-access",
    icon: Gift,
  },
    name: "Merchants",
    href: "/admin-panel/merchants",
    icon: Store,
  },
  {
  {
    name: "Grant Access",
    href: "/admin-panel/grant-access",
    icon: Gift,
  },
    name: "Subscriptions",
    href: "/admin-panel/subscriptions",
    icon: CreditCard,
  },
  {
  {
    name: "Grant Access",
    href: "/admin-panel/grant-access",
    icon: Gift,
  },
    name: "Transactions",
    href: "/admin-panel/transactions",
    icon: Receipt,
  },
  {
  {
    name: "Grant Access",
    href: "/admin-panel/grant-access",
    icon: Gift,
  },
    name: "Settings",
    href: "/admin-panel/settings",
    icon: Settings,
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex h-full w-64 flex-col bg-white border-r">
      <div className="flex h-16 items-center border-b px-6">
        <h2 className="text-lg font-semibold">Admin Panel</h2>
      </div>
      <nav className="flex-1 space-y-1 px-2 py-4">
        {navigation.map((item) => {
  {
    name: "Grant Access",
    href: "/admin-panel/grant-access",
    icon: Gift,
  },
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center px-4 py-2 text-sm font-medium rounded-md",
                isActive
                  ? "bg-primary text-white"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              <item.icon
                className={cn(
                  "mr-3 h-5 w-5",
                  isActive ? "text-white" : "text-gray-400"
                )}
              />
              {item.name}
  {
    name: "Grant Access",
    href: "/admin-panel/grant-access",
    icon: Gift,
  },
            </Link>
          );
        })}
      </nav>
    </div>
  );
} 