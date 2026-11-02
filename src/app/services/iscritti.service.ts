
import {environment} from "../../environments/environment";
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Gruppo,
         Iscritto,
         IscrittoDb,
         IscrittoGruppo } from '../models/datamod';
import { map,
   tap } from "rxjs/operators";
import {utils} from "../common/utils";

@Injectable({
  providedIn: 'root'
})
export class IscrittiService
{
   private apiUrl: string = `${environment.apiBaseUrl}/iscritti/api.php`;

   constructor(private http: HttpClient)
   {
   }


   FormattaData (data: Date | string): string
   {
      const d = new Date (data);

      return utils.DataPerDb (d);
   }


   /*
      Un iscritto può stare in più gruppi. Nel database:
        gruppoid_link = id dei gruppi separati da virgola       (es. "3,5")
        nummaglia     = numeri di maglia nello stesso ordine    (es. "7,12")
      Con un solo gruppo, nummaglia è preso così com'è (compatibile con i dati già presenti).
   */
   static LeggiGruppi (gruppiIds: string | number | null,
                       numMaglia: string | null,
                       listaGruppi: Array<Gruppo>): Array<IscrittoGruppo>
   {
      const ids: Array<number> = String (gruppiIds ?? '').split (',')
                                                         .map (x => parseInt (x.trim (), 10))
                                                         .filter (x => (!isNaN (x)) && (x > 0));
      const maglie: Array<string> = (ids.length > 1) ? String (numMaglia ?? '').split (',') : [String (numMaglia ?? '')];
      return ids.map ((id, i) => ({
         gruppoid:  id,
         gruppo:    listaGruppi.find (g => g.id == id)?.nome ?? `? (${id})`,
         nummaglia: (maglie[i] ?? '').trim ()
      }));
   }


   static GruppiIdsPerDb (gruppi: Array<IscrittoGruppo>): string
   {
      return gruppi.map (g => g.gruppoid).join (',');
   }


   // La virgola è il separatore: la tolgo dai singoli numeri
   static MagliePerDb (gruppi: Array<IscrittoGruppo>): string
   {
      return gruppi.map (g => (g.nummaglia ?? '').replace (/,/g, ' ').trim ()).join (',');
   }


   static GruppiTesto (gruppi: Array<IscrittoGruppo>): string
   {
      return gruppi.map (g => g.gruppo).join (', ');
   }


   static MaglieTesto (gruppi: Array<IscrittoGruppo>): string
   {
      return gruppi.map (g => g.nummaglia).join (', ');
   }


   getAllData(stagione: number | null,
              gruppo: number | null,
              societa: number | null,
              categoria: number | null,
              listaGruppi: Array<Gruppo> = []): Observable<any>
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
                  const gruppi: Array<IscrittoGruppo> = IscrittiService.LeggiGruppi (elm.gruppoid_link, elm.nummaglia, listaGruppi);
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
                        gruppi:         gruppi,
                        gruppo:         IscrittiService.GruppiTesto (gruppi),
                        societaid:      elm.societaid_link,
                        societa:        elm.societa,
                        categoriaid:    elm.categoriaid_link,
                        categoria:      elm.categoria,
                        nummaglia:      IscrittiService.MaglieTesto (gruppi),
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
                        gruppi:        gruppi,
                        gruppo:        IscrittiService.GruppiTesto (gruppi),
                        societaid:     elm.societaid_link,
                        societa:       elm.societa,
                        categoriaid:   elm.categoriaid_link,
                        categoria:     elm.categoria,
                        nummaglia:     IscrittiService.MaglieTesto (gruppi),
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
               aGruppiId: string,
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
         `&gruppo_id=${encodeURIComponent(aGruppiId)}` +
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
               aGruppiId: string,
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
         `&gruppo_id=${encodeURIComponent(aGruppiId)}` +
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
