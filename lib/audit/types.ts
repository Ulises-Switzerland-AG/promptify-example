import "server-only";

export type AdministratorAssignedEvent = {
  actorOid: string;
  action: "administrator.assigned";
  targetId: string;
  timestamp: Date;
};

export interface AuditLog {
  // Resolves only once the event is confirmed as delivered; rejects otherwise.
  recordAdministratorAssigned(event: AdministratorAssignedEvent): Promise<void>;
}
