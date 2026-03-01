/**
 * Supabase DB <-> TypeScript mapper functions
 *
 * Maps Czech DB column names to English TS property names and vice versa.
 */

import type {
  User,
  Role,
  Store,
  AbsenceRequest,
  Task,
  TaskComment,
  ChatGroup,
  ChatGroupType,
  ChatMessage,
  ChatReadStatus,
  ChatGroupSummary,
  ChatSearchResult,
  AttendanceRecord,
  ModuleDefinition,
  ModuleConfig,
  RoleType,
  AbsenceRequestStatus,
  TaskStatus,
  TaskPriority,
  TaskRepeat,
  TaskAssigneeType,
  TaskType,
  StoreOpeningHours,
  EmployeeWorkingHours,
  EmailAccount,
  EmailAccountAccess,
  EmailFolder,
  EmailFolderType,
  EmailMessage,
  EmailRule,
  EmailSyncLog,
  Eshop,
  Product,
  AttributeType,
  AttributeDisplayType,
  AttributeValue,
  ProductVariant,
  VariantAttribute,
  ProductImage,
  Category,
  ProductCategory,
  ShopCategory,
  ShopProduct,
  AiStatus,
  ShopProductVariant,
  Customer,
  CustomerAddress,
  AddressType,
  Order,
  OrderStatus,
  OrderItem,
  OrderHistory,
  ShopShipping,
  ShopPayment,
  BlockType,
  PageBlock,
  BlogPost,
  BlogPostStatus,
  FeedConfig,
  FeedType,
  FeedLog,
  Redirect,
  Review,
  AiKonfigurace,
} from '@/shared/types';

// =============================================================================
// DB Row types (what comes from Supabase)
// =============================================================================

/* eslint-disable @typescript-eslint/no-explicit-any */

// =============================================================================
// USERS (zamestnanci)
// =============================================================================

/**
 * Migrates old flat working hours format to new nested format.
 * Old format: { sameAllWeek, monday, ... } (flat, no alternating)
 * New format: { alternating, oddWeek: { sameAllWeek, ... } }
 */
function migrateWorkingHours(raw: any): EmployeeWorkingHours | undefined {
  if (!raw) return undefined;
  if ('alternating' in raw) return raw;
  // Old format: flat object with days + sameAllWeek directly
  return { alternating: false, oddWeek: raw };
}

export function mapDbToUser(row: any): User {
  return {
    id: row.id,
    username: row.uzivatelske_jmeno,
    fullName: row.cele_jmeno,
    roleIds: row.id_roli ?? [],
    storeIds: row.id_prodejen ?? [],
    defaultRoleId: row.vychozi_role_id ?? undefined,
    defaultStoreId: row.vychozi_prodejna_id ?? undefined,
    active: row.aktivni ?? true,
    workingHours: migrateWorkingHours(row.pracovni_hodiny),
    authId: row.auth_id ?? undefined,
    mustChangePassword: row.vychozi_heslo ?? false,
  };
}

export function mapUserToDb(user: Partial<User> & { id: string }): Record<string, any> {
  const row: Record<string, any> = { id: user.id };
  if (user.username !== undefined) row.uzivatelske_jmeno = user.username;
  if (user.fullName !== undefined) row.cele_jmeno = user.fullName;
  if (user.roleIds !== undefined) row.id_roli = user.roleIds;
  if (user.storeIds !== undefined) row.id_prodejen = user.storeIds;
  if (user.defaultRoleId !== undefined) row.vychozi_role_id = user.defaultRoleId || null;
  if (user.defaultStoreId !== undefined) row.vychozi_prodejna_id = user.defaultStoreId || null;
  if (user.active !== undefined) row.aktivni = user.active;
  if (user.workingHours !== undefined) row.pracovni_hodiny = user.workingHours || null;
  if (user.mustChangePassword !== undefined) row.vychozi_heslo = user.mustChangePassword;
  return row;
}

// =============================================================================
// ROLES (role)
// =============================================================================

export function mapDbToRole(row: any): Role {
  return {
    id: row.id,
    name: row.nazev,
    type: row.typ as RoleType,
    active: row.aktivni ?? true,
  };
}

export function mapRoleToDb(role: Partial<Role> & { id: string }): Record<string, any> {
  const row: Record<string, any> = { id: role.id };
  if (role.name !== undefined) row.nazev = role.name;
  if (role.type !== undefined) row.typ = role.type;
  if (role.active !== undefined) row.aktivni = role.active;
  return row;
}

// =============================================================================
// STORES (prodejny)
// =============================================================================

export function mapDbToStore(row: any): Store {
  return {
    id: row.id,
    name: row.nazev,
    address: row.adresa ?? '',
    active: row.aktivni ?? true,
    cashBase: row.zaklad_pokladny ?? 2000,
    openingHours: row.oteviraci_hodiny as StoreOpeningHours | undefined,
  };
}

export function mapStoreToDb(store: Partial<Store> & { id: string }): Record<string, any> {
  const row: Record<string, any> = { id: store.id };
  if (store.name !== undefined) row.nazev = store.name;
  if (store.address !== undefined) row.adresa = store.address;
  if (store.active !== undefined) row.aktivni = store.active;
  if (store.cashBase !== undefined) row.zaklad_pokladny = store.cashBase;
  if (store.openingHours !== undefined) row.oteviraci_hodiny = store.openingHours || null;
  return row;
}

// =============================================================================
// ABSENCE REQUESTS (zadosti_o_absenci)
// =============================================================================

export function mapDbToAbsenceRequest(row: any): AbsenceRequest {
  return {
    id: row.id,
    userId: row.id_zamestnance,
    type: row.typ,
    dateFrom: row.datum_od,
    dateTo: row.datum_do,
    timeFrom: row.cas_od ?? undefined,
    timeTo: row.cas_do ?? undefined,
    note: row.poznamka ?? '',
    status: row.stav as AbsenceRequestStatus,
    createdAt: row.vytvoreno,
    approvedBy: row.schvalil ?? undefined,
    approvedAt: row.zpracovano ?? undefined,
    seenByUser: row.precteno_zamestnancem ?? undefined,
    approverNote: row.poznamka_schvalovatele ?? undefined,
  };
}

export function mapAbsenceRequestToDb(req: Partial<AbsenceRequest> & { id: string }): Record<string, any> {
  const row: Record<string, any> = { id: req.id };
  if (req.userId !== undefined) row.id_zamestnance = req.userId;
  if (req.type !== undefined) row.typ = req.type;
  if (req.dateFrom !== undefined) row.datum_od = req.dateFrom;
  if (req.dateTo !== undefined) row.datum_do = req.dateTo;
  if (req.timeFrom !== undefined) row.cas_od = req.timeFrom || null;
  if (req.timeTo !== undefined) row.cas_do = req.timeTo || null;
  if (req.note !== undefined) row.poznamka = req.note;
  if (req.status !== undefined) row.stav = req.status;
  if (req.createdAt !== undefined) row.vytvoreno = req.createdAt;
  if (req.approvedBy !== undefined) row.schvalil = req.approvedBy || null;
  if (req.approvedAt !== undefined) row.zpracovano = req.approvedAt || null;
  if (req.seenByUser !== undefined) row.precteno_zamestnancem = req.seenByUser;
  if (req.approverNote !== undefined) row.poznamka_schvalovatele = req.approverNote || null;
  return row;
}

// =============================================================================
// TASKS (ukoly)
// =============================================================================

export function mapDbToTask(row: any, comments: TaskComment[] = []): Task {
  return {
    id: row.id,
    title: row.nazev,
    description: row.popis ?? '',
    priority: row.priorita as TaskPriority,
    status: row.stav as TaskStatus,
    createdBy: row.vytvoril,
    createdAt: row.vytvoreno,
    assigneeType: row.typ_prirazeni as TaskAssigneeType,
    assigneeId: row.prirazeno_komu,
    deadline: row.termin,
    repeat: (row.opakovani ?? 'none') as TaskRepeat,
    repeatSourceId: row.zdroj_opakovani ?? undefined,
    repeatPaused: row.opakovani_pozastaveno ?? false,
    completedBy: row.dokoncil ?? undefined,
    completedAt: row.dokonceno ?? undefined,
    approvedAt: row.schvaleno ?? undefined,
    returnedAt: row.vraceno ?? undefined,
    returnReason: row.duvod_vraceni ?? undefined,
    seenByAssignee: row.precteno_prirazenym ?? false,
    seenByCreator: row.precteno_zadavatelem ?? true,
    delegatedTo: row.delegovano_komu ?? undefined,
    delegatedBy: row.delegoval ?? undefined,
    delegatedAt: row.delegovano_kdy ?? undefined,
    seenByDelegatee: row.precteno_delegovanym ?? undefined,
    taskType: (row.typ_ukolu as TaskType) ?? 'obecny',
    comments,
  };
}

