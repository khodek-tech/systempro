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
  ChatMessage,
  ChatReadStatus,
  AttendanceRecord,
  ModuleDefinition,
  ModuleConfig,
  RoleType,
  AbsenceRequestStatus,
  TaskStatus,
  TaskPriority,
  TaskRepeat,
  TaskAssigneeType,
  StoreOpeningHours,
  EmailAccount,
  EmailAccountAccess,
  EmailFolder,
  EmailFolderType,
  EmailMessage,
  EmailRule,
  EmailSyncLog,
} from '@/shared/types';

// =============================================================================
// DB Row types (what comes from Supabase)
// =============================================================================

/* eslint-disable @typescript-eslint/no-explicit-any */

// =============================================================================
// USERS (zamestnanci)
// =============================================================================

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
    startsWithShortWeek: row.zacina_kratkym_tydnem ?? undefined,
    workingHours: row.pracovni_hodiny ?? undefined,
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
  if (user.startsWithShortWeek !== undefined) row.zacina_kratkym_tydnem = user.startsWithShortWeek;
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
    approvedAt: row.schvaleno ?? undefined,
    seenByUser: row.precteno_zamestnancem ?? undefined,
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
  if (req.approvedAt !== undefined) row.schvaleno = req.approvedAt || null;
  if (req.seenByUser !== undefined) row.precteno_zamestnancem = req.seenByUser;
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
    memberIds: row.id_clenu ?? [],
    createdAt: row.vytvoreno,
    createdBy: row.vytvoril,
  };
}

export function mapChatGroupToDb(group: Partial<ChatGroup> & { id: string }): Record<string, any> {
  const row: Record<string, any> = { id: group.id };
  if (group.name !== undefined) row.nazev = group.name;
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

// =============================================================================
// ATTENDANCE (dochazka)
// =============================================================================

export function mapDbToAttendanceRecord(row: any): AttendanceRecord {
  return {
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
