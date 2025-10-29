import { IndexedEntity, Entity } from "./core-utils";
import type { Project, Comment, User, AppSettings, Message } from "@shared/types";
import { v4 as uuidv4 } from 'uuid';
const initialProjectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>[] = [{ nomDuProjet: 'i-action.org', dateEnregistrementDomaine: '2023-10-21', dateExpirationDomaine: '2025-10-21', coutDomaine: null, coutHebergement: null, dateDebut: '2023-10-21', dateTermine: null, status: 'Terminé' }, { nomDuProjet: 'ahandtohumanity.org', dateEnregistrementDomaine: '2023-12-17', dateExpirationDomaine: '2025-12-17', coutDomaine: null, coutHebergement: null, dateDebut: '2023-12-17', dateTermine: null, status: 'Terminé' }, { nomDuProjet: 'blusky.bar', dateEnregistrementDomaine: '2024-12-21', dateExpirationDomaine: '2025-12-21', coutDomaine: null, coutHebergement: null, dateDebut: '2024-12-21', dateTermine: null, status: 'Terminé' },
{ nomDuProjet: 'halfindustrysarl.com', dateEnregistrementDomaine: '2024-11-16', dateExpirationDomaine: '2025-11-16', coutDomaine: null, coutHebergement: null, dateDebut: '2024-11-16', dateTermine: null, status: 'Terminé' },
{ nomDuProjet: 'grinecosarl.com', dateEnregistrementDomaine: '2024-12-24', dateExpirationDomaine: '2025-12-24', coutDomaine: null, coutHebergement: null, dateDebut: '2025-01-06', dateTermine: '2025-01-08', status: 'Terminé' },
{ nomDuProjet: 'reginaacademy.com', dateEnregistrementDomaine: '2025-01-31', dateExpirationDomaine: '2026-01-31', coutDomaine: null, coutHebergement: null, dateDebut: '2025-01-08', dateTermine: '2025-01-10', status: 'Terminé' },
{ nomDuProjet: 'reginahouseplan.com', dateEnregistrementDomaine: '2024-07-23', dateExpirationDomaine: '2025-07-23', coutDomaine: null, coutHebergement: null, dateDebut: '2024-07-23', dateTermine: null, status: 'Terminé' },
{ nomDuProjet: 'reginahouseplans.com', dateEnregistrementDomaine: '2023-02-01', dateExpirationDomaine: '2026-02-01', coutDomaine: null, coutHebergement: null, dateDebut: '2023-02-01', dateTermine: null, status: 'En cours' },
{ nomDuProjet: 'reginatechnologies.com', dateEnregistrementDomaine: '2024-09-28', dateExpirationDomaine: '2025-09-28', coutDomaine: null, coutHebergement: null, dateDebut: '2025-01-07', dateTermine: '2025-01-12', status: 'Terminé' },
{ nomDuProjet: 'sercobtp.com', dateEnregistrementDomaine: '2024-12-22', dateExpirationDomaine: '2025-12-22', coutDomaine: null, coutHebergement: null, dateDebut: '2025-01-09', dateTermine: '2025-01-15', status: 'Terminé' },
{ nomDuProjet: 'nostressevent.com', dateEnregistrementDomaine: '2025-01-15', dateExpirationDomaine: '2026-01-15', coutDomaine: null, coutHebergement: null, dateDebut: '2025-01-14', dateTermine: '2025-01-17', status: 'Terminé' },
{ nomDuProjet: 'barman-mobile.com', dateEnregistrementDomaine: '2025-01-26', dateExpirationDomaine: '2026-01-26', coutDomaine: null, coutHebergement: null, dateDebut: '2025-01-20', dateTermine: '2025-01-23', status: 'Terminé' },
{ nomDuProjet: 'hosting.reginatechnologies.com', dateEnregistrementDomaine: null, dateExpirationDomaine: null, coutDomaine: null, coutHebergement: null, dateDebut: null, dateTermine: null, status: 'Terminé -  En attente de traduction' },
{ nomDuProjet: 'mata-style.com', dateEnregistrementDomaine: '2025-04-05', dateExpirationDomaine: '2026-04-05', coutDomaine: null, coutHebergement: null, dateDebut: '2025-01-22', dateTermine: '2025-01-27', status: 'Terminé' },
{ nomDuProjet: 'training.reginaacademy.com', dateEnregistrementDomaine: null, dateExpirationDomaine: null, coutDomaine: null, coutHebergement: null, dateDebut: null, dateTermine: null, status: '90% Terminé' },
{ nomDuProjet: 'gobygrace.com', dateEnregistrementDomaine: '2024-10-17', dateExpirationDomaine: '2025-10-17', coutDomaine: null, coutHebergement: null, dateDebut: '2025-02-06', dateTermine: '2025-02-08', status: '85% Terminé' },
{ nomDuProjet: 'logictechproservices.com', dateEnregistrementDomaine: '2025-01-15', dateExpirationDomaine: '2026-01-15', coutDomaine: null, coutHebergement: null, dateDebut: null, dateTermine: null, status: '20%' },
{ nomDuProjet: 'divinefleur-traiteur.com', dateEnregistrementDomaine: '2024-12-29', dateExpirationDomaine: '2025-12-29', coutDomaine: null, coutHebergement: null, dateDebut: null, dateTermine: null, status: "Le client n'a pas r��pondu" },
{ nomDuProjet: 'divinefleur.com', dateEnregistrementDomaine: '2024-12-29', dateExpirationDomaine: '2025-12-29', coutDomaine: null, coutHebergement: null, dateDebut: null, dateTermine: null, status: 'Annulé' },
{ nomDuProjet: 'divinefleurtraiteur.com', dateEnregistrementDomaine: '2024-12-29', dateExpirationDomaine: '2025-12-29', coutDomaine: null, coutHebergement: null, dateDebut: null, dateTermine: null, status: 'Annulé' },
{ nomDuProjet: 'lesmerveillesduwalo.com', dateEnregistrementDomaine: '2025-01-26', dateExpirationDomaine: '2026-01-26', coutDomaine: null, coutHebergement: null, dateDebut: null, dateTermine: null, status: '0%' },
{ nomDuProjet: 'regina-tech.com', dateEnregistrementDomaine: '2024-12-24', dateExpirationDomaine: '2025-12-24', coutDomaine: null, coutHebergement: null, dateDebut: null, dateTermine: null, status: '0%' },
{ nomDuProjet: 'reginagroupinc.org', dateEnregistrementDomaine: '2024-10-22', dateExpirationDomaine: '2025-10-22', coutDomaine: null, coutHebergement: null, dateDebut: null, dateTermine: null, status: '0%' },
{ nomDuProjet: 'reginagrp.com', dateEnregistrementDomaine: '2024-10-22', dateExpirationDomaine: '2025-10-22', coutDomaine: null, coutHebergement: null, dateDebut: null, dateTermine: null, status: 'Terminé' },
{ nomDuProjet: 'reginagroupinc.com', dateEnregistrementDomaine: '2024-10-22', dateExpirationDomaine: '2025-10-22', coutDomaine: null, coutHebergement: null, dateDebut: null, dateTermine: null, status: '0%' },
{ nomDuProjet: 'reginacorp.com', dateEnregistrementDomaine: '2024-10-01', dateExpirationDomaine: '2025-10-01', coutDomaine: null, coutHebergement: null, dateDebut: null, dateTermine: null, status: '0%' },
{ nomDuProjet: 'kalafetakintou.com', dateEnregistrementDomaine: '2025-04-05', dateExpirationDomaine: '2026-04-05', coutDomaine: null, coutHebergement: null, dateDebut: '2025-03-05', dateTermine: '2025-03-10', status: 'Terminé' },
{ nomDuProjet: 'cod-es.com', dateEnregistrementDomaine: '2025-03-07', dateExpirationDomaine: '2026-03-07', coutDomaine: null, coutHebergement: null, dateDebut: '2025-03-07', dateTermine: '2025-03-12', status: 'Terminé-modes de paiement en attente (Orange)' },
{ nomDuProjet: 'sm-groupe.com', dateEnregistrementDomaine: '2025-03-11', dateExpirationDomaine: '2026-03-11', coutDomaine: null, coutHebergement: null, dateDebut: '2025-03-04', dateTermine: '2025-03-11', status: 'Terminé' },
{ nomDuProjet: 'commune-ouakam.com', dateEnregistrementDomaine: '2025-03-17', dateExpirationDomaine: '2026-03-17', coutDomaine: null, coutHebergement: null, dateDebut: '2025-03-17', dateTermine: '2025-03-21', status: 'Terminé' },
{ nomDuProjet: 'empirebeauty11.com', dateEnregistrementDomaine: '2025-03-20', dateExpirationDomaine: '2026-03-20', coutDomaine: null, coutHebergement: null, dateDebut: '2025-03-20', dateTermine: '2025-03-25', status: 'Terminé-modes de paiement en attente (Paytech)' },
{ nomDuProjet: 'empirebeauty11.shop', dateEnregistrementDomaine: '2025-03-20', dateExpirationDomaine: '2026-03-20', coutDomaine: null, coutHebergement: null, dateDebut: null, dateTermine: null, status: 'En cours' },
{ nomDuProjet: 'groupprandisenegal.com', dateEnregistrementDomaine: '2025-04-22', dateExpirationDomaine: '2026-04-22', coutDomaine: null, coutHebergement: null, dateDebut: '2025-03-26', dateTermine: '2025-03-29', status: 'Terminé - Travailler sur des commentaires' },
{ nomDuProjet: '2gpsecurite', dateEnregistrementDomaine: null, dateExpirationDomaine: null, coutDomaine: null, coutHebergement: null, dateDebut: '2025-03-28', dateTermine: '2025-03-29', status: 'Terminé - en attente de commentaires' },
{ nomDuProjet: 'soko.regina-tech.com', dateEnregistrementDomaine: null, dateExpirationDomaine: null, coutDomaine: null, coutHebergement: null, dateDebut: '2025-03-29', dateTermine: '2025-03-30', status: 'Terminé' },
{ nomDuProjet: 'Global Sporting Management Group Website (sm-groupe.com)', dateEnregistrementDomaine: '2025-03-11', dateExpirationDomaine: '2026-03-11', coutDomaine: null, coutHebergement: null, dateDebut: '2025-03-31', dateTermine: '2025-04-02', status: 'Terminé' },
{ nomDuProjet: 'ambacamdakar.com', dateEnregistrementDomaine: '2025-04-03', dateExpirationDomaine: '2026-04-03', coutDomaine: null, coutHebergement: null, dateDebut: '2025-04-04', dateTermine: '2025-04-07', status: 'Terminé' },
{ nomDuProjet: 'immobilier.regina-tech.com', dateEnregistrementDomaine: null, dateExpirationDomaine: null, coutDomaine: null, coutHebergement: null, dateDebut: '2025-04-04', dateTermine: '2025-04-07', status: 'Terminé' },
{ nomDuProjet: 'thavernyshop.com', dateEnregistrementDomaine: '2025-04-27', dateExpirationDomaine: '2026-04-27', coutDomaine: null, coutHebergement: null, dateDebut: '2025-04-28', dateTermine: '2025-04-30', status: 'Terminé' },
{ nomDuProjet: 'Mend\'s Shopping', dateEnregistrementDomaine: null, dateExpirationDomaine: null, coutDomaine: null, coutHebergement: null, dateDebut: '2025-04-30', dateTermine: '2025-05-05', status: 'Terminé' },
{ nomDuProjet: 'Regina House Plans Catalouge', dateEnregistrementDomaine: null, dateExpirationDomaine: null, coutDomaine: null, coutHebergement: null, dateDebut: '2025-05-29', dateTermine: '2025-06-20', status: 'Terminé' },
{ nomDuProjet: 'Asav Senengal', dateEnregistrementDomaine: '2025-06-26', dateExpirationDomaine: '2026-06-26', coutDomaine: null, coutHebergement: null, dateDebut: '2025-06-12', dateTermine: '2025-06-28', status: 'Terminé' },
{ nomDuProjet: 'Jgo.sn', dateEnregistrementDomaine: '2025-08-29', dateExpirationDomaine: '2026-08-29', coutDomaine: null, coutHebergement: null, dateDebut: '2025-06-27', dateTermine: null, status: 'En cours' },
{ nomDuProjet: 'jgo247.com', dateEnregistrementDomaine: '2025-08-29', dateExpirationDomaine: '2026-08-29', coutDomaine: null, coutHebergement: null, dateDebut: null, dateTermine: null, status: 'En cours' },
{ nomDuProjet: 'jgo247.sn', dateEnregistrementDomaine: '2025-08-29', dateExpirationDomaine: '2026-08-29', coutDomaine: null, coutHebergement: null, dateDebut: null, dateTermine: null, status: 'En cours' },
{ nomDuProjet: 'Ropalane Voyage', dateEnregistrementDomaine: '2025-06-26', dateExpirationDomaine: '2026-06-26', coutDomaine: null, coutHebergement: null, dateDebut: '2025-06-24', dateTermine: '2025-07-03', status: 'Terminé' },
{ nomDuProjet: 'CH Consulting', dateEnregistrementDomaine: '2025-07-14', dateExpirationDomaine: '2026-07-14', coutDomaine: null, coutHebergement: null, dateDebut: '2025-07-04', dateTermine: '2025-07-10', status: 'Terminé' },
{ nomDuProjet: 'Wild Ash Pictures', dateEnregistrementDomaine: '2025-07-22', dateExpirationDomaine: '2026-07-22', coutDomaine: null, coutHebergement: null, dateDebut: '2025-07-04', dateTermine: '2025-09-23', status: 'Terminé' },
{ nomDuProjet: 'HCP Group', dateEnregistrementDomaine: null, dateExpirationDomaine: null, coutDomaine: null, coutHebergement: null, dateDebut: '2025-08-25', dateTermine: '2025-08-29', status: 'Premier projet soumis en attente de retour d\'information' },
{ nomDuProjet: 'Diaelle.com', dateEnregistrementDomaine: '2025-09-01', dateExpirationDomaine: '2026-09-01', coutDomaine: null, coutHebergement: null, dateDebut: '2025-08-14', dateTermine: '2025-08-20', status: 'Terminé' },
{ nomDuProjet: 'Everythingdezzy', dateEnregistrementDomaine: '2025-09-01', dateExpirationDomaine: '2026-09-01', coutDomaine: null, coutHebergement: null, dateDebut: '2025-09-01', dateTermine: '2025-09-08', status: 'Terminé' },
{ nomDuProjet: 'Ahandtohumanity Revamping', dateEnregistrementDomaine: '2023-12-17', dateExpirationDomaine: '2025-12-17', coutDomaine: null, coutHebergement: null, dateDebut: '2025-07-06', dateTermine: '2025-09-24', status: 'Terminé' },
{ nomDuProjet: 'Sy Tranpsort Ecommerce', dateEnregistrementDomaine: null, dateExpirationDomaine: null, coutDomaine: null, coutHebergement: null, dateDebut: '2025-08-22', dateTermine: null, status: 'Premier projet soumis en attente de retour d\'information' },
{ nomDuProjet: 'Sy Tranpsort Boutigue Chez Ndoura', dateEnregistrementDomaine: null, dateExpirationDomaine: null, coutDomaine: null, coutHebergement: null, dateDebut: '2025-09-22', dateTermine: null, status: 'En cours' }];
const SEED_PROJECTS: Project[] = initialProjectData.map((p) => {
  const now = new Date().toISOString();
  return {
    ...p,
    id: uuidv4(),
    createdAt: now,
    updatedAt: now
  };
});
export class ProjectEntity extends IndexedEntity<Project> {
  static readonly entityName = "project";
  static readonly indexName = "projects";
  static readonly initialState: Project = {
    id: "",
    nomDuProjet: "",
    status: "En cours",
    createdAt: "",
    updatedAt: ""
  };
  static seedData = SEED_PROJECTS;
}
export class SettingsEntity extends Entity<AppSettings> {
  static readonly entityName = "settings";
  static readonly SINGLETON_ID = "app-settings";
  static readonly initialState: AppSettings = {
    appName: 'DomainDeck',
    appLogoUrl: null,
    smtp: {
      host: '',
      port: 587,
      user: '',
      pass: '',
      secure: true
    },
    columns: {
      nomDuProjet: true,
      status: true,
      domainExpiry: true,
      domainRegistration: true,
      cost: true,
      startDate: true,
      completedDate: true,
      actions: true
    },
    reminder: {
      defaultEmails: '',
      startMonthsBefore: 3,
      frequency: 'weekly',
    }
  };
  constructor(env: any) {
    super(env, SettingsEntity.SINGLETON_ID);
  }
}
const SEED_USERS: User[] = [
  { id: 'user-superadmin-01', name: 'Super Admin', email: 'admin@domaindeck.com', role: 'superadmin', password: 'password123', lastSeen: new Date().toISOString() },
  { id: 'user-collaborator-01', name: 'Collaborator User', email: 'collab@domaindeck.com', role: 'collaborator', password: 'password123', lastSeen: null },
];
export class UserEntity extends IndexedEntity<User> {
  static readonly entityName = "user";
  static readonly indexName = "users";
  static readonly initialState: User = { id: "", name: "", email: "", role: 'collaborator', lastSeen: null };
  static seedData = SEED_USERS;
}
const SEED_COMMENTS: Comment[] = [];
export class CommentEntity extends IndexedEntity<Comment> {
  static readonly entityName = "comment";
  static readonly indexName = "comments";
  static readonly initialState: Comment = {
    id: "",
    authorId: "",
    authorName: "",
    text: "",
    createdAt: "",
    parentId: null,
    projectId: null,
    visibleTo: [],
    readBy: [],
  };
  static seedData = SEED_COMMENTS;
}
const SEED_MESSAGES: Message[] = [];
export class MessageEntity extends IndexedEntity<Message> {
  static readonly entityName = "message";
  static readonly indexName = "messages";
  static readonly initialState: Message = {
    id: "",
    senderId: "",
    receiverId: "",
    senderName: "",
    text: "",
    createdAt: "",
    readAt: null,
  };
  static seedData = SEED_MESSAGES;
}