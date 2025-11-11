import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Doctor Helper",
  description: "Choose the perfect AI medical assistance plan for your needs with AI Doctor Helper.",
};

export default function PlansLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