export function mapTaskToDb(task: Partial<Task> & { id: string }): Record<string, any> {
  const row: Record<string, any> = { id: task.id };
  if (task.title !== undefined) row.nazev = task.title;
  if (task.description !== undefined) row.popis = task.description;
  if (task.priority !== undefined) row.priorita = task.priority;
  if (task.status !== undefined) row.stav = task.status;
  if (task.createdBy !== undefined) row.vytvoril = task.createdBy;
  if (task.createdAt !== undefined) row.vytvoreno = task.createdAt;
  if (task.assigneeType !== undefined) row.typ_prirazeni = task.assigneeType;
  if (task.assigneeId !== undefined) row.prirazeno_komu = task.assigneeId;
  if (task.deadline !== undefined) row.termin = task.deadline;
  if (task.repeat !== undefined) row.opakovani = task.repeat;
  if (task.repeatSourceId !== undefined) row.zdroj_opakovani = task.repeatSourceId || null;
  if (task.repeatPaused !== undefined) row.opakovani_pozastaveno = task.repeatPaused;
  if (task.completedBy !== undefined) row.dokoncil = task.completedBy || null;
  if (task.completedAt !== undefined) row.dokonceno = task.completedAt || null;
  if (task.approvedAt !== undefined) row.schvaleno = task.approvedAt || null;
  if (task.returnedAt !== undefined) row.vraceno = task.returnedAt || null;
  if (task.returnReason !== undefined) row.duvod_vraceni = task.returnReason || null;
  if (task.seenByAssignee !== undefined) row.precteno_prirazenym = task.seenByAssignee;
  if (task.seenByCreator !== undefined) row.precteno_zadavatelem = task.seenByCreator;
  if (task.delegatedTo !== undefined) row.delegovano_komu = task.delegatedTo || null;
  if (task.delegatedBy !== undefined) row.delegoval = task.delegatedBy || null;
  if (task.delegatedAt !== undefined) row.delegovano_kdy = task.delegatedAt || null;
  if (task.seenByDelegatee !== undefined) row.precteno_delegovanym = task.seenByDelegatee;
  if (task.taskType !== undefined) row.typ_ukolu = task.taskType;
  return row;
}

// =============================================================================
// TASK COMMENTS (komentare_ukolu)
// =============================================================================

export function mapDbToTaskComment(row: any): TaskComment {
  return {
    id: row.id,
    taskId: row.id_ukolu,
    userId: row.id_zamestnance,
    text: row.text,
    attachments: row.prilohy ?? [],
    createdAt: row.vytvoreno,
  };
}

export function mapTaskCommentToDb(comment: Partial<TaskComment> & { id: string }): Record<string, any> {
  const row: Record<string, any> = { id: comment.id };
  if (comment.taskId !== undefined) row.id_ukolu = comment.taskId;
  if (comment.userId !== undefined) row.id_zamestnance = comment.userId;
  if (comment.text !== undefined) row.text = comment.text;
  if (comment.attachments !== undefined) row.prilohy = comment.attachments;
  if (comment.createdAt !== undefined) row.vytvoreno = comment.createdAt;
  return row;
}

// =============================================================================
// CHAT GROUPS (chat_skupiny)
// =============================================================================

export function mapDbToChatGroup(row: any): ChatGroup {
  return {
    id: row.id,
    name: row.nazev,
    type: (row.typ as ChatGroupType) ?? 'group',
    memberIds: row.id_clenu ?? [],
    createdAt: row.vytvoreno,
    createdBy: row.vytvoril,
  };
}

export function mapChatGroupToDb(group: Partial<ChatGroup> & { id: string }): Record<string, any> {
  const row: Record<string, any> = { id: group.id };
  if (group.name !== undefined) row.nazev = group.name;
  if (group.type !== undefined) row.typ = group.type;
  if (group.memberIds !== undefined) row.id_clenu = group.memberIds;
  if (group.createdAt !== undefined) row.vytvoreno = group.createdAt;
  if (group.createdBy !== undefined) row.vytvoril = group.createdBy;
  return row;
}

// =============================================================================
// CHAT MESSAGES (chat_zpravy)
// =============================================================================

export function mapDbToChatMessage(row: any): ChatMessage {
  return {
    id: row.id,
    groupId: row.id_skupiny,
    userId: row.id_zamestnance,
    text: row.text,
    attachments: row.prilohy ?? [],
    reactions: row.reakce ?? [],
    replyToMessageId: row.id_odpoved_na ?? null,
    createdAt: row.vytvoreno,
  };
}

export function mapChatMessageToDb(msg: Partial<ChatMessage> & { id: string }): Record<string, any> {
  const row: Record<string, any> = { id: msg.id };
  if (msg.groupId !== undefined) row.id_skupiny = msg.groupId;
  if (msg.userId !== undefined) row.id_zamestnance = msg.userId;
  if (msg.text !== undefined) row.text = msg.text;
  if (msg.attachments !== undefined) row.prilohy = msg.attachments;
  if (msg.reactions !== undefined) row.reakce = msg.reactions;
  if (msg.replyToMessageId !== undefined) row.id_odpoved_na = msg.replyToMessageId;
  if (msg.createdAt !== undefined) row.vytvoreno = msg.createdAt;
  return row;
}

// =============================================================================
// CHAT READ STATUS (chat_stav_precteni)
// =============================================================================

export function mapDbToChatReadStatus(row: any): ChatReadStatus {
  return {
    groupId: row.id_skupiny,
    userId: row.id_uzivatele,
    lastReadMessageId: row.id_posledni_prectene_zpravy ?? null,
    lastReadAt: row.precteno,
  };
}

export function mapChatReadStatusToDb(status: ChatReadStatus): Record<string, any> {
  return {
    id_skupiny: status.groupId,
    id_uzivatele: status.userId,
    id_posledni_prectene_zpravy: status.lastReadMessageId,
    precteno: status.lastReadAt,
  };
}

// Chat group summary (from RPC get_chat_group_summaries)
export function mapDbToChatGroupSummary(row: any): ChatGroupSummary {
  return {
    groupId: row.group_id,
    lastMessageText: row.last_message_text ?? '',
    lastMessageUserId: row.last_message_user_id ?? '',
    lastMessageAt: row.last_message_at ?? '',
    totalCount: Number(row.total_count) || 0,
    unreadCount: Number(row.unread_count) || 0,
  };
}

// Chat search result (from RPC search_chat_messages)
export function mapDbToChatSearchResult(row: any): ChatSearchResult {
  return {
    messageId: row.message_id,
    groupId: row.group_id,
    userId: row.user_id,
    text: row.message_text,
    createdAt: row.created_at,
  };
}

// =============================================================================
// ATTENDANCE (dochazka)
// =============================================================================

export function mapDbToAttendanceRecord(row: any): AttendanceRecord {
  return {
    id: row.id,
    date: row.datum,
    store: row.prodejna ?? '',
    workplaceType: row.typ_pracoviste ?? 'store',
    workplaceId: row.id_pracoviste ?? '',
    workplaceName: row.nazev_pracoviste ?? '',
    user: row.zamestnanec,
    in: row.prichod ?? '',
    out: row.odchod ?? '',
    abs: row.absence ?? '-',
    hrs: row.hodiny ?? '',
    absNote: row.poznamka_absence ?? '',
    cash: row.hotovost ?? 0,
    card: row.karta ?? 0,
    partner: row.partner ?? 0,
    flows: row.pohyby ?? '0',
    saleNote: row.poznamka_trzba ?? '',
    collected: row.vybrano === 'false' || row.vybrano === false ? false : row.vybrano,
    motivacePercent: row.motivace_procenta ?? 2.0,
    motivaceAmount: row.motivace_castka ?? 0,
    motivaceProduktyCastka: row.motivace_produkty_castka ?? 0,
  };
}

export function mapAttendanceRecordToDb(record: AttendanceRecord): Record<string, any> {
  return {
    datum: record.date,
    prodejna: record.store,
    typ_pracoviste: record.workplaceType,
    id_pracoviste: record.workplaceId,
    nazev_pracoviste: record.workplaceName,
    zamestnanec: record.user,
    prichod: record.in,
    odchod: record.out,
    absence: record.abs,
    hodiny: record.hrs,
    poznamka_absence: record.absNote,
    hotovost: record.cash,
    karta: record.card,
    partner: record.partner,
    pohyby: record.flows,
    poznamka_trzba: record.saleNote,
    vybrano: record.collected === false ? 'false' : record.collected,
  };
}

// =============================================================================
// MODULE DEFINITIONS (definice_modulu)
// =============================================================================

export function mapDbToModuleDefinition(row: any): ModuleDefinition {
  return {
    id: row.id,
    name: row.nazev,
    description: row.popis ?? '',
    component: row.komponenta,
    icon: row.ikona,
  };
}

// =============================================================================
// MODULE CONFIGS (konfigurace_modulu)
// =============================================================================

export function mapDbToModuleConfig(row: any): ModuleConfig {
  return {
    moduleId: row.id_modulu,
    roleIds: row.id_roli ?? [],
    order: row.poradi ?? 0,
    column: row.sloupec ?? 'left',
    enabled: row.aktivni ?? true,
    approvalMappings: row.mapovani_schvalovani ?? undefined,
    viewMappings: row.mapovani_zobrazeni ?? undefined,
  };
}

export function mapModuleConfigToDb(config: Partial<ModuleConfig> & { moduleId: string }): Record<string, any> {
  const row: Record<string, any> = { id_modulu: config.moduleId };
  if (config.roleIds !== undefined) row.id_roli = config.roleIds;
  if (config.order !== undefined) row.poradi = config.order;
  if (config.column !== undefined) row.sloupec = config.column;
  if (config.enabled !== undefined) row.aktivni = config.enabled;
  if (config.approvalMappings !== undefined) row.mapovani_schvalovani = config.approvalMappings || null;
  if (config.viewMappings !== undefined) row.mapovani_zobrazeni = config.viewMappings || null;
  return row;
}

// =============================================================================
// EMAIL ACCOUNTS (emailove_ucty)
// =============================================================================

export function mapDbToEmailAccount(row: any): EmailAccount {
  return {
    id: row.id,
    name: row.nazev,
    email: row.email,
    imapServer: row.imap_server,
    imapPort: row.imap_port ?? 993,
    smtpServer: row.smtp_server,
    smtpPort: row.smtp_port ?? 465,
    username: row.uzivatelske_jmeno,
    active: row.aktivni ?? true,
    lastSync: row.posledni_sync ?? null,
    createdAt: row.vytvoreno,
    updatedAt: row.aktualizovano,
  };
}

export function mapEmailAccountToDb(account: Partial<EmailAccount> & { id: string }): Record<string, any> {
  const row: Record<string, any> = { id: account.id };
  if (account.name !== undefined) row.nazev = account.name;
  if (account.email !== undefined) row.email = account.email;
  if (account.imapServer !== undefined) row.imap_server = account.imapServer;
  if (account.imapPort !== undefined) row.imap_port = account.imapPort;
  if (account.smtpServer !== undefined) row.smtp_server = account.smtpServer;
  if (account.smtpPort !== undefined) row.smtp_port = account.smtpPort;
  if (account.username !== undefined) row.uzivatelske_jmeno = account.username;
  if (account.active !== undefined) row.aktivni = account.active;
  if (account.lastSync !== undefined) row.posledni_sync = account.lastSync;
  if (account.updatedAt !== undefined) row.aktualizovano = account.updatedAt;
  return row;
}

// =============================================================================
// EMAIL ACCESS (emailovy_pristup)
// =============================================================================

export function mapDbToEmailAccess(row: any): EmailAccountAccess {
  return {
    accountId: row.id_uctu,
    employeeId: row.id_zamestnance,
    canSend: row.muze_odesilat ?? true,
    canDelete: row.muze_mazat ?? false,
    createdAt: row.vytvoreno,
  };
}

export function mapEmailAccessToDb(access: EmailAccountAccess): Record<string, any> {
  return {
    id_uctu: access.accountId,
    id_zamestnance: access.employeeId,
    muze_odesilat: access.canSend,
    muze_mazat: access.canDelete,
  };
}

// =============================================================================
// EMAIL FOLDERS (emailove_slozky)
// =============================================================================

export function mapDbToEmailFolder(row: any): EmailFolder {
  return {
    id: row.id,
    accountId: row.id_uctu,
    name: row.nazev,
    imapPath: row.imap_cesta,
    type: row.typ as EmailFolderType,
    messageCount: row.pocet_zprav ?? 0,
    unreadCount: row.pocet_neprectenych ?? 0,
    lastUid: row.posledni_uid ?? 0,
    order: row.poradi ?? 0,
    createdAt: row.vytvoreno,
  };
}

export function mapEmailFolderToDb(folder: Partial<EmailFolder> & { id: string }): Record<string, any> {
  const row: Record<string, any> = { id: folder.id };
  if (folder.accountId !== undefined) row.id_uctu = folder.accountId;
  if (folder.name !== undefined) row.nazev = folder.name;
  if (folder.imapPath !== undefined) row.imap_cesta = folder.imapPath;
  if (folder.type !== undefined) row.typ = folder.type;
  if (folder.messageCount !== undefined) row.pocet_zprav = folder.messageCount;
  if (folder.unreadCount !== undefined) row.pocet_neprectenych = folder.unreadCount;
  if (folder.lastUid !== undefined) row.posledni_uid = folder.lastUid;
  if (folder.order !== undefined) row.poradi = folder.order;
  return row;
}

// =============================================================================
// EMAIL MESSAGES (emailove_zpravy)
// =============================================================================

export function mapDbToEmailMessage(row: any): EmailMessage {
  return {
    id: row.id,
    accountId: row.id_uctu,
    folderId: row.id_slozky,
    imapUid: row.imap_uid,
    rfcMessageId: row.id_zpravy_rfc ?? null,
    subject: row.predmet ?? '',
    from: row.odesilatel ?? { address: '' },
    to: row.prijemci ?? [],
    cc: row.kopie ?? null,
    bcc: row.skryta_kopie ?? null,
    date: row.datum,
    preview: row.nahled ?? '',
    bodyText: row.telo_text ?? null,
    bodyHtml: row.telo_html ?? null,
    read: row.precteno ?? false,
    flagged: row.oznaceno ?? false,
    hasAttachments: row.ma_prilohy ?? false,
    attachmentsMeta: row.metadata_priloh ?? [],
    inReplyTo: row.odpoved_na ?? null,
    threadId: row.vlakno_id ?? null,
    size: row.velikost ?? 0,
    syncedAt: row.synchronizovano,
  };
}

export function mapEmailMessageToDb(msg: Partial<EmailMessage> & { id: string }): Record<string, any> {
  const row: Record<string, any> = { id: msg.id };
  if (msg.accountId !== undefined) row.id_uctu = msg.accountId;
  if (msg.folderId !== undefined) row.id_slozky = msg.folderId;
  if (msg.imapUid !== undefined) row.imap_uid = msg.imapUid;
  if (msg.rfcMessageId !== undefined) row.id_zpravy_rfc = msg.rfcMessageId;
  if (msg.subject !== undefined) row.predmet = msg.subject;
  if (msg.from !== undefined) row.odesilatel = msg.from;
  if (msg.to !== undefined) row.prijemci = msg.to;
  if (msg.cc !== undefined) row.kopie = msg.cc;
  if (msg.bcc !== undefined) row.skryta_kopie = msg.bcc;
  if (msg.date !== undefined) row.datum = msg.date;
  if (msg.preview !== undefined) row.nahled = msg.preview;
  if (msg.bodyText !== undefined) row.telo_text = msg.bodyText;
  if (msg.bodyHtml !== undefined) row.telo_html = msg.bodyHtml;
  if (msg.read !== undefined) row.precteno = msg.read;
  if (msg.flagged !== undefined) row.oznaceno = msg.flagged;
  if (msg.hasAttachments !== undefined) row.ma_prilohy = msg.hasAttachments;
  if (msg.attachmentsMeta !== undefined) row.metadata_priloh = msg.attachmentsMeta;
  if (msg.inReplyTo !== undefined) row.odpoved_na = msg.inReplyTo;
  if (msg.threadId !== undefined) row.vlakno_id = msg.threadId;
  if (msg.size !== undefined) row.velikost = msg.size;
  return row;
}

// =============================================================================
// EMAIL RULES (emailova_pravidla)
// =============================================================================

export function mapDbToEmailRule(row: any): EmailRule {
  return {
    id: row.id,
    accountId: row.id_uctu,
    name: row.nazev,
    active: row.aktivni ?? true,
    order: row.poradi ?? 0,
    conditions: row.podminky ?? { match: 'all', rules: [] },
    actions: row.akce ?? [],
    stopFurther: row.zastavit_dalsi ?? false,
    createdBy: row.vytvoril,
    createdAt: row.vytvoreno,
    updatedAt: row.aktualizovano,
  };
}

export function mapEmailRuleToDb(rule: Partial<EmailRule> & { id: string }): Record<string, any> {
  const row: Record<string, any> = { id: rule.id };
  if (rule.accountId !== undefined) row.id_uctu = rule.accountId;
  if (rule.name !== undefined) row.nazev = rule.name;
  if (rule.active !== undefined) row.aktivni = rule.active;
  if (rule.order !== undefined) row.poradi = rule.order;
  if (rule.conditions !== undefined) row.podminky = rule.conditions;
  if (rule.actions !== undefined) row.akce = rule.actions;
  if (rule.stopFurther !== undefined) row.zastavit_dalsi = rule.stopFurther;
  if (rule.createdBy !== undefined) row.vytvoril = rule.createdBy;
  return row;
}

// =============================================================================
// EMAIL SYNC LOG (emailovy_log)
// =============================================================================

export function mapDbToEmailSyncLog(row: any): EmailSyncLog {
  return {
    id: row.id,
    accountId: row.id_uctu,
    status: row.stav,
    message: row.zprava ?? null,
    newCount: row.pocet_novych ?? 0,
    durationMs: row.trvani_ms ?? 0,
    totalMessages: row.celkem_zprav ?? 0,
    processed: row.zpracovano ?? 0,
    currentFolder: row.aktualni_slozka ?? null,
    createdAt: row.vytvoreno,
  };
}

// =============================================================================
// MOTIVATION SETTINGS (motivace_nastaveni)
import type { MotivationSettings } from '@/shared/types';

export function mapDbToMotivationSettings(row: any): MotivationSettings {
  return {
    id: row.id,
    percentage: Number(row.procento) || 0,
    warehouseId: row.sklad_id ?? null,
    updatedAt: row.aktualizovano,
  };
}

export function mapMotivationSettingsToDb(settings: Partial<MotivationSettings>) {
  const row: Record<string, any> = { id: 1 };
  if (settings.percentage !== undefined) row.procento = settings.percentage;
  if (settings.warehouseId !== undefined) row.sklad_id = settings.warehouseId;
  row.aktualizovano = new Date().toISOString();
  return row;
}

// =============================================================================
// PREVODKY (prevodky)
// =============================================================================

import type { Prevodka, PrevodkaStav, PrevodkaPolozka } from '@/shared/types';

export function mapDbToPrevodkaPolozka(row: any): PrevodkaPolozka {
  return {
    id: row.id,
    prevodkaId: row.prevodka_id,
    kod: row.kod,
    nazev: row.nazev,
    pozice: row.pozice ?? null,
    pozadovaneMnozstvi: row.pozadovane_mnozstvi,
    skutecneMnozstvi: row.skutecne_mnozstvi ?? null,
    vychystano: row.vychystano ?? false,
    casVychystani: row.cas_vychystani ?? null,
    poradi: row.poradi ?? 0,
  };
}

export function mapPrevodkaPolozkaToDb(item: Partial<PrevodkaPolozka> & { id: string }): Record<string, any> {
  const row: Record<string, any> = { id: item.id };
  if (item.prevodkaId !== undefined) row.prevodka_id = item.prevodkaId;
  if (item.kod !== undefined) row.kod = item.kod;
  if (item.nazev !== undefined) row.nazev = item.nazev;
  if (item.pozice !== undefined) row.pozice = item.pozice;
  if (item.pozadovaneMnozstvi !== undefined) row.pozadovane_mnozstvi = item.pozadovaneMnozstvi;
  if (item.skutecneMnozstvi !== undefined) row.skutecne_mnozstvi = item.skutecneMnozstvi;
  if (item.vychystano !== undefined) row.vychystano = item.vychystano;
  if (item.casVychystani !== undefined) row.cas_vychystani = item.casVychystani;
  if (item.poradi !== undefined) row.poradi = item.poradi;
  return row;
}

export function mapDbToPrevodka(row: any, polozky: PrevodkaPolozka[] = []): Prevodka {
  return {
    id: row.id,
    cisloPrevodky: row.cislo_prevodky,
    zdrojovySklad: row.zdrojovy_sklad,
    cilovySklad: row.cilovy_sklad,
    stav: row.stav as PrevodkaStav,
    prirazenoKomu: row.prirazeno_komu ?? null,
    vytvoreno: row.vytvoreno,
    zahajeno: row.zahajeno ?? null,
    vychystano: row.vychystano ?? null,
    odeslano: row.odeslano ?? null,
    potvrzeno: row.potvrzeno ?? null,
    zruseno: row.zruseno ?? null,
    poznamka: row.poznamka ?? null,
    vytvoril: row.vytvoril,
    pohodaOdeslano: row.pohoda_odeslano ?? false,
    pohodaCisloDokladu: row.pohoda_cislo_dokladu ?? null,
    pohodaChyba: row.pohoda_chyba ?? null,
    pohodaOdeslanoAt: row.pohoda_odeslano_at ?? null,
    ukolId: row.ukol_id ?? null,
    polozky,
  };
}

export function mapPrevodkaToDb(p: Partial<Prevodka> & { id: string }): Record<string, any> {
  const row: Record<string, any> = { id: p.id };
  if (p.cisloPrevodky !== undefined) row.cislo_prevodky = p.cisloPrevodky;
  if (p.zdrojovySklad !== undefined) row.zdrojovy_sklad = p.zdrojovySklad;
  if (p.cilovySklad !== undefined) row.cilovy_sklad = p.cilovySklad;
  if (p.stav !== undefined) row.stav = p.stav;
  if (p.prirazenoKomu !== undefined) row.prirazeno_komu = p.prirazenoKomu;
  if (p.vytvoreno !== undefined) row.vytvoreno = p.vytvoreno;
  if (p.zahajeno !== undefined) row.zahajeno = p.zahajeno;
  if (p.vychystano !== undefined) row.vychystano = p.vychystano;
  if (p.odeslano !== undefined) row.odeslano = p.odeslano;
  if (p.potvrzeno !== undefined) row.potvrzeno = p.potvrzeno;
  if (p.zruseno !== undefined) row.zruseno = p.zruseno;
  if (p.poznamka !== undefined) row.poznamka = p.poznamka;
  if (p.vytvoril !== undefined) row.vytvoril = p.vytvoril;
  if (p.pohodaOdeslano !== undefined) row.pohoda_odeslano = p.pohodaOdeslano;
  if (p.pohodaCisloDokladu !== undefined) row.pohoda_cislo_dokladu = p.pohodaCisloDokladu;
  if (p.pohodaChyba !== undefined) row.pohoda_chyba = p.pohodaChyba;
  if (p.pohodaOdeslanoAt !== undefined) row.pohoda_odeslano_at = p.pohodaOdeslanoAt;
  if (p.ukolId !== undefined) row.ukol_id = p.ukolId;
  return row;
}

// POHODA CONFIG (pohoda_konfigurace)
// =============================================================================

import type { PohodaCredentials } from '@/features/pohoda/pohoda-store';
import type { PohodaSyncLog } from '@/shared/types';

export function mapDbToPohodaCredentials(row: any): PohodaCredentials {
  return {
    url: row.url ?? '',
    username: row.uzivatel ?? '',
    password: row.heslo ?? '',
    ico: row.ico ?? '',
  };
}

export function mapPohodaCredentialsToDb(creds: PohodaCredentials) {
  return {
    id: 1,
    url: creds.url,
    uzivatel: creds.username,
    heslo: creds.password,
    ico: creds.ico,
    aktualizovano: new Date().toISOString(),
  };
}

export function mapDbToPohodaSyncLog(row: any): PohodaSyncLog {
  return {
    id: row.id,
    typ: row.typ,
    stav: row.stav,
    zprava: row.zprava ?? null,
    pocetZaznamu: row.pocet_zaznamu ?? 0,
    pocetNovych: row.pocet_novych ?? 0,
    pocetAktualizovanych: row.pocet_aktualizovanych ?? 0,
    sklad: row.sklad ?? null,
    trvaniMs: row.trvani_ms ?? 0,
    detail: row.detail ?? null,
    vytvoreno: row.vytvoreno,
  };
}

// =============================================================================
// E-SHOP (eshopy)
// =============================================================================

export function mapDbToEshop(row: any): Eshop {
  return {
    id: row.id,
    name: row.nazev,
    domain: row.domena,
    slug: row.slug,
    logoUrl: row.logo_url ?? undefined,
    faviconUrl: row.favicon_url ?? undefined,
    primaryColor: row.primarni_barva ?? '#3B82F6',
    secondaryColor: row.sekundarni_barva ?? '#1E293B',
    font: row.font ?? 'Inter',
    toneOfVoice: row.ton_hlasu ?? undefined,
    targetAudience: row.cilova_skupina ?? undefined,
    aiInstructions: row.ai_instrukce ?? undefined,
    contactEmail: row.kontaktni_email ?? undefined,
    contactPhone: row.kontaktni_telefon ?? undefined,
    ico: row.ico ?? undefined,
    dic: row.dic ?? undefined,
    companyName: row.nazev_firmy ?? undefined,
    companyAddress: row.adresa_firmy ?? undefined,
    termsAndConditions: row.obchodni_podminky ?? undefined,
    gdprText: row.gdpr_text ?? undefined,
    seoTitleTemplate: row.seo_title_sablona ?? undefined,
    seoDescriptionTemplate: row.seo_description_sablona ?? undefined,
    senderEmail: row.odesilatel_email ?? undefined,
    senderName: row.odesilatel_jmeno ?? undefined,
    active: row.aktivni ?? true,
    createdAt: row.vytvoreno,
    updatedAt: row.aktualizovano,
  };
}

export function mapEshopToDb(data: Partial<Eshop>): Record<string, any> {
  const row: Record<string, any> = {};
  if (data.name !== undefined) row.nazev = data.name;
  if (data.domain !== undefined) row.domena = data.domain;
  if (data.slug !== undefined) row.slug = data.slug;
  if (data.logoUrl !== undefined) row.logo_url = data.logoUrl;
  if (data.faviconUrl !== undefined) row.favicon_url = data.faviconUrl;
  if (data.primaryColor !== undefined) row.primarni_barva = data.primaryColor;
  if (data.secondaryColor !== undefined) row.sekundarni_barva = data.secondaryColor;
  if (data.font !== undefined) row.font = data.font;
  if (data.toneOfVoice !== undefined) row.ton_hlasu = data.toneOfVoice;
  if (data.targetAudience !== undefined) row.cilova_skupina = data.targetAudience;
  if (data.aiInstructions !== undefined) row.ai_instrukce = data.aiInstructions;
  if (data.contactEmail !== undefined) row.kontaktni_email = data.contactEmail;
  if (data.contactPhone !== undefined) row.kontaktni_telefon = data.contactPhone;
  if (data.ico !== undefined) row.ico = data.ico;
  if (data.dic !== undefined) row.dic = data.dic;
  if (data.companyName !== undefined) row.nazev_firmy = data.companyName;
  if (data.companyAddress !== undefined) row.adresa_firmy = data.companyAddress;
  if (data.termsAndConditions !== undefined) row.obchodni_podminky = data.termsAndConditions;
  if (data.gdprText !== undefined) row.gdpr_text = data.gdprText;
  if (data.seoTitleTemplate !== undefined) row.seo_title_sablona = data.seoTitleTemplate;
  if (data.seoDescriptionTemplate !== undefined) row.seo_description_sablona = data.seoDescriptionTemplate;
  if (data.senderEmail !== undefined) row.odesilatel_email = data.senderEmail;
  if (data.senderName !== undefined) row.odesilatel_jmeno = data.senderName;
  if (data.active !== undefined) row.aktivni = data.active;
  row.aktualizovano = new Date().toISOString();
  return row;
}

// =============================================================================
// PRODUCTS (produkty)
// =============================================================================

export function mapDbToProduct(row: any): Product {
  return {
    id: row.id,
    sku: row.sku ?? undefined,
    name: row.nazev,
    slug: row.slug,
    brand: row.znacka ?? undefined,
    manufacturer: row.vyrobce ?? undefined,
    ean: row.ean ?? undefined,
    weight: row.hmotnost != null ? Number(row.hmotnost) : undefined,
    dimensions: row.rozmery ?? undefined,
    baseDescription: row.zakladni_popis ?? undefined,
    baseShortDescription: row.zakladni_kratky_popis ?? undefined,
    stock: row.skladem ?? 0,
    minStock: row.min_skladem ?? 0,
    active: row.aktivni ?? true,
    feedId: row.feed_id ?? undefined,
    feedData: row.feed_data ?? undefined,
    createdAt: row.vytvoreno,
    updatedAt: row.aktualizovano,
  };
}

export function mapProductToDb(data: Partial<Product>): Record<string, any> {
  const row: Record<string, any> = {};
  if (data.sku !== undefined) row.sku = data.sku;
  if (data.name !== undefined) row.nazev = data.name;
  if (data.slug !== undefined) row.slug = data.slug;
  if (data.brand !== undefined) row.znacka = data.brand;
  if (data.manufacturer !== undefined) row.vyrobce = data.manufacturer;
  if (data.ean !== undefined) row.ean = data.ean;
  if (data.weight !== undefined) row.hmotnost = data.weight;
  if (data.dimensions !== undefined) row.rozmery = data.dimensions;
  if (data.baseDescription !== undefined) row.zakladni_popis = data.baseDescription;
  if (data.baseShortDescription !== undefined) row.zakladni_kratky_popis = data.baseShortDescription;
  if (data.stock !== undefined) row.skladem = data.stock;
  if (data.minStock !== undefined) row.min_skladem = data.minStock;
  if (data.active !== undefined) row.aktivni = data.active;
  if (data.feedId !== undefined) row.feed_id = data.feedId;
  if (data.feedData !== undefined) row.feed_data = data.feedData;
  row.aktualizovano = new Date().toISOString();
  return row;
}

// =============================================================================
// ATTRIBUTE TYPES (atributy_typy)
// =============================================================================

export function mapDbToAttributeType(row: any): AttributeType {
  return {
    id: row.id,
    name: row.nazev,
    slug: row.slug,
    displayType: (row.typ_zobrazeni ?? 'dropdown') as AttributeDisplayType,
    expandInCategory: row.rozbalit_v_kategorii ?? false,
    order: row.poradi ?? 0,
    createdAt: row.vytvoreno,
  };
}

export function mapAttributeTypeToDb(data: Partial<AttributeType>): Record<string, any> {
  const row: Record<string, any> = {};
  if (data.name !== undefined) row.nazev = data.name;
  if (data.slug !== undefined) row.slug = data.slug;
  if (data.displayType !== undefined) row.typ_zobrazeni = data.displayType;
  if (data.expandInCategory !== undefined) row.rozbalit_v_kategorii = data.expandInCategory;
  if (data.order !== undefined) row.poradi = data.order;
  return row;
}

// =============================================================================
// ATTRIBUTE VALUES (atributy_hodnoty)
// =============================================================================

export function mapDbToAttributeValue(row: any): AttributeValue {
  return {
    id: row.id,
    attributeTypeId: row.atribut_typ_id,
    value: row.hodnota,
    slug: row.slug,
    hexColor: row.hex_barva ?? undefined,
    order: row.poradi ?? 0,
  };
}

export function mapAttributeValueToDb(data: Partial<AttributeValue>): Record<string, any> {
  const row: Record<string, any> = {};
  if (data.attributeTypeId !== undefined) row.atribut_typ_id = data.attributeTypeId;
  if (data.value !== undefined) row.hodnota = data.value;
  if (data.slug !== undefined) row.slug = data.slug;
  if (data.hexColor !== undefined) row.hex_barva = data.hexColor;
  if (data.order !== undefined) row.poradi = data.order;
  return row;
}

// =============================================================================
// PRODUCT VARIANTS (produkty_varianty)
// =============================================================================

export function mapDbToProductVariant(row: any): ProductVariant {
  return {
    id: row.id,
    productId: row.produkt_id,
    sku: row.sku ?? undefined,
    name: row.nazev,
    slug: row.slug,
    basePrice: Number(row.cena_zakladni ?? 0),
    stock: row.skladem ?? 0,
    ean: row.ean ?? undefined,
    active: row.aktivni ?? true,
    feedId: row.feed_id ?? undefined,
    createdAt: row.vytvoreno,
    updatedAt: row.aktualizovano,
  };
}

export function mapProductVariantToDb(data: Partial<ProductVariant>): Record<string, any> {
  const row: Record<string, any> = {};
  if (data.productId !== undefined) row.produkt_id = data.productId;
  if (data.sku !== undefined) row.sku = data.sku;
  if (data.name !== undefined) row.nazev = data.name;
  if (data.slug !== undefined) row.slug = data.slug;
  if (data.basePrice !== undefined) row.cena_zakladni = data.basePrice;
  if (data.stock !== undefined) row.skladem = data.stock;
  if (data.ean !== undefined) row.ean = data.ean;
  if (data.active !== undefined) row.aktivni = data.active;
  if (data.feedId !== undefined) row.feed_id = data.feedId;
  row.aktualizovano = new Date().toISOString();
  return row;
}

