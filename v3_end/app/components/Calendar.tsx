"use client";

import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { useMemo, useState } from "react";
import { v4 as uuid } from "uuid";
import EventModal from "./EventModal";
import type { CalendarEvent } from "../types/calendar";

type ModalState =
  | { open: false }
  | { open: true; mode: "create" | "edit"; eventId?: string; defaultStart?: string; defaultEnd?: string };

export default function Calendar({ calendarId }: { calendarId: string }) {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [modal, setModal] = useState<ModalState>({ open: false });

  const filtered = useMemo(() => events.filter((e) => e.calendarId === calendarId), [events, calendarId]);

  const activeEvent = useMemo(() => {
    if (!modal.open || modal.mode !== "edit" || !modal.eventId) return null;
    return events.find((e) => e.id === modal.eventId) ?? null;
  }, [modal, events]);

  return (
    <>
      <div className="calendarWrap">
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          locale="hu"
          height="auto"
          headerToolbar={{ left: "prev,next today", center: "title", right: "dayGridMonth,timeGridWeek,timeGridDay" }}
          buttonText={{ today: "Ma", month: "Hónap", week: "Hét", day: "Nap" }}
          selectable
          editable
          events={filtered as any}
          select={(info) => setModal({ open: true, mode: "create", defaultStart: info.startStr, defaultEnd: info.endStr })}
          eventClick={(info) => setModal({ open: true, mode: "edit", eventId: info.event.id })}
          eventChange={(changeInfo) => {
            const id = changeInfo.event.id;
            setEvents((prev) => prev.map((e) => e.id === id ? { ...e, start: changeInfo.event.startStr, end: changeInfo.event.endStr || undefined } : e));
          }}
        />
      </div>

      <EventModal
        open={modal.open}
        title={modal.open && modal.mode === "edit" ? "Esemény szerkesztése" : "Új esemény"}
        initial={
          modal.open && modal.mode === "edit"
            ? { title: activeEvent?.title, description: activeEvent?.description, start: activeEvent?.start, end: activeEvent?.end }
            : { title: "", description: "", start: modal.open ? modal.defaultStart : undefined, end: modal.open ? modal.defaultEnd : undefined }
        }
        canDelete={modal.open && modal.mode === "edit"}
        onClose={() => setModal({ open: false })}
        onDelete={() => {
          if (!activeEvent) return;
          setEvents((prev) => prev.filter((e) => e.id !== activeEvent.id));
          setModal({ open: false });
        }}
        onSave={(data) => {
          if (modal.open && modal.mode === "edit" && activeEvent) {
            setEvents((prev) => prev.map((e) => (e.id === activeEvent.id ? { ...e, ...data } : e)));
          } else {
            setEvents((prev) => [...prev, { id: uuid(), calendarId, ...data }]);
          }
          setModal({ open: false });
        }}
      />
    </>
  );
}
