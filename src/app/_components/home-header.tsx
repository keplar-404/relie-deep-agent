"use client";

import Link from "next/link";
import { SignInButton, SignUpButton, useUser } from "@clerk/nextjs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

export function HomeHeader() {
  const { isSignedIn, isLoaded, user } = useUser();

  return (
    <header className="flex w-full items-center justify-between px-6 py-4 border-b border-border bg-background">
      <div className="flex items-center gap-2 font-bold text-lg tracking-tight">
        <span>Relie</span>
      </div>

      <div className="flex items-center gap-3 min-h-9">
        {!isLoaded ? (
          <div className="h-8 w-20 rounded-md bg-muted/60 animate-pulse" />
        ) : isSignedIn ? (
          <Link
            href="/dashboard"
            className="flex items-center gap-2 rounded-full p-1 hover:bg-accent transition-colors cursor-pointer"
            title="Go to Dashboard"
          >
            <Avatar className="size-8 border border-border">
              <AvatarImage src={user?.imageUrl} alt={user?.fullName ?? "Profile"} />
              <AvatarFallback className="text-xs font-semibold">
                {user?.firstName?.[0] ?? user?.username?.[0] ?? "U"}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium pr-2">Dashboard</span>
          </Link>
        ) : (
          <div className="flex items-center gap-2">
            <SignInButton mode="modal">
              <Button variant="ghost" size="sm" className="cursor-pointer">
                Sign In
              </Button>
            </SignInButton>
            <SignUpButton mode="modal">
              <Button size="sm" className="cursor-pointer">
                Sign Up
              </Button>
            </SignUpButton>
          </div>
        )}
      </div>
    </header>
  );
}
