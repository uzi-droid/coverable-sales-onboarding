export const ADMIN_EMAILS = [
  "uzi@coverable.ai",
  "joshuareinfeld17@gmail.com"
];

export function isAdminEmail(email) {
  return ADMIN_EMAILS.includes((email || "").toLowerCase());
}
