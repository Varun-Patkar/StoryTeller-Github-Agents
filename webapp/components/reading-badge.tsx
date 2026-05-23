"use client";

import { useAllReadingProgress } from "@/lib/reading-progress";

export function ReadingBadge({ slug }: { slug: string }) {
  const { all, loaded } = useAllReadingProgress();

  if (!loaded) return null;

  const progress = all[slug];
  if (!progress) return null;

  return (
    <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
      Ch. {progress.chapter}
      {progress.scrollPercent > 0 && progress.scrollPercent < 100 && (
        <> · {progress.scrollPercent}%</>
      )}
    </span>
  );
}
