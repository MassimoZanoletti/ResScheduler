
import {environment} from "../../environments/environment";
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';



@Injectable({
               providedIn: 'root'
            })
export class RuoliService
{
   private apiUrl: string = `${environment.apiBaseUrl}/ruoli/api.php`;

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
               aName: string,
               aAttributo: number): Observable<any>
   {
      const operation: string = "edit";
      const url: string = `${this.apiUrl}?operation=${operation}&id=${aId}&nome=${encodeURIComponent(aName)}&attributo=${aAttributo}`;
      return this.http.get<any>(url);
   }


   addNewData (aName: string,
               aAttributo: number): Observable<any>
   {
      const operation: string = "add";
      const url: string = `${this.apiUrl}?operation=${operation}&nome=${encodeURIComponent(aName)}&attributo=${aAttributo}`;
      return this.http.get<any>(url);
   }


   DeleteData (aId: number): Observable<any>
   {
      const operation: string = "delete";
      const url: string = `${this.apiUrl}?operation=${operation}&id=${aId}`;
      return this.http.get<any>(url);
   }

}
