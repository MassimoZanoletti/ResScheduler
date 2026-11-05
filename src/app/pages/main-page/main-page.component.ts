// angular
import {AfterViewInit,
         ChangeDetectorRef,
         Component,
         ElementRef,
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
import {ToastModule} from 'primeng/toast';

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
import {ScegliStagione} from "../../common/stagioni";
import {CalcolaSovrapposizioni,
        DescriviEvento,
        EscapeHtml,
        StessoGiorno,
        IdRisorseTrasferta,
        OccupaRisorsa} from "../../common/sovrapposizioni";



export interface CbTipoEvento
{
   id: number;
   nome: string;
}


/*
   Valori mostrati in una riga della tabella eventi, calcolati UNA volta al caricamento.
   Prima il template chiamava 6-8 metodi per ogni riga a ogni ciclo di change detection.
*/
export interface VistaEvento
{
   classe: string;         // colore della riga in base al giorno della settimana
   data: string;           // vuota se la riga e' dello stesso giorno della precedente
   ora: string;
   fine: string;
   stileRisorsa: object;
   stileGruppo: object;
   stileTipo: object;
}


export interface RigaEvento extends EventoElement
{
   vista: VistaEvento;
}





// Formattatore date creato UNA sola volta: creare un Intl.DateTimeFormat e' molto costoso
// e veniva fatto per ogni riga della tabella ad ogni ciclo di change detection.
const FMT_DATA_BREVE: Intl.DateTimeFormat = new Intl.DateTimeFormat ('it-IT', {
   weekday: 'short',
   day:     '2-digit',
   month:   'short'
});

// Chiave del toast che mostra i dettagli delle sovrapposizioni (stessa usata nel template: key="sovrapposizioni")
const TOAST_SOVRAPPOSIZIONI: string = 'sovrapposizioni';

// Chiavi in sessionStorage: evento selezionato e posizione della tabella (cancellate al logout)
export const CHIAVE_EVENTO_SELEZIONATO: string = "RS_Editing_Event_Id";
export const CHIAVE_POSIZIONE_EVENTI: string = "RS_Eventi_Scroll";

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
                  DynamicDialogModule,
                  ToastModule
               ],
               providers: [
                  DialogService, // Fornisci il servizio per DynamicDialog
                  MessageService // Opzionale, per i messaggi
               ],
               templateUrl: './main-page.component.html',
               styleUrl:    './main-page.component.css'
            })
