import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {
   EventoMasterDb,
   EventoMasterDbElement } from "../models/datamod";
import {map,
   tap} from "rxjs/operators";



@Injectable ({
                providedIn: 'root'
             })
export class EventiMasterService
{
   private apiUrl = 'https://www.basketsarezzo.com/code/backend/yessched/eventi_master/api.php'; // Assicurati che questo sia corretto

   constructor (private http: HttpClient)
   {
   }


   FormattaData (data: Date | string): string
   {
      const d = new Date (data);

      return `${d.getFullYear ()}-${d.getMonth () + 1}-${d.getDate ()}`;
   }


   DbTimeToTime (aDate: string,
                 aTime: string): Date
   {
      let result: Date = new Date (aDate);
      const parts = aTime.split (':');
      const hour = parseInt (parts[0], 10);
      const minute = parseInt (parts[1], 10);
      result.setHours (hour, minute);
      return result;
   }


   getAllData (stagione: number | null,
               risorsa: Array<number> | null,
               gruppo: Array<number> | null,
               data: Date | null): Observable<any>
   {
      const operation: string = "all";
      let qryStagione: string = "";
      let qryRisorsa: string = "";
      let qryGruppo: string = "";
      let qryData: string = "";
      if (stagione != null)
         qryStagione = `&season=${stagione}`;
      if (risorsa != null)
      {
         for (let i = 0; i < risorsa.length; i++)
            qryRisorsa += `&risorsa[]=${risorsa[i]}`;
      }
      if (gruppo != null)
      {
         for (let i = 0; i < gruppo.length; i++)
            qryRisorsa += `&gruppo[]=${gruppo[i]}`;
      }
      if (data != null)
         qryData = `&data=${this.FormattaData (data)}`;
      const url: string = `${this.apiUrl}?operation=${operation}` + qryStagione + qryRisorsa + qryGruppo + qryData;
      let rrr = this.http.get<EventoMasterDb> (url).pipe (
         tap (value => { }),
         map ((dataFromDb) =>
              {
                 return {
                    ok:       dataFromDb.ok,
                    message:  dataFromDb.message,
                    elements: dataFromDb.elements.map (element =>
                                                       {
                                                          const elm: EventoMasterDbElement = (element as EventoMasterDbElement);
                                                          try
                                                          {
                                                             const dt: Date = new Date (elm.data);
                                                             const dtfin: Date = new Date (elm.data_fine);
                                                             const oi: Date = this.DbTimeToTime (elm.data, elm.orainizio);
                                                             const ofi: Date = this.DbTimeToTime (elm.data, elm.orafine);
                                                             return {
                                                                id:          elm.id,
                                                                data:        dt,
                                                                datafine:    dtfin,
                                                                orainizio:   oi,
                                                                orafine:     ofi,
                                                                risorsa_id:  elm.risorsa_id,
                                                                gruppo_id:   elm.gruppo_id,
                                                                commento:    elm.commento,
                                                                season_id:   elm.season_id,
                                                                risorsa:     elm.risorsa,
                                                                risorsatxt:  elm.risorsatxt,
                                                                risorsabck:  elm.risorsabck,
                                                                gruppo:      elm.gruppo,
                                                                gruppotxt:   elm.gruppotxt,
                                                                gruppobck:   elm.gruppobck,
                                                                season:      elm.season
                                                             }
                                                          }
                                                          catch (e)
                                                          {
                                                             const ddd: Date = new Date ();
                                                             return {
                                                                id:          elm.id,
                                                                data:        ddd,
                                                                datafine:    ddd,
                                                                orainizio:   ddd,
                                                                orafine:     ddd,
                                                                risorsa_id:  elm.risorsa_id,
                                                                gruppo_id:   elm.gruppo_id,
                                                                commento:    "ERRORE",
                                                                season_id:   elm.season_id,
                                                                risorsa:     elm.risorsa,
                                                                risorsatxt:  elm.risorsatxt,
                                                                risorsabck:  elm.risorsabck,
                                                                gruppo:      elm.gruppo,
                                                                gruppotxt:   elm.gruppotxt,
                                                                gruppobck:   elm.gruppobck,
                                                                season:      elm.season
                                                             }
                                                          }
                                                       })
                 }
              })
      );
      return rrr;
   }


   /*
   {
   "id": "1",
   "data": "2025-02-07",
   "orainizio": "15:30:00",
   "orafine": "17:30:00",
   "risorsa_id": "1",
   "gruppo_id": "3",
   "casa": "U19",
   "ospite": "Padernese",
   "luogo": "",
   "commento": "",
   "arbitraggio": "0",
   "tipoevento": "1",
   "season_id": "1",
   "risorsa": "Sarezzo",
   "risorsatxt": "#000000",
   "risorsabck": "#ff9d00",
   "gruppo": "Under-19",
   "gruppotxt": "#FFFFFF",
   "gruppobck": "#a67a00",
   "season": "2024/2025"
   }
    */

   getSingleData (aId: number): Observable<any>
   {
      const operation: string = "single";
      const url: string = `${this.apiUrl}?operation=${operation}&id=${aId}`;
      return this.http.get<any> (url);
   }


   updateData (aId: number,
               aData: string,
               aDataFine: string,
               aOraInizio: string,
               aOraFine: string,
               aRisorsaId: number,
               aGruppoId: number,
               aCommento: string,
               aSeasonId: number): Observable<any>
   {
      const operation: string = "edit";
      const url: string = `${this.apiUrl}?operation=${operation}` +
         `&id=${aId}` +
         `&data=${aData}` +
         `&datafine=${aDataFine}` +
         `&orainizio=${aOraInizio}` +
         `&orafine=${aOraFine}` +
         `&risorsa_id=${aRisorsaId}` +
         `&gruppo_id=${aGruppoId}` +
         `&commento=${aCommento}` +
         `&season_id=${aSeasonId}`
      ;
      return this.http.get<any> (url);
   }


   addNewData (aData: string,
               aDataFine: string,
               aOraInizio: string,
               aOraFine: string,
               aRisorsaId: number,
               aGruppoId: number,
               aCommento: string,
               aSeasonId: number): Observable<any>
   {
      const operation: string = "add";
      const url: string = `${this.apiUrl}?operation=${operation}` +
         `&data=${aData}` +
         `&datafine=${aDataFine}` +
         `&orainizio=${aOraInizio}` +
         `&orafine=${aOraFine}` +
         `&risorsa_id=${aRisorsaId}` +
         `&gruppo_id=${aGruppoId}` +
         `&commento=${aCommento}` +
         `&season_id=${aSeasonId}`
      return this.http.get<any> (url);
   }


   DeleteData (aId: number): Observable<any>
   {
      const operation: string = "delete";
      const url: string = `${this.apiUrl}?operation=${operation}&id=${aId}`;
      return this.http.get<any> (url);
   }

}
