import { CalendarProvider, CalendarEvent } from './calendar.provider.interface';
import { v4 as uuidv4 } from 'uuid';

export class MockCalendarProvider implements CalendarProvider {
  async createEvent(event: CalendarEvent): Promise<string> {
    const id = uuidv4();
    console.log(`[Mock Calendar] Created event ${id}: ${event.title}`);
    return id;
  }

  async deleteEvent(eventId: string): Promise<void> {
    console.log(`[Mock Calendar] Deleted event ${eventId}`);
  }
}
