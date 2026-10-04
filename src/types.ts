export type ReportMetadata = {
  title: string;
  school: string;
  branch: string;
  employeeName: string;
  jobTitle?: string;
  reportMonth: string;
  principalName: string;
  principalNip: string;
  reporterName: string;
  reporterNip: string;
  reportDate: string;
};

export type ReportEntry = {
  id: string;
  date: string; // YYYY-MM-DD
  dayName: string;
  duration: string;
  description: string;
  taskCategory?: string;
  photo: string | null; // data URL
  isHoliday: boolean;
};
