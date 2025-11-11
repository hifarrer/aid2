import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Doctor Helper",
  description: "Privacy Policy for AI Doctor Helper - Learn how we protect your health data and privacy.",
};

export default function PrivacyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
