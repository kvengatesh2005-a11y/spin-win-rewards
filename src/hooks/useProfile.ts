import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useProfile() {
  return useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return null;
      const [{ data: profile }, { data: roles }] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", u.user.id).single(),
        supabase.from("user_roles").select("role").eq("user_id", u.user.id),
      ]);
      return { profile, isAdmin: !!roles?.some((r) => r.role === "admin") };
    },
  });
}
