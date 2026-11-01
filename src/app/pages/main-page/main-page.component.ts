// angular
import {ChangeDetectorRef,
         Component,
         HostListener,
         NgZone,
         OnDestroy,
         OnInit,
         ViewChild} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {CommonModule} from '@angular/common';
import {Router} from "@angular/router";
import {firstValueFrom, lastValueFrom} from "rxjs";

// primeng
import {Table,
         TableModule} from 'primeng/table';
import {ButtonModule} from "primeng/button";
import {TooltipModule} from 'primeng/tooltip';
import {CardModule} from 'primeng/card';
import {DropdownModule} from "primeng/dropdown";
import {EventoElement,
         Gruppo,
         MessDlgData,
         Resource,
         SeasonElement,
         TipoEvento} from "../../models/datamod";
import {BlockUIModule} from "primeng/blockui";
import {ProgressSpinnerModule} from "primeng/progressspinner";
import {DividerModule} from 'primeng/divider';
import {CheckboxModule} from "primeng/checkbox";
import {DialogModule} from 'primeng/dialog';
import {DialogService,
         DynamicDialogModule,
         DynamicDialogRef} from 'primeng/dynamicdialog';
import {MessageService} from 'primeng/api';

// other
import {SeasonsService} from "../../services/seasons.service";
import {EventiService} from "../../services/eventi.service";
import {RisorseService} from "../../services/risorse.service";
import {MessageDialogService} from "../../services/message-dialog.service";
import {utils} from "../../common/utils";
import {MultiSelectModalComponent} from "../../dialogs/multi-select-modal/multi-select-modal.component";
import {GruppiService} from "../../services/gruppi.service";
import {loggedUser} from "../../services/users.service";
import { LogService } from "../../services/log.service";
import { globs } from "../../common/globals";
import {CalcolaSovrapposizioni,
        DescriviEvento,
        IdRisorseTrasferta,
        OccupaRisorsa} from "../../common/sovrapposizioni";



export interface CbTipoEvento
{
   id: number;
   nome: string;
}





// Formattatore date creato UNA sola volta: creare un Intl.DateTimeFormat e' molto costoso
// e veniva fatto per ogni riga della tabella ad ogni ciclo di change detection.
const FMT_DATA_BREVE: Intl.DateTimeFormat = new Intl.DateTimeFormat ('it-IT', {
   weekday: 'short',
   day:     '2-digit',
   month:   'short'
});

@Component ({
               selector:    'app-main-page',
               standalone:  true,
               imports: [
                  TableModule,
                  FormsModule,
                  CommonModule,
                  ButtonModule,
                  TooltipModule,
                  CardModule,
                  DropdownModule,
                  BlockUIModule,
                  ProgressSpinnerModule,
                  DividerModule,
                  CheckboxModule,
                  DialogModule,
                  DynamicDialogModule
               ],
               providers: [
                  DialogService, // Fornisci il servizio per DynamicDialog
                  MessageService // Opzionale, per i messaggi
               ],
               templateUrl: './main-page.component.html',
               styleUrl:    './main-page.component.css'
            })
export class MainPageComponent implements OnInit, OnDestroy
{
   /*
   isLoadingEv: boolean = false;
   isLoadingSea: boolean = false;
   */
   isLoadingData: number = 0;
   listaEventi: Array<EventoElement> = [];
   currEvent: EventoElement | null = null;
   listaStagioni: Array<SeasonElement> = [];
   //currSeason: SeasonElement | null = null;
   theLocalStorage: globs.TLocalStorage | null = null;
   theSessionStorage: globs.TSessionStorage | null = null;
   listaRisorse: Array<Resource> = [];
   listaGruppi: Array<Gruppo> = [];
   debug: number = 0;
   /*
   fltrGruppo: boolean = false;
   fltrGruppoItems: Array<Resource> | null = null;
   fltrGruppo: boolean = false;
   fltrGruppoItems: Array<Gruppo> | null = null;
   */
   fltrDlgRef: DynamicDialogRef | undefined;
   totRec: number = 0;
   listaTipoEvento: Array<CbTipoEvento> = [];
   //currTipoEvento: CbTipoEvento | null = null;
   windowHeight: number = 110;
   scrollHeight: string = "110px";
   timerId: any;
   // Solo su iOS: la tendina delle combo (p-dropdown) ignora gli eventi di scroll.
   // Su iPhone il tocco provoca uno scroll che PrimeNG interpreta come "chiudi",
   // quindi la tendina si apriva e si richiudeva subito. Sugli altri dispositivi
   // resta undefined, cioe' il comportamento standard di PrimeNG.
   comboOverlayOptions: any = utils.IsIOS ()
                              ? { listener: (event: Event, opts: { type: string, valid: boolean }) => (opts.type === 'scroll') ? false : opts.valid }
                              : undefined;
   resizeDebounceTimer: any;
   @ViewChild('eventsTable') pTable: Table | undefined;
   // Eventi che si sovrappongono ad altri nella stessa palestra: id evento -> testo del tooltip
   sovrapposizioni: Map<number, string> = new Map<number, string> ();
   // Serve a scartare il risultato di un calcolo superato da un caricamento piu' recente
   private sovrapposizioniReqId: number = 0;


