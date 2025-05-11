"use client";

import { useEffect, useCallback } from "react";
import { createClient } from "@/utils/supabase/client";
import { useUserStore } from "@/stores/user";
import { useSearchParams } from "next/navigation";
import { MessageRepository } from "@/utils/redis/message-repository";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setUser, setLoading, loading, updateConversations } = useUserStore();
  const searchParams = useSearchParams();

  const checkUser = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();

    try {
      console.log("Checking user authentication status...");
      const { data, error } = await supabase.auth.getUser();

      if (error) {
        console.error("Authentication error:", error.message);
        console.error("Error details:", error);

        // Try to refresh the session if we got an authentication error
        try {
          console.log("Attempting to refresh session...");
          const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();

          if (refreshError) {
            console.error("Session refresh failed:", refreshError.message);
            setLoading(false);
            return;
          }

          if (refreshData.user) {
            console.log("Session refreshed successfully");
            setUser(refreshData.user);

            try {
              // Get message count for rate limiting from Redis
              const count = await fetch('/api/storage/v1/messages/count').then(res => res.json());
              if (count) {
                updateConversations(count);
              }
            } catch (countErr) {
              console.error("Error fetching message count:", countErr);
            }
          }
        } catch (refreshErr) {
          console.error("Exception during session refresh:", refreshErr);
        }
      } else if (data?.user) {
        console.log("User authenticated successfully");
        setUser(data.user);

        try {
          // Get message count for rate limiting from Redis
          const count = await fetch('/api/storage/v1/messages/count').then(res => res.json());
          if (count) {
            updateConversations(count);
          }
        } catch (err) {
          console.error("Error fetching message count:", err);
        }
      } else {
        console.log("No user data available");
      }
    } catch (exception) {
      console.error("Unexpected exception during authentication:", exception);
    } finally {
      setLoading(false);
    }
  }, [setUser, setLoading, updateConversations]);

  useEffect(() => {
    checkUser();
  }, [checkUser]);

  useEffect(() => {
    const auth = searchParams.get("auth");
    if (auth === "success") {
      checkUser();
    }
  }, [searchParams, checkUser]);

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-t-2 border-gray-900 dark:border-white" />
      </div>
    );
  }
  return <>{children}</>;
}
