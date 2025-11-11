import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Doctor Helper",
  description: "View and manage your medical reports and analysis with AI Doctor Helper.",
};

export default function ReportsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
