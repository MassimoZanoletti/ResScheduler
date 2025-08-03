// angular
import {ChangeDetectorRef,
         Component,
         HostListener,
         NgZone,
         OnDestroy,
         OnInit,
         ViewChild} from '@angular/core';
import {CommonModule} from "@angular/common";
import {FormsModule} from "@angular/forms";
import {Router} from "@angular/router";
import {firstValueFrom} from "rxjs";

// primeng
import {BlockUIModule} from "primeng/blockui";
import {ButtonModule} from "primeng/button";
import {CardModule} from "primeng/card";
import {CheckboxModule} from "primeng/checkbox";
import {DividerModule} from "primeng/divider";
import {DropdownModule} from "primeng/dropdown";
import {MessageService} from "primeng/api";
import {ProgressSpinnerModule} from "primeng/progressspinner";
import {Table,
         TableModule} from "primeng/table";
import {TooltipModule} from "primeng/tooltip";
import {DialogModule} from "primeng/dialog";
import {DialogService,
         DynamicDialogModule,
         DynamicDialogRef} from "primeng/dynamicdialog";

// other
import {EventoMasterElement,
         Gruppo,
         MessDlgData,
         Resource,
         SeasonElement} from "../../models/datamod";
import {SeasonsService} from "../../services/seasons.service";
import {EventiMasterService} from "../../services/eventi-master.service";
import {RisorseService} from "../../services/risorse.service";
import {GruppiService} from "../../services/gruppi.service";
import {MessageDialogService} from "../../services/message-dialog.service";
import {utils} from "../../common/utils";
import {loggedUser} from "../../services/users.service";
import {MultiSelectModalComponent} from "../../dialogs/multi-select-modal/multi-select-modal.component";
import {EventiService} from "../../services/eventi.service";
import { LogService } from "../../services/log.service";



