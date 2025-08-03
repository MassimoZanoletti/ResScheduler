
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Resource } from '../models/datamod';

@Injectable({
               providedIn: 'root'
            })
export class RisorseService
{
   private apiUrl = 'https://www.basketsarezzo.com/code/backend/yessched/risorse/api.php'; // Assicurati che questo sia corretto

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
               aAbbrev: string,
               aAddress: string,
               aColTesto: string,
               aColSfondo: string,
               aSocId: number): Observable<any>
   {
      const operation: string = "edit";
      const url: string = `${this.apiUrl}?operation=${operation}` +
         `&id=${aId}` +
         `&nome=${aName}` +
         `&abbreviazione=${aAbbrev}` +
         `&indirizzo=${aAddress}` +
         `&coloretesto=${encodeURIComponent(aColTesto)}` +
         `&coloresfondo=${encodeURIComponent(aColSfondo)}` +
         `&societa_id=${aSocId}`;
      return this.http.get<any>(url);
   }


   addNewData (aName: string,
               aAbbrev: string,
               aAddress: string,
               aColTesto: string,
               aColSfondo: string,
               aSocId: number): Observable<any>
   {
      const operation: string = "add";
      const url: string = `${this.apiUrl}?operation=${operation}` +
         `&nome=${aName}` +
         `&abbreviazione=${aAbbrev}` +
         `&indirizzo=${aAddress}` +
         `&coloretesto=${encodeURIComponent(aColTesto)}` +
         `&coloresfondo=${encodeURIComponent(aColSfondo)}` +
         `&societa_id=${aSocId}`;
      return this.http.get<any>(url);
   }


   DeleteData (aId: number): Observable<any>
   {
      const operation: string = "delete";
      const url: string = `${this.apiUrl}?operation=${operation}&id=${aId}`;
      return this.http.get<any>(url);
   }

}
