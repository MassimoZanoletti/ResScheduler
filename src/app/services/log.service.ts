
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
   private apiUrl = 'https://www.basketsarezzo.com/code/backend/yessched/log/api.php'; // Assicurati che questo sia corretto

   constructor(private http: HttpClient)
   {
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
         `&datetime=${aDateTime}` +
         `&userid=${aUser.id}` +
         `&username=${aUser.nome}` +
         `&message=${aMessage}`;
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
         `&datetime=${dataOra}` +
         `&userid=${aUser.id}` +
         `&username=${aUser.nome}` +
         `&message=${aMessage}`;
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
