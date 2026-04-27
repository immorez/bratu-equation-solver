export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  LiveMeeting: { meetingId: string; title: string };
};

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Meetings: undefined;
  Profile: undefined;
};

export type MeetingsStackParamList = {
  MeetingsList: undefined;
  MeetingDetail: { meetingId: string };
};
