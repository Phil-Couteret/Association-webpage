import React, { createContext, useCallback, useContext, useEffect, useState, ReactNode } from "react";

export type MemberSessionPreview = {
  id: number;
  first_name: string;
  second_name: string;
  email: string;
};

type MemberSessionContextType = {
  memberSession: MemberSessionPreview | null;
  isLoading: boolean;
  refresh: () => Promise<void>;
};

const MemberSessionContext = createContext<MemberSessionContextType>({
  memberSession: null,
  isLoading: true,
  refresh: async () => {},
});

export const MemberSessionProvider = ({ children }: { children: ReactNode }) => {
  const [memberSession, setMemberSession] = useState<MemberSessionPreview | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const response = await fetch("/api/member-auth-check.php", {
        method: "GET",
        credentials: "include",
      });
      const data = await response.json();
      if (data.success && data.authenticated && data.member) {
        setMemberSession(data.member);
      } else {
        setMemberSession(null);
      }
    } catch {
      setMemberSession(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <MemberSessionContext.Provider value={{ memberSession, isLoading, refresh }}>
      {children}
    </MemberSessionContext.Provider>
  );
};

export const useMemberSession = () => useContext(MemberSessionContext);
