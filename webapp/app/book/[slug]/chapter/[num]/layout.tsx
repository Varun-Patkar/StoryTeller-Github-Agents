export default function ChapterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // No header in chapter reader — it has its own minimal top bar
  return <>{children}</>;
}
