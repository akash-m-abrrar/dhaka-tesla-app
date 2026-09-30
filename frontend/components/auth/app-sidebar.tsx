"use client";

import {
  CarFront,
  ClipboardList,
  CreditCard,
  History,
  House,
  LogOut,
  MapPin,
  Route,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { ThemeToggle } from "@/components/site/theme-toggle";
import type { UserRole } from "@/lib/features/auth/types";

const passengerLinks = [
  { label: "Overview", href: "/passenger", icon: House },
  { label: "Request Ride", href: "/passenger/requests/new", icon: MapPin },
  { label: "My Requests", href: "/passenger/requests", icon: ClipboardList },
  { label: "Payments", href: "/passenger/payments", icon: CreditCard },
] as const;

const driverLinks = [
  { label: "Overview", href: "/driver", icon: House },
  { label: "Vehicle", href: "/driver/vehicle", icon: CarFront },
  { label: "Ride Requests", href: "/driver/ride-requests", icon: ClipboardList },
  { label: "Pools", href: "/driver/pools", icon: Route },
] as const;

export function AppSidebar({
  name,
  role,
  pathname,
  onLogout,
}: {
  name: string;
  role: UserRole;
  pathname: string;
  onLogout: () => void;
}) {
  const links = role === "PASSENGER" ? passengerLinks : driverLinks;
  const { isMobile, setOpenMobile } = useSidebar();

  function navigationLink(href: string) {
    return (
      <Link
        href={href}
        onClick={() => {
          if (isMobile) setOpenMobile(false);
        }}
      />
    );
  }

  return (
    <Sidebar>
      <SidebarHeader>
        <Link className="inline-flex min-h-11 items-center gap-3 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" href="/">
          <span aria-hidden="true" className="grid size-9 place-items-center bg-foreground text-xs font-bold tracking-[-0.08em] text-background">
            TB
          </span>
          <span className="text-xs font-semibold tracking-[0.16em]">TBTESLA BULLET</span>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <nav aria-label="Application navigation">
          <SidebarGroup>
            <SidebarGroupLabel>Workspace</SidebarGroupLabel>
            <SidebarMenu>
              {links.map(({ label, href, icon: Icon }) => {
                const isActive = href === "/passenger/requests" || href === "/driver/pools"
                  ? pathname === href || pathname.startsWith(`${href}/`)
                  : pathname === href;

                return (
                  <SidebarMenuItem key={href}>
                    <SidebarMenuButton
                      aria-current={isActive ? "page" : undefined}
                      className="data-active:bg-sidebar-primary data-active:text-sidebar-primary-foreground"
                      isActive={isActive}
                      render={navigationLink(href)}
                      size="lg"
                    >
                      <Icon aria-hidden="true" className="size-4" />
                      <span>{label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
              {(role === "PASSENGER"
                ? [{ label: "Ride History", icon: History }]
                : [
                    { label: "Ride History", icon: History },
                  ]
              ).map(({ label, icon: Icon }) => (
                <SidebarMenuItem key={label}>
                  <SidebarMenuButton className="h-12" disabled type="button">
                    <Icon aria-hidden="true" className="size-4" />
                    <span>{label}</span>
                    <span className="ml-auto text-[9px] font-semibold uppercase tracking-[0.12em]">Coming soon</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroup>
        </nav>
      </SidebarContent>

      <SidebarFooter>
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{name}</p>
            <p className="mt-0.5 text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">{role}</p>
          </div>
          <ThemeToggle />
        </div>
        <Button className="w-full justify-start" onClick={onLogout} type="button" variant="outline">
          <LogOut aria-hidden="true" />
          Log out
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
