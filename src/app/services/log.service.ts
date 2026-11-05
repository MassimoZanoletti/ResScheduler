
import {environment} from "../../environments/environment";
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {lastValueFrom, Observable} from 'rxjs';
import { User } from '../models/datamod';
import { utils } from "../common/utils";



@Injectable({
  providedIn: 'root'
})
export class LogService
{
   private apiUrl: string = `${environment.apiBaseUrl}/log/api.php`;

   private static readonly CHIAVE_SESSIONE: string = "RS_Log_Sessione";

   constructor(private http: HttpClient)
   {
   }


   // Nuovo codice di sessione: va creato a ogni login, guest compresi.
   // Resta in sessionStorage, quindi sopravvive al ricaricamento della pagina ma non alla chiusura della scheda.
   NuovaSessione (): string
   {
      let codice: string;
      if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function")
         codice = crypto.randomUUID ();
      else
         codice = `${Date.now ().toString (16)}-${Math.random ().toString (16).substring (2, 14)}`;
      utils.SaveToSessionStorage (LogService.CHIAVE_SESSIONE, codice);
      return codice;
   }


   // Se manca (es. utente già collegato prima dell'aggiornamento) ne crea uno al volo
   GetSessione (): string
   {
      return utils.GetFromSessionStorage<string> (LogService.CHIAVE_SESSIONE) ?? this.NuovaSessione ();
   }


   ChiudiSessione (): void
   {
      utils.removeFromSessionStorage (LogService.CHIAVE_SESSIONE);
   }


   getAllData(): Observable<any>
   {
      const operation: string = "all";
      const url: string = `${this.apiUrl}?operation=${operation}`;
      return this.http.get<any>(url);
   }


   getSingleData(aId: number): Observable<any>
   {
      const operation: string = "single";
      const url: string = `${this.apiUrl}?operation=${operation}&id=${aId}`;
      return this.http.get<any>(url);
   }


   updateData (aId: number,
               aUser: User,
               aDateTime: string,
               aMessage: string): Observable<any>
   {
      const operation: string = "edit";
      const url: string = `${this.apiUrl}` +
         `?operation=${operation}` +
         `&id=${aId}` +
         `&datetime=${encodeURIComponent(aDateTime)}` +
         `&userid=${aUser.id}` +
         `&username=${encodeURIComponent(aUser.nome)}` +
         `&message=${encodeURIComponent(aMessage)}`;
      return this.http.get<any>(url);
   }


   internalAddToLog (aUser: User,
                     aMessage: string): Observable<any>
   {
      const operation: string = "add";
      const ora: Date = new Date();
      const dataOra: string = `${ora.getFullYear()}-${utils.Dlt_PadDigits(ora.getMonth()+1, 2)}-${utils.Dlt_PadDigits(ora.getDate(), 2)} :: ${utils.Dlt_PadDigits(ora.getHours(), 2)}:${utils.Dlt_PadDigits(ora.getMinutes(), 2)}:${utils.Dlt_PadDigits(ora.getSeconds(), 2)}`;
      const url: string = `${this.apiUrl}` +
         `?operation=${operation}` +
         `&datetime=${encodeURIComponent(dataOra)}` +
         `&userid=${aUser.id}` +
         `&username=${encodeURIComponent(aUser.nome)}` +
         `&message=${encodeURIComponent(aMessage)}` +
         `&sessione=${encodeURIComponent(this.GetSessione ())}`;
      let result: any;
      try
      {
         result = this.http.get<any>(url);
      }
      catch (e)
      {
         result = e;
      }
      return result;
   }


   async AddToLog (aUser: User,
                   aMessage: string): Promise<any>
   {
      return await lastValueFrom(this.internalAddToLog(aUser, aMessage));
   }


   DeleteData (aId: number): Observable<any>
   {
      const operation: string = "delete";
      const url: string = `${this.apiUrl}?operation=${operation}&id=${aId}`;
      return this.http.get<any>(url);
   }


}
