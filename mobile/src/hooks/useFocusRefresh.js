import { useCallback, useEffect, useRef } from "react";

/**
 * Refresh intelligent au focus:
 * - évite de recharger à chaque aller/retour si les données sont récentes
 * - permet un refresh forcé (pull-to-refresh / action utilisateur)
 */
export function useFocusRefresh(
  navigation,
  refreshFn,
  { minIntervalMs = 20_000, runOnMount = true } = {},
) {
  const lastRunAtRef = useRef(0);
  const runningRef = useRef(false);

  const run = useCallback(
    async (force = false) => {
      if (runningRef.current) return;
      const now = Date.now();
      const recentEnough = now - lastRunAtRef.current < minIntervalMs;
      if (!force && recentEnough) return;

      runningRef.current = true;
      try {
        await refreshFn(force);
        lastRunAtRef.current = Date.now();
      } finally {
        runningRef.current = false;
      }
    },
    [refreshFn, minIntervalMs],
  );

  useEffect(() => {
    if (!navigation?.addListener) return undefined;
    const unsubscribe = navigation.addListener("focus", () => {
      run(false);
    });
    if (runOnMount) run(true);
    return unsubscribe;
  }, [navigation, run, runOnMount]);

  return run;
}

