// timestamp formatting
export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

export function formatTime(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function formatDateTime(date: Date): string {
  return `${formatDate(date)} ${formatTime(date)}`;
}

const DAY_MS = 24 * 60 * 60 * 1000;

const toStartOfDay = (date: Date): Date =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate());

const toDate = (value: string | Date | undefined | null): Date =>
  new Date(value as string | Date);

const getDayDifference = (left: Date, right: Date): number => {
  const leftStart = toStartOfDay(left).getTime();
  const rightStart = toStartOfDay(right).getTime();
  return Math.round((leftStart - rightStart) / DAY_MS);
};

export function formatNotificationTimestamp(value: string | Date): string {
  const date = toDate(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  const now = new Date();
  const dayDiff = getDayDifference(date, now);
  const timeLabel = new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);

  if (dayDiff === 0) {
    return `Today, ${timeLabel}`;
  }

  if (dayDiff === -1) {
    return `Yesterday, ${timeLabel}`;
  }

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export function formatTaskDeadlineLabel(
  value: string | Date | undefined | null,
): string {
  if (!value) {
    return "No due";
  }

  const date = toDate(value);
  if (Number.isNaN(date.getTime())) {
    return "No due";
  }

  const now = new Date();
  const dayDiff = getDayDifference(date, now);

  if (dayDiff === 0) {
    return "Today";
  }

  if (dayDiff === 1) {
    return "Tomorrow";
  }

  if (dayDiff > 1) {
    return `In ${dayDiff} days`;
  }

  if (dayDiff === -1) {
    return "Yesterday";
  }

  return `Overdue by ${Math.abs(dayDiff)} days`;
}
