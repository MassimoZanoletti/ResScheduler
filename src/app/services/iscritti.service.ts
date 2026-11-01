
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Iscritto,
         IscrittoDb } from '../models/datamod';
import { map,
   tap } from "rxjs/operators";
import {utils} from "../common/utils";

@Injectable({
  providedIn: 'root'
})
export class IscrittiService
{
   private apiUrl = 'https://www.basketsarezzo.com/code/backend/yessched/iscritti/api.php'; // Assicurati che questo sia corretto

   constructor(private http: HttpClient)
   {
   }


   FormattaData (data: Date | string): string
   {
      const d = new Date (data);

      return utils.DataPerDb (d);
   }


   getAllData(stagione: number | null,
              gruppo: number | null,
              societa: number | null,
              categoria: number | null): Observable<any>
   {
      const operation: string = "all";
      let qryStagione: string = "";
      let qryGruppo: string = "";
      let qrySocieta: string = "";
      let qryCategoria: string = "";
      if (stagione != null)
         qryStagione = `&season=${stagione}`;
      if (gruppo != null)
         qryGruppo = `&gruppo=${gruppo}`;
      if (societa != null)
         qrySocieta = `&societa=${societa}`;
      if (categoria != null)
         qryCategoria = `&categoria=${categoria}`;
      const url: string = `${this.apiUrl}?operation=${operation}`+ qryStagione + qryGruppo + qryCategoria + qrySocieta;
      let rrr = this.http.get<any>(url).pipe (
         tap (value => {  }),
         map ((dataFromDb) => {
            return {
               ok:         dataFromDb.ok,
               message:    dataFromDb.message,
               elements:   dataFromDb.elements.map ((element: IscrittoDb) => {
                  const elm: IscrittoDb = (element as IscrittoDb);
                  try
                  {
                     const dt1: Date = new Date (elm.visitafatta);
                     const dt2: Date = new Date (elm.visitascadenza);
                     return {
                        id:             elm.id,
                        cognome:        elm.cognome,
                        nome:           elm.nome,
                        anno:           elm.anno,
                        visitafatta:    `${dt1.getFullYear()}-${utils.Dlt_PadDigits(1+dt1.getMonth(),2)}-${utils.Dlt_PadDigits(dt1.getDate(),2)}`,
                        visitascadenza: `${dt2.getFullYear()}-${utils.Dlt_PadDigits(1+dt2.getMonth(),2)}-${utils.Dlt_PadDigits(dt2.getDate(),2)}`,
                        seasonid:       elm.seasonid_link,
                        season:         elm.season,
                        gruppoid:       elm.gruppoid_link,
                        gruppo:         elm.gruppo,
                        societaid:      elm.societaid_link,
                        societa:        elm.societa,
                        categoriaid:    elm.categoriaid_link,
                        categoria:      elm.categoria,
                        nummaglia:      elm.nummaglia,
                        tesserato:      Boolean((elm.tesserato!=0)? true : false),
                        myfip:          Boolean((elm.myfip!=0)? true : false),
                        pagamenti:      elm.pagamenti,
                        recapiti:      elm.recapiti,
                        note:          elm.note
                     }
                  }
                  catch (e)
                  {
                     return {
                        id:            elm.id,
                        cognome:       elm.cognome,
                        nome:          elm.nome,
                        anno:          elm.anno,
                        visitafatta:   "ERRORE",
                        visitascadenza: "ERRORE",
                        seasonid:      elm.seasonid_link,
                        season:        elm.season,
                        gruppoid:      elm.gruppoid_link,
                        gruppo:        elm.gruppo,
                        societaid:     elm.societaid_link,
                        societa:       elm.societa,
                        categoriaid:   elm.categoriaid_link,
                        categoria:     elm.categoria,
                        nummaglia:     elm.nummaglia,
                        tesserato:      Boolean((elm.tesserato!=0)? true : false),
                        myfip:          Boolean((elm.myfip!=0)? true : false),
                        pagamenti:     elm.pagamenti,
                        recapiti:      elm.recapiti,
                        note:          "ERRORE"
                  };
               }})
            }
         })
      );
      return rrr;
   }



   getSingleData(aId: number): Observable<any>
   {
      const operation: string = "single";
      const url: string = `${this.apiUrl}?operation=${operation}&id=${aId}`;
      return this.http.get<any>(url);
   }


   updateData (aId: number,
               aCognome: string,
               aNome: string,
               aAnno: number,
               aSeasonId: number,
               aGruppoId: number,
               aCategoriaId: number,
               aSocietaId: number,
               aNumMaglia: string,
               aVisitaFatta: string,
               aVisitaScadenza: string,
               aTesserato: boolean,
               aMyFip: boolean,
               aPagamenti: string,
               aRecapiti: string,
               aNote: string): Observable<any>
   {
      const operation: string = "edit";
      const url: string = `${this.apiUrl}?operation=${operation}` +
         `&id=${aId}` +
         `&cognome=${encodeURIComponent(aCognome)}` +
         `&nome=${encodeURIComponent(aNome)}` +
         `&anno=${aAnno}` +
         `&season_id=${aSeasonId}` +
         `&gruppo_id=${aGruppoId}` +
         `&categoria_id=${aCategoriaId}` +
         `&societa_id=${aSocietaId}` +
         `&nummaglia=${encodeURIComponent(aNumMaglia)}` +
         `&visitafatta=${encodeURIComponent(aVisitaFatta)}` +
         `&visitascadenza=${encodeURIComponent(aVisitaScadenza)}` +
         `&tesserato=${Number(aTesserato)}` +
         `&myfip=${Number(aMyFip)}` +
         `&pagamenti=${encodeURIComponent(aPagamenti)}` +
         `&recapiti=${encodeURIComponent(aRecapiti)}` +
         `&note=${encodeURIComponent(aNote)}`
      ;
      return this.http.get<any>(url);
   }


   addNewData (aCognome: string,
               aNome: string,
               aAnno: number,
               aSeasonId: number,
               aGruppoId: number,
               aCategoriaId: number,
               aSocietaId: number,
               aNumMaglia: string,
               aVisitaFatta: string,
               aVisitaScadenza: string,
               aTesserato: boolean,
               aMyFip: boolean,
               aPagamenti: string,
               aRecapiti: string,
               aNote: string): Observable<any>
   {
      const operation: string = "add";
      const url: string = `${this.apiUrl}?operation=${operation}` +
         `&cognome=${encodeURIComponent(aCognome)}` +
         `&nome=${encodeURIComponent(aNome)}` +
         `&anno=${aAnno}` +
         `&season_id=${aSeasonId}` +
         `&gruppo_id=${aGruppoId}` +
         `&categoria_id=${aCategoriaId}` +
         `&societa_id=${aSocietaId}` +
         `&nummaglia=${encodeURIComponent(aNumMaglia)}` +
         `&visitafatta=${encodeURIComponent(aVisitaFatta)}` +
         `&visitascadenza=${encodeURIComponent(aVisitaScadenza)}` +
         `&tesserato=${Number(aTesserato)}` +
         `&myfip=${Number(aMyFip)}` +
         `&pagamenti=${encodeURIComponent(aPagamenti)}` +
         `&recapiti=${encodeURIComponent(aRecapiti)}` +
         `&note=${encodeURIComponent(aNote)}`
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