   constructor (public router: Router,
                private seasonServ: SeasonsService,
                private eventServ: EventiService,
                private resourceService: RisorseService,
                private gruppiService: GruppiService,
                private cdr: ChangeDetectorRef,
                private messageDialogService: MessageDialogService,
                private zone: NgZone,
                public fltrDialogService: DialogService,
                public fltrMessageService: MessageService,
                private logService: LogService)
   {
      this.currEvent = null;
      //
      this.listaTipoEvento = [];
      this.listaTipoEvento.push({ id: 1, nome: "Solo Eventi classici" });
      this.listaTipoEvento.push({ id: 3, nome: "Solo Eventi periodici" });
      this.listaTipoEvento.push({ id: -1, nome: "Tutti i tipi" });
   }


   async ngOnInit()
   {
      try
      {
         this.theLocalStorage = new globs.TLocalStorage();
         await this.theLocalStorage.Load();
         this.theSessionStorage = new globs.TSessionStorage();
         await this.theSessionStorage.Load();
         //
         await this.GetWindowSize();
         //
         /*
         const tmpTipo: CbTipoEvento | null = utils.GetFromLocalStorage<CbTipoEvento> ("RS_CurrTipoEvento");
         if (tmpTipo != null)
         {
            this.currTipoEvento = this.listaTipoEvento.find (tipo => tipo.id == tmpTipo.id) || null;
            this.cdr.detectChanges();
         }
         */
         //
         await this.SetLoading(99);
         await this.LoadFilters();
         //
         await this.LoadSeasons();
         //
         /*
         const tmpSeason: SeasonElement | null = utils.GetFromLocalStorage<SeasonElement> ("RS_CurrSeason");
         if (tmpSeason != null)
         {
            this.currSeason = this.listaStagioni.find (season => season.id === tmpSeason.id) || null;
         }
         */
         this.theLocalStorage.data.currSeason = this.listaStagioni.find (season => season.id === this.theLocalStorage?.data.currSeason.id) || null;
         this.theLocalStorage.data.currTipoEvento = this.listaTipoEvento.find (event => event.id === this.theLocalStorage?.data.currTipoEvento.id) || null;
         if (this.theLocalStorage.data.currTipoEvento == null)
            this.theLocalStorage.data.currTipoEvento = this.listaTipoEvento[0];
         //
         //this.isLoadingEv = true;
         await this.LoadEvents();
      }
      catch (e)
      {

      }
      finally
      {
         //this.isLoadingSea = false;
         //this.isLoadingEv = false;
         await this.SetLoading(0);
         this.cdr.detectChanges();
      }
   }


   async ngOnDestroy()
   {
      if (this.fltrDlgRef)
      {
         this.fltrDlgRef.destroy();
      }
      if (this.resizeDebounceTimer)
      {
         clearTimeout(this.resizeDebounceTimer);
      }
   }


   async SetLoading (value: number)
   {
      console.info(`Loading: ${value}`);
      this.isLoadingData = value;
   }


   CheckLoading(): boolean
   {
      //return ((this.isLoadingEv) || (this.isLoadingSea));
      return (this.isLoadingData != 0);
   }


   async LoadSeasons()
   {
      try
      {
         //this.isLoadingSea = true;
         const dataSeas = await firstValueFrom(this.seasonServ.getAllData());
         if ((dataSeas) && (dataSeas.ok))
            this.listaStagioni = dataSeas.elements;
      }
      catch (err)
      {

      }
      finally
      {
         //this.isLoadingSea = false;
         this.cdr.detectChanges ();
      }
   }

