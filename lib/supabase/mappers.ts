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
