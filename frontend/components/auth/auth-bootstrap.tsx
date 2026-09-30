"use client";

import { useEffect, useRef } from "react";
import { useAppDispatch } from "@/lib/hooks";
import { bootstrapAuthSession } from "@/lib/features/auth/session";

export function AuthBootstrap() {
  const dispatch = useAppDispatch();
  const started = useRef(false);

  useEffect(() => {
    if (started.current) {
      return;
    }

    started.current = true;
    void bootstrapAuthSession(dispatch);
  }, [dispatch]);

  return null;
}
