import { createBrowserRouter } from "react-router";
import { Layout } from "./components/Layout";
import { Schedule } from "./components/Schedule";
import { ChatSummary } from "./components/ChatSummary";
import { Reports } from "./components/Reports";
import { SuggestionsProblems } from "./components/SuggestionsProblems";
import { DirectorCalendar } from "./components/DirectorCalendar";
import { StaffDatabase } from "./components/StaffDatabase";
import { AiChat } from "./components/AiChat";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Layout,
    children: [
      { index: true, Component: Schedule },
      { path: "schedule", Component: Schedule },
      { path: "chat-summary", Component: ChatSummary },
      { path: "reports", Component: Reports },
      { path: "suggestions", Component: SuggestionsProblems },
      { path: "calendar", Component: DirectorCalendar },
      { path: "staff", Component: StaffDatabase },
      { path: "ai-chat", Component: AiChat },
    ],
  },
]);