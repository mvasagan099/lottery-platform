const fs = require('fs');
const path = require('path');

const schemaPath = path.join(__dirname, '../prisma/schema.prisma');
let schema = fs.readFileSync(schemaPath, 'utf8');

// Replace SupportTicketStatus
schema = schema.replace(/enum SupportTicketStatus \{[\s\S]*?\}/, `enum SupportTicketStatus {
  OPEN
  PENDING
  WAITING_FOR_CUSTOMER
  ASSIGNED
  IN_PROGRESS
  RESOLVED
  CLOSED
  ESCALATED
}`);

// Replace SupportTicket model
const supportTicketRegex = /model SupportTicket \{[\s\S]*?@@map\("support_tickets"\)\n\}/;
const newSupportTicketModel = `model SupportTicket {
  id           String              @id @default(cuid())
  userId       String?
  user         User?               @relation(fields: [userId], references: [id])
  ticketNumber String              @unique @default(cuid())
  subject      String
  description  String?
  categoryId   String?
  category     TicketCategoryModel? @relation(fields: [categoryId], references: [id])
  status       SupportTicketStatus @default(OPEN)
  priority     TicketPriority      @default(MEDIUM)
  departmentId String?
  department   SupportDepartment?  @relation(fields: [departmentId], references: [id])
  assignedToId String?
  assignedTo   SupportAgent?       @relation(fields: [assignedToId], references: [id])
  firstResponseTime DateTime?
  resolvedAt   DateTime?
  closedAt     DateTime?
  slaDeadline  DateTime?
  createdAt    DateTime            @default(now())
  updatedAt    DateTime            @updatedAt

  messages     SupportMessage[]
  attachments  TicketAttachment[]
  assignments  TicketAssignment[]
  statusHistory TicketStatusHistory[]
  tags         TicketTag[] @relation("TicketToTag")

  @@map("support_tickets")
}`;
schema = schema.replace(supportTicketRegex, newSupportTicketModel);

// Replace SupportMessage model
const supportMessageRegex = /model SupportMessage \{[\s\S]*?@@map\("support_messages"\)\n\}/;
const newSupportMessageModel = `model SupportMessage {
  id         String        @id @default(cuid())
  ticketId   String
  ticket     SupportTicket @relation(fields: [ticketId], references: [id])
  senderId   String // Can be UserId or AgentId
  senderType String @default("USER") // "USER" or "AGENT"
  message    String
  isInternal Boolean       @default(false)
  readAt     DateTime?
  createdAt  DateTime      @default(now())

  attachments TicketAttachment[]

  @@map("support_messages")
}`;
schema = schema.replace(supportMessageRegex, newSupportMessageModel);