   async LoadEvents()
   {
      try
      {
         //this.isLoadingEv = true;
         await this.SetLoading (2);
         this.totRec = 0;
         let seasonId: number | null = null;
         if ((this.theLocalStorage) && (this.theLocalStorage.data) && (this.theLocalStorage.data.currSeason))
            seasonId = this.theLocalStorage.data.currSeason.id;
         let tipoEvnt: number | null = null;
         let risorsaid: Array<number> | null = null;
         let gruppoId: Array<number> | null = null;
         let giorno: Date | null = null;
         let masterId: number | null = null;
         if (this.theSessionStorage)
         {
            if (this.theSessionStorage.data.fltrRisorsaItems.length > 0)
            {
               risorsaid = [];
               for (let i = 0; i < this.theSessionStorage.data.fltrRisorsaItems.length; i++)
                  risorsaid.push (this.theSessionStorage.data.fltrRisorsaItems[i].id);
            }
         }
         if (this.theSessionStorage)
         {
            if (this.theSessionStorage.data.fltrGruppoItems.length > 0)
            {
               gruppoId = [];
               for (let i = 0; i < this.theSessionStorage.data.fltrGruppoItems.length; i++)
                  gruppoId.push (this.theSessionStorage.data.fltrGruppoItems[i].id);
            }
         }
         tipoEvnt = -1;
         if ((this.theLocalStorage) && (this.theLocalStorage.data) && (this.theLocalStorage.data.currTipoEvento))
         {
            if (this.theLocalStorage?.data.currTipoEvento == this.listaTipoEvento[0])
               tipoEvnt = TipoEvento.EventoNormale;
            if (this.theLocalStorage?.data.currTipoEvento == this.listaTipoEvento[1])
               tipoEvnt = TipoEvento.EventoPeriodico;
         }
         let dataEvnt: any;
         dataEvnt = await firstValueFrom(this.eventServ.getAllData (seasonId, tipoEvnt, risorsaid, gruppoId, giorno, masterId));
         if (dataEvnt)
         {
            if (dataEvnt.ok)
            {
               this.listaEventi = dataEvnt.elements;
               this.totRec = this.listaEventi.length;
               // Non si attende: la tabella compare subito, le evidenziazioni arrivano appena pronte
               this.AggiornaSovrapposizioni (seasonId, tipoEvnt, (gruppoId != null));
               const prevSelected = utils.GetFromSessionStorage("RS_Editing_Event_Id");
               utils.removeFromSessionStorage("RS_Editing_Event_Id");
               if (prevSelected != null)
               {
                  this.SelectAndScrollToEvent(Number(prevSelected));
               }
            }
            else
            {
               const dlgData: MessDlgData = {
                  title:      'ERRORE',
                  subtitle:   'Errore durante il caricamento degli eventi dal server',
                  message:    `${dataEvnt.message}`,
                  messtype:   'error',
                  btncaption: 'Chiudi'
               };
               this.messageDialogService.showMessage (dlgData, '600px');
            }
         }
         else
         {
            const dlgData: MessDlgData = {
               title:      'ERRORE',
               subtitle:   'Errore durante il caricamento degli eventi dal server',
               message:    `No data returned`,
               messtype:   'error',
               btncaption: 'Chiudi'
            };
            this.messageDialogService.showMessage (dlgData, '600px');
         }
      }
      catch (err)
      {
         await this.logService.AddToLog (loggedUser, `Exception [LoadEvents]: '${JSON.stringify(err,null,-1)}'`);
         const dlgData: MessDlgData = {
            title:      'Exception',
            subtitle:   'Errore',
            message:    `${JSON.stringify(err,null,3)}`,
            messtype:   'error',
            btncaption: 'Chiudi'
         };
         this.messageDialogService.showMessage (dlgData, '600px');
      }
      finally
      {
         //this.isLoadingEv = false;
         await this.SetLoading(0);
         this.cdr.detectChanges ();
      }
   }


   /*
      Calcola quali eventi della lista si sovrappongono ad altri nella stessa palestra.
      La lista visibile puo' essere filtrata (per gruppo o per tipo evento): in quel caso
      gli eventi nascosti, ad esempio di altri gruppi o extra, non ci sono. Per non perdere
      conflitti con loro si caricano a parte TUTTI gli eventi della stagione per le palestre visibili.
   */
   async AggiornaSovrapposizioni (seasonId: number | null,
                                  tipoEvnt: number | null,
                                  filtroGruppi: boolean)
   {
      const reqId: number = ++this.sovrapposizioniReqId;
      let tutti: Array<EventoElement> = this.listaEventi;
      // Le trasferte non occupano palestre nostre: vanno escluse dal controllo
      const trasferte: Set<number> = IdRisorseTrasferta (this.listaRisorse);
      try
      {
         // Senza filtro per gruppo e con tutti i tipi evento la lista visibile e' gia' completa
         if ((filtroGruppi) || (tipoEvnt != -1))
         {
            const risorse: Array<number> = [...new Set (this.listaEventi.filter (ev => OccupaRisorsa (ev, trasferte)).map (ev => ev.risorsa_id))];
            if (risorse.length == 0)
            {
               tutti = [];
            }
            else
            {
               const resp = await firstValueFrom (this.eventServ.getAllData (seasonId, -1, risorse, null, null, null));
               if ((!resp) || (!resp.ok))
               {
                  console.warn (`Sovrapposizioni non calcolate: ${resp?.message}`);
                  tutti = [];
               }
               else
                  tutti = resp.elements;
            }
         }
         if (reqId != this.sovrapposizioniReqId)
            return;
         const info = new Map<number, string> ();
         for (const [id, altri] of CalcolaSovrapposizioni (tutti, trasferte))
            info.set (id, `Sovrapposto con:\n${altri.map (ev => DescriviEvento (ev)).join ('\n')}`);
         this.sovrapposizioni = info;
      }
      catch (err)
      {
         console.error ("AggiornaSovrapposizioni:", err);
         if (reqId == this.sovrapposizioniReqId)
            this.sovrapposizioni = new Map<number, string> ();
      }
      this.cdr.detectChanges ();
   }