// =============================================================================
// VARIANT ATTRIBUTES (varianty_atributy)
// =============================================================================

export function mapDbToVariantAttribute(row: any): VariantAttribute {
  return {
    id: row.id,
    variantId: row.varianta_id,
    attributeValueId: row.atribut_hodnota_id,
  };
}

// =============================================================================
// PRODUCT IMAGES (produkty_obrazky)
// =============================================================================

export function mapDbToProductImage(row: any): ProductImage {
  return {
    id: row.id,
    productId: row.produkt_id,
    variantId: row.varianta_id ?? undefined,
    url: row.url,
    altText: row.alt_text ?? undefined,
    order: row.poradi ?? 0,
    isMain: row.hlavni ?? false,
  };
}

export function mapProductImageToDb(data: Partial<ProductImage>): Record<string, any> {
  const row: Record<string, any> = {};
  if (data.productId !== undefined) row.produkt_id = data.productId;
  if (data.variantId !== undefined) row.varianta_id = data.variantId;
  if (data.url !== undefined) row.url = data.url;
  if (data.altText !== undefined) row.alt_text = data.altText;
  if (data.order !== undefined) row.poradi = data.order;
  if (data.isMain !== undefined) row.hlavni = data.isMain;
  return row;
}

// =============================================================================
// CATEGORIES (kategorie)
// =============================================================================

export function mapDbToCategory(row: any): Category {
  return {
    id: row.id,
    name: row.nazev,
    slug: row.slug,
    parentId: row.rodic_id ?? undefined,
    description: row.popis ?? undefined,
    order: row.poradi ?? 0,
    active: row.aktivni ?? true,
  };
}

export function mapCategoryToDb(data: Partial<Category>): Record<string, any> {
  const row: Record<string, any> = {};
  if (data.name !== undefined) row.nazev = data.name;
  if (data.slug !== undefined) row.slug = data.slug;
  if (data.parentId !== undefined) row.rodic_id = data.parentId;
  if (data.description !== undefined) row.popis = data.description;
  if (data.order !== undefined) row.poradi = data.order;
  if (data.active !== undefined) row.aktivni = data.active;
  return row;
}

// =============================================================================
// PRODUCT CATEGORIES (produkty_kategorie)
// =============================================================================

export function mapDbToProductCategory(row: any): ProductCategory {
  return {
    id: row.id,
    productId: row.produkt_id,
    categoryId: row.kategorie_id,
    order: row.poradi ?? 0,
  };
}

export function mapProductCategoryToDb(data: Partial<ProductCategory>): Record<string, any> {
  const row: Record<string, any> = {};
  if (data.productId !== undefined) row.produkt_id = data.productId;
  if (data.categoryId !== undefined) row.kategorie_id = data.categoryId;
  if (data.order !== undefined) row.poradi = data.order;
  return row;
}

// =============================================================================
// SHOP CATEGORIES (eshop_kategorie)
// =============================================================================

export function mapDbToShopCategory(row: any): ShopCategory {
  return {
    id: row.id,
    shopId: row.eshop_id,
    categoryId: row.kategorie_id,
    nameOverride: row.nazev_override ?? undefined,
    descriptionOverride: row.popis_override ?? undefined,
    seoTitle: row.seo_title ?? undefined,
    seoDescription: row.seo_description ?? undefined,
    order: row.poradi ?? 0,
    active: row.aktivni ?? true,
  };
}

// =============================================================================
// SHOP PRODUCTS (eshop_produkty)
// =============================================================================

export function mapDbToShopProduct(row: any): ShopProduct {
  return {
    id: row.id,
    shopId: row.eshop_id,
    productId: row.produkt_id,
    price: Number(row.cena ?? 0),
    priceBeforeDiscount: row.cena_pred_slevou != null ? Number(row.cena_pred_slevou) : undefined,
    nameOverride: row.nazev_override ?? undefined,
    shortDescription: row.kratky_popis ?? undefined,
    longDescription: row.dlouhy_popis ?? undefined,
    seoTitle: row.seo_title ?? undefined,
    seoDescription: row.seo_description ?? undefined,
    seoSlug: row.seo_slug ?? undefined,
    aiStatus: (row.ai_stav ?? 'ceka') as AiStatus,
    active: row.aktivni ?? true,
    order: row.poradi ?? 0,
    createdAt: row.vytvoreno,
    updatedAt: row.aktualizovano,
  };
}

export function mapShopProductToDb(data: Partial<ShopProduct>): Record<string, any> {
  const row: Record<string, any> = {};
  if (data.shopId !== undefined) row.eshop_id = data.shopId;
  if (data.productId !== undefined) row.produkt_id = data.productId;
  if (data.price !== undefined) row.cena = data.price;
  if (data.priceBeforeDiscount !== undefined) row.cena_pred_slevou = data.priceBeforeDiscount;
  if (data.nameOverride !== undefined) row.nazev_override = data.nameOverride;
  if (data.shortDescription !== undefined) row.kratky_popis = data.shortDescription;
  if (data.longDescription !== undefined) row.dlouhy_popis = data.longDescription;
  if (data.seoTitle !== undefined) row.seo_title = data.seoTitle;
  if (data.seoDescription !== undefined) row.seo_description = data.seoDescription;
  if (data.seoSlug !== undefined) row.seo_slug = data.seoSlug;
  if (data.aiStatus !== undefined) row.ai_stav = data.aiStatus;
  if (data.active !== undefined) row.aktivni = data.active;
  if (data.order !== undefined) row.poradi = data.order;
  row.aktualizovano = new Date().toISOString();
  return row;
}

// =============================================================================
// SHOP CATEGORIES WRITE (eshop_kategorie → DB)
// =============================================================================

export function mapShopCategoryToDb(data: Partial<ShopCategory>): Record<string, any> {
  const row: Record<string, any> = {};
  if (data.shopId !== undefined) row.eshop_id = data.shopId;
  if (data.categoryId !== undefined) row.kategorie_id = data.categoryId;
  if (data.nameOverride !== undefined) row.nazev_override = data.nameOverride;
  if (data.descriptionOverride !== undefined) row.popis_override = data.descriptionOverride;
  if (data.seoTitle !== undefined) row.seo_title = data.seoTitle;
  if (data.seoDescription !== undefined) row.seo_description = data.seoDescription;
  if (data.order !== undefined) row.poradi = data.order;
  if (data.active !== undefined) row.aktivni = data.active;
  return row;
}

// =============================================================================
// SHOP PRODUCT VARIANTS (eshop_produkty_varianty)
// =============================================================================

export function mapDbToShopProductVariant(row: any): ShopProductVariant {
  return {
    id: row.id,
    shopProductId: row.eshop_produkt_id,
    variantId: row.varianta_id,
    priceOverride: row.cena_override != null ? Number(row.cena_override) : undefined,
    active: row.aktivni ?? true,
  };
}

// =============================================================================
// SHOP PRODUCT VARIANTS WRITE (eshop_produkty_varianty → DB)
// =============================================================================

export function mapShopProductVariantToDb(data: Partial<ShopProductVariant>): Record<string, any> {
  const row: Record<string, any> = {};
  if (data.shopProductId !== undefined) row.eshop_produkt_id = data.shopProductId;
  if (data.variantId !== undefined) row.varianta_id = data.variantId;
  if (data.priceOverride !== undefined) row.cena_override = data.priceOverride;
  if (data.active !== undefined) row.aktivni = data.active;
  return row;
}

// =============================================================================
// CUSTOMERS (zakaznici)
// =============================================================================

export function mapDbToCustomer(row: any): Customer {
  return {
    id: row.id,
    shopId: row.eshop_id,
    email: row.email,
    firstName: row.jmeno ?? undefined,
    lastName: row.prijmeni ?? undefined,
    phone: row.telefon ?? undefined,
    ageVerified: row.vek_overen ?? false,
    active: row.aktivni ?? true,
    createdAt: row.vytvoreno,
    lastLoginAt: row.posledni_prihlaseni ?? undefined,
  };
}

// =============================================================================
// CUSTOMER ADDRESSES (zakaznici_adresy)
// =============================================================================

