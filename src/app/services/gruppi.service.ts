
import {environment} from "../../environments/environment";
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Gruppo } from '../models/datamod';

@Injectable({
               providedIn: 'root'
            })
export class GruppiService
{
   private apiUrl: string = `${environment.apiBaseUrl}/gruppi/api.php`;

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
               aColTesto: string,
               aColSfondo: string,
               aSocId: number,
               aCatId: number,
               aExportGroup: string,
               aExportName: string): Observable<any>
   {
      const operation: string = "edit";
      const url: string = `${this.apiUrl}?operation=${operation}` +
         `&id=${aId}` +
         `&nome=${encodeURIComponent(aName)}` +
         `&abbreviazione=${encodeURIComponent(aAbbrev)}` +
         `&coloretesto=${encodeURIComponent(aColTesto)}` +
         `&coloresfondo=${encodeURIComponent(aColSfondo)}` +
         `&societa_id=${aSocId}` +
         `&categoria_id=${aCatId}` +
         `&exportgroup=${encodeURIComponent(aExportGroup)}` +
         `&exportname=${encodeURIComponent(aExportName)}`
      ;
      return this.http.get<any>(url);
   }


   addNewData (aName: string,
               aAbbrev: string,
               aColTesto: string,
               aColSfondo: string,
               aSocId: number,
               aCatId: number,
               aExportGroup: string,
               aExportName: string): Observable<any>
   {
      const operation: string = "add";
      const url: string = `${this.apiUrl}?operation=${operation}` +
         `&nome=${encodeURIComponent(aName)}` +
         `&abbreviazione=${encodeURIComponent(aAbbrev)}` +
         `&coloretesto=${encodeURIComponent(aColTesto)}` +
         `&coloresfondo=${encodeURIComponent(aColSfondo)}` +
         `&societa_id=${aSocId}` +
         `&categoria_id=${aCatId}` +
         `&exportgroup=${encodeURIComponent(aExportGroup)}` +
         `&exportname=${encodeURIComponent(aExportName)}`
      return this.http.get<any>(url);
   }


   DeleteData (aId: number): Observable<any>
   {
      const operation: string = "delete";
      const url: string = `${this.apiUrl}?operation=${operation}&id=${aId}`;
      return this.http.get<any>(url);
   }

}
