export interface ScheduleCell {
  subject: string;
  teacher: string;
  room: string;
  isSubstitute?: boolean;
  isDeleted?: boolean;
  isRoomChanged?: boolean;
}

export type DayData = {
  [time: string]: ScheduleCell;
};

export type ClassSchedule = {
  [day: string]: DayData;
};

export type FullScheduleData = {
  [classKey: string]: ClassSchedule;
};