   async LoadFilters()
   {
      try
      {
         const dataRis = await firstValueFrom (this.resourceService.getAllData ());
         if ((dataRis) && (dataRis.ok))
            this.listaRisorse = dataRis.elements;
         //
         const dataGrp = await firstValueFrom (this.gruppiService.getAllData ());
         if ((dataGrp) && (dataGrp.ok))
            this.listaGruppi = dataGrp.elements;
      }
      catch(err)
      {}
   }


   AddEnabled (): boolean
   {
      return (loggedUser.attributo > 0);
   }


   EditEnabled (): boolean
   {
      return (loggedUser.attributo > 0);
   }


   DeleteEnabled (): boolean
   {
      return (loggedUser.attributo > 1);
   }


   GetRowColorClass (evento: EventoElement): string
   {
      const wDay = evento.data.getDay ();

      switch (wDay)
      {
         case 1:
            return "row-lun";
         case 2:
            return "row-mar";
         case 3:
            return "row-mer";
         case 4:
            return "row-gio";
         case 5:
            return "row-ven";
         case 6:
            return "row-sab";
         case 0:
            return "row-dom";
         default:
            return "row-lun";
      }
   }


   async OnAdd ()
   {
      let yyyy: number;
      let mmmm: number;
      let dddd: number;

      if (this.currEvent == null)
      {
         const dlgData: MessDlgData = {
            title:      'ATTENZIONE',
            subtitle:   'Nuovo evento',
            message:    `Non è stato selezionato alcun giorno`,
            messtype:   'warning',
            btncaption: 'Chiudi'
         };
         this.messageDialogService.showMessage (dlgData, '600px');
      }
      else
      {
         yyyy = this.currEvent.data.getFullYear();
         mmmm = this.currEvent.data.getMonth() + 1;
         dddd = this.currEvent.data.getDate();
         let listaGiorno: Array<EventoElement> = [];
         listaGiorno = this.EventiDelGiorno (this.currEvent.data);
         // controllo se nell'elenco degli eventi del giorno esiste almeno un evento con tipo 1
         //  se esiste, allora devo fare un vero add
         //  altrimenti devo cercare quello con tipo zero e fare update in quello
         let isAdd: boolean = false;
         let _id: number = 0;
         let rqst: string = "add";
         let si: number = 0;
         if (this.theLocalStorage?.data.currSeason)
            si = this.theLocalStorage?.data.currSeason.id;
         for (let i=0;   i<listaGiorno.length;   i++)
         {
            if (listaGiorno[i].tipoevento == 1)
               isAdd = true;
         }
         // cerco l'evento vuoto del giorno e prendo il suo id
         if (isAdd == false)
         {
            for (let i=0;   i<listaGiorno.length;   i++)
            {
               if (listaGiorno[i].tipoevento == 0)
                  _id = listaGiorno[i].id;
            }
         }
         console.log ('Nuovo evento:');
         this.router.navigate ([`/eventoedit`], {state: {
               id: _id,
               request: rqst,
               isadd: isAdd,
               year: yyyy,
               month: mmmm,
               day: dddd,
               season_id: si}});
      }
   }


   OnEdit (): void
   {
      let yyyy: number;
      let mmmm: number;
      let dddd: number;

      if (this.currEvent == null)
      {
         const dlgData: MessDlgData = {
            title:      'ATTENZIONE',
            subtitle:   'Modifica evento',
            message:    `Non è stato selezionato alcun evento`,
            messtype:   'warning',
            btncaption: 'Chiudi'
         };
         this.messageDialogService.showMessage (dlgData, '600px');
      }
      else
      {
         yyyy = this.currEvent.data.getFullYear();
         mmmm = this.currEvent.data.getMonth() + 1;
         dddd = this.currEvent.data.getDate();
         let isAdd: boolean = false;
         let _id: number = 0;
         let rqst: string = "";
         let si: number = 0;
         if (this.theLocalStorage?.data.currSeason)
            si = this.theLocalStorage?.data.currSeason.id;
         if (this.currEvent.tipoevento == 0)
         {
            // è un evento vuoto
            isAdd = false;
            _id = this.currEvent.id;
            rqst =  "add";
         }
         else
         {
            isAdd = false;
            _id = this.currEvent.id;
            rqst =  "edit";
         }
         this.router.navigate ([`/eventoedit`], {state: {
               id: _id,
               request: rqst,
               isadd: isAdd,
               year: yyyy,
               month: mmmm,
               day: dddd,
               season_id: si}});
      }
   }


   OnDelete (): void
   {
      if (this.currEvent == null)
      {
         const dlgData: MessDlgData = {
            title:      'ATTENZIONE',
            subtitle:   'Cancellazione evento',
            message:    `Non è stato selezionato alcun evento`,
            messtype:   'warning',
            btncaption: 'Chiudi'
         };
         this.messageDialogService.showMessage (dlgData, '600px');
      }
      else
      {
         const dlgData: MessDlgData = {
            title:               'Cancellazione Evento',
            subtitle:            '',
            message:             `Sei veramente sicuro di voloer cancellare l'evento '<b>${this.FormattaData(this.currEvent.data)} : ${this.FormattaOrario(this.currEvent.orainizio)}</b>' dal database?`,
            messtype:            'warning',
            btncaption:          'Annulla',
            showCancelButton:    true,
            cancelButtonCaption: 'Sì, procedi'
         };

         this.messageDialogService.showMessage (dlgData, '', true).subscribe (result =>
                                                                              {
                                                                                 if (result === 'secondary')
                                                                                 {
                                                                                    this.DeleteSelected();
                                                                                 }
                                                                              });
      }
   }


   OnRowSelected (evento: any)
   {
      if (this.currEvent != null)
         utils.SaveToSessionStorage ("RS_Editing_Event_Id", this.currEvent.id);
   }


   OnRowUnselected (evento: any)
   {
      utils.removeFromSessionStorage("RS_Editing_Event_Id");
   }


   GetFormattedDate(evento: any, rowIndex: number): string
   {
      // Se è la prima riga, visualizza sempre la data
      if (rowIndex === 0)
      {
         return this.FormattaData(evento.data);
      }

      // Recupera la data dell'evento precedente e confronta giorno/mese/anno
      // (confronto numerico: evita di formattare due stringhe per ogni riga)
      const previousEvent = this.listaEventi[rowIndex - 1];
      const prev = new Date (previousEvent.data);
      const curr = new Date (evento.data);
      if ((prev.getFullYear() == curr.getFullYear()) &&
          (prev.getMonth() == curr.getMonth()) &&
          (prev.getDate() == curr.getDate()))
         return '';
      return this.FormattaData(evento.data);
   }


   FormattaData (data: Date | string): string
   {
      try
      {
         const d = new Date (data);

         return FMT_DATA_BREVE.format (d);
      }
      catch (e)
      {
         return "DATE ERROR";
      }
   }


   FormattaOrario (date: Date): string
   {
      try
      {
         const hours = date.getHours ().toString ().padStart (2, '0');
         const minutes = date.getMinutes ().toString ().padStart (2, '0');
         if ((hours == "00") && (minutes == "00"))
            return "";
         else
            return `${hours}:${minutes}`;
      }
      catch (e)
      {
         return "TIME ERROR";
      }
   }


   ColoreRisorsa (evento: EventoElement): any
   {
      try
      {
         if ((evento) && (evento.risorsatxt != "") && (evento.risorsabck != ""))
            return {'background-color': `${evento.risorsabck}`, 'color': `${evento.risorsatxt}`};
         else
            return {};
      }
      catch (e)
      {
         return {};
      }
   }


   ColoreGruppo (evento: EventoElement): any
   {
      try
      {
         if ((evento) && (evento.gruppotxt != "") && (evento.gruppobck != ""))
            return {'background-color': `${evento.gruppobck}`, 'color': `${evento.gruppotxt}`};
         else
            return {};
      }
      catch (e)
      {
         return {};
      }
   }

   ColoreTipoEvento (evento: EventoElement): any
   {
      const colore = "#646464";
      try
      {
         if ((evento) && (evento.tipoevento == TipoEvento.EventoPeriodico))
            return {'background-color': `${colore}`};
         else
            return {};
      }
      catch (e)
      {
         return {};
      }
   }


   OnSeasonChange(evento: any)
   {
      //utils.SaveToLocalStorage("RS_CurrSeason", this.currSeason);
      this.theLocalStorage?.Save();
      this.logService.AddToLog (loggedUser, `Eventi: selezionata stagione '${this.theLocalStorage?.data.currSeason?.nome}'`);
      this.RefreshData();
   }


   OnTipoEventoChange(evento: any)
   {
      //utils.SaveToLocalStorage("RS_CurrTipoEvento", this.currTipoEvento);
      this.theLocalStorage?.Save();
      this.RefreshData();
   }


