export interface CalendarEvent {
  title: string;
  startTime: Date;
  endTime: Date;
  attendees: string[];
}

export interface CalendarProvider {
  createEvent(event: CalendarEvent): Promise<string>;
  deleteEvent(eventId: string): Promise<void>;
}
