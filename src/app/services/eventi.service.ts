
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { EventoDb,
   EventoDbElement } from "../models/datamod";
import { map,
   tap } from "rxjs/operators";


@Injectable({
  providedIn: 'root'
})
export class EventiService
{
   private apiUrl = 'https://www.basketsarezzo.com/code/backend/yessched/eventi/api.php'; // Assicurati che questo sia corretto

   constructor(private http: HttpClient)
   {
   }


   FormattaData (data: Date | string): string
   {
      const d = new Date (data);

      return `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`;
   }


   DbTimeToTime (aDate: string,
                 aTime: string): Date
   {
      let result: Date = new Date(aDate);
      const parts = aTime.split(':');
      const hour = parseInt(parts[0], 10);
      const minute = parseInt(parts[1], 10);
      result.setHours(hour, minute);
      return result;
   }


   getAllData(stagione: number | null,
              tipoEVento: number | null,
              risorsa: Array<number> | null,
              gruppo : Array<number> | null,
              data : Date | null,
              master: number | null): Observable<any>
   {
      const operation: string = "all";
      let qryStagione: string = "";
      let qryEvento: string = "";
      let qryRisorsa: string = "";
      let qryGruppo: string = "";
      let qryData: string = "";
      let qryMaster: string = "";
      if (stagione != null)
         qryStagione = `&season=${stagione}`;
      if (tipoEVento != null)
      {
         if (tipoEVento < 0)
            qryEvento = `&tipoevento=${tipoEVento}`;
         else
            qryEvento = `&tipoevento=${tipoEVento}`;
      }
      if (risorsa != null)
      {
         for (let i=0;   i<risorsa.length;   i++)
            qryRisorsa += `&risorsa[]=${risorsa[i]}`;
      }
      if (gruppo != null)
      {
         for (let i=0;   i<gruppo.length;   i++)
            qryRisorsa += `&gruppo[]=${gruppo[i]}`;
      }
      if (data != null)
         qryData = `&data=${this.FormattaData(data)}`;
      if (master != null)
      {
         qryMaster = `&master_id=${master}`;
      }
      const url: string = `${this.apiUrl}?operation=${operation}`+ qryStagione + qryEvento + qryRisorsa + qryGruppo + qryData + qryMaster;
      let rrr = this.http.get<EventoDb>(url).pipe (
         tap (value => {  }),
         map ((dataFromDb) => {
            return {
               ok:         dataFromDb.ok,
               message:    dataFromDb.message,
               elements:   dataFromDb.elements.map (element => {
                  const elm: EventoDbElement = (element as EventoDbElement);
                  try
                  {
                     const arb: boolean = Boolean (((String (elm.arbitraggio)) != "1") ? false : true);
                     const dt: Date = new Date (elm.data);
                     const oi: Date = this.DbTimeToTime (elm.data, elm.orainizio);
                     const ofi: Date = this.DbTimeToTime (elm.data, elm.orafine);
                     return {
                        id:            elm.id,
                        data:          dt,
                        orainizio:     oi,
                        orafine:       ofi,
                        risorsa_id:    elm.risorsa_id,
                        gruppo_id:     elm.gruppo_id,
                        casa:          elm.casa,
                        ospite:        elm.ospite,
                        luogo:         elm.luogo,
                        commento:      elm.commento,
                        arbitraggio:   arb,
                        tipoevento:    elm.tipoevento,
                        season_id:     elm.season_id,
                        risorsa:       elm.risorsa,
                        risorsatxt:    elm.risorsatxt,
                        risorsabck:    elm.risorsabck,
                        gruppo:        elm.gruppo,
                        gruppotxt:     elm.gruppotxt,
                        gruppobck:     elm.gruppobck,
                        season:        elm.season,
                        master_id:     elm.master_id
                     }
                  }
                  catch (e)
                  {
                     const ddd: Date = new Date();
                     return {
                        id:            elm.id,
                        data:          ddd,
                        orainizio:     ddd,
                        orafine:       ddd,
                        risorsa_id:    elm.risorsa_id,
                        gruppo_id:     elm.gruppo_id,
                        casa:          elm.data,
                        ospite:        elm.ospite,
                        luogo:         elm.luogo,
                        commento:      "ERRORE",
                        arbitraggio:   false,
                        tipoevento:    elm.tipoevento,
                        season_id:     elm.season_id,
                        risorsa:       elm.risorsa,
                        risorsatxt:    elm.risorsatxt,
                        risorsabck:    elm.risorsabck,
                        gruppo:        elm.gruppo,
                        gruppotxt:     elm.gruppotxt,
                        gruppobck:     elm.gruppobck,
                        season:        elm.season,
                        master_id:     elm.master_id
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


   getSingleData(aId: number): Observable<any>
   {
      const operation: string = "single";
      const url: string = `${this.apiUrl}?operation=${operation}&id=${aId}`;
      return this.http.get<any>(url);
   }


   updateData (aId: number,
               aData: string,
               aOraInizio: string,
               aOraFine: string,
               aRisorsaId: number,
               aGruppoId: number,
               aCasa: string,
               aOspite: string,
               aLuogo: string,
               aCommento: string,
               aArbitraggio: boolean,
               aTipoEvento: number,
               aSeasonId: number,
               aMasterId: number): Observable<any>
   {
      const operation: string = "edit";
      const url: string = `${this.apiUrl}?operation=${operation}` +
         `&id=${aId}` +
         `&data=${aData}` +
         `&orainizio=${aOraInizio}` +
         `&orafine=${aOraFine}` +
         `&risorsa_id=${aRisorsaId}` +
         `&gruppo_id=${aGruppoId}` +
         `&casa=${aCasa}` +
         `&ospite=${aOspite}` +
         `&luogo=${aLuogo}` +
         `&commento=${aCommento}` +
         `&arbitraggio=${Number(aArbitraggio)}` +
         `&tipoevento=${aTipoEvento}` +
         `&season_id=${aSeasonId}` +
         `&master_id=${aMasterId}`
      ;
      return this.http.get<any>(url);
   }


   addNewData (aData: string,
               aOraInizio: string,
               aOraFine: string,
               aRisorsaId: number,
               aGruppoId: number,
               aCasa: string,
               aOspite: string,
               aLuogo: string,
               aCommento: string,
               aArbitraggio: boolean,
               aTipoEvento: number,
               aSeasonId: number,
               aMasterId: number): Observable<any>
   {
      const operation: string = "add";
      const url: string = `${this.apiUrl}?operation=${operation}` +
         `&data=${aData}` +
         `&orainizio=${aOraInizio}` +
         `&orafine=${aOraFine}` +
         `&risorsa_id=${aRisorsaId}` +
         `&gruppo_id=${aGruppoId}` +
         `&casa=${aCasa}` +
         `&ospite=${aOspite}` +
         `&luogo=${aLuogo}` +
         `&commento=${aCommento}` +
         `&arbitraggio=${Number(aArbitraggio)}` +
         `&tipoevento=${aTipoEvento}` +
         `&season_id=${aSeasonId}` +
         `&master_id=${aMasterId}`
      return this.http.get<any>(url);
   }


   DeleteData (aId: number): Observable<any>
   {
      const operation: string = "delete";
      const url: string = `${this.apiUrl}?operation=${operation}&id=${aId}`;
      return this.http.get<any>(url);
   }


   DeletePeriodic (aMasterId: number): Observable<any>
   {
      const operation: string = "deleteperiodic";
      const url: string = `${this.apiUrl}?operation=${operation}&masterid=${aMasterId}`;
      return this.http.get<any>(url);
   }

}