   CreaEventiStagione()
   {
      if (this.theLocalStorage?.data.currSeason != null)
      {
         const dlgData: MessDlgData = {
            title:               'Creazione Eventi Stagione',
            subtitle:            '',
            message:             `Sei sicuro di voloer aggiungere gli eventi vuoti per la stagione\n'<b>${this.theLocalStorage?.data.currSeason?.nome}</b>'\nnel database?</b>`,
            messtype:            'warning',
            btncaption:          'Annulla',
            showCancelButton:    true,
            cancelButtonCaption: 'Sì, procedi'
         };

         this.messageDialogService.showMessage (dlgData, '', true).subscribe (async result =>
                                                                              {
                                                                                 if (result === 'secondary')
                                                                                 {
                                                                                    if (this.theLocalStorage?.data.currSeason != null)
                                                                                    {
                                                                                       let goOn: boolean = false;
                                                                                       let strData: string;
                                                                                       let currDay: Date = new Date (this.theLocalStorage?.data.currSeason.datainizio);
                                                                                       let dayToStop: Date = new Date (this.theLocalStorage?.data.currSeason.datafine);
                                                                                       let esisteGia: boolean = false;
                                                                                       dayToStop.setDate (dayToStop.getDate () + 1);
                                                                                       currDay.setHours(0,0,0,0);
                                                                                       dayToStop.setHours(0,0,0,0);
                                                                                       while (currDay.getTime () < dayToStop.getTime ())
                                                                                       {
                                                                                          esisteGia = false;
                                                                                          currDay.setHours (0, 0, 0, 0);
                                                                                          strData = `${currDay.getFullYear()}-${currDay.getMonth()+1}-${currDay.getDate()}`;
                                                                                          for (let ggg=0;   ggg<this.listaEventi.length;   ggg++)
                                                                                          {
                                                                                             if (strData == `${this.listaEventi[ggg].data.getFullYear()}-${this.listaEventi[ggg].data.getMonth()+1}-${this.listaEventi[ggg].data.getDate()}`)
                                                                                             {
                                                                                                esisteGia = true;
                                                                                                break;
                                                                                             }
                                                                                          }
                                                                                          if (esisteGia == false)
                                                                                          {
                                                                                             goOn = false;
                                                                                             this.eventServ.addNewData (strData,
                                                                                                                        "00:00",
                                                                                                                        "00:00",
                                                                                                                        0,
                                                                                                                        0,
                                                                                                                        "",
                                                                                                                        "",
                                                                                                                        "",
                                                                                                                        "",
                                                                                                                        false,
                                                                                                                        TipoEvento.EventoVuoto,
                                                                                                                        this.theLocalStorage?.data.currSeason.id,
                                                                                                                        0).subscribe (data =>
                                                                                                                                                       {
                                                                                                                                                          goOn = true;
                                                                                                                                                       });
                                                                                             //
                                                                                             while (goOn == false)
                                                                                                await utils.Dlt_Sleep (10);
                                                                                          }
                                                                                          currDay.setDate(currDay.getDate() + 1);
                                                                                       }
                                                                                    }
                                                                                    this.cdr.detectChanges ();
                                                                                    this.RefreshData();
                                                                                 }
                                                                                 /*
                                                                                 else if (result === 'primary')
                                                                                 {
                                                                                    console.log ('L\'utente ha premuto "No, annulla"');
                                                                                    // Annulla l'azione
                                                                                 }
                                                                                 else
                                                                                 {
                                                                                    console.log ('Il dialogo è stato chiuso (es. con X o ESC) o non è stato selezionato un bottone specifico:', result);
                                                                                 }
                                                                                 */
                                                                              });
      }
   }


   async SelectAndScrollToEvent(idToSelect: number)
   {
      let rowToSelect: EventoElement | null = null;
      let selectedIndex: number = -1;
      for (let i=0;   i<this.listaEventi.length;   i++)
      {
         if (this.listaEventi[i].id == idToSelect)
         {
            rowToSelect = this.listaEventi[i];
            selectedIndex = i;
            break;
         }
      }

      this.debug++;
      if (rowToSelect)
      {
         //await utils.Dlt_Sleep(5000);
         let rts: number = 0;
         let rpp: number = 20;
         let scr1: number = selectedIndex-rpp;
         if (scr1 > 0)
            rts = scr1 + (rpp/2);
         if (this.pTable)
         {
            console.log(`GoTo line ${rts}`)
            // Lasciare le due righe che seguono: sia la chiamata diretta che quella con timeout
            this.pTable.scrollTo ({'top': 25 * rts});
            setTimeout (() => {
               if (this.pTable)
                  this.pTable.scrollTo ({'top': 25 * rts});
            }, 0);
         }
         this.currEvent = rowToSelect;
      }
      else
      {
         console.warn(`Riga con ID ${idToSelect} non trovata.`);
      }
   }


   EventiDelGiorno (aDay: Date): Array<EventoElement>
   {
      let result: Array<EventoElement> = [];
      try
      {
         for (let iii=0;   iii<this.listaEventi.length;   iii++)
         {
            if ((this.listaEventi[iii].data.getFullYear() == aDay.getFullYear()) &&
                (this.listaEventi[iii].data.getMonth() == aDay.getMonth()) &&
                (this.listaEventi[iii].data.getDate() == aDay.getDate()))
            {
               result.push(this.listaEventi[iii]);
            }
         }
      }
      catch (e)
      {
         result = [];
      }
      return result;;
   }


