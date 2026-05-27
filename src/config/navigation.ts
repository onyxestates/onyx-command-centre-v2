import type { NavItem } from "@/types/app";

export const NAV_ITEMS: NavItem[] = [
  { title: "Dashboard", href: "/dashboard", icon: "layout-dashboard" },
  { title: "Properties", href: "/properties", icon: "building-2", permission: "canManageListings" },
  { title: "Reservations", href: "/reservations", icon: "book-open", permission: "canManageReservations" },
  { title: "Guests", href: "/guests", icon: "users", permission: "canManageGuests" },
  { title: "Messaging", href: "/messaging", icon: "messages-square", permission: "canManageGuests" },
  { title: "Cleanings", href: "/cleanings", icon: "sparkles", permission: "canManageCleanings" },
  { title: "Maintenance", href: "/maintenance", icon: "wrench", permission: "canManageMaintenance" },
  { title: "Calendar", href: "/calendar", icon: "calendar-days" },
  { title: "Reports", href: "/reports", icon: "bar-chart-3", permission: "canViewAnalytics" },
  { title: "Inventory", href: "/inventory", icon: "package-2", permission: "canManageInventory" },
  { title: "Settings", href: "/settings", icon: "settings", permission: "canManageSettings" }
];