export function mapDbToCustomerAddress(row: any): CustomerAddress {
  return {
    id: row.id,
    customerId: row.zakaznik_id,
    type: (row.typ ?? 'dodaci') as AddressType,
    firstName: row.jmeno ?? undefined,
    lastName: row.prijmeni ?? undefined,
    street: row.ulice ?? undefined,
    city: row.mesto ?? undefined,
    zip: row.psc ?? undefined,
    country: row.stat ?? 'CZ',
    isDefault: row.vychozi ?? false,
  };
}

// =============================================================================
// ORDERS (objednavky)
// =============================================================================

export function mapDbToOrder(row: any): Order {
  return {
    id: row.id,
    shopId: row.eshop_id,
    customerId: row.zakaznik_id ?? undefined,
    orderNumber: row.cislo_objednavky,
    status: (row.stav ?? 'nova') as OrderStatus,
    totalPrice: Number(row.celkova_cena ?? 0),
    shippingPrice: Number(row.doprava_cena ?? 0),
    paymentPrice: Number(row.platba_cena ?? 0),
    shippingType: row.doprava_typ ?? undefined,
    paymentType: row.platba_typ ?? undefined,
    trackingNumber: row.sledovaci_cislo ?? undefined,
    note: row.poznamka ?? undefined,
    internalNote: row.interni_poznamka ?? undefined,
    pohodaExported: row.pohoda_export ?? false,
    assignedTo: row.prirazeno_komu ?? undefined,
    billingAddress: row.fakturacni_adresa ?? undefined,
    shippingAddress: row.dodaci_adresa ?? undefined,
    createdAt: row.vytvoreno,
    updatedAt: row.aktualizovano,
  };
}

export function mapOrderToDb(data: Partial<Order>): Record<string, any> {
  const row: Record<string, any> = {};
  if (data.shopId !== undefined) row.eshop_id = data.shopId;
  if (data.customerId !== undefined) row.zakaznik_id = data.customerId;
  if (data.orderNumber !== undefined) row.cislo_objednavky = data.orderNumber;
  if (data.status !== undefined) row.stav = data.status;
  if (data.totalPrice !== undefined) row.celkova_cena = data.totalPrice;
  if (data.shippingPrice !== undefined) row.doprava_cena = data.shippingPrice;
  if (data.paymentPrice !== undefined) row.platba_cena = data.paymentPrice;
  if (data.shippingType !== undefined) row.doprava_typ = data.shippingType;
  if (data.paymentType !== undefined) row.platba_typ = data.paymentType;
  if (data.trackingNumber !== undefined) row.sledovaci_cislo = data.trackingNumber;
  if (data.note !== undefined) row.poznamka = data.note;
  if (data.internalNote !== undefined) row.interni_poznamka = data.internalNote;
  if (data.pohodaExported !== undefined) row.pohoda_export = data.pohodaExported;
  if (data.assignedTo !== undefined) row.prirazeno_komu = data.assignedTo;
  if (data.billingAddress !== undefined) row.fakturacni_adresa = data.billingAddress;
  if (data.shippingAddress !== undefined) row.dodaci_adresa = data.shippingAddress;
  row.aktualizovano = new Date().toISOString();
  return row;
}

// =============================================================================
// ORDER ITEMS (objednavky_polozky)
// =============================================================================

export function mapDbToOrderItem(row: any): OrderItem {
  return {
    id: row.id,
    orderId: row.objednavka_id,
    productId: row.produkt_id ?? undefined,
    variantId: row.varianta_id ?? undefined,
    name: row.nazev,
    price: Number(row.cena ?? 0),
    quantity: row.pocet ?? 1,
    total: Number(row.celkem ?? 0),
  };
}

// =============================================================================
// ORDER HISTORY (objednavky_historie)
// =============================================================================

export function mapDbToOrderHistory(row: any): OrderHistory {
  return {
    id: row.id,
    orderId: row.objednavka_id,
    statusFrom: row.stav_z ?? undefined,
    statusTo: row.stav_na,
    note: row.poznamka ?? undefined,
    changedBy: row.zmenil ?? undefined,
    createdAt: row.vytvoreno,
  };
}

// =============================================================================
// SHOP SHIPPING (eshop_doprava)
// =============================================================================

export function mapDbToShopShipping(row: any): ShopShipping {
  return {
    id: row.id,
    shopId: row.eshop_id,
    name: row.nazev,
    type: row.typ,
    price: Number(row.cena ?? 0),
    freeFrom: row.zdarma_od != null ? Number(row.zdarma_od) : undefined,
    config: row.konfigurace ?? {},
    active: row.aktivni ?? true,
    order: row.poradi ?? 0,
  };
}

// =============================================================================
// SHOP PAYMENT (eshop_platby)
// =============================================================================

export function mapDbToShopPayment(row: any): ShopPayment {
  return {
    id: row.id,
    shopId: row.eshop_id,
    name: row.nazev,
    type: row.typ,
    price: Number(row.cena ?? 0),
    config: row.konfigurace ?? {},
    active: row.aktivni ?? true,
    order: row.poradi ?? 0,
  };
}

// =============================================================================
// CUSTOMER WRITE MAPPERS
// =============================================================================

export function mapCustomerToDb(data: Partial<Customer>): Record<string, any> {
  const row: Record<string, any> = {};
  if (data.shopId !== undefined) row.eshop_id = data.shopId;
  if (data.email !== undefined) row.email = data.email;
  if (data.firstName !== undefined) row.jmeno = data.firstName;
  if (data.lastName !== undefined) row.prijmeni = data.lastName;
  if (data.phone !== undefined) row.telefon = data.phone;
  if (data.ageVerified !== undefined) row.vek_overen = data.ageVerified;
  if (data.active !== undefined) row.aktivni = data.active;
  return row;
}

export function mapCustomerAddressToDb(data: Partial<CustomerAddress>): Record<string, any> {
  const row: Record<string, any> = {};
  if (data.customerId !== undefined) row.zakaznik_id = data.customerId;
  if (data.type !== undefined) row.typ = data.type;
  if (data.firstName !== undefined) row.jmeno = data.firstName;
  if (data.lastName !== undefined) row.prijmeni = data.lastName;
  if (data.street !== undefined) row.ulice = data.street;
  if (data.city !== undefined) row.mesto = data.city;
  if (data.zip !== undefined) row.psc = data.zip;
  if (data.country !== undefined) row.stat = data.country;
  if (data.isDefault !== undefined) row.vychozi = data.isDefault;
  return row;
}

// =============================================================================
// ORDER WRITE MAPPERS
// =============================================================================

export function mapOrderItemToDb(data: Partial<OrderItem>): Record<string, any> {
  const row: Record<string, any> = {};
  if (data.orderId !== undefined) row.objednavka_id = data.orderId;
  if (data.productId !== undefined) row.produkt_id = data.productId;
  if (data.variantId !== undefined) row.varianta_id = data.variantId;
  if (data.name !== undefined) row.nazev = data.name;
  if (data.price !== undefined) row.cena = data.price;
  if (data.quantity !== undefined) row.pocet = data.quantity;
  if (data.total !== undefined) row.celkem = data.total;
  return row;
}

export function mapOrderHistoryToDb(data: Partial<OrderHistory>): Record<string, any> {
  const row: Record<string, any> = {};
  if (data.orderId !== undefined) row.objednavka_id = data.orderId;
  if (data.statusFrom !== undefined) row.stav_z = data.statusFrom;
  if (data.statusTo !== undefined) row.stav_na = data.statusTo;
  if (data.note !== undefined) row.poznamka = data.note;
  if (data.changedBy !== undefined) row.zmenil = data.changedBy;
  return row;
}

// =============================================================================
// SHIPPING & PAYMENT WRITE MAPPERS
// =============================================================================

export function mapShopShippingToDb(data: Partial<ShopShipping>): Record<string, any> {
  const row: Record<string, any> = {};
  if (data.shopId !== undefined) row.eshop_id = data.shopId;
  if (data.name !== undefined) row.nazev = data.name;
  if (data.type !== undefined) row.typ = data.type;
  if (data.price !== undefined) row.cena = data.price;
  if (data.freeFrom !== undefined) row.zdarma_od = data.freeFrom;
  if (data.config !== undefined) row.konfigurace = data.config;
  if (data.active !== undefined) row.aktivni = data.active;
  if (data.order !== undefined) row.poradi = data.order;
  return row;
}

export function mapShopPaymentToDb(data: Partial<ShopPayment>): Record<string, any> {
  const row: Record<string, any> = {};
  if (data.shopId !== undefined) row.eshop_id = data.shopId;
  if (data.name !== undefined) row.nazev = data.name;
  if (data.type !== undefined) row.typ = data.type;
  if (data.price !== undefined) row.cena = data.price;
  if (data.config !== undefined) row.konfigurace = data.config;
  if (data.active !== undefined) row.aktivni = data.active;
  if (data.order !== undefined) row.poradi = data.order;
  return row;
}

