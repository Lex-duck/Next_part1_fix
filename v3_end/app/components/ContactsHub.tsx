"use client";

import { useState } from "react";
import PartnersPanel from "./PartnersPanel";
import MailPanel from "./MailPanel";
import ChatPanel from "./ChatPanel";
import MeetingPanel from "./MeetingPanel";

type Tab = "partners" | "mail" | "chat" | "meeting";

const tabs: { id: Tab; name: string }[] = [
  { id: "partners", name: "Partnerek" },
  { id: "mail", name: "Mail" },
  { id: "chat", name: "Chat" },
  { id: "meeting", name: "Meeting room" }
];

export default function ContactsHub() {
  const [tab, setTab] = useState<Tab>("partners");

  return (
    <div className="card">
      <div className="sectionHeader">
        <div>
          <div className="h1">Kapcsolat</div>
          <div className="muted">Partnerek, kommunikáció és meeting felület.</div>
        </div>
      </div>

      <div className="tabsRow">
        {tabs.map((t) => (
          <button key={t.id} className={`tab ${t.id === tab ? "tabActive" : ""}`} onClick={() => setTab(t.id)}>
            {t.name}
          </button>
        ))}
      </div>

      <div className="row" style={{ paddingTop: 10 }}>
        {tab === "partners" ? <PartnersPanel /> : null}
        {tab === "mail" ? <MailPanel /> : null}
        {tab === "chat" ? <ChatPanel /> : null}
        {tab === "meeting" ? <MeetingPanel /> : null}
      </div>
    </div>
  );
}