// Append new Enums and Models
const appendText = `
// ============ SUPPORT CENTER ENUMS ============
enum SupportAgentStatus {
  ONLINE
  OFFLINE
  BUSY
  AWAY
  ON_BREAK
}

enum SupportAgentRole {
  SUPPORT_AGENT
  SENIOR_AGENT
  TEAM_LEAD
  SUPPORT_MANAGER
  COMPLIANCE_OFFICER
  SUPER_ADMIN
}

enum TicketPriority {
  LOW
  MEDIUM
  HIGH
  URGENT
  CRITICAL
}

enum AttachmentType {
  IMAGE
  PDF
  VIDEO
  DOCUMENT
}

// ============ SUPPORT CENTER MODELS ============

model SupportAgent {
  id            String             @id @default(cuid())
  userId        String             @unique
  user          User               @relation(fields: [userId], references: [id])
  employeeId    String             @unique
  departmentId  String?
  department    SupportDepartment? @relation(fields: [departmentId], references: [id])
  team          String?
  designation   String?
  role          SupportAgentRole   @default(SUPPORT_AGENT)
  status        SupportAgentStatus @default(OFFLINE)
  workingHours  Json?
  timeZone      String             @default("UTC")
  languages     String[]
  skills        String[]
  experience    String?
  notes         String?
  createdAt     DateTime           @default(now())
  updatedAt     DateTime           @updatedAt

  assignedTickets SupportTicket[]
  activityLogs    AgentActivity[]
  performance     AgentPerformance?
  assignments     TicketAssignment[]

  @@map("support_agents")
}

model SupportDepartment {
  id          String   @id @default(cuid())
  name        String   @unique
  description String?
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  agents      SupportAgent[]
  tickets     SupportTicket[]

  @@map("support_departments")
}

model TicketAttachment {
  id          String         @id @default(cuid())
  ticketId    String?
  ticket      SupportTicket? @relation(fields: [ticketId], references: [id])
  messageId   String?
  message     SupportMessage? @relation(fields: [messageId], references: [id])
  fileName    String
  fileUrl     String
  fileType    AttachmentType
  fileSize    Int
  createdAt   DateTime       @default(now())

  @@map("ticket_attachments")
}

model TicketTag {
  id          String   @id @default(cuid())
  name        String   @unique
  createdAt   DateTime @default(now())

  tickets     SupportTicket[] @relation("TicketToTag")

  @@map("ticket_tags")
}

model TicketCategoryModel {
  id          String   @id @default(cuid())
  name        String   @unique
  description String?
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())

  tickets     SupportTicket[]

  @@map("ticket_categories")
}

model TicketAssignment {
  id          String   @id @default(cuid())
  ticketId    String
  ticket      SupportTicket @relation(fields: [ticketId], references: [id])
  agentId     String
  agent       SupportAgent  @relation(fields: [agentId], references: [id])
  assignedBy  String?
  assignedAt  DateTime @default(now())
  unassignedAt DateTime?

  @@map("ticket_assignments")
}

model TicketStatusHistory {
  id          String   @id @default(cuid())
  ticketId    String
  ticket      SupportTicket @relation(fields: [ticketId], references: [id])
  status      SupportTicketStatus
  changedBy   String?
  changedAt   DateTime @default(now())
  reason      String?

  @@map("ticket_status_history")
}

model AgentActivity {
  id          String   @id @default(cuid())
  agentId     String
  agent       SupportAgent @relation(fields: [agentId], references: [id])
  action      String
  details     Json?
  createdAt   DateTime @default(now())

  @@map("agent_activity")
}

model AgentPerformance {
  id                  String   @id @default(cuid())
  agentId             String   @unique
  agent               SupportAgent @relation(fields: [agentId], references: [id])
  ticketsAssigned     Int      @default(0)
  ticketsSolved       Int      @default(0)
  openTickets         Int      @default(0)
  pendingTickets      Int      @default(0)
  avgResponseTime     Int      @default(0) // in seconds
  avgResolutionTime   Int      @default(0) // in seconds
  csatScore           Decimal  @default(0) @db.Decimal(5, 2)
  rating              Decimal  @default(0) @db.Decimal(5, 2)
  escalatedTickets    Int      @default(0)
  firstResponseSlaMet Int      @default(0)
  updatedAt           DateTime @updatedAt

  @@map("agent_performance")
}

model KnowledgeBaseCategory {
  id          String   @id @default(cuid())
  name        String   @unique
  description String?
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  articles    KnowledgeBaseArticle[]

  @@map("kb_categories")
}

model KnowledgeBaseArticle {
  id          String   @id @default(cuid())
  categoryId  String
  category    KnowledgeBaseCategory @relation(fields: [categoryId], references: [id])
  title       String
  content     String
  tags        String[]
  views       Int      @default(0)
  isPublished Boolean  @default(false)
  authorId    String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@map("kb_articles")
}

model SLARule {
  id                  String   @id @default(cuid())
  priority            TicketPriority
  firstResponseTime   Int      // in minutes
  resolutionTime      Int      // in minutes
  escalationTime      Int      // in minutes
  isActive            Boolean  @default(true)
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt

  @@map("sla_rules")
}
`;

fs.writeFileSync(schemaPath, schema + appendText);
console.log('Schema updated successfully');