// =============================================================================
// BLOCK TYPES (bloky_typy)
// =============================================================================

export function mapDbToBlockType(row: any): BlockType {
  return {
    id: row.id,
    name: row.nazev,
    slug: row.slug,
    description: row.popis ?? undefined,
    defaultConfig: row.vychozi_konfigurace ?? {},
    configSchema: row.schema_konfigurace ?? {},
  };
}

// =============================================================================
// PAGE BLOCKS (stranky_bloky)
// =============================================================================

export function mapDbToPageBlock(row: any): PageBlock {
  return {
    id: row.id,
    shopId: row.eshop_id,
    page: row.stranka,
    pageId: row.stranka_id ?? undefined,
    blockTypeId: row.blok_typ_id,
    config: row.konfigurace ?? {},
    order: row.poradi ?? 0,
    active: row.aktivni ?? true,
    createdAt: row.vytvoreno,
    updatedAt: row.aktualizovano,
  };
}

export function mapPageBlockToDb(data: Partial<PageBlock>): Record<string, any> {
  const row: Record<string, any> = {};
  if (data.shopId !== undefined) row.eshop_id = data.shopId;
  if (data.page !== undefined) row.stranka = data.page;
  if (data.pageId !== undefined) row.stranka_id = data.pageId;
  if (data.blockTypeId !== undefined) row.blok_typ_id = data.blockTypeId;
  if (data.config !== undefined) row.konfigurace = data.config;
  if (data.order !== undefined) row.poradi = data.order;
  if (data.active !== undefined) row.aktivni = data.active;
  row.aktualizovano = new Date().toISOString();
  return row;
}

// =============================================================================
// BLOG POSTS (blog_clanky)
// =============================================================================

export function mapDbToBlogPost(row: any): BlogPost {
  return {
    id: row.id,
    shopId: row.eshop_id,
    title: row.nazev,
    slug: row.slug,
    shortDescription: row.kratky_popis ?? undefined,
    content: row.obsah ?? undefined,
    imageUrl: row.obrazek_url ?? undefined,
    seoTitle: row.seo_title ?? undefined,
    seoDescription: row.seo_description ?? undefined,
    authorId: row.autor_id ?? undefined,
    status: (row.stav ?? 'koncept') as BlogPostStatus,
    publishedAt: row.publikovano_v ?? undefined,
    tags: row.tagy ?? [],
    aiStatus: row.ai_stav ?? undefined,
    createdAt: row.vytvoreno,
    updatedAt: row.aktualizovano,
  };
}

export function mapBlogPostToDb(data: Partial<BlogPost>): Record<string, any> {
  const row: Record<string, any> = {};
  if (data.shopId !== undefined) row.eshop_id = data.shopId;
  if (data.title !== undefined) row.nazev = data.title;
  if (data.slug !== undefined) row.slug = data.slug;
  if (data.shortDescription !== undefined) row.kratky_popis = data.shortDescription;
  if (data.content !== undefined) row.obsah = data.content;
  if (data.imageUrl !== undefined) row.obrazek_url = data.imageUrl;
  if (data.seoTitle !== undefined) row.seo_title = data.seoTitle;
  if (data.seoDescription !== undefined) row.seo_description = data.seoDescription;
  if (data.authorId !== undefined) row.autor_id = data.authorId;
  if (data.status !== undefined) row.stav = data.status;
  if (data.publishedAt !== undefined) row.publikovano_v = data.publishedAt;
  if (data.tags !== undefined) row.tagy = data.tags;
  if (data.aiStatus !== undefined) row.ai_stav = data.aiStatus;
  row.aktualizovano = new Date().toISOString();
  return row;
}

// =============================================================================
// FEED CONFIG (feed_konfigurace)
// =============================================================================

export function mapDbToFeedConfig(row: any): FeedConfig {
  return {
    id: row.id,
    name: row.nazev,
    url: row.url ?? undefined,
    type: (row.typ ?? 'csv') as FeedType,
    delimiter: row.oddelovac ?? ';',
    encoding: row.kodovani ?? 'utf-8',
    mapping: row.mapovani ?? {},
    autoSync: row.auto_sync ?? false,
    syncInterval: row.sync_interval ?? 'daily',
    lastSync: row.posledni_sync ?? undefined,
    lastSyncStatus: row.posledni_sync_stav ?? undefined,
    lastSyncLog: row.posledni_sync_log ?? undefined,
    active: row.aktivni ?? true,
    createdAt: row.vytvoreno,
  };
}

export function mapFeedConfigToDb(data: Partial<FeedConfig>): Record<string, any> {
  const row: Record<string, any> = {};
  if (data.name !== undefined) row.nazev = data.name;
  if (data.url !== undefined) row.url = data.url;
  if (data.type !== undefined) row.typ = data.type;
  if (data.delimiter !== undefined) row.oddelovac = data.delimiter;
  if (data.encoding !== undefined) row.kodovani = data.encoding;
  if (data.mapping !== undefined) row.mapovani = data.mapping;
  if (data.autoSync !== undefined) row.auto_sync = data.autoSync;
  if (data.syncInterval !== undefined) row.sync_interval = data.syncInterval;
  if (data.lastSync !== undefined) row.posledni_sync = data.lastSync;
  if (data.lastSyncStatus !== undefined) row.posledni_sync_stav = data.lastSyncStatus;
  if (data.lastSyncLog !== undefined) row.posledni_sync_log = data.lastSyncLog;
  if (data.active !== undefined) row.aktivni = data.active;
  return row;
}

// =============================================================================
// FEED LOG (feed_log)
// =============================================================================

export function mapDbToFeedLog(row: any): FeedLog {
  return {
    id: row.id,
    feedId: row.feed_id,
    type: row.typ,
    status: row.stav,
    newProducts: row.novych_produktu ?? 0,
    updatedProducts: row.aktualizovano_produktu ?? 0,
    errors: row.chyb ?? 0,
    details: row.detaily ?? undefined,
    startedAt: row.spusteno,
    completedAt: row.dokonceno ?? undefined,
  };
}

export function mapFeedLogToDb(data: Partial<FeedLog>): Record<string, any> {
  const row: Record<string, any> = {};
  if (data.feedId !== undefined) row.feed_id = data.feedId;
  if (data.type !== undefined) row.typ = data.type;
  if (data.status !== undefined) row.stav = data.status;
  if (data.newProducts !== undefined) row.novych_produktu = data.newProducts;
  if (data.updatedProducts !== undefined) row.aktualizovano_produktu = data.updatedProducts;
  if (data.errors !== undefined) row.chyb = data.errors;
  if (data.details !== undefined) row.detaily = data.details;
  if (data.startedAt !== undefined) row.spusteno = data.startedAt;
  if (data.completedAt !== undefined) row.dokonceno = data.completedAt;
  return row;
}

// =============================================================================
// REDIRECTS (presmerovani)
// =============================================================================

export function mapDbToRedirect(row: any): Redirect {
  return {
    id: row.id,
    shopId: row.eshop_id,
    oldUrl: row.stara_url,
    newUrl: row.nova_url,
    type: row.typ ?? 301,
    createdAt: row.vytvoreno,
  };
}

export function mapRedirectToDb(data: Partial<Redirect>): Record<string, any> {
  const row: Record<string, any> = {};
  if (data.shopId !== undefined) row.eshop_id = data.shopId;
  if (data.oldUrl !== undefined) row.stara_url = data.oldUrl;
  if (data.newUrl !== undefined) row.nova_url = data.newUrl;
  if (data.type !== undefined) row.typ = data.type;
  return row;
}

// =============================================================================
// REVIEWS
// =============================================================================

export function mapDbToReview(row: any): Review {
  return {
    id: row.id,
    shopId: row.eshop_id,
    productId: row.produkt_id,
    customerId: row.zakaznik_id ?? undefined,
    name: row.jmeno,
    email: row.email ?? undefined,
    rating: row.hodnoceni,
    text: row.text ?? undefined,
    approved: row.schvaleno ?? false,
    createdAt: row.vytvoreno,
  };
}

// =============================================================================
// AI KONFIGURACE
// =============================================================================

export function mapDbToAiKonfigurace(row: any): AiKonfigurace {
  return {
    id: row.id,
    key: row.klic,
    value: row.hodnota,
    description: row.popis,
    createdAt: row.vytvoreno,
    updatedAt: row.aktualizovano,
  };
}
