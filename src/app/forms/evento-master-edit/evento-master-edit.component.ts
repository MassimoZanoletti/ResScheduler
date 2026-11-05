
import {
   ChangeDetectorRef, Component,
   OnInit
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router} from "@angular/router";
import { RisorseService } from "../../services/risorse.service";
import { GruppiService } from "../../services/gruppi.service";
import { EventiMasterService } from "../../services/eventi-master.service";
import { EventiService } from "../../services/eventi.service";
import { SeasonsService } from "../../services/seasons.service";
import {
   MessDlgData,
   SeasonElement,
   EventoElement,
   EventoMasterElement,
   TipoEvento
} from "../../models/datamod";
import { MessageDialogService } from "../../services/message-dialog.service";
import { LogService } from "../../services/log.service";
import {loggedUser} from "../../services/users.service";

// PrimeNG modules
import { InputTextModule } from 'primeng/inputtext';
import { CalendarModule } from 'primeng/calendar';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DropdownModule } from "primeng/dropdown";
import { InputGroupModule } from "primeng/inputgroup";
import { CheckboxModule } from 'primeng/checkbox';
import { SelectButtonModule } from 'primeng/selectbutton';
import {utils} from "../../common/utils";
import {firstValueFrom} from "rxjs";
import {DescriviEvento,
        EscapeHtml,
        IdRisorseTrasferta,
        IntervalliSovrapposti,
        IntervalloMinuti,
        OccupaRisorsa} from "../../common/sovrapposizioni";
import {FestivitaTra} from "../../common/festivita";


/*
   Una data dell'evento periodico, come mostrata nell'elenco del form.
   Una data "esclusa" e' una data della serie per cui non esiste (o non deve esistere) l'evento:
   non serve una colonna nel database, l'esclusione coincide con l'assenza dell'evento.
*/
interface RigaData
{
   data: Date;
   chiave: string;            // "YYYY-MM-DD"
   etichetta: string;         // es. "mar 09/09"
   inclusa: boolean;
   modificabile: boolean;     // false per le date passate quando si modifica "da oggi in poi"
   festivita: string;         // nome della festivita' ("" se giorno normale)
   conflitti: Array<string>;  // altri eventi nella stessa palestra con orario che si accavalla
}


const NOMI_GIORNI: Array<string> = ["domenica", "lunedì", "martedì", "mercoledì", "giovedì", "venerdì", "sabato"];


@Component({
  selector:    'app-evento-master-edit',
  standalone:  true,
              imports: [
                 CommonModule,
                 FormsModule,
                 InputTextModule,
                 CalendarModule,
                 ButtonModule,
                 CardModule,
                 DropdownModule,
                 InputGroupModule,
                 CheckboxModule,
                 SelectButtonModule
              ],
  templateUrl: './evento-master-edit.component.html',
  styleUrl:    './evento-master-edit.component.css'
})
export class EventoMasterEditComponent implements OnInit
{
   id: number = 0;
   isAdd: boolean = false;
   season_id: number = 0;
   stagione: SeasonElement | null = null;
   minData: Date | undefined = undefined;     // limiti dei calendari = date della stagione
   maxData: Date | undefined = undefined;
   operazione: string = "";
   data: Date |  null = null;
   datafine: Date |  null = null;
   orainizio: Date |  null = null;
   orafine: Date |  null = null;
   risorsa_id: number = 0;
   listaRisorse: Array<any> = [];
   currRisorsa: any | null = null;
   gruppo_id: number = 0;
   listaGruppi: Array<any> = [];
   currGruppo: any | null = null;
   commento: string = "";
   caricamento: boolean = true;
   salvataggioInCorso: boolean = false;   // blocca il doppio click su OK
   ritorno: string = '/eventimastertable'; // pagina a cui tornare (tabella periodici o orario palestre)
   progresso: string = "";                // avanzamento mostrato durante il salvataggio
   soloLettura: boolean = false;          // utenti senza diritti di modifica (es. guest): si puo' solo guardare

   // Date dell'evento periodico
   righe: Array<RigaData> = [];
   escluse: Set<string> = new Set<string> ();
   occorrenze: Map<string, EventoElement> = new Map<string, EventoElement> ();   // eventi gia' esistenti (modifica)
   riepilogo: string = "";
   numIncluse: number = 0;
   numConflitti: number = 0;

   // Eventi della palestra scelta (per segnare le date in conflitto), per giorno "YYYY-MM-DD"
   eventiPalestra: Map<string, Array<EventoElement>> = new Map<string, Array<EventoElement>> ();
   palestraCaricata: number = 0;

   // Ambito delle modifiche (solo in modifica)
   ambito: string = 'futuro';
   opzioniAmbito: Array<{ label: string, value: string }> = [
      { label: 'Da oggi in poi', value: 'futuro' },
      { label: 'Tutte le date',  value: 'tutte' }
   ];


   constructor (private eventiService: EventiMasterService,
                private eventoFiglioService: EventiService,
                private resourceService: RisorseService,
                private gruppiService: GruppiService,
                private seasonsService: SeasonsService,
                private router: Router,
                private cdr: ChangeDetectorRef,
                private messageDialogService: MessageDialogService,
                private logService: LogService)
   {
   }


   async ngOnInit ()
   {
      try
      {
         this.id = Number (history.state.id) || 0;
         // Senza id (es. pagina ricaricata) si puo' solo creare un nuovo evento periodico
         this.isAdd = (this.id <= 0) || Boolean (history.state.isadd);
         this.soloLettura = (loggedUser.attributo <= 0);
         this.season_id = Number (history.state.season_id) || 0;
         if (typeof history.state.ritorno === 'string')
            this.ritorno = history.state.ritorno;
         //
         const [dataRis, dataGrp, dataSea] = await Promise.all ([firstValueFrom (this.resourceService.getAllData ()),
                                                                 firstValueFrom (this.gruppiService.getAllData ()),
                                                                 firstValueFrom (this.seasonsService.getAllData ())]);
         if ((dataRis) && (dataRis.ok))
            this.listaRisorse = dataRis.elements;
         else
            this.messageDialogService.showError ("Errore durante il caricamento delle palestre", dataRis?.message ?? 'No data returned');
         if ((dataGrp) && (dataGrp.ok))
            this.listaGruppi = dataGrp.elements;
         else
            this.messageDialogService.showError ("Errore durante il caricamento dei gruppi", dataGrp?.message ?? 'No data returned');
         const listaStagioni: Array<SeasonElement> = ((dataSea) && (dataSea.ok)) ? dataSea.elements : [];

         if (this.id > 0)
         {
            this.operazione = (this.soloLettura) ? `` : `Modifica `;
            const dataRes = await firstValueFrom (this.eventiService.getSingleData (this.id));
            if ((dataRes) && (dataRes.ok))
            {
               const el: EventoMasterElement = dataRes.elements as EventoMasterElement;
               this.data = new Date (el.data);
               this.data.setHours (0, 0, 0, 0);
               this.datafine = new Date ((dataRes.elements as any).data_fine);
               this.datafine.setHours (0, 0, 0, 0);
               this.orainizio = this.TimeFromString ((dataRes.elements as any).data, (dataRes.elements as any).orainizio);
               this.orafine = this.TimeFromString ((dataRes.elements as any).data, (dataRes.elements as any).orafine);
               this.risorsa_id = el.risorsa_id;
               this.currRisorsa = this.listaRisorse.find (r => r.id == this.risorsa_id) ?? null;
               this.gruppo_id = el.gruppo_id;
               this.currGruppo = this.listaGruppi.find (g => g.id == this.gruppo_id) ?? null;
               this.commento = el.commento;
               // La stagione e' quella dell'evento periodico, non quella selezionata nella tabella
               const stagioneEvento: number = Number (el.season_id);
               if (stagioneEvento > 0)
                  this.season_id = stagioneEvento;
            }
            else
               this.messageDialogService.showError ("Errore durante la lettura dell'evento periodico", dataRes?.message ?? 'No data returned');
         }
         else
         {
            this.operazione = `Nuovo `;
         }
         this.ImpostaStagione (listaStagioni);

         if (this.id > 0)
         {
            await this.CaricaOccorrenze ();
            // Le date della serie senza evento sono state escluse (o cancellate a mano): restano escluse
            for (const giorno of this.GiorniSerie ())
            {
               const chiave: string = utils.DataPerDb (giorno);
               if (!this.occorrenze.has (chiave))
                  this.escluse.add (chiave);
            }
         }
         else
         {
            // Nuovo: dal giorno di oggi (o dall'inizio della stagione, se non e' ancora iniziata) alla fine della stagione
            const oggi: Date = new Date ();
            oggi.setHours (0, 0, 0, 0);
            this.data = oggi;
            this.datafine = new Date (oggi);
            if (this.stagione)
            {
               const inizio: Date = this.SoloGiorno (this.stagione.datainizio);
               const fine: Date = this.SoloGiorno (this.stagione.datafine);
               if ((utils.DataPerDb (oggi) < utils.DataPerDb (inizio)) || (utils.DataPerDb (oggi) > utils.DataPerDb (fine)))
                  this.data = inizio;
               this.datafine = fine;
            }
            this.orainizio = new Date (this.data);
            this.orafine = new Date (this.data);
            this.Precompila ();
         }
         await this.CaricaEventiPalestra ();
      }
      catch (e)
      {
         this.messageDialogService.showError ("Errore durante l'apertura dell'evento periodico", e);
      }
      finally
      {
         this.caricamento = false;
         this.AggiornaRighe ();
         this.cdr.detectChanges ();
      }
   }


   /*
      Nuovo evento aperto dall'orario palestre (clic su uno spazio libero):
      giorno della settimana, ora di inizio e palestra arrivano gia' scelti.
   */
   Precompila ()
   {
      const giorno: number = Number (history.state.giorno);
      if ((this.data) && (Number.isInteger (giorno)) && (giorno >= 0) && (giorno <= 6))
      {
         // primo giorno con quel giorno della settimana a partire dal giorno iniziale proposto
         while (this.data.getDay () != giorno)
            this.data.setDate (this.data.getDate () + 1);
      }
      const ora: number = Number (history.state.ora);
      if ((this.data) && (Number.isInteger (ora)) && (ora > 0))
      {
         this.orainizio = new Date (this.data);
         this.orainizio.setHours (Math.floor (ora / 60), ora % 60, 0, 0);
         this.orafine = new Date (this.orainizio);
         this.orafine.setMinutes (this.orafine.getMinutes () + 90);
      }
      const risorsaId: number = Number (history.state.risorsa_id);
      if (risorsaId > 0)
         this.currRisorsa = this.listaRisorse.find (r => r.id == risorsaId) ?? null;
   }


   SoloGiorno (d: Date): Date
   {
      const result: Date = new Date (d);
      result.setHours (0, 0, 0, 0);
      return result;
   }


   ImpostaStagione (listaStagioni: Array<SeasonElement>)
   {
      this.stagione = listaStagioni.find (s => s.id == this.season_id) ?? null;
      if (this.stagione)
      {
         this.minData = this.SoloGiorno (this.stagione.datainizio);
         this.maxData = this.SoloGiorno (this.stagione.datafine);
      }
   }


   // Eventi gia' generati da questo evento periodico (escluse le date rese indipendenti)
   async CaricaOccorrenze ()
   {
      this.occorrenze.clear ();
      const resp = await firstValueFrom (this.eventoFiglioService.getAllData (null, -1, null, null, null, this.id));
      if ((!resp) || (!resp.ok))
      {
         this.messageDialogService.showError ("Errore durante la lettura delle date dell'evento periodico", resp?.message ?? 'No data returned');
         return;
      }
      for (const ev of (resp.elements as Array<EventoElement>))
      {
         if ((ev.master_id == this.id) && (ev.tipoevento == TipoEvento.EventoPeriodico))
            this.occorrenze.set (utils.DataPerDb (ev.data), ev);
      }
   }


   TimeFromString (aDate: any,
                   aTime: any): Date
   {
      const sTime: string = `${aTime}`;
      const result: Date = new Date (aDate);
      const hours: number = parseInt (sTime.substring (0, 2), 10);
      const minutes: number = parseInt (sTime.substring (3, 5), 10);
      result.setHours (hours, minutes, 0, 0);
      return result;
   }


   /*
      Giorni della serie: dal giorno iniziale, ogni 7 giorni, fino al giorno finale.
   */
   GiorniSerie (): Array<Date>
   {
      const result: Array<Date> = [];
      if ((this.data == null) || (this.datafine == null))
         return result;
      const ultimo: string = utils.DataPerDb (this.datafine);
      const giorno: Date = this.SoloGiorno (this.data);
      while ((utils.DataPerDb (giorno) <= ultimo) && (result.length < 200))
      {
         result.push (new Date (giorno));
         giorno.setDate (giorno.getDate () + 7);
      }
      return result;
   }


   // In modifica "da oggi in poi" le date passate non vengono toccate
   InAmbito (chiave: string): boolean
   {
      if ((this.isAdd) || (this.ambito == 'tutte'))
         return true;
      return (chiave >= utils.DataPerDb (new Date ()));
   }


   /*
      Ricalcola l'elenco delle date e il riepilogo. Da chiamare a ogni modifica di
      date, orari, esclusioni o ambito.
   */
   AggiornaRighe ()
   {
      const giorni: Array<Date> = this.GiorniSerie ();
      const festivita: Map<string, string> = ((this.data) && (this.datafine)) ? FestivitaTra (this.data, this.datafine) : new Map<string, string> ();
      this.righe = giorni.map (g =>
      {
         const chiave: string = utils.DataPerDb (g);
         const modificabile: boolean = this.InAmbito (chiave);
         return {
            data:         g,
            chiave:       chiave,
            etichetta:    g.toLocaleDateString ('it-IT', { weekday: 'short', day: '2-digit', month: '2-digit' }),
            // una data passata che non si puo' modificare mostra com'e' davvero (esiste o no)
            inclusa:      modificabile ? (!this.escluse.has (chiave)) : this.occorrenze.has (chiave),
            modificabile: modificabile,
            festivita:    festivita.get (chiave) ?? ""
         };
      }).map (r => ({ ...r, conflitti: (r.inclusa) ? this.ConflittiDel (r.chiave) : [] }));
      this.numIncluse = this.righe.filter (r => r.inclusa).length;
      this.numConflitti = this.righe.filter (r => r.conflitti.length > 0).length;
      this.riepilogo = this.CalcolaRiepilogo ();
   }


   /*
      Carica gli eventi della stagione nella palestra scelta, per segnare le date in conflitto.
      Da chiamare all'apertura e quando cambia la palestra.
   */
   async CaricaEventiPalestra ()
   {
      const rid: number = Number (this.currRisorsa?.id ?? 0);
      if (rid == this.palestraCaricata)
         return;
      this.palestraCaricata = rid;
      this.eventiPalestra = new Map<string, Array<EventoElement>> ();
      const trasferte: Set<number> = IdRisorseTrasferta (this.listaRisorse);
      if ((rid > 0) && (!trasferte.has (rid)))
      {
         try
         {
            const stagione: number | null = (this.season_id > 0) ? this.season_id : null;
            const resp = await firstValueFrom (this.eventoFiglioService.getAllData (stagione, -1, [rid], null, null, null));
            if (rid != this.palestraCaricata)
               return;   // nel frattempo e' stata scelta un'altra palestra
            if ((resp) && (resp.ok))
            {
               for (const ev of (resp.elements as Array<EventoElement>))
               {
                  // le date di questo stesso evento periodico non sono un conflitto
                  if ((this.id > 0) && (ev.master_id == this.id) && (ev.tipoevento == TipoEvento.EventoPeriodico))
                     continue;
                  if ((!OccupaRisorsa (ev, trasferte)) || (Number (ev.risorsa_id) != rid) || (ev.data == null))
                     continue;
                  const chiave: string = utils.DataPerDb (ev.data);
                  const lista: Array<EventoElement> = this.eventiPalestra.get (chiave) ?? [];
                  lista.push (ev);
                  this.eventiPalestra.set (chiave, lista);
               }
            }
         }
         catch (e)
         {
            console.error ("CaricaEventiPalestra:", e);
         }
      }
      this.AggiornaRighe ();
      this.cdr.detectChanges ();
   }


   async OnPalestraChange ()
   {
      this.AggiornaRighe ();
      await this.CaricaEventiPalestra ();
   }


   // Descrizione degli eventi che nel giorno indicato si accavallano con l'orario scelto
   ConflittiDel (chiave: string): Array<string>
   {
      const eventi: Array<EventoElement> | undefined = this.eventiPalestra.get (chiave);
      const nuovo = IntervalloMinuti (this.orainizio, this.orafine);
      if ((eventi == null) || (nuovo == null))
         return [];
      return eventi.filter (ev =>
      {
         const altro = IntervalloMinuti (ev.orainizio, ev.orafine);
         return ((altro != null) && (IntervalliSovrapposti (nuovo, altro)));
      }).sort ((a, b) => utils.MinutiDelGiorno (a.orainizio) - utils.MinutiDelGiorno (b.orainizio))
        .map (ev => DescriviEvento (ev));
   }


   // Tooltip di una data: festivita', conflitti e cosa succede con un clic
   TooltipData (r: RigaData): string
   {
      const parti: Array<string> = [];
      if (r.festivita)
         parti.push (r.festivita);
      if (r.conflitti.length > 0)
         parti.push ("⚠ Palestra già occupata da:\n" + r.conflitti.map (c => "• " + c).join ("\n"));
      if (this.soloLettura)
      {
         if (!r.inclusa)
            parti.push ("esclusa");
      }
      else if (r.modificabile)
         parti.push ((r.inclusa) ? "clic per escludere" : "clic per includere");
      else
         parti.push ("data passata: non viene modificata");
      return parti.join ("\n");
   }


