"use client";

import { useEffect, useState, useCallback } from "react";

export interface ReadingProgress {
  chapter: number;
  scrollPercent: number;
  updatedAt: string;
}

const STORAGE_KEY = "storyteller-reading-progress";

function getAll(): Record<string, ReadingProgress> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveAll(data: Record<string, ReadingProgress>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function getProgress(slug: string): ReadingProgress | null {
  const all = getAll();
  return all[slug] || null;
}

export function setProgress(slug: string, chapter: number, scrollPercent: number) {
  const all = getAll();
  all[slug] = {
    chapter,
    scrollPercent,
    updatedAt: new Date().toISOString(),
  };
  saveAll(all);
}

export function useReadingProgress(slug: string) {
  const [progress, setProgressState] = useState<ReadingProgress | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setProgressState(getProgress(slug));
    setLoaded(true);
  }, [slug]);

  const updateProgress = useCallback(
    (chapter: number, scrollPercent: number) => {
      setProgress(slug, chapter, scrollPercent);
      setProgressState({ chapter, scrollPercent, updatedAt: new Date().toISOString() });
    },
    [slug]
  );

  return { progress, updateProgress, loaded };
}

export function useAllReadingProgress() {
  const [all, setAll] = useState<Record<string, ReadingProgress>>({});
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setAll(getAll());
    setLoaded(true);
  }, []);

  return { all, loaded };
}
