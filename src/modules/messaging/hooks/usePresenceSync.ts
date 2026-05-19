import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { usePresenceStore } from "../stores/PresenceStore";
import { MESSAGING_USERS_QUERY_KEY } from "./useMessagingUsers";

export function usePresenceSync() {
  const queryClient = useQueryClient();
  const _tick = usePresenceStore((s) => s._tick);

  useEffect(() => {
    void queryClient.invalidateQueries({ queryKey: MESSAGING_USERS_QUERY_KEY });
  }, [_tick, queryClient]);
}