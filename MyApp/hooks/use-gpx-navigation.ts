import { useCallback, useEffect, useMemo, useState } from "react";
import { buildSteps, getNextStep } from "@/data/navigationSteps";
import { getTrackHeading, type GpxTrack } from "@/data/gpxTracks";

// Phát lại một tuyến GPX đã ghi: tăng chỉ số điểm theo stepMs của tuyến.
export function useGpxNavigation() {
  const [state, setState] = useState<{ track: GpxTrack; step: number } | null>(
    null,
  );
  const track = state?.track ?? null;
  const step = state?.step ?? 0;

  useEffect(() => {
    if (!track) return;
    const timer = setInterval(() => {
      setState((current) =>
        current && current.step < current.track.route.length - 1
          ? { ...current, step: current.step + 1 }
          : current,
      );
    }, track.stepMs);
    return () => clearInterval(timer);
  }, [track]);

  const steps = useMemo(
    () =>
      track ? buildSteps(track.route, track.totalMeters, track.toName) : [],
    [track],
  );
  const camera = useMemo(
    () =>
      track
        ? {
            coordinate: track.route[step],
            heading: getTrackHeading(track, step),
          }
        : undefined,
    [track, step],
  );

  const start = useCallback(
    (next: GpxTrack) => setState({ track: next, step: 0 }),
    [],
  );
  const stop = useCallback(() => setState(null), []);

  const traveled = track ? track.cumulative[step] : 0;
  const remaining = track
    ? Math.max(0, Math.round(track.totalMeters - traveled))
    : 0;
  return {
    active: track !== null,
    track,
    camera,
    start,
    stop,
    remaining,
    minutes: track
      ? Math.max(1, Math.ceil(remaining / track.metersPerMinute))
      : 0,
    progress: track ? step / (track.route.length - 1) : 0,
    arrived: track !== null && step >= track.route.length - 1,
    next: track ? getNextStep(steps, traveled) : null,
  };
}

export type GpxNavigation = ReturnType<typeof useGpxNavigation>;