@Component ({
               selector:    'app-eventi-master-table',
               standalone:  true,
               imports:     [
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
               providers:   [
                  DialogService, // Fornisci il servizio per DynamicDialog
                  MessageService // Opzionale, per i messaggi
               ],
               templateUrl: './eventi-master-table.component.html',
               styleUrl:    './eventi-master-table.component.css'
            })
export class EventiMasterTableComponent implements OnInit, OnDestroy
{
   isLoadingEv: boolean = false;
   isLoadingSea: boolean = false;
   listaEventi: Array<EventoMasterElement> = [];
   currEvent: EventoMasterElement | null = null;
   listaStagioni: Array<SeasonElement> = [];
   currSeason: SeasonElement | null = null;
   listaRisorse: Array<Resource> = [];
   listaGruppi: Array<Gruppo> = [];
   debug: number = 0;
   fltrRisorsa: boolean = false;
   fltrRisorsaItems: Array<Resource> | null = null;
   fltrGruppo: boolean = false;
   fltrGruppoItems: Array<Gruppo> | null = null;
   fltrDlgRef: DynamicDialogRef | undefined;
   totRec: number = 0;
   windowHeight: number = 110;
   scrollHeight: string = "110px";
   @ViewChild ('eventsMasterTable') pTable: Table | undefined;


   constructor (public router: Router,
                private seasonServ: SeasonsService,
                private eventServ: EventiMasterService,
                private eventoFiglioService: EventiService,
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
   }


   async ngOnInit ()
   {
      try
      {
         await this.GetWindowSize ();
         //
         await this.LoadFilters ();
         //
         await this.LoadSeasons ();
         //
         const tmpSeason: SeasonElement | null = utils.GetFromLocalStorage<SeasonElement> ("RS_CurrSeason");
         if (tmpSeason != null)
         {
            this.currSeason = this.listaStagioni.find (season => season.id === tmpSeason.id) || null;
         }
         //
         this.isLoadingEv = true;
         await this.LoadEvents ();
      }
      catch (e)
      {

      }
      finally
      {
         //this.isLoadingSea = false;
         //this.isLoadingEv = false;
      }
   }


   async ngOnDestroy ()
   {
      if (this.fltrDlgRef)
      {
         this.fltrDlgRef.destroy ();
      }
   }


   CheckLoading (): boolean
   {
      return ((this.isLoadingEv) || (this.isLoadingSea));
   }


   async LoadSeasons ()
   {
      try
      {
         this.isLoadingSea = true;
         const dataSeas = await firstValueFrom (this.seasonServ.getAllData ());
         if ((dataSeas) && (dataSeas.ok))
            this.listaStagioni = dataSeas.elements;
      }
      catch (err)
      {

      }
      finally
      {
         this.isLoadingSea = false;
         this.cdr.detectChanges ();
      }
   }


   async LoadEvents ()
   {
      try
      {
         this.isLoadingEv = true;
         this.totRec = 0;
         let seasonId: number | null = (this.currSeason != null) ? this.currSeason.id : null;
         let risorsaId: Array<number> | null = null;
         let gruppoId: Array<number> | null = null;
         let giorno: Date | null = null;
         let giornofine: Date | null = null;
         if ((this.fltrRisorsaItems) && (this.fltrRisorsaItems.length > 0))
         {
            risorsaId = [];
            for (let i = 0; i < this.fltrRisorsaItems.length; i++)
               risorsaId.push (this.fltrRisorsaItems[i].id);
         }
         if ((this.fltrGruppoItems) && (this.fltrGruppoItems.length > 0))
         {
            gruppoId = [];
            for (let i = 0; i < this.fltrGruppoItems.length; i++)
               gruppoId.push (this.fltrGruppoItems[i].id);
         }
         const dataEvnt = await firstValueFrom (this.eventServ.getAllData (seasonId, risorsaId, gruppoId, giorno));
         if (dataEvnt)
         {
            if (dataEvnt.ok)
            {
               this.listaEventi = dataEvnt.elements;
               this.totRec = this.listaEventi.length;
               const prevSelected = utils.GetFromSessionStorage ("RS_Editing_MasterEvent_Id");
               utils.removeFromSessionStorage ("RS_Editing_MasterEvent_Id");
               if (prevSelected != null)
               {
                  this.SelectAndScrollToEvent (Number (prevSelected));
               }
            }
            else
            {
               const dlgData: MessDlgData = {
                  title:      'ERRORE',
                  subtitle:   'Errore durante il caricamento degli eventi master dal server',
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
               subtitle:   'Errore durante il caricamento degli eventi master dal server',
               message:    `No data returned`,
               messtype:   'error',
               btncaption: 'Chiudi'
            };
            this.messageDialogService.showMessage (dlgData, '600px');
         }
      }
      catch (err)
      {
         await this.logService.AddToLog (loggedUser, `Exception [EventiMaster::LoadEvents]: '${JSON.stringify(err,null,-1)}'`);
         const dlgData: MessDlgData = {
            title:      'Exception',
            subtitle:   'Errore',
            message:    `${JSON.stringify (err, null, 3)}`,
            messtype:   'error',
            btncaption: 'Chiudi'
         };
         this.messageDialogService.showMessage (dlgData, '600px');
      }
      finally
      {
         this.isLoadingEv = false;
         this.cdr.detectChanges ();
      }
   }


   async LoadFilters ()
   {
      const dataRis = await firstValueFrom (this.resourceService.getAllData ());
      if ((dataRis) && (dataRis.ok))
         this.listaRisorse = dataRis.elements;
      //
      const dataGrp = await firstValueFrom (this.gruppiService.getAllData ());
      if ((dataGrp) && (dataGrp.ok))
         this.listaGruppi = dataGrp.elements;
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


   GetRowColorClass (evento: EventoMasterElement): string
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
      let yyyy: number = 0;
      let mmmm: number = 0;
      let dddd: number = 0;
      let oggi: Date = new Date ();


      yyyy = oggi.getFullYear ();
      mmmm = oggi.getMonth () + 1;
      dddd = oggi.getDate ();
      let isAdd: boolean = true;
      let _id: number = 0;
      let rqst: string = "add";
      let si: number = 0;
      if (this.currSeason)
         si = this.currSeason.id;
      console.log ('Nuovo evento:');
      this.router.navigate ([`/eventomasteredit`], {
         state: {
            id:        _id,
            request:   rqst,
            isadd:     isAdd,
            year:      yyyy,
            month:     mmmm,
            day:       dddd,
            season_id: si
         }
      });
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
            subtitle:   'Modifica evento master',
            message:    `Non è stato selezionato alcun evento`,
            messtype:   'warning',
            btncaption: 'Chiudi'
         };
         this.messageDialogService.showMessage (dlgData, '600px');
      }
      else
      {
         yyyy = this.currEvent.data.getFullYear ();
         mmmm = this.currEvent.data.getMonth () + 1;
         dddd = this.currEvent.data.getDate ();
         let isAdd: boolean = false;
         let _id: number = this.currEvent.id;
         let rqst: string = "";
         let si: number = 0;
         if (this.currSeason)
            si = this.currSeason.id;
         this.router.navigate ([`/eventomasteredit`], {
            state: {
               id:        _id,
               request:   rqst,
               isadd:     isAdd,
               year:      yyyy,
               month:     mmmm,
               day:       dddd,
               season_id: si
            }
         });
      }
   }


   OnDelete (): void
   {
      if (this.currEvent == null)
      {
         const dlgData: MessDlgData = {
            title:      'ATTENZIONE',
            subtitle:   'Cancellazione evento master',
            message:    `Non è stato selezionato alcun evento`,
            messtype:   'warning',
            btncaption: 'Chiudi'
         };
         this.messageDialogService.showMessage (dlgData, '600px');
      }
      else
      {
         const dlgData: MessDlgData = {
            title:               'Cancellazione Evento Master',
            subtitle:            '',
            message:             `Sei veramente sicuro di voloer cancellare l'evento master\n'<b>${this.FormattaData (this.currEvent.data)} : ${this.FormattaOrario (this.currEvent.orainizio)} : ${this.currEvent.gruppo} : ${this.currEvent.risorsa}</b>'\n dal database?`,
            messtype:            'warning',
            btncaption:          'Annulla',
            showCancelButton:    true,
            cancelButtonCaption: 'Sì, procedi'
         };

         this.messageDialogService.showMessage (dlgData, '', true).subscribe (result =>
                                                                              {
                                                                                 if (result === 'secondary')
                                                                                 {
                                                                                    this.DeleteSelected ();
                                                                                 }
                                                                              });
      }
   }


   OnRowSelected (evento: any)
   {
      if (this.currEvent != null)
      {
         utils.SaveToSessionStorage ("RS_Editing_Event_Id", this.currEvent.id);
      }
   }


   OnRowUnselected (evento: any)
   {
      utils.removeFromSessionStorage ("RS_Editing_Event_Id");
   }


   OnSeasonChange (evento: any)
   {
      utils.SaveToLocalStorage ("RS_CurrSeason", this.currSeason);
      //this.logService.AddToLog (loggedUser, `EventiMaster: selezionata stagione '${this.currSeason?.nome}'`);
      this.LoadEvents ();
   }


   GetFormattedDate(evento: any, rowIndex: number): string
   {
      // Se è la prima riga, visualizza sempre la data
      if (rowIndex === 0)
      {
         return this.FormattaData(evento.data);
      }

      // Recupera il valore della data dell'evento precedente
      const previousEvent = this.listaEventi[rowIndex - 1];
      const previousDate = this.FormattaData(previousEvent.data);
      const currentDate = this.FormattaData(evento.data);

      // Confronta le date. Se sono uguali, restituisci una stringa vuota.
      // Altrimenti, restituisci la data formattata.
      return currentDate === previousDate ? '' : currentDate;
   }


   FormattaData (data: Date | string): string
   {
      try
      {
         const d = new Date (data);

         return new Intl.DateTimeFormat ('it-IT', {
            weekday: 'short',
            day:     '2-digit',
            month:   'short'
         }).format (d);
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


   ColoreRisorsa (evento: EventoMasterElement): any
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


   ColoreGruppo (evento: EventoMasterElement): any
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


   SelectAndScrollToEvent (idToSelect: number)
   {
      let rowToSelect: EventoMasterElement | null = null;
      let selectedIndex: number = -1;
      for (let i = 0; i < this.listaEventi.length; i++)
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
         let scr1: number = selectedIndex - rpp;
         if (scr1 > 0)
            rts = scr1 + (rpp / 2);
         this.pTable?.scrollTo ({'top': 25 * rts});
         this.currEvent = rowToSelect;
      }
      else
      {
         console.warn (`Riga con ID ${idToSelect} non trovata.`);
      }
   }


   EventiDelGiorno (aDay: Date): Array<EventoMasterElement>
   {
      let result: Array<EventoMasterElement> = [];
      try
      {
         for (let iii = 0; iii < this.listaEventi.length; iii++)
         {
            if ((this.listaEventi[iii].data.getFullYear () == aDay.getFullYear ()) &&
               (this.listaEventi[iii].data.getMonth () == aDay.getMonth ()) &&
               (this.listaEventi[iii].data.getDate () == aDay.getDate ()))
            {
               result.push (this.listaEventi[iii]);
            }
         }
      }
      catch (e)
      {
         result = [];
      }
      return result;
      ;
   }


   async DeleteSelected ()
   {
      if (this.currEvent)
      {
         try
         {
            this.isLoadingEv = true;
            // cancello tutti gli eventi periodici figli
            await firstValueFrom (this.eventoFiglioService.DeletePeriodic (this.currEvent.id));
            // .. e pi cancello l'evento master
            const response = await firstValueFrom (this.eventServ.DeleteData (this.currEvent.id));

            if (response.ok)
            {
               await this.logService.AddToLog (loggedUser, `Cancellato Evento Master '${this.currEvent.id}'`);
               await this.LoadEvents ();
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
         catch (e)
         {

         }
         finally
         {
            this.isLoadingEv = false;
         }
      }
   }


   OnFilterRisorsa ()
   {
      this.fltrRisorsa = (this.fltrRisorsaItems) ? ((this.fltrRisorsaItems.length > 0) ? true : false) : false;
      try
      {
         this.fltrDlgRef = this.fltrDialogService.open (MultiSelectModalComponent, {
            //header: 'Filtro Risorse',
            width:      '600px',
            height:     '650px',
            position:   'topleft',
            styleClass: 'custom-dlg-class',
            data:       {
               options:            this.listaRisorse,
               preSelectedOptions: this.fltrRisorsaItems,
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
                                                        this.fltrRisorsaItems = result.selectedOptions;
                                                        console.log ('Opzioni selezionate (OK):', this.fltrRisorsaItems);
                                                        this.fltrMessageService.add ({
                                                                                        severity: 'success',
                                                                                        summary:  'Confermato',
                                                                                        detail:   'Selezione salvata!'
                                                                                     });
                                                     }
                                                     else if (result.action === 'cancel')
                                                     {
                                                        // Se l'utente ha premuto Annulla
                                                        console.log ('Modale annullata. Mantenute le selezioni precedenti.');
                                                        this.fltrMessageService.add ({
                                                                                        severity: 'warn',
                                                                                        summary:  'Annullato',
                                                                                        detail:   'Selezione precedente mantenuta.'
                                                                                     });
                                                        // Non facciamo nulla con this.selectedItemsFromModal, così conserva il suo stato precedente
                                                     }
                                                  }
                                                  else
                                                  {
                                                     // Questo caso si verifica se la modale è stata chiusa senza un'azione esplicita (es. clic su 'x' o tasto ESC)
                                                     console.log ('Modale chiusa senza azione specifica (es. X o ESC). Mantenute le selezioni precedenti.');
                                                     this.fltrMessageService.add ({
                                                                                     severity: 'info',
                                                                                     summary:  'Chiusa',
                                                                                     detail:   'Nessuna modifica alla selezione.'
                                                                                  });
                                                  }
                                               }
                                               catch (e)
                                               {

                                               }
                                               finally
                                               {
                                                  this.fltrRisorsa = (this.fltrRisorsaItems) ? ((this.fltrRisorsaItems.length > 0) ? true : false) : false;
                                                  this.cdr.detectChanges ();
                                                  this.LoadEvents ();
                                               }
                                            });
      }
      catch (e)
      {

      }
      finally
      {
         //this.fltrRisorsa = (this.fltrRisorsaItems)?((this.fltrRisorsaItems.length > 0)?true:false):false;
      }
   }


   OnFilterGruppo ()
   {
      try
      {
         this.fltrDlgRef = this.fltrDialogService.open (MultiSelectModalComponent, {
            //header: 'Filtro Gruppi',
            width:      '600px',
            height:     '650px',
            position:   'topleft',
            styleClass: 'custom-dlg-class',
            data:       {
               options:            this.listaGruppi,
               preSelectedOptions: this.fltrGruppoItems,
               customTitle:        'Filtro per Gruppi'
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
                                                        this.fltrGruppoItems = result.selectedOptions;
                                                        console.log ('Opzioni selezionate (OK):', this.fltrGruppoItems);
                                                        this.fltrMessageService.add ({
                                                                                        severity: 'success',
                                                                                        summary:  'Confermato',
                                                                                        detail:   'Selezione salvata!'
                                                                                     });
                                                     }
                                                     else if (result.action === 'cancel')
                                                     {
                                                        // Se l'utente ha premuto Annulla
                                                        console.log ('Modale annullata. Mantenute le selezioni precedenti.');
                                                        this.fltrMessageService.add ({
                                                                                        severity: 'warn',
                                                                                        summary:  'Annullato',
                                                                                        detail:   'Selezione precedente mantenuta.'
                                                                                     });
                                                        // Non facciamo nulla con this.selectedItemsFromModal, così conserva il suo stato precedente
                                                     }
                                                  }
                                                  else
                                                  {
                                                     // Questo caso si verifica se la modale è stata chiusa senza un'azione esplicita (es. clic su 'x' o tasto ESC)
                                                     console.log ('Modale chiusa senza azione specifica (es. X o ESC). Mantenute le selezioni precedenti.');
                                                     this.fltrMessageService.add ({
                                                                                     severity: 'info',
                                                                                     summary:  'Chiusa',
                                                                                     detail:   'Nessuna modifica alla selezione.'
                                                                                  });
                                                  }
                                               }
                                               catch (e)
                                               {

                                               }
                                               finally
                                               {
                                                  this.fltrGruppo = (this.fltrGruppoItems) ? ((this.fltrGruppoItems.length > 0) ? true : false) : false;
                                                  this.cdr.detectChanges ();
                                                  this.LoadEvents ();
                                               }
                                            });
      }
      catch (e)
      {

      }
      finally
      {
         //this.fltrGruppo = (this.fltrGruppoItems)?((this.fltrGruppoItems.length > 0)?true:false):false;
      }
   }


   async GetWindowSize ()
   {
      this.windowHeight = window.innerHeight;
      let sh: number = this.windowHeight - 110 - 90 - 180;
      if (sh < 110)
         sh = 110;
      this.scrollHeight = `${sh}px`;
   }


   @HostListener ('window:resize', ['$event'])
   async onResize (event: any)
   {
      await this.GetWindowSize ();
   }


}


