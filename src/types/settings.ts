export interface AppSettings {
  pages_per_day: number | null;
  minutes_per_day: number | null;
}

export interface YearlyGoal {
  year: number;
  target_books: number;
}