   CalcolaRiepilogo (): string
   {
      if ((this.data == null) || (this.datafine == null) || (this.righe.length == 0))
         return "Indicare il giorno iniziale e il giorno finale.";
      const giorno: string = NOMI_GIORNI[this.data.getDay ()];
      const inizio: number = utils.MinutiDelGiorno (this.orainizio);
      const fine: number = utils.MinutiDelGiorno (this.orafine);
      let orario: string = "";
      if (inizio > 0)
         orario = (fine > 0) ? `, ${utils.OraPerDb (this.orainizio)}–${utils.OraPerDb (this.orafine)}` : `, dalle ${utils.OraPerDb (this.orainizio)}`;
      const fmt = (d: Date): string => d.toLocaleDateString ('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' });
      const escluse: number = this.righe.length - this.numIncluse;
      let result: string = `Ogni ${giorno}${orario}, dal ${fmt (this.data)} al ${fmt (this.datafine)}: ${this.numIncluse} date`;
      if (escluse > 0)
         result += ` (${escluse} escluse)`;
      return result;
   }


   ToggleData (riga: RigaData)
   {
      if ((!riga.modificabile) || (this.salvataggioInCorso) || (this.soloLettura))
         return;
      if (this.escluse.has (riga.chiave))
         this.escluse.delete (riga.chiave);
      else
         this.escluse.add (riga.chiave);
      this.AggiornaRighe ();
   }


   EscludiFestivita ()
   {
      for (const r of this.righe)
      {
         if ((r.modificabile) && (r.festivita != ""))
            this.escluse.add (r.chiave);
      }
      this.AggiornaRighe ();
   }


   IncludiTutte ()
   {
      for (const r of this.righe)
      {
         if (r.modificabile)
            this.escluse.delete (r.chiave);
      }
      this.AggiornaRighe ();
   }


   // Giorni che dopo il salvataggio avranno l'evento (e che il salvataggio crea o aggiorna)
   GiorniDaSalvare (): Array<RigaData>
   {
      return this.righe.filter (r => (r.modificabile) && (r.inclusa));
   }


   /*
      Controllo sovrapposizioni (lato client): cerca gli altri eventi nella stessa palestra,
      nei giorni che verranno creati o aggiornati, con orario che si accavalla.
      Se ne trova, chiede conferma. Ritorna true se si puo' procedere con il salvataggio.
   */
   async ConfermaSovrapposizioni (): Promise<boolean>
   {
      const conflitti: Array<EventoElement> | null = await this.CercaSovrapposizioni ();
      let message: string;

      if ((conflitti != null) && (conflitti.length == 0))
         return true;
      if (conflitti == null)
         message = 'Non è stato possibile verificare se la palestra è già occupata in quei giorni e orari.\nSalvare comunque?';
      else
      {
         const MAX_RIGHE: number = 12;
         const righe: Array<string> = conflitti.slice (0, MAX_RIGHE).map (ev =>
            `• ${EscapeHtml (ev.data.toLocaleDateString ('it-IT', {weekday: 'short', day: '2-digit', month: '2-digit'}))}  ${EscapeHtml (DescriviEvento (ev))}`);
         if (conflitti.length > MAX_RIGHE)
            righe.push (`... e altri ${conflitti.length - MAX_RIGHE}`);
         message = `In <b>${EscapeHtml (this.currRisorsa?.nome ?? '')}</b> ci sono già <b>${conflitti.length}</b> eventi che si sovrappongono a questo orario:\n\n${righe.join ('\n')}\n\nSalvare comunque?`;
      }
      const dlgData: MessDlgData = {
         title:               'ATTENZIONE',
         subtitle:            (conflitti == null) ? 'Controllo sovrapposizioni' : 'Palestra già occupata',
         message:             message,
         messtype:            'warning',
         btncaption:          'Annulla',
         showCancelButton:    true,
         cancelButtonCaption: 'Sì, salva'
      };
      const result = await firstValueFrom (this.messageDialogService.showMessage (dlgData, '650px', true));
      return (result === 'secondary');
   }


   /*
      Ritorna gli eventi in conflitto ordinati per data e ora (array vuoto se nessuno),
      oppure null se non e' stato possibile caricare i dati dal server.
   */
   async CercaSovrapposizioni (): Promise<Array<EventoElement> | null>
   {
      if (this.risorsa_id <= 0)
         return [];
      const trasferte: Set<number> = IdRisorseTrasferta (this.listaRisorse);
      if (trasferte.has (Number (this.risorsa_id)))
         return [];
      const nuovo = IntervalloMinuti (this.orainizio, this.orafine);
      if (nuovo == null)
         return [];
      const giorni: Set<string> = new Set<string> (this.GiorniDaSalvare ().map (r => r.chiave));
      if (giorni.size == 0)
         return [];

      try
      {
         const stagione: number | null = (this.season_id > 0) ? this.season_id : null;
         const resp = await firstValueFrom (this.eventoFiglioService.getAllData (stagione, -1, [this.risorsa_id], null, null, null));
         if ((!resp) || (!resp.ok))
            return null;
         return (resp.elements as Array<EventoElement>).filter (ev =>
         {
            // le date di questo stesso evento periodico vengono aggiornate, non sono un conflitto
            if ((this.id > 0) && (ev.master_id == this.id) && (ev.tipoevento == TipoEvento.EventoPeriodico))
               return false;
            if ((!OccupaRisorsa (ev, trasferte)) || (ev.risorsa_id != this.risorsa_id))
               return false;
            if (!giorni.has (utils.DataPerDb (ev.data)))
               return false;
            const altro = IntervalloMinuti (ev.orainizio, ev.orafine);
            return ((altro != null) && (IntervalliSovrapposti (nuovo, altro)));
         }).sort ((a, b) => a.data.getTime () - b.data.getTime ());
      }
      catch (e)
      {
         console.error ("CercaSovrapposizioni:", e);
         return null;
      }
   }


   /*
      Controlli prima del salvataggio. Ritorna l'elenco degli errori (una riga ciascuno),
      stringa vuota se e' tutto a posto.
   */
   Valida (): string
   {
      const errori: Array<string> = [];
      if (this.data == null)
         errori.push ("• Indicare il giorno iniziale.");
      if (this.datafine == null)
         errori.push ("• Indicare il giorno finale.");
      if ((this.data != null) && (this.datafine != null) && (utils.DataPerDb (this.datafine) < utils.DataPerDb (this.data)))
         errori.push ("• Il giorno finale non può essere prima di quello iniziale.");
      if (!(this.season_id > 0))
         errori.push ("• Nessuna stagione: tornare alla tabella e selezionare la stagione.");
      else if ((this.stagione) && (this.data != null) && (this.datafine != null))
      {
         const inizioStagione: string = utils.DataPerDb (this.stagione.datainizio);
         const fineStagione: string = utils.DataPerDb (this.stagione.datafine);
         if ((utils.DataPerDb (this.data) < inizioStagione) || (utils.DataPerDb (this.datafine) > fineStagione))
            errori.push (`• Le date devono essere comprese nella stagione ${EscapeHtml (this.stagione.nome)} ` +
                         `(${this.stagione.datainizio.toLocaleDateString ('it-IT')} - ${this.stagione.datafine.toLocaleDateString ('it-IT')}).`);
      }
      if (this.currRisorsa == null)
         errori.push ("• Selezionare la palestra.");
      if (this.currGruppo == null)
         errori.push ("• Selezionare il gruppo.");
      errori.push (...utils.ErroriOrario (this.orainizio, this.orafine));
      if ((this.isAdd) && (this.numIncluse == 0))
         errori.push ("• Tutte le date sono escluse: non verrebbe creato nessun evento.");
      return errori.join ("\n");
   }


   // Mostra un messaggio e attende che l'utente lo chiuda
   async MostraEAttendi (dlgData: MessDlgData)
   {
      await firstValueFrom (this.messageDialogService.showMessage (dlgData, '600px'));
   }


   // true se l'evento esistente ha gia' i valori da salvare (nessun aggiornamento necessario)
   OccorrenzaInvariata (ev: EventoElement): boolean
   {
      return ((Number (ev.risorsa_id) == Number (this.risorsa_id)) &&
              (Number (ev.gruppo_id) == Number (this.gruppo_id)) &&
              (Number (ev.season_id) == Number (this.season_id)) &&
              (utils.OraPerDb (ev.orainizio) == utils.OraPerDb (this.orainizio)) &&
              (utils.OraPerDb (ev.orafine) == utils.OraPerDb (this.orafine)) &&
              ((ev.commento ?? "") == (this.commento ?? "")));
   }


   /*
      Allinea gli eventi del database alle date dell'evento periodico:
       - date incluse senza evento: crea l'evento;
       - date incluse con evento: lo aggiorna (solo se qualcosa e' cambiato);
       - eventi su date escluse o non piu' nella serie: li toglie.
      Considera solo le date nell'ambito scelto (in modifica "da oggi in poi" non tocca il passato).
      Un evento tolto viene cancellato se nel suo giorno ci sono altri eventi normali o vuoti,
      altrimenti diventa un giorno vuoto: cosi' il giorno resta visibile nella pagina eventi.
   */
   async AllineaOccorrenze (masterId: number): Promise<{ creati: number, aggiornati: number, tolti: number, errori: number, ultimoErrore: string }>
   {
      const esito = { creati: 0, aggiornati: 0, tolti: 0, errori: 0, ultimoErrore: "" };
      const daSalvare: Array<RigaData> = this.GiorniDaSalvare ();
      const chiaviDaSalvare: Set<string> = new Set<string> (daSalvare.map (r => r.chiave));
      const daTogliere: Array<EventoElement> = [];
      for (const [chiave, ev] of this.occorrenze)
      {
         if ((this.InAmbito (chiave)) && (!chiaviDaSalvare.has (chiave)))
            daTogliere.push (ev);
      }

      // Giorni con altri eventi normali o vuoti: servono per decidere se cancellare o svuotare
      const altriNelGiorno: Map<string, number> = new Map<string, number> ();
      if (daTogliere.length > 0)
      {
         const resp = await firstValueFrom (this.eventoFiglioService.getAllData (this.season_id, -1, null, null, null, null));
         if ((!resp) || (!resp.ok))
         {
            esito.errori += daTogliere.length;
            esito.ultimoErrore = `Impossibile leggere gli eventi della stagione: ${resp?.message ?? 'No data returned'}`;
            daTogliere.length = 0;
         }
         else
         {
            for (const ev of (resp.elements as Array<EventoElement>))
            {
               if ((ev.tipoevento == TipoEvento.EventoNormale) || (ev.tipoevento == TipoEvento.EventoVuoto))
               {
                  const k: string = utils.DataPerDb (ev.data);
                  altriNelGiorno.set (k, (altriNelGiorno.get (k) ?? 0) + 1);
               }
            }
         }
      }

      const totale: number = daSalvare.length + daTogliere.length;
      let passo: number = 0;
      const avanza = () =>
      {
         passo++;
         this.progresso = `Aggiornamento date: ${passo} di ${totale}...`;
         this.cdr.detectChanges ();
      };
      const registraErrore = (r: any) =>
      {
         esito.errori++;
         esito.ultimoErrore = `${r?.message ?? 'No data returned'}`;
      };

      for (const riga of daSalvare)
      {
         avanza ();
         const esistente: EventoElement | undefined = this.occorrenze.get (riga.chiave);
         try
         {
            if ((esistente) && (this.OccorrenzaInvariata (esistente)))
               continue;
            const r = (esistente)
               ? await firstValueFrom (this.eventoFiglioService.updateData (esistente.id, riga.chiave, utils.OraPerDb (this.orainizio), utils.OraPerDb (this.orafine),
                                                                            this.risorsa_id, this.gruppo_id, "", "", "", this.commento, false,
                                                                            TipoEvento.EventoPeriodico, this.season_id, masterId))
               : await firstValueFrom (this.eventoFiglioService.addNewData (riga.chiave, utils.OraPerDb (this.orainizio), utils.OraPerDb (this.orafine),
                                                                            this.risorsa_id, this.gruppo_id, "", "", "", this.commento, false,
                                                                            TipoEvento.EventoPeriodico, this.season_id, masterId));
            if ((r) && (r.ok))
            {
               if (esistente)
                  esito.aggiornati++;
               else
                  esito.creati++;
            }
            else
               registraErrore (r);
         }
         catch (e)
         {
            registraErrore ({ message: `${e}` });
         }
      }

      for (const ev of daTogliere)
      {
         avanza ();
         try
         {
            const chiave: string = utils.DataPerDb (ev.data);
            const r = ((altriNelGiorno.get (chiave) ?? 0) > 0)
               ? await firstValueFrom (this.eventoFiglioService.DeleteData (ev.id))
               : await firstValueFrom (this.eventoFiglioService.updateData (ev.id, chiave, "00:00", "00:00", 0, 0, "", "", "", "", false,
                                                                            TipoEvento.EventoVuoto, ev.season_id, 0));
            if ((r) && (r.ok))
               esito.tolti++;
            else
               registraErrore (r);
         }
         catch (e)
         {
            registraErrore ({ message: `${e}` });
         }
      }
      return esito;
   }


   async Salva()
   {
      // In sola lettura OK chiude senza salvare nulla
      if (this.soloLettura)
      {
         this.router.navigate ([this.ritorno]);
         return;
      }
      // Un secondo click mentre il salvataggio e' in corso creerebbe un secondo evento periodico completo
      if ((this.salvataggioInCorso) || (this.caricamento))
         return;
      this.salvataggioInCorso = true;
      this.progresso = "";
      this.cdr.detectChanges ();
      try
      {
         this.AggiornaRighe ();
         const errori: string = this.Valida ();
         if (errori != "")
         {
            await this.MostraEAttendi ({
               title:      'ATTENZIONE',
               subtitle:   'Dati incompleti o non validi',
               message:    errori,
               messtype:   'warning',
               btncaption: 'Chiudi'
            });
            return;
         }
         this.risorsa_id = (this.currRisorsa) ? this.currRisorsa.id : 0;
         this.gruppo_id = (this.currGruppo) ? this.currGruppo.id : 0;
         //
         if (!(await this.ConfermaSovrapposizioni ()))
            return;
         //
         let masterId: number = 0;
         this.progresso = "Salvataggio evento periodico...";
         this.cdr.detectChanges ();
         if (this.isAdd)
         {
            const response = await firstValueFrom (this.eventiService.addNewData (utils.DataPerDb (this.data!),
                                                                                  utils.DataPerDb (this.datafine!),
                                                                                  utils.OraPerDb (this.orainizio),
                                                                                  utils.OraPerDb (this.orafine),
                                                                                  this.risorsa_id,
                                                                                  this.gruppo_id,
                                                                                  this.commento,
                                                                                  this.season_id));
            if ((!response) || (!response.ok))
            {
               this.messageDialogService.showError ("Errore nell'inserimento dell'evento periodico", response?.message ?? 'No data returned');
               return;
            }
            // Il server restituisce l'id del nuovo evento periodico come primo elemento
            if ((response.elements) && (response.elements.length > 0))
               masterId = Number (response.elements[0]) || 0;
            if (masterId <= 0)
            {
               // L'evento periodico esiste ma senza date: si torna alla tabella per non crearne un secondo
               await this.MostraEAttendi ({
                  title:      'ERRORE',
                  subtitle:   'Date non create',
                  message:    "L'evento periodico è stato salvato, ma il server non ha restituito il suo identificativo, quindi le singole date <b>non</b> sono state create.\nAprire l'evento periodico dalla tabella e salvarlo di nuovo per generarle.",
                  messtype:   'error',
                  btncaption: 'Chiudi'
               });
               this.router.navigate ([this.ritorno]);
               return;
            }
            await this.logService.AddToLog (loggedUser, `Aggiunto Evento Periodico '${masterId}'`);
         }
         else
         {
            const response = await firstValueFrom (this.eventiService.updateData (this.id,
                                                                                   utils.DataPerDb (this.data!),
                                                                                   utils.DataPerDb (this.datafine!),
                                                                                   utils.OraPerDb (this.orainizio),
                                                                                   utils.OraPerDb (this.orafine),
                                                                                   this.risorsa_id,
                                                                                   this.gruppo_id,
                                                                                   this.commento,
                                                                                   this.season_id));
            if ((!response) || (!response.ok))
            {
               this.messageDialogService.showError ("Errore nell'aggiornamento dell'evento periodico", response?.message ?? 'No data returned');
               return;
            }
            masterId = this.id;
            await this.logService.AddToLog (loggedUser, `Modificato Evento Periodico '${masterId}' (${(this.ambito == 'tutte') ? 'tutte le date' : 'da oggi in poi'})`);
         }
         //
         const esito = await this.AllineaOccorrenze (masterId);
         if (esito.errori > 0)
         {
            await this.MostraEAttendi ({
               title:      'ATTENZIONE',
               subtitle:   'Alcune date non sono state aggiornate',
               message:    `Date create: <b>${esito.creati}</b>, aggiornate: <b>${esito.aggiornati}</b>, tolte: <b>${esito.tolti}</b>.\n` +
                           `Operazioni non riuscite: <b>${esito.errori}</b>\nUltimo errore: ${EscapeHtml (esito.ultimoErrore)}\n\n` +
                           `Le date che non è stato possibile creare risulteranno <b>escluse</b>: per aggiungerle, ` +
                           `riaprire l'evento periodico, includerle con un clic e salvare.`,
               messtype:   'warning',
               btncaption: 'Chiudi'
            });
         }
         this.router.navigate ([this.ritorno]);
      }
      catch (error: any)
      {
         this.messageDialogService.showError ("Errore durante il salvataggio dell'evento periodico", error);
      }
      finally
      {
         this.salvataggioInCorso = false;
         this.progresso = "";
         this.cdr.detectChanges ();
      }
   }


   async Annulla()
   {
      this.router.navigate ([this.ritorno]);
   }


   // Ora di fine = inizio + 1h30 (durata tipica di un allenamento)
   SetOraFine()
   {
      if (this.orainizio)
      {
         const newOraFine = new Date (this.orainizio);
         newOraFine.setHours (this.orainizio.getHours () + 1, this.orainizio.getMinutes () + 30, 0, 0);
         this.orafine = newOraFine;
         this.AggiornaRighe ();
      }
   }
}
