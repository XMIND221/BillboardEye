import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { persistDemoMode, loadDemoModeFromStorage, DEMO_USER_EMAIL, setDemoModeRef } from "../services/demoMode";
import { resetDemoApiState } from "../services/demoApiState";

const DemoContext = createContext({
  isDemo: false,
  ready: false,
  enterDemo: async () => {},
  exitDemo: async () => {},
});

export function useDemo() {
  return useContext(DemoContext);
}

export function DemoProvider({ children }) {
  const [isDemo, setIsDemo] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const on = await loadDemoModeFromStorage();
      if (!cancelled) {
        setIsDemo(on);
        setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const enterDemo = useCallback(async () => {
    resetDemoApiState();
    await persistDemoMode(true);
    setDemoModeRef(true);
    setIsDemo(true);
  }, []);

  const exitDemo = useCallback(async () => {
    await persistDemoMode(false);
    setDemoModeRef(false);
    setIsDemo(false);
    resetDemoApiState();
  }, []);

  const value = useMemo(
    () => ({
      isDemo,
      ready,
      enterDemo,
      exitDemo,
      demoUserEmail: DEMO_USER_EMAIL,
    }),
    [isDemo, ready, enterDemo, exitDemo],
  );

  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>;
}