export class MainPageComponent implements OnInit, OnDestroy, AfterViewInit
{
   /*
   isLoadingEv: boolean = false;
   isLoadingSea: boolean = false;
   */
   isLoadingData: number = 0;
   listaEventi: Array<RigaEvento> = [];
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
   @ViewChild('tableContainer') tableContainer?: ElementRef<HTMLElement>;
   @ViewChild('buttonsContainer') buttonsContainer?: ElementRef<HTMLElement>;
   private osservaAltezze: ResizeObserver | null = null;
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
      let daCentrare: boolean = false;
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
         // Filtri (palestre, gruppi) e stagioni sono indipendenti: si caricano in parallelo
         await Promise.all ([this.LoadFilters (), this.LoadSeasons ()]);
         //
         /*
         const tmpSeason: SeasonElement | null = utils.GetFromLocalStorage<SeasonElement> ("RS_CurrSeason");
         if (tmpSeason != null)
         {
            this.currSeason = this.listaStagioni.find (season => season.id === tmpSeason.id) || null;
         }
         */
         this.theLocalStorage.data.currSeason = ScegliStagione (this.listaStagioni, this.theLocalStorage.data.currSeason);
         this.theLocalStorage.Save ();
         this.theLocalStorage.data.currTipoEvento = this.listaTipoEvento.find (event => event.id === this.theLocalStorage?.data.currTipoEvento.id) || null;
         if (this.theLocalStorage.data.currTipoEvento == null)
            this.theLocalStorage.data.currTipoEvento = this.listaTipoEvento[0];
         //
         //this.isLoadingEv = true;
         // Posizione all'apertura:
         //  - c'è una riga selezionata -> LoadEvents la porta al centro
         //  - altrimenti, se si torna sulla pagina -> ultima posizione lasciata
         //  - altrimenti (primo ingresso dopo il login) -> centrata su oggi
         daCentrare = !(await this.LoadEvents());
      }
      catch (e)
      {
         this.MostraErrore ("Errore durante l'apertura della pagina", e);
      }
      finally
      {
         //this.isLoadingSea = false;
         //this.isLoadingEv = false;
         await this.SetLoading(0);
         this.cdr.detectChanges();
         if (daCentrare)
         {
            const posizione = utils.GetFromSessionStorage<number> (CHIAVE_POSIZIONE_EVENTI);
            if (posizione != null)
               this.RipristinaPosizione (posizione);
            else
               this.CentraSuOggi ();
         }
      }
   }


   /*
      Porta al centro della tabella la prima riga di oggi (o, se oggi non ci sono eventi, del primo giorno successivo).
      Se la stagione è tutta passata va all'ultima riga.
   */
   CentraSuOggi ()
   {
      if (this.listaEventi.length == 0)
         return;
      const oggi: Date = new Date ();
      oggi.setHours (0, 0, 0, 0);
      let indice: number = this.listaEventi.findIndex (ev => (new Date (ev.data).getTime () >= oggi.getTime ()));
      if (indice < 0)
         indice = this.listaEventi.length - 1;
      if (indice == 0)
         return;
      this.CentraRiga (indice);
   }


   // Contenitore della tabella che scorre (null se la tabella non è ancora disegnata)
   ContenitoreTabella (): HTMLElement | null
   {
      const tabella: HTMLElement | undefined = this.pTable?.el?.nativeElement;
      return (tabella?.querySelector ('.p-datatable-wrapper') as HTMLElement | null) ?? null;
   }


   /*
      Porta la riga 'indice' al centro della tabella.
      Usa la posizione reale della riga sullo schermo perché le righe hanno altezze diverse.
      Dopo un setTimeout, così le righe sono già state disegnate.
   */
   CentraRiga (indice: number)
   {
      setTimeout (() =>
                  {
                     const wrapper = this.ContenitoreTabella ();
                     const righe = this.pTable?.el?.nativeElement.querySelectorAll ('.p-datatable-tbody > tr');
                     if ((!wrapper) || (!righe) || (indice >= righe.length))
                        return;
                     const riga = righe[indice] as HTMLElement;
                     const rWrapper = wrapper.getBoundingClientRect ();
                     const rRiga = riga.getBoundingClientRect ();
                     wrapper.scrollTop += (rRiga.top - rWrapper.top) - ((wrapper.clientHeight - rRiga.height) / 2);
                  });
   }


   RipristinaPosizione (posizione: number)
   {
      setTimeout (() =>
                  {
                     const wrapper = this.ContenitoreTabella ();
                     if (wrapper)
                        wrapper.scrollTop = posizione;
                  });
   }


   async ngOnDestroy()
   {
      // Ricorda dove era la tabella, per ritrovarla uguale tornando sulla pagina
      const wrapper = this.ContenitoreTabella ();
      if (wrapper)
         utils.SaveToSessionStorage (CHIAVE_POSIZIONE_EVENTI, wrapper.scrollTop);
      this.osservaAltezze?.disconnect ();
      this.osservaAltezze = null;
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


   // Mostra l'errore all'utente e lo registra (console + log sul server)
   MostraErrore (sottotitolo: string,
                 err: unknown)
   {
      this.messageDialogService.showError (sottotitolo, err);
   }


   async LoadSeasons()
   {
      try
      {
         //this.isLoadingSea = true;
         const dataSeas = await firstValueFrom(this.seasonServ.getAllData());
         if ((dataSeas) && (dataSeas.ok))
            this.listaStagioni = dataSeas.elements;
         else
            this.MostraErrore ("Errore durante il caricamento delle stagioni", dataSeas?.message ?? 'No data returned');
      }
      catch (err)
      {
         this.MostraErrore ("Errore durante il caricamento delle stagioni", err);
      }
      finally
      {
         //this.isLoadingSea = false;
         this.cdr.detectChanges ();
      }
   }

   // Ritorna true se ha riposizionato la tabella sull'evento selezionato in precedenza
   async LoadEvents(): Promise<boolean>
   {
      let selezioneRipristinata: boolean = false;
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
               this.listaEventi = this.PreparaRighe (dataEvnt.elements);
               this.totRec = this.listaEventi.length;
               // Non si attende: la tabella compare subito, le evidenziazioni arrivano appena pronte
               this.AggiornaSovrapposizioni (seasonId, tipoEvnt, (gruppoId != null));
               // La selezione resta salvata finché l'utente non la toglie: così sopravvive
               // a più cambi di pagina, non solo al primo ritorno
               const prevSelected = utils.GetFromSessionStorage(CHIAVE_EVENTO_SELEZIONATO);
               if (prevSelected != null)
                  selezioneRipristinata = this.SelectAndScrollToEvent(Number(prevSelected));
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
      return selezioneRipristinata;
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
         const [dataRis, dataGrp] = await Promise.all ([firstValueFrom (this.resourceService.getAllData ()),
                                                        firstValueFrom (this.gruppiService.getAllData ())]);
         if ((dataRis) && (dataRis.ok))
            this.listaRisorse = dataRis.elements;
         else
            this.MostraErrore ("Errore durante il caricamento delle palestre", dataRis?.message ?? 'No data returned');
         if ((dataGrp) && (dataGrp.ok))
            this.listaGruppi = dataGrp.elements;
         else
            this.MostraErrore ("Errore durante il caricamento dei gruppi", dataGrp?.message ?? 'No data returned');
      }
      catch(err)
      {
         this.MostraErrore ("Errore durante il caricamento di palestre e gruppi", err);
      }
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
         // Eventi del giorno letti dal server senza i filtri della tabella:
         // con un filtro attivo il giorno vuoto potrebbe essere nascosto.
         const listaGiorno: Array<EventoElement> | null = await this.EventiDelGiornoDalServer (this.currEvent.data);
         if (listaGiorno == null)
            return;
         // Se il giorno ha ancora il suo evento vuoto (tipo 0) si riusa quello (update),
         // altrimenti si aggiunge un nuovo record.
         let isAdd: boolean = true;
         let _id: number = 0;
         let rqst: string = "add";
         let si: number = 0;
         if (this.theLocalStorage?.data.currSeason)
            si = this.theLocalStorage?.data.currSeason.id;
         const vuoto: EventoElement | undefined = listaGiorno.find (ev => ev.tipoevento == TipoEvento.EventoVuoto);
         if (vuoto)
         {
            isAdd = false;
            _id = vuoto.id;
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
         utils.SaveToSessionStorage (CHIAVE_EVENTO_SELEZIONATO, this.currEvent.id);
      this.MostraSovrapposizioni (evento?.data ?? this.currEvent);
   }


   /*
      Se l'evento selezionato si sovrappone ad altri, mostra i dettagli in un avviso a comparsa.
      Serve soprattutto su telefono e tablet, dove il tooltip della cella Ora (al passaggio
      del mouse) non e' disponibile. Usa un toast dedicato (key) per non mostrare gli altri
      messaggi della pagina.
   */
   MostraSovrapposizioni (ev: EventoElement | null)
   {
      this.fltrMessageService.clear (TOAST_SOVRAPPOSIZIONI);
      if (ev == null)
         return;
      const dettagli: string | undefined = this.sovrapposizioni.get (ev.id);
      if (dettagli == null)
         return;
      this.fltrMessageService.add ({key:      TOAST_SOVRAPPOSIZIONI,
                                    severity: 'warn',
                                    summary:  'Palestra già occupata',
                                    detail:   dettagli,
                                    life:     8000});
   }


   OnRowUnselected (evento: any)
   {
      this.fltrMessageService.clear (TOAST_SOVRAPPOSIZIONI);
      utils.removeFromSessionStorage(CHIAVE_EVENTO_SELEZIONATO);
   }


   /*
      Aggiunge a ogni evento i valori gia' pronti per la visualizzazione (campo 'vista').
      La data compare solo sulla prima riga di ogni giorno (la lista arriva ordinata dal server).
   */
   PreparaRighe (eventi: Array<EventoElement>): Array<RigaEvento>
   {
      const result: Array<RigaEvento> = [];
      let precedente: Date | null = null;
      for (const ev of eventi)
      {
         const nuovoGiorno: boolean = ((precedente == null) || (!StessoGiorno (precedente, ev.data)));
         precedente = ev.data;
         const vista: VistaEvento = {
            classe:       this.GetRowColorClass (ev),
            data:         nuovoGiorno ? this.FormattaData (ev.data) : '',
            ora:          this.FormattaOrario (ev.orainizio),
            fine:         this.FormattaOrario (ev.orafine),
            stileRisorsa: this.ColoreRisorsa (ev),
            stileGruppo:  this.ColoreGruppo (ev),
            stileTipo:    this.ColoreTipoEvento (ev)
         };
         result.push (Object.assign (ev, { vista: vista }));
      }
      return result;
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
                                                                                    await this.EseguiCreaEventiStagione ();
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


   /*
      Crea un evento vuoto (tipo 0) per ogni giorno della stagione che non ha ancora eventi.
      I giorni esistenti si leggono dal server SENZA i filtri della tabella: con un filtro
      attivo i giorni con eventi nascosti sembrerebbero mancanti e verrebbero duplicati.
   */
   async EseguiCreaEventiStagione ()
   {
      const stagione = this.theLocalStorage?.data.currSeason;
      if (stagione == null)
         return;
      const chiave = (d: Date): string => utils.DataPerDb (d);
      let creati: number = 0;
      let errori: number = 0;
      let ultimoErrore: string = "";
      try
      {
         await this.SetLoading (6);
         const resp = await firstValueFrom (this.eventServ.getAllData (stagione.id, -1, null, null, null, null));
         if ((!resp) || (!resp.ok))
         {
            errori++;
            ultimoErrore = `${resp?.message ?? 'No data returned'}`;
            return;
         }
         const giorniEsistenti: Set<string> = new Set<string> ((resp.elements as Array<EventoElement>).map (ev => chiave (ev.data)));
         const currDay: Date = new Date (stagione.datainizio);
         const dayToStop: Date = new Date (stagione.datafine);
         dayToStop.setDate (dayToStop.getDate () + 1);
         currDay.setHours (0, 0, 0, 0);
         dayToStop.setHours (0, 0, 0, 0);
         while (currDay.getTime () < dayToStop.getTime ())
         {
            const strData: string = chiave (currDay);
            if (!giorniEsistenti.has (strData))
            {
               const r = await firstValueFrom (this.eventServ.addNewData (strData, "00:00", "00:00", 0, 0, "", "", "", "", false,
                                                                          TipoEvento.EventoVuoto, stagione.id, 0));
               if ((r) && (r.ok))
                  creati++;
               else
               {
                  errori++;
                  ultimoErrore = `${r?.message}`;
               }
            }
            currDay.setDate (currDay.getDate () + 1);
         }
      }
      catch (err)
      {
         errori++;
         ultimoErrore = `${err}`;
      }
      finally
      {
         await this.SetLoading (0);
         if (creati > 0)
            await this.logService.AddToLog (loggedUser, `Creati ${creati} eventi vuoti per la stagione '${stagione.nome}'`);
         const dlgData: MessDlgData = {
            title:      (errori > 0) ? 'ATTENZIONE' : 'Creazione Eventi Stagione',
            subtitle:   '',
            message:    `Giorni aggiunti: <b>${creati}</b>` + ((errori > 0) ? `\nErrori: <b>${errori}</b>\nUltimo errore: ${EscapeHtml (ultimoErrore)}` : ''),
            messtype:   (errori > 0) ? 'warning' : 'info',
            btncaption: 'Chiudi'
         };
         this.messageDialogService.showMessage (dlgData, '600px');
         await this.RefreshData ();
      }
   }


   // Seleziona l'evento e lo porta al centro della tabella. Ritorna false se l'evento non c'è più
   // (es. cancellato, o escluso da un filtro): in quel caso dimentica la selezione salvata.
   SelectAndScrollToEvent(idToSelect: number): boolean
   {
      const indice: number = this.listaEventi.findIndex (ev => ev.id == idToSelect);
      if (indice < 0)
      {
         console.warn(`Riga con ID ${idToSelect} non trovata.`);
         utils.removeFromSessionStorage (CHIAVE_EVENTO_SELEZIONATO);
         return false;
      }
      this.currEvent = this.listaEventi[indice];
      this.CentraRiga (indice);
      return true;
   }


   /*
      Tutti gli eventi di un giorno letti dal server, SENZA i filtri attivi nella tabella
      (con un filtro per palestra o gruppo la tabella mostra solo una parte del giorno).
      Ritorna null in caso di errore, dopo aver mostrato il messaggio all'utente.
   */
   async EventiDelGiornoDalServer (aDay: Date): Promise<Array<EventoElement> | null>
   {
      const resp = await firstValueFrom (this.eventServ.getAllData (null, -1, null, null, aDay, null));
      if ((!resp) || (!resp.ok))
      {
         const dlgData: MessDlgData = {
            title:      'ERRORE',
            subtitle:   'Errore durante la lettura degli eventi del giorno',
            message:    `${resp?.message ?? 'No data returned'}`,
            messtype:   'error',
            btncaption: 'Chiudi'
         };
         this.messageDialogService.showMessage (dlgData, '600px');
         return null;
      }
      return (resp.elements as Array<EventoElement>).filter (ev => StessoGiorno (ev.data, aDay));
   }


   async DeleteSelected()
   {
      if (this.currEvent)
      {
         try
         {
            const evento: EventoElement = this.currEvent;
            await this.SetLoading(4);
            // Eventi del giorno letti dal server senza i filtri della tabella
            const listaGiorno: Array<EventoElement> | null = await this.EventiDelGiornoDalServer (evento.data);
            if (listaGiorno == null)
               return;
            // Il record si cancella solo se nel giorno resta un altro evento normale o vuoto,
            // cosi' il giorno continua a comparire in tabella. Gli eventi periodici non contano:
            // con il filtro "Solo eventi classici" non si vedono.
            const altri: Array<EventoElement> = listaGiorno.filter (ev => (ev.id != evento.id) &&
                                                                           ((ev.tipoevento == TipoEvento.EventoNormale) ||
                                                                            (ev.tipoevento == TipoEvento.EventoVuoto)));
            if (altri.length > 0)
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
                                                                                 (this.currEvent.data) ? utils.DataPerDb (this.currEvent.data) : "",
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
                                                                                 0));   // il giorno vuoto non appartiene a nessun evento periodico

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
            this.MostraErrore ("Errore durante la cancellazione dell'evento", e);
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
                                                     this.MostraErrore ("Errore nell'applicazione del filtro palestre", e);
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
         this.MostraErrore ("Errore nell'apertura del filtro palestre", e);
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
               this.MostraErrore ("Errore nell'applicazione del filtro gruppi", e);
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
         this.MostraErrore ("Errore nell'apertura del filtro gruppi", e);
      }
      finally
      {
         //this.theSessionStorage?.Save();
      }
   }


   ngAfterViewInit ()
   {
      // Misuro dopo il rendering: qui la pagina precedente può essere ancora nel DOM
      // (viene tolta a fine animazione) e falserebbe la posizione della tabella
      setTimeout (() =>
      {
         this.GetWindowSize ();
         this.cdr.detectChanges ();
      });
      // Intestazione della pagina e barra dei bottoni cambiano altezza dopo il primo disegno
      // (tendine, bottoni che dipendono dall'utente): quando cambiano si ricalcola l'altezza della tabella
      const bottoni = this.buttonsContainer?.nativeElement;
      // cercata dentro questa pagina: durante il cambio pagina può esserci ancora quella precedente
      const intestazione = this.tableContainer?.nativeElement.closest ('#main_container')?.querySelector ('#div-page-header') as HTMLElement | null;
      const daOsservare: Array<HTMLElement> = [bottoni, intestazione].filter ((e): e is HTMLElement => e != null);
      if ((daOsservare.length > 0) && (typeof ResizeObserver !== 'undefined'))
      {
         let firmaPrecedente: string = "";
         this.osservaAltezze = new ResizeObserver (() =>
         {
            const firma: string = daOsservare.map (e => Math.round (e.getBoundingClientRect ().height)).join ('|');
            if (firma == firmaPrecedente)
               return;
            firmaPrecedente = firma;
            this.GetWindowSize ();
            this.cdr.detectChanges ();
         });
         daOsservare.forEach (e => this.osservaAltezze?.observe (e));
      }
   }


   /*
      Altezza della tabella: dal suo inizio fino al piè di pagina (fisso in basso),
      meno la barra dei bottoni sotto la tabella. Se la pagina non è ancora disegnata
      resta la formula fissa.
   */
   async GetWindowSize()
   {
      this.windowHeight = window.innerHeight;
      // 48 px recuperati dalla barra in alto più compatta
      let sh: number = this.windowHeight - 110 - 90 - 180 + 48;
      const container = this.tableContainer?.nativeElement;
      if (container)
      {
         const footer = document.querySelector ('.app-footer');
         const fondo: number = footer ? footer.getBoundingClientRect ().top : this.windowHeight;
         let altezzaBottoni: number = 0;
         const bottoni = this.buttonsContainer?.nativeElement;
         if (bottoni)
         {
            const stile = getComputedStyle (bottoni);
            altezzaBottoni = bottoni.getBoundingClientRect ().height + (parseFloat (stile.marginTop) || 0) + (parseFloat (stile.marginBottom) || 0);
         }
         const misurato: number = Math.floor (fondo - container.getBoundingClientRect ().top - altezzaBottoni - 8);
         if (misurato >= 110)
            sh = misurato;
      }
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
