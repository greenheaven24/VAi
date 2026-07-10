import { AuthGuard } from "@/components/auth/AuthGuard";

export default function AnnotateLayout({ children }: { children: React.ReactNode }) {
  return <AuthGuard>{children}</AuthGuard>;
}