   async DeleteSelected()
   {
      if (this.currEvent)
      {
         try
         {
            let listaGiorno: Array<EventoElement> = [];
            listaGiorno = this.EventiDelGiorno (this.currEvent.data);
            if (listaGiorno.length > 1)
            {
               // c'è più di un evento per il giorno selezionato:
               //  cancello l'evento
               //this.isLoadingEv = true;
               await this.SetLoading(4);
               const response = await firstValueFrom (this.eventServ.DeleteData(this.currEvent.id));

               if (response.ok)
               {
                  await this.logService.AddToLog (loggedUser, `Cancellato Evento '${this.currEvent.id}'`);
                  this.RefreshData();
                  this.cdr.detectChanges ();
               }
               else
               {
                  const dlgData: MessDlgData = {
                     title:      'ERRORE',
                     subtitle:   "Errore nella cancellazione dei dati",
                     message:    `${response.message}`,
                     messtype:   'error',
                     btncaption: 'Chiudi'
                  };
                  this.messageDialogService.showMessage (dlgData, '600px');
               }
            }
            else
            {
               // c'è solo un evento nel giorno selezionato
               //  azzero l'evento senza cancellare il record
               //this.isLoadingEv = true;
               await this.SetLoading(5);
               const response = await firstValueFrom (this.eventServ.updateData (this.currEvent.id,
                                                                                 (this.currEvent.data) ? this.currEvent.data.toLocaleDateString ('ja-JP') : "",
                                                                                 `00:00`,
                                                                                 `00:00`,
                                                                                 0,
                                                                                 0,
                                                                                 "",
                                                                                 "",
                                                                                 "",
                                                                                 "",
                                                                                 false,
                                                                                 TipoEvento.EventoVuoto,
                                                                                 this.currEvent.season_id,
                                                                                 this.currEvent.master_id));

               if (response.ok)
               {
                  //await this.LoadEvents();
                  await this.RefreshData();
                  this.cdr.detectChanges ();
               }
               else
               {
                  const dlgData: MessDlgData = {
                     title:      'ERRORE',
                     subtitle:   "Errore nell'aggiornamento dei dati",
                     message:    `${response.message}`,
                     messtype:   'error',
                     btncaption: 'Chiudi'
                  };
                  this.messageDialogService.showMessage (dlgData, '600px');
               }
            }
         }
         catch(e)
         {

         }
         finally
         {
            //this.isLoadingEv = false;
            await this.SetLoading(0);
         }
      }
   }


   OnFilterRisorsa()
   {
      if (this.theSessionStorage)
      {
         if (this.theSessionStorage.data.fltrRisorsaItems.length > 0)
            this.theSessionStorage.data.fltrRisorsa = true;
         else
            this.theSessionStorage.data.fltrRisorsa = false;
      }
      try
      {
         if (this.theSessionStorage)
         {
            this.fltrDlgRef = this.fltrDialogService.open (MultiSelectModalComponent, {
               //header: 'Filtro Risorse',
               width:      '600px',
               height:     '750px',
               position:   'topleft',
               styleClass: 'custom-dlg-class',
               data:       {
                  options:            this.listaRisorse,
                  preSelectedOptions: (this.theSessionStorage)?this.theSessionStorage.data.fltrRisorsaItems:[],
                  customTitle:        'Filtro per Risorse'
               }
            });
            //
            this.fltrDlgRef.onClose.subscribe ((result: { action: string, selectedOptions: any[] | null } | null) =>
                                               {
                                                  // Controlla se 'result' non è null (cioè la modale non è stata chiusa con la 'x' o ESC senza passare valori)
                                                  try
                                                  {
                                                     if (result)
                                                     {
                                                        if (result.action === 'ok' && result.selectedOptions)
                                                        {
                                                           // Se l'utente ha premuto OK e ci sono opzioni selezionate
                                                           if ((this.theSessionStorage) && (this.theSessionStorage.data))
                                                           {
                                                              this.theSessionStorage.data.fltrRisorsaItems = result.selectedOptions;
                                                              console.log ('Opzioni selezionate (OK):', this.theSessionStorage.data.fltrRisorsaItems);
                                                           }
                                                           this.fltrMessageService.add ({severity:  'success',
                                                                                           summary: 'Confermato',
                                                                                           detail:  'Selezione salvata!'
                                                                                        });
                                                        }
                                                        else if (result.action === 'cancel')
                                                        {
                                                           // Se l'utente ha premuto Annulla
                                                           console.log ('Modale annullata. Mantenute le selezioni precedenti.');
                                                           this.fltrMessageService.add ({severity:  'warn',
                                                                                           summary: 'Annullato',
                                                                                           detail:  'Selezione precedente mantenuta.'
                                                                                        });
                                                           // Non facciamo nulla con this.selectedItemsFromModal, così conserva il suo stato precedente
                                                        }
                                                     }
                                                     else
                                                     {
                                                        // Questo caso si verifica se la modale è stata chiusa senza un'azione esplicita (es. clic su 'x' o tasto ESC)
                                                        console.log ('Modale chiusa senza azione specifica (es. X o ESC). Mantenute le selezioni precedenti.');
                                                        this.fltrMessageService.add ({severity:  'info',
                                                                                        summary: 'Chiusa',
                                                                                        detail:  'Nessuna modifica alla selezione.'
                                                                                     });
                                                     }
                                                  }
                                                  catch (e)
                                                  {

                                                  }
                                                  finally
                                                  {
                                                     if (this.theSessionStorage)
                                                     {
                                                        if (this.theSessionStorage.data.fltrRisorsaItems.length > 0)
                                                           this.theSessionStorage.data.fltrRisorsa = true;
                                                        else
                                                           this.theSessionStorage.data.fltrRisorsa = false;
                                                     }
                                                     this.theSessionStorage?.Save();
                                                     this.cdr.detectChanges ();
                                                     this.RefreshData ();
                                                  }
                                               });
         }
      }
      catch (e)
      {

      }
      finally
      {
         this.theSessionStorage?.Save();
      }
   }


