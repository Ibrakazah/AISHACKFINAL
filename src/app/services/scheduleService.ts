import { type GeneratedSchedule } from "../components/schedule-gen/GeneratePanel";

export async function fetchActiveSchedule(): Promise<GeneratedSchedule> {
  try {
    const res = await fetch("http://localhost:8000/api/schedule");
    if (!res.ok) throw new Error("Failed to fetch schedule");
    return await res.json();
  } catch (error) {
    console.error("API Fetch error, falling back to local data:", error);
    // You could import REAL_SCHEDULE_DATA here if you want a fallback
    return {};
  }
}

export async function fetchTeachersList(): Promise<string[]> {
  try {
    const res = await fetch("http://localhost:8000/api/teachers");
    if (!res.ok) throw new Error("Failed to fetch teachers");
    return await res.json();
  } catch (error) {
    console.error("API Fetch error:", error);
    return [];
  }
}
