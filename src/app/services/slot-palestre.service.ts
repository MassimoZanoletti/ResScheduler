import {environment} from "../../environments/environment";
import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable, map} from 'rxjs';
import {SlotPalestra} from '../models/datamod';


/*
   Slot orari assegnati alle palestre, per stagione. Solo GET (l'hosting non accetta POST/PUT).
   Il server usa "HH:MM:SS"; l'app lavora in minuti dalla mezzanotte.
*/
@Injectable({
               providedIn: 'root'
            })
export class SlotPalestreService
{
   private apiUrl: string = `${environment.apiBaseUrl}/slotpalestre/api.php`;

   constructor (private http: HttpClient)
   {
   }


   static Minuti (ora: string): number
   {
      const parti: Array<string> = `${ora ?? ''}`.split (':');
      return (parseInt (parti[0], 10) || 0) * 60 + (parseInt (parti[1], 10) || 0);
   }


   static Ora (minuti: number): string
   {
      return `${String (Math.floor (minuti / 60)).padStart (2, '0')}:${String (minuti % 60).padStart (2, '0')}`;
   }


   // Slot della stagione: { ok, message, elements: SlotPalestra[] }
   getAllData (aSeasonId: number): Observable<{ ok: boolean, message: string, elements: Array<SlotPalestra> }>
   {
      const url: string = `${this.apiUrl}?operation=all&season_id=${aSeasonId}`;
      return this.http.get<any> (url).pipe (map (resp => ({
         ok:       Boolean (resp?.ok),
         message:  resp?.message ?? '',
         elements: ((resp?.elements ?? []) as Array<any>).map (r => ({
            id:         Number (r.id),
            season_id:  Number (r.season_id),
            risorsa_id: Number (r.risorsa_id),
            giorno:     Number (r.giorno),
            da:         SlotPalestreService.Minuti (r.orainizio),
            a:          SlotPalestreService.Minuti (r.orafine)
         }))
      })));
   }


   addNewData (aSeasonId: number, aRisorsaId: number, aGiorno: number, aDa: number, aA: number): Observable<any>
   {
      const url: string = `${this.apiUrl}?operation=add` +
         `&season_id=${aSeasonId}&risorsa_id=${aRisorsaId}&giorno=${aGiorno}` +
         `&orainizio=${SlotPalestreService.Ora (aDa)}&orafine=${SlotPalestreService.Ora (aA)}`;
      return this.http.get<any> (url);
   }


   updateData (aId: number, aRisorsaId: number, aGiorno: number, aDa: number, aA: number): Observable<any>
   {
      const url: string = `${this.apiUrl}?operation=edit&id=${aId}` +
         `&risorsa_id=${aRisorsaId}&giorno=${aGiorno}` +
         `&orainizio=${SlotPalestreService.Ora (aDa)}&orafine=${SlotPalestreService.Ora (aA)}`;
      return this.http.get<any> (url);
   }


   DeleteData (aId: number): Observable<any>
   {
      return this.http.get<any> (`${this.apiUrl}?operation=delete&id=${aId}`);
   }


   // Copia tutti gli slot della stagione 'da' nella stagione 'a' (che deve essere vuota)
   CopiaStagione (aDa: number, aA: number): Observable<any>
   {
      return this.http.get<any> (`${this.apiUrl}?operation=copyseason&from=${aDa}&to=${aA}`);
   }
}