   async OnFilterGruppo()
   {
      if (this.theSessionStorage)
      {
         if (this.theSessionStorage.data.fltrGruppoItems.length > 0)
            this.theSessionStorage.data.fltrGruppo = true;
         else
            this.theSessionStorage.data.fltrGruppo = false;
      }
      try
      {
         this.fltrDlgRef = this.fltrDialogService.open(MultiSelectModalComponent, {
            //header: 'Filtro Gruppi',
            width: '600px',
            height: '650px',
            position: 'topleft',
            styleClass: 'custom-dlg-class',
            data: {
               options: this.listaGruppi,
               preSelectedOptions: (this.theSessionStorage)?this.theSessionStorage.data.fltrGruppoItems:[],
               customTitle: 'Filtro per Gruppi'
            }
         });
         //
         this.fltrDlgRef.onClose.subscribe((result: { action: string, selectedOptions: any[] | null } | null) => {
            // Controlla se 'result' non è null (cioè la modale non è stata chiusa con la 'x' o ESC senza passare valori)
            try
            {
               if (result)
               {
                  if (result.action === 'ok' && result.selectedOptions)
                  {
                     // Se l'utente ha premuto OK e ci sono opzioni selezionate
                     if ((this.theSessionStorage) && (this.theSessionStorage.data))
                     {
                        this.theSessionStorage.data.fltrGruppoItems = result.selectedOptions;
                        console.log ('Opzioni selezionate (OK):', this.theSessionStorage.data.fltrGruppoItems);
                     }
                     this.fltrMessageService.add({severity:'success', summary:'Confermato', detail:'Selezione salvata!'});
                  }
                  else if (result.action === 'cancel')
                  {
                     // Se l'utente ha premuto Annulla
                     console.log('Modale annullata. Mantenute le selezioni precedenti.');
                     this.fltrMessageService.add({severity:'warn', summary:'Annullato', detail:'Selezione precedente mantenuta.'});
                     // Non facciamo nulla con this.selectedItemsFromModal, così conserva il suo stato precedente
                  }
               }
               else
               {
                  // Questo caso si verifica se la modale è stata chiusa senza un'azione esplicita (es. clic su 'x' o tasto ESC)
                  console.log('Modale chiusa senza azione specifica (es. X o ESC). Mantenute le selezioni precedenti.');
                  this.fltrMessageService.add({severity:'info', summary:'Chiusa', detail:'Nessuna modifica alla selezione.'});
               }
            }
            catch (e)
            {

            }
            finally
            {
               if (this.theSessionStorage)
               {
                  if (this.theSessionStorage.data.fltrGruppoItems.length > 0)
                     this.theSessionStorage.data.fltrGruppo = true;
                  else
                     this.theSessionStorage.data.fltrGruppo = false;
               }
               this.theSessionStorage?.Save();
               this.cdr.detectChanges ();
               this.RefreshData();
               this.cdr.detectChanges ();
            }
         });
      }
      catch (e)
      {

      }
      finally
      {
         //this.theSessionStorage?.Save();
      }
   }


   async GetWindowSize()
   {
      this.windowHeight = window.innerHeight;
      let sh: number = this.windowHeight - 110 - 90 - 180;
      if (sh < 110)
         sh = 110;
      this.scrollHeight = `${sh}px`;
   }


   @HostListener('window:resize', ['$event'])
   onResize(event: any)
   {
      // Su iOS Safari la barra degli indirizzi si nasconde/mostra durante lo
      // scroll, generando molti eventi 'resize' ravvicinati con innerHeight
      // diverso: senza debounce la tabella ricalcola l'altezza in continuazione
      // e "salta" visivamente. Il debounce riduce il ricalcolo a fine attivita'.
      if (this.resizeDebounceTimer)
         clearTimeout(this.resizeDebounceTimer);
      this.resizeDebounceTimer = setTimeout(async () =>
      {
         await this.GetWindowSize();
         this.cdr.detectChanges();
      }, 250);
   }


   async RefreshData()
   {
      //await this.LoadFilters();
      // Ricarica solo gli eventi: il vecchio window.location.reload() rifaceva
      // TUTTE le chiamate al server (filtri, stagioni, eventi) dopo averle gia' fatte,
      // raddoppiando le richieste e il rischio di restare bloccati con lo spinner.
      await this.LoadEvents();
      this.cdr.detectChanges ();
   }


   FiltroRisorseOn(): boolean
   {
      let result: boolean = false;
      try
      {
         if ((this.theSessionStorage) && (this.theSessionStorage.data) && (this.theSessionStorage.data.fltrRisorsaItems.length > 0))
            result = true;
      }
      catch(e)
      {
         result = false;
      }
      return result;
   }


   FiltroGruppiOn(): boolean
   {
      let result: boolean = false;
      try
      {
         if ((this.theSessionStorage) && (this.theSessionStorage.data) && (this.theSessionStorage.data.fltrGruppoItems.length > 0))
            result = true;
      }
      catch(e)
      {
         result = false;
      }
      return result;
   }

}
