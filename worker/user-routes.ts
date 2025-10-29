import { Hono } from "hono";
import type { Env } from './core-utils';
import { UserEntity, ProjectEntity, SettingsEntity, CommentEntity, MessageEntity } from "./entities";
import { ok, bad, notFound, isStr, unauthorized, forbidden } from './core-utils';
import type { Project, Comment, AppSettings, User, Message, Conversation, NewMessageNotification, PaginatedProjectsResponse, SmtpSettings } from "@shared/types";
import { v4 as uuidv4 } from 'uuid';
import { differenceInDays, parseISO, isBefore, addMonths, isWithinInterval } from 'date-fns';
// --- AUTH HELPERS ---
async function getAuthedUser(c: any, requiredRole?: 'superadmin'): Promise<User | Response> {
  const userId = c.req.header('X-User-Id');
  if (!isStr(userId)) {
    return unauthorized(c, 'Missing user ID');
  }
  const userEntity = new UserEntity(c.env, userId);
  if (!(await userEntity.exists())) {
    return unauthorized(c, 'Invalid user');
  }
  const user = await userEntity.getState();
  if (requiredRole && user.role !== requiredRole) {
    return forbidden(c, 'Insufficient permissions');
  }
  // Update lastSeen timestamp non-blockingly
  userEntity.patch({ lastSeen: new Date().toISOString() }).catch(console.error);
  return user;
}
// --- DOMAINDECK HELPERS ---
const getDomainDaysRemaining = (expiryDate: string | null | undefined): number | null => {
    if (!expiryDate) return null;
    try {
        return differenceInDays(parseISO(expiryDate), new Date());
    } catch {
        return null;
    }
};
const applyProjectFiltersAndSorting = (
    allProjects: Project[],
    queryParams: Record<string, string | undefined>
): Project[] => {
    const {
        sortKey = 'nomDuProjet',
        sortDirection = 'asc',
        status,
        expiryDateFrom, expiryDateTo,
        startDateFrom, startDateTo,
        completedDateFrom, completedDateTo
    } = queryParams;
    // 1. Filtering
    let filteredProjects = allProjects;
    if (status && status !== 'all') {
        filteredProjects = filteredProjects.filter(p => p.status === status);
    }
    const checkDateRange = (dateStr: string | null | undefined, from?: string, to?: string) => {
        if (!dateStr || !from) return false;
        try {
            const date = parseISO(dateStr);
            const start = parseISO(from);
            const end = to ? parseISO(to) : start;
            return isWithinInterval(date, { start, end });
        } catch (e) { return false; }
    };
    if (expiryDateFrom) {
        filteredProjects = filteredProjects.filter(p => checkDateRange(p.dateExpirationDomaine, expiryDateFrom, expiryDateTo));
    }
    if (startDateFrom) {
        filteredProjects = filteredProjects.filter(p => checkDateRange(p.dateDebut, startDateFrom, startDateTo));
    }
    if (completedDateFrom) {
        filteredProjects = filteredProjects.filter(p => checkDateRange(p.dateTermine, completedDateFrom, completedDateTo));
    }
    // 2. Sorting
    filteredProjects.sort((a, b) => {
        let valA: any, valB: any;
        if (sortKey === 'domainStatus') {
            valA = getDomainDaysRemaining(a.dateExpirationDomaine) ?? Infinity;
            valB = getDomainDaysRemaining(b.dateExpirationDomaine) ?? Infinity;
        } else if (sortKey === 'totalCost') {
            valA = (a.coutDomaine ?? 0) + (a.coutHebergement ?? 0);
            valB = (b.coutDomaine ?? 0) + (b.coutHebergement ?? 0);
        } else {
            valA = a[sortKey as keyof Project];
            valB = b[sortKey as keyof Project];
        }
        if (valA === null || valA === undefined) valA = '';
        if (valB === null || valB === undefined) valB = '';
        if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
        if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
        return 0;
    });
    return filteredProjects;
};
export function userRoutes(app: Hono<{ Bindings: Env }>) {
  // --- AUTH ROUTES ---
  app.post('/api/auth/login', async (c) => {
    await UserEntity.ensureSeed(c.env);
    const { email, password } = await c.req.json<{ email?: string; password?: string }>();
    if (!isStr(email) || !isStr(password)) {
      return bad(c, 'Email and password are required');
    }
    const { items: allUsers } = await UserEntity.list(c.env);
    const user = allUsers.find(u => u.email === email);
    if (!user || user.password !== password) {
      return unauthorized(c, 'Invalid credentials');
    }
    // Update lastSeen on login
    const userEntity = new UserEntity(c.env, user.id);
    await userEntity.patch({ lastSeen: new Date().toISOString() });
    const updatedUser = await userEntity.getState();
    const { password: _, ...userWithoutPassword } = updatedUser;
    return ok(c, userWithoutPassword);
  });
  app.get('/api/auth/me/:id', async (c) => {
    const { id } = c.req.param();
    const userEntity = new UserEntity(c.env, id);
    if (!(await userEntity.exists())) {
      return notFound(c, 'User not found');
    }
    const user = await userEntity.getState();
    const { password: _, ...userWithoutPassword } = user;
    return ok(c, userWithoutPassword);
  });
  // --- USER MANAGEMENT ROUTES (Protected: Superadmin) ---
  app.get('/api/users', async (c) => {
    const authResult = await getAuthedUser(c); // Allow any authenticated user to get user list for messaging
    if (authResult instanceof Response) return authResult;
    const { items } = await UserEntity.list(c.env);
    const usersWithoutPasswords = items.map(({ password, ...rest }) => rest);
    return ok(c, usersWithoutPasswords);
  });
  app.post('/api/users', async (c) => {
    const authResult = await getAuthedUser(c, 'superadmin');
    if (authResult instanceof Response) return authResult;
    const body = await c.req.json<Omit<User, 'id'>>();
    if (!isStr(body.email) || !isStr(body.name) || !isStr(body.password) || !isStr(body.role)) {
      return bad(c, 'Missing required user fields');
    }
    const newUser: User = { ...body, id: uuidv4(), lastSeen: null };
    await UserEntity.create(c.env, newUser);
    const { password, ...userWithoutPassword } = newUser;
    return ok(c, userWithoutPassword);
  });
  app.put('/api/users/:id', async (c) => {
    const authResult = await getAuthedUser(c);
    if (authResult instanceof Response) return authResult;
    const { id } = c.req.param();
    const body = await c.req.json<Partial<Omit<User, 'id'>>>();
    // A user can update their own profile. A superadmin can update any profile.
    if (authResult.role !== 'superadmin' && authResult.id !== id) {
      return forbidden(c, 'You can only update your own profile.');
    }
    // Collaborators cannot change their own role.
    if (authResult.role !== 'superadmin' && body.role) {
      delete body.role;
    }
    const user = new UserEntity(c.env, id);
    if (!(await user.exists())) {
      return notFound(c, 'User not found');
    }
    await user.patch(body);
    const updatedUser = await user.getState();
    const { password, ...userWithoutPassword } = updatedUser;
    return ok(c, userWithoutPassword);
  });
  app.delete('/api/users/:id', async (c) => {
    const authResult = await getAuthedUser(c, 'superadmin');
    if (authResult instanceof Response) return authResult;
    const { id } = c.req.param();
    if (authResult.id === id) {
      return bad(c, 'You cannot delete your own account.');
    }
    const deleted = await UserEntity.delete(c.env, id);
    if (!deleted) {
      return notFound(c, 'User not found');
    }
    return ok(c, { id, deleted: true });
  });
  // --- SETTINGS ROUTES (Protected) ---
  app.get('/api/settings', async (c) => {
    const settings = new SettingsEntity(c.env);
    const state = await settings.getState();
    return ok(c, state);
  });
  app.post('/api/settings', async (c) => {
    const authResult = await getAuthedUser(c, 'superadmin');
    if (authResult instanceof Response) return authResult;
    const body = await c.req.json<AppSettings>();
    const settings = new SettingsEntity(c.env);
    await settings.save(body);
    return ok(c, await settings.getState());
  });
  app.post('/api/settings/test-smtp', async (c) => {
    const authResult = await getAuthedUser(c, 'superadmin');
    if (authResult instanceof Response) return authResult;
    const { smtp, testEmail } = await c.req.json<{ smtp: SmtpSettings, testEmail: string }>();
    if (!smtp || !testEmail || !isStr(testEmail)) {
      return bad(c, 'SMTP settings and a test email address are required.');
    }
    // Simulate sending an email by logging to the console
    console.log('--- SIMULATING SMTP TEST EMAIL ---');
    console.log(`To: ${testEmail}`);
    console.log(`From: "DomainDeck" <noreply@domaindeck.com>`);
    console.log(`Subject: SMTP Configuration Test`);
    console.log(`Host: ${smtp.host}, Port: ${smtp.port}, Secure: ${smtp.secure}`);
    console.log(`User: ${smtp.user}`);
    console.log(`Body: This is a test email to verify your SMTP settings are configured correctly in DomainDeck.`);
    console.log('------------------------------------');
    return ok(c, { message: `Test email successfully simulated. Check worker logs for details.` });
  });
  // --- REMINDER ROUTES ---
  app.post('/api/reminders/send', async (c) => {
    const authResult = await getAuthedUser(c);
    if (authResult instanceof Response) return authResult;

    const { recipientEmails, subject, body } = await c.req.json<{ recipientEmails: string; subject: string; body: string }>();
    if (!isStr(recipientEmails) || !isStr(subject) || !isStr(body)) {
      return bad(c, 'Recipient, subject, and body are required.');
    }

    const settingsEntity = new SettingsEntity(c.env);
    const settings = await settingsEntity.getState();
    const smtp = settings.smtp;

    if (!smtp.host || !smtp.port || !smtp.user) {
      return bad(c, 'SMTP settings are not configured. Please configure them in Admin Settings.');
    }

    // Simulate sending an email by logging to the console
    console.log('--- SIMULATING SMTP REMINDER EMAIL ---');
    console.log(`To: ${recipientEmails}`);
    console.log(`From: "DomainDeck" <${smtp.user}>`);
    console.log(`Subject: ${subject}`);
    console.log(`Body:\n${body}`);
    console.log('------------------------------------');

    return ok(c, { message: `Reminder email successfully simulated for ${recipientEmails}. Check worker logs for details.` });
  });
  // --- DOMAINDECK CRM ROUTES ---
  app.get('/api/projects/export', async (c) => {
    await ProjectEntity.ensureSeed(c.env);
    const { items: allProjects } = await ProjectEntity.list(c.env);
    const queryParams = c.req.query();
    const processedProjects = applyProjectFiltersAndSorting(allProjects, queryParams);
    return ok(c, processedProjects);
  });
  app.get('/api/projects', async (c) => {
    await ProjectEntity.ensureSeed(c.env);
    const page = parseInt(c.req.query('page') || '1', 10);
    const limit = parseInt(c.req.query('limit') || '8', 10);
    const { items: allProjects } = await ProjectEntity.list(c.env);
    const queryParams = c.req.query();
    const processedProjects = applyProjectFiltersAndSorting(allProjects, queryParams);
    // Pagination
    const total = processedProjects.length;
    const totalPages = Math.ceil(total / limit);
    const startIndex = (page - 1) * limit;
    const paginatedProjects = processedProjects.slice(startIndex, startIndex + limit);
    const response: PaginatedProjectsResponse = {
        projects: paginatedProjects,
        total,
        page,
        limit,
        totalPages,
    };
    return ok(c, response);
  });
  app.get('/api/projects/:id', async (c) => {
    const { id } = c.req.param();
    const project = new ProjectEntity(c.env, id);
    if (!(await project.exists())) {
      return notFound(c, 'Project not found');
    }
    return ok(c, await project.getState());
  });
  app.post('/api/projects', async (c) => {
    const authResult = await getAuthedUser(c, 'superadmin');
    if (authResult instanceof Response) return authResult;
    const body = await c.req.json<Omit<Project, 'id' | 'createdAt' | 'updatedAt'>>();
    if (!body.nomDuProjet) {
      return bad(c, 'Project name is required');
    }
    const now = new Date().toISOString();
    const newProject: Project = { ...body, id: uuidv4(), createdAt: now, updatedAt: now };
    await ProjectEntity.create(c.env, newProject);
    return ok(c, newProject);
  });
  app.put('/api/projects/:id', async (c) => {
    const authResult = await getAuthedUser(c, 'superadmin');
    if (authResult instanceof Response) return authResult;
    const { id } = c.req.param();
    const body = await c.req.json<Partial<Omit<Project, 'id' | 'createdAt' | 'updatedAt'>>>();
    const project = new ProjectEntity(c.env, id);
    if (!(await project.exists())) {
      return notFound(c, 'Project not found');
    }
    await project.mutate(s => ({ ...s, ...body, updatedAt: new Date().toISOString() }));
    return ok(c, await project.getState());
  });
  app.delete('/api/projects/:id', async (c) => {
    const authResult = await getAuthedUser(c, 'superadmin');
    if (authResult instanceof Response) return authResult;
    const { id } = c.req.param();
    const deleted = await ProjectEntity.delete(c.env, id);
    if (!deleted) {
      return notFound(c, 'Project not found');
    }
    return ok(c, { id, deleted: true });
  });
  // --- COMMENT ROUTES ---
  app.get('/api/comments/poll', async (c) => {
    const authResult = await getAuthedUser(c);
    if (authResult instanceof Response) return authResult;
    const since = c.req.query('since');
    if (!since || !isStr(since)) {
      return bad(c, 'A "since" timestamp is required.');
    }
    const sinceDate = new Date(since);
    if (isNaN(sinceDate.getTime())) {
      return bad(c, 'Invalid "since" timestamp format.');
    }
    const { items: allComments } = await CommentEntity.list(c.env);
    const newComments = allComments.filter(comment => new Date(comment.createdAt) > sinceDate);
    if (newComments.length === 0) {
      return ok(c, []);
    }
    // Filter for visibility
    const visibleComments = newComments.filter(comment => {
      return comment.visibleTo.length === 0 || comment.visibleTo.includes(authResult.id) || comment.authorId === authResult.id;
    });
    return ok(c, visibleComments.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()));
  });
  app.get('/api/comments', async (c) => {
    const authResult = await getAuthedUser(c);
    if (authResult instanceof Response) return authResult;
    const projectId = c.req.query('projectId');
    const { items: allComments } = await CommentEntity.list(c.env);
    let comments = allComments;
    if (projectId) {
      comments = comments.filter(comment => comment.projectId === projectId);
    }
    // Filter for visibility
    const visibleComments = comments.filter(comment => {
      return comment.visibleTo.length === 0 || comment.visibleTo.includes(authResult.id) || comment.authorId === authResult.id;
    });
    return ok(c, visibleComments);
  });
  app.post('/api/comments', async (c) => {
    const authResult = await getAuthedUser(c);
    if (authResult instanceof Response) return authResult;
    if (authResult.role !== 'superadmin' && authResult.role !== 'collaborator') {
      return forbidden(c, 'You do not have permission to comment.');
    }
    const body = await c.req.json<{ text: string; parentId?: string | null; projectId?: string | null; visibleTo?: string[] }>();
    if (!isStr(body.text)) {
      return bad(c, 'Comment text is required');
    }
    const newComment: Comment = {
      id: uuidv4(),
      authorId: authResult.id,
      authorName: authResult.name,
      text: body.text,
      createdAt: new Date().toISOString(),
      parentId: body.parentId || null,
      projectId: body.projectId || null,
      visibleTo: body.visibleTo || [],
      readBy: [authResult.id], // Author has implicitly read it
    };
    // If it's a reply, inherit visibility and project from parent
    if (newComment.parentId) {
      const parentCommentEntity = new CommentEntity(c.env, newComment.parentId);
      if (await parentCommentEntity.exists()) {
        const parentComment = await parentCommentEntity.getState();
        newComment.visibleTo = parentComment.visibleTo;
        newComment.projectId = parentComment.projectId;
      } else {
        return notFound(c, 'Parent comment not found.');
      }
    }
    await CommentEntity.create(c.env, newComment);
    return ok(c, newComment);
  });
  app.post('/api/comments/:id/read', async (c) => {
    const authResult = await getAuthedUser(c);
    if (authResult instanceof Response) return authResult;
    const { id } = c.req.param();
    const commentEntity = new CommentEntity(c.env, id);
    if (!(await commentEntity.exists())) {
      return notFound(c, 'Comment not found');
    }
    await commentEntity.mutate(comment => {
      if (!comment.readBy.includes(authResult.id)) {
        comment.readBy.push(authResult.id);
      }
      return comment;
    });
    return ok(c, await commentEntity.getState());
  });
  app.get('/api/notifications/comments', async (c) => {
    const authResult = await getAuthedUser(c);
    if (authResult instanceof Response) return authResult;
    const { items: allComments } = await CommentEntity.list(c.env);
    const notifications = allComments.filter(comment => {
      return comment.visibleTo.length === 0 || comment.visibleTo.includes(authResult.id);
    });
    return ok(c, notifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
  });
  // --- MESSAGING ROUTES ---
  app.get('/api/messages/poll', async (c) => {
    const authResult = await getAuthedUser(c);
    if (authResult instanceof Response) return authResult;
    const since = c.req.query('since');
    if (!since || !isStr(since)) {
      return bad(c, 'A "since" timestamp is required.');
    }
    const sinceDate = new Date(since);
    if (isNaN(sinceDate.getTime())) {
      return bad(c, 'Invalid "since" timestamp format.');
    }
    const { items: allMessages } = await MessageEntity.list(c.env);
    const newMessages = allMessages.filter(m =>
      m.receiverId === authResult.id && new Date(m.createdAt) > sinceDate
    );
    if (newMessages.length === 0) {
      return ok(c, []);
    }
    const { items: allUsers } = await UserEntity.list(c.env);
    const userMap = allUsers.reduce((acc, user) => {
      const { password, ...userWithoutPassword } = user;
      acc[user.id] = userWithoutPassword;
      return acc;
    }, {} as Record<string, Omit<User, 'password'>>);
    const notifications: NewMessageNotification[] = newMessages
      .map(message => {
        const sender = userMap[message.senderId];
        if (!sender) return null;
        return { message, sender };
      })
      .filter((n): n is NewMessageNotification => n !== null)
      .sort((a, b) => new Date(a.message.createdAt).getTime() - new Date(b.message.createdAt).getTime());
    return ok(c, notifications);
  });
  app.get('/api/notifications/messages/unread', async (c) => {
    const authResult = await getAuthedUser(c);
    if (authResult instanceof Response) return authResult;
    const { items: allMessages } = await MessageEntity.list(c.env);
    const unreadCount = allMessages.filter(m => m.receiverId === authResult.id && !m.readAt).length;
    return ok(c, { count: unreadCount });
  });
  app.get('/api/messages/conversations', async (c) => {
    const authResult = await getAuthedUser(c);
    if (authResult instanceof Response) return authResult;
    const { items: allMessages } = await MessageEntity.list(c.env);
    const { items: allUsers } = await UserEntity.list(c.env);
    const userMap = allUsers.reduce((acc, user) => {
      const { password, ...userWithoutPassword } = user;
      acc[user.id] = userWithoutPassword;
      return acc;
    }, {} as Record<string, Omit<User, 'password'>>);
    const conversations: Record<string, Conversation> = {};
    allMessages
      .filter(m => m.senderId === authResult.id || m.receiverId === authResult.id)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      .forEach(message => {
        const otherUserId = message.senderId === authResult.id ? message.receiverId : message.senderId;
        if (!conversations[otherUserId]) {
          const otherUser = userMap[otherUserId];
          if (!otherUser) return;
          conversations[otherUserId] = {
            otherUser,
            lastMessage: message,
            unreadCount: 0,
          };
        }
        conversations[otherUserId].lastMessage = message;
        if (message.receiverId === authResult.id && !message.readAt) {
          conversations[otherUserId].unreadCount++;
        }
      });
    const conversationList = Object.values(conversations).sort((a, b) => new Date(b.lastMessage.createdAt).getTime() - new Date(a.lastMessage.createdAt).getTime());
    return ok(c, conversationList);
  });
  app.get('/api/messages/thread/:otherUserId', async (c) => {
    const authResult = await getAuthedUser(c);
    if (authResult instanceof Response) return authResult;
    const { otherUserId } = c.req.param();
    const { items: allMessages } = await MessageEntity.list(c.env);
    const thread = allMessages
      .filter(m =>
        (m.senderId === authResult.id && m.receiverId === otherUserId) ||
        (m.senderId === otherUserId && m.receiverId === authResult.id)
      )
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    return ok(c, thread);
  });
  app.post('/api/messages', async (c) => {
    const authResult = await getAuthedUser(c);
    if (authResult instanceof Response) return authResult;
    const { text, receiverId } = await c.req.json<{ text: string; receiverId: string }>();
    if (!isStr(text) || !isStr(receiverId)) {
      return bad(c, 'Text and receiverId are required');
    }
    const receiverExists = await new UserEntity(c.env, receiverId).exists();
    if (!receiverExists) {
      return notFound(c, 'Recipient not found');
    }
    const newMessage: Message = {
      id: uuidv4(),
      senderId: authResult.id,
      receiverId,
      senderName: authResult.name,
      text,
      createdAt: new Date().toISOString(),
      readAt: null,
    };
    await MessageEntity.create(c.env, newMessage);
    return ok(c, newMessage);
  });
  app.post('/api/messages/read', async (c) => {
    const authResult = await getAuthedUser(c);
    if (authResult instanceof Response) return authResult;
    const { otherUserId } = await c.req.json<{ otherUserId: string }>();
    if (!isStr(otherUserId)) {
      return bad(c, 'otherUserId is required');
    }
    const { items: allMessages } = await MessageEntity.list(c.env);
    const messagesToUpdate = allMessages.filter(m =>
      m.receiverId === authResult.id && m.senderId === otherUserId && !m.readAt
    );
    const now = new Date().toISOString();
    for (const message of messagesToUpdate) {
      const messageEntity = new MessageEntity(c.env, message.id);
      await messageEntity.patch({ readAt: now });
    }
    return ok(c, { success: true, markedAsRead: messagesToUpdate.length });
  });
}