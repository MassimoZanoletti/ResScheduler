


export interface User
{
   id: number;
   nome: string;
   password: string;
   ruolo: string;
   ruolo_id: number;
   attributo: number
}


export interface Resource
{
   id: number;
   nome: string;
   abbreviazione: string;
   indirizzo: string;
   coloretesto: string;
   coloresfondo: string;
   societa_id: number;
   soc_nome: string;
   soc_codice: number;
}


export interface Ruolo
{
   id: number;
   ruolo: string;
   attributo: number;
}


export interface Societa
{
   id: number;
   nome: string;
   tenant: string;
   codice: number;
}


export interface Categoria
{
   id: number;
   nome: string;
}


export interface SeasonDbElement
{
   id: number;
   nome: string;
   datainizio: string;
   datafine: string;
}


export interface SeasonDb
{
   ok: boolean;
   message: string;
   elements: SeasonDbElement[];
}


export interface SeasonElement
{
   id: number;
   nome: string;
   datainizio: Date;
   datafine: Date;
}


export interface Season
{
   ok: boolean;
   message: string;
   elements: SeasonElement[];
}


export interface Gruppo
{
   id: number;
   nome: string;
   abbreviazione: string;
   coloretesto: string;
   coloresfondo: string;
   exportgroup: string;
   exportname: string;
   categoria_id: number;
   societa_id: number;
   societa: string;
   categoria: string;
}


export namespace TipoEvento
{
   export const EventoVuoto: number = 0;
   export const EventoNormale: number = 1;
   export const EventoMaster: number = 2;
   export const EventoPeriodico: number = 3;
}


export interface EventoDbElement
{
   id: number;
   data: string;
   orainizio: string;
   orafine: string;
   risorsa_id: number;
   gruppo_id: number;
   casa: string;
   ospite: string;
   luogo: string;
   commento: string;
   arbitraggio: number;
   tipoevento: number;
   season_id: number;
   season: string;
   risorsa: string;
   risorsatxt: string;
   risorsabck: string;
   gruppo: string;
   gruppotxt: string
   gruppobck: string;
   master_id: number;
}


export interface EventoDb
{
   ok: boolean;
   message: string;
   elements: EventoDbElement[];
}


export interface EventoElement
{
   id: number;
   data: Date;
   orainizio: Date;
   orafine: Date;
   risorsa_id: number;
   gruppo_id: number;
   casa: string;
   ospite: string;
   luogo: string;
   commento: string;
   arbitraggio: boolean;
   tipoevento: number;
   risorsa: string;
   risorsatxt: string;
   risorsabck: string;
   gruppo: string;
   gruppotxt: string
   gruppobck: string;
   season_id: number;
   season: string;
   master_id: number;
}


export interface Evento
{
   ok: boolean;
   message: string;
   elements: EventoElement[];
}


export interface EventoMasterDbElement
{
   id: number;
   data: string;
   data_fine: string;
   orainizio: string;
   orafine: string;
   risorsa_id: number;
   gruppo_id: number;
   commento: string;
   season_id: number;
   season: string;
   risorsa: string;
   risorsatxt: string;
   risorsabck: string;
   gruppo: string;
   gruppotxt: string
   gruppobck: string;
}


export interface EventoMasterDb
{
   ok: boolean;
   message: string;
   elements: EventoMasterDbElement[];
}


export interface EventoMasterElement
{
   id: number;
   data: Date;
   datafine: Date;
   orainizio: Date;
   orafine: Date;
   risorsa_id: number;
   gruppo_id: number;
   commento: string;
   risorsa: string;
   risorsatxt: string;
   risorsabck: string;
   gruppo: string;
   gruppotxt: string
   gruppobck: string;
   season_id: number;
   season: string;
}


export interface EventoMaster
{
   ok: boolean;
   message: string;
   elements: EventoMasterElement[];
}


export interface LogMessage
{
   id: number;
   datetime: string;
   user_id: number;
   user: string
   description: string;
}


export namespace globs
{
   export let appName: string = "";
   export let appVersion: string = "";
}





// src/app/models/mess-dlg-data.model.ts
export interface MessDlgData {
   title: string;
   subtitle?: string;
   message: string;
   btncaption?: string; // Caption for the primary (OK/Yes) button
   messtype?: 'info' | 'warning' | 'error';
   showCancelButton?: boolean; // New: true to show a second button (e.g., No/Cancel)
   cancelButtonCaption?: string; // New: Caption for the second button
}

// Aggiungiamo un tipo per il risultato del dialogo per maggiore chiarezza
export type MessDialogResult = boolean | 'primary' | 'secondary' | undefined;
// 'confirm' o true per il bottone principale (OK/Sì)
// 'cancel' o false per il secondo bottone (Annulla/No)
// undefined se chiuso dalla 'X' o ESC
