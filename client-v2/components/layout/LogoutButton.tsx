"use client";

import { Button } from "@/components/ui/button";
import { deleteCookie } from "@/shared/utils/cookies";
import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";

export function LogoutButton() {
  const router = useRouter();

  const handleLogout = () => {
    deleteCookie("access_token");
    deleteCookie("workspace_id");
    router.push("/");
    router.refresh();
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleLogout}
      className="text-zinc-600 hover:text-red-600 dark:text-zinc-400 dark:hover:text-red-400 gap-2 font-medium"
    >
      <LogOut className="h-4 w-4" />
      <span className="hidden lg:inline">Log out</span>
    </Button>
  );
}
