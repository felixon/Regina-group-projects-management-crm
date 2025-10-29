export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}
export type ProjectStatus = string;
export interface Comment {
  id: string;
  authorId: string;
  authorName: string;
  text: string;
  createdAt: string; // ISO 8601 string
  parentId: string | null; // For threading
  projectId: string | null; // For project-specific or general comments
  visibleTo: string[]; // Array of user IDs, empty array means visible to all
  readBy: string[]; // Array of user IDs who have read the comment
}
export interface Project {
  id: string;
  nomDuProjet: string;
  dateEnregistrementDomaine?: string | null;
  dateExpirationDomaine?: string | null;
  coutDomaine?: number | null;
  coutHebergement?: number | null;
  dateDebut?: string | null;
  dateTermine?: string | null;
  status: ProjectStatus;
  createdAt: string; // ISO 8601 string
  updatedAt: string; // ISO 8601 string
}
export interface PaginatedProjectsResponse {
  projects: Project[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
// --- App Settings ---
export interface SmtpSettings {
  host: string;
  port: number;
  user: string;
  pass: string;
  secure: boolean;
}
export interface ReminderSettings {
  defaultEmails: string; // Comma-separated list
  startMonthsBefore: number; // e.g., 3
  frequency: 'weekly' | 'daily';
}
export const tableColumns = [
  'nomDuProjet',
  'status',
  'domainRegistration',
  'domainExpiry',
  'cost',
  'startDate',
  'completedDate',
  'actions'
] as const;
export type TableColumn = typeof tableColumns[number];
export type ColumnVisibility = Record<TableColumn, boolean>;
export interface AppSettings {
  appName: string;
  appLogoUrl: string | null;
  smtp: SmtpSettings;
  columns: ColumnVisibility;
  reminder: ReminderSettings;
}
// --- Auth ---
export type UserRole = 'superadmin' | 'collaborator';
export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  password?: string; // Should not be sent to client, except on creation/pw change flows
  lastSeen: string | null; // ISO 8601 string
}
// --- Messaging ---
export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  senderName: string;
  text: string;
  createdAt: string; // ISO 8601 string
  readAt: string | null; // ISO 8601 string
}
export interface Conversation {
  otherUser: Omit<User, 'password'>;
  lastMessage: Message;
  unreadCount: number;
}
export interface NewMessageNotification {
  message: Message;
  sender: Omit<User, 'password'>;
}

export interface Chat {
  id: string;
  title: string;
}

export interface ChatMessage {
  id: string;
  userId: string;
  text: string;
  ts: string;
}