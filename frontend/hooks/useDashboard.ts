import { useState, useEffect } from "react";
import { DashboardData } from "../types/dashboard";
import { mockDashboardData } from "../mock/dashboard";

export function useDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        // Simulate network delay for verification of loading states
        await new Promise((resolve) => setTimeout(resolve, 800));
        if (active) {
          setData(mockDashboardData);
        }
      } catch (err) {
        if (active) {
          setError("Failed to resolve dashboard information. Please try again.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    fetchDashboardData();

    return () => {
      active = false;
    };
  }, []);

  return { data, loading, error };
}
