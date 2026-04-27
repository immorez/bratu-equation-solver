export class RoomService {
  async checkAvailability(date: string) {
    // Mock implementation
    return [
      { id: 'room-1', name: 'Conference Room A', capacity: 10, available: true },
      { id: 'room-2', name: 'Conference Room B', capacity: 6, available: true },
      { id: 'room-3', name: 'Board Room', capacity: 20, available: false },
    ];
  }

  async reserve(roomId: string, meetingId: string) {
    // Mock implementation
    return { roomId, meetingId, reserved: true };
  }
}

export const roomService = new RoomService();
