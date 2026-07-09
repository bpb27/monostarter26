import { useAuth } from "@clerk/clerk-react";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { makeApi } from "../api";

export function HomePage() {
  const { getToken } = useAuth();
  const api = useMemo(() => makeApi(() => getToken()), [getToken]);

  const { data, isLoading, error } = useQuery({
    queryKey: ["widgets"],
    queryFn: async () => {
      const res = await api.api.widgets.$get();
      if (!res.ok) throw new Error("Failed to load widgets");
      return res.json();
    },
  });

  if (isLoading) return <p>Loading…</p>;
  if (error) return <p>Could not load widgets.</p>;

  return (
    <section>
      <h2>Your widgets</h2>
      <ul>
        {data?.widgets.map((w) => (
          <li key={w.id}>{w.name}</li>
        ))}
      </ul>
    </section>
  );
}
