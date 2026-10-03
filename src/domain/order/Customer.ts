export type UserId = string;
export type ClientId = string;

export enum Role {
   ADMIN,
   CLIENT
}

export interface Client {
   id: ClientId
   name: string
   tel: string
   email: string
   role: Role.CLIENT
}

export interface User {
   id: UserId;
   name: string
}