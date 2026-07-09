import {
  SignedIn,
  SignedOut,
  SignInButton,
  UserButton,
  useUser,
} from "@clerk/clerk-react";
import { isAdmin } from "@repo/auth";
import type { UserRole } from "@repo/shared";
import type { ReactNode } from "react";
import { Outlet } from "react-router";

function AdminOnly({ children }: { children: ReactNode }) {
  const { user, isLoaded } = useUser();
  if (!isLoaded) return <p>Loading…</p>;
  const role: UserRole =
    user?.publicMetadata?.role === "admin" ? "admin" : "user";
  if (!isAdmin(role)) {
    return <p>Access denied — this console is for admins only.</p>;
  }
  return <>{children}</>;
}

export function RootLayout() {
  return (
    <div style={{ maxWidth: 640, margin: "2rem auto", fontFamily: "system-ui" }}>
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h1>Monostarter — Admin</h1>
        <SignedIn>
          <UserButton />
        </SignedIn>
        <SignedOut>
          <SignInButton />
        </SignedOut>
      </header>
      <main>
        <SignedIn>
          <AdminOnly>
            <Outlet />
          </AdminOnly>
        </SignedIn>
        <SignedOut>
          <p>Please sign in to continue.</p>
        </SignedOut>
      </main>
    </div>
  );
}
