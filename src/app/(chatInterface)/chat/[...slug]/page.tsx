import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import LayoutLoading from "../../components/LayoutLoading";
import getUser from "../action/getUser";
import ChatPanel from "../../components/ChatPanel";

export default async function () {
  const { userId } = await auth();
  if (!userId) redirect("/");
  const user = await getUser(userId);
  if (!user) redirect("/");

  return (
    <Suspense fallback={<LayoutLoading />}>
      <ResizablePanelGroup orientation="horizontal">
        {/* Left Panel: Chat Interface */}
        <ResizablePanel
          defaultSize="40%"
          minSize="0%"
          maxSize="75%"
          className="flex flex-col h-screen bg-background border-r border-border"
        >
          <ChatPanel />
        </ResizablePanel>

        <ResizableHandle withHandle className="after:w-4" />

        {/* Right Panel: Web Preview & Code View */}
        <ResizablePanel className="hidden md:flex flex-col h-full bg-background">
          Right side
        </ResizablePanel>
      </ResizablePanelGroup>
    </Suspense>
  );
}
