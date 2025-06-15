import {
   ChangeDetectorRef,
   Component,
   OnInit,
   ViewChild,
   ElementRef,
   OnDestroy
} from '@angular/core';
import { TableModule} from 'primeng/table';
import { FormsModule} from '@angular/forms';
import { CommonModule} from '@angular/common';
import { ButtonModule} from "primeng/button";
import { TooltipModule} from 'primeng/tooltip';
import { CardModule} from 'primeng/card';
import { DropdownModule} from "primeng/dropdown";
import {
   EventoElement, Gruppo,
   MessDlgData, Resource,
   SeasonElement,
   TipoEvento
} from "../../models/datamod";
import { SeasonsService} from "../../services/seasons.service";
import { EventiService} from "../../services/eventi.service";
import { RisorseService } from "../../services/risorse.service";
import { MessageDialogService} from "../../services/message-dialog.service";
import { utils} from "../../common/utils";
import { BlockUIModule} from "primeng/blockui";
import { ProgressSpinnerModule} from "primeng/progressspinner";
import { DividerModule } from 'primeng/divider';
import { CheckboxModule } from "primeng/checkbox";
import { Router} from "@angular/router";
import { Table } from 'primeng/table';
import { NgZone } from '@angular/core'
import { firstValueFrom} from "rxjs";
import { DialogModule } from 'primeng/dialog';
import {
   DialogService,
   DynamicDialogRef,
   DynamicDialogModule
      } from 'primeng/dynamicdialog';
import { MessageService } from 'primeng/api';
import { MultiSelectModalComponent } from "../../dialogs/multi-select-modal/multi-select-modal.component";
import {GruppiService} from "../../services/gruppi.service";



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
   isLoadingEv: boolean = false;
   isLoadingSea: boolean = false;
   listaEventi: Array<EventoElement> = [];
   currEvent: EventoElement | null = null;
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
   @ViewChild('eventsTable') pTable: Table | undefined;


   constructor (public router: Router,
                private seasonServ: SeasonsService,
                private eventServ: EventiService,
                private resourceService: RisorseService,
                private gruppiService: GruppiService,
                private cdr: ChangeDetectorRef,
                private messageDialogService: MessageDialogService,
                private zone: NgZone,
                public fltrDialogService: DialogService,
                public fltrMessageService: MessageService)
   {
      this.currEvent = null;
   }


   async ngOnInit()
   {
      try
      {
         await this.LoadFilters();
         //
         await this.LoadSeasons();
         //
         const tmpSeason: SeasonElement | null = utils.GetFromLocalStorage<SeasonElement> ("RS_CurrSeason");
         if (tmpSeason != null)
         {
            this.currSeason = this.listaStagioni.find (season => season.id === tmpSeason.id) || null;
         }
         //
         this.isLoadingEv = true;
         await this.LoadEvents();
      }
      catch (e)
      {

      }
      finally
      {
         this.isLoadingSea = false;
         this.isLoadingEv = false;
      }
   }


   async ngOnDestroy()
   {
      if (this.fltrDlgRef)
      {
         this.fltrDlgRef.destroy();
      }
   }


   CheckLoading(): boolean
   {
      return ((this.isLoadingEv) || (this.isLoadingSea));
   }


   async LoadSeasons()
   {
      try
      {
         this.isLoadingSea = true;
         const dataSeas = await firstValueFrom(this.seasonServ.getAllData());
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


   async LoadEvents()
   {
      try
      {
         this.isLoadingEv = true;
         let seasonId: number | null = (this.currSeason != null)?this.currSeason.id:null;
         let tipoEvnt: number | null = 1;
         let risorsaId: Array<number> | null = null;
         let gruppoId: Array<number> | null = null;
         let giorno: Date | null = null;
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
         const dataEvnt = await firstValueFrom(this.eventServ.getAllData (seasonId, tipoEvnt, risorsaId, gruppoId, giorno));
         if (dataEvnt)
         {
            if (dataEvnt.ok)
            {
               this.listaEventi = dataEvnt.elements;
               this.cdr.detectChanges ();
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

      }
      finally
      {
         this.isLoadingEv = false;
      }
   }


   async LoadFilters()
   {
      const dataRis = await firstValueFrom(this.resourceService.getAllData());
      if ((dataRis) && (dataRis.ok))
         this.listaRisorse = dataRis.elements;
      //
      const dataGrp = await firstValueFrom(this.gruppiService.getAllData());
      if ((dataGrp) && (dataGrp.ok))
         this.listaGruppi = dataGrp.elements;
   }


   AddEnabled (): boolean
   {
      return true;
   }


   EditEnabled (): boolean
   {
      return true;
   }


   DeleteEnabled (): boolean
   {
      return true;
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
         if (this.currSeason)
            si = this.currSeason.id;
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
         if (this.currSeason)
            si = this.currSeason.id;
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
                                                                                    /*
                                                                                    this.theDataService.DeleteData (item.id).subscribe (data =>
                                                                                                                                        {
                                                                                                                                           if (data)
                                                                                                                                           {
                                                                                                                                              if (data.ok)
                                                                                                                                              {
                                                                                                                                                 this.LoadData ();
                                                                                                                                              }
                                                                                                                                              else
                                                                                                                                              {
                                                                                                                                                 const dlgData: MessDlgData = {
                                                                                                                                                    title:      'ERRORE',
                                                                                                                                                    subtitle:   'Errore durante la cancellazione del dato',
                                                                                                                                                    message:    `${data.message}`,
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
                                                                                                                                                 subtitle:   'Errore durante la cancellazione del dato',
                                                                                                                                                 message:    `Nessun dato ritornato`,
                                                                                                                                                 messtype:   'error',
                                                                                                                                                 btncaption: 'Chiudi'
                                                                                                                                              };
                                                                                                                                              this.messageDialogService.showMessage (dlgData, '600px');
                                                                                                                                           }
                                                                                                                                           this.isLoading = false;
                                                                                                                                        })
                                                                                    */
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


   OnRowSelected (evento: any)
   {
      if (this.currEvent != null)
         utils.SaveToSessionStorage ("RS_Editing_Event_Id", this.currEvent.id);
   }


   OnRowUnselected (evento: any)
   {
      utils.removeFromSessionStorage("RS_Editing_Event_Id");
   }


   FormattaData (data: Date | string): string
   {
      const d = new Date (data);

      return new Intl.DateTimeFormat ('it-IT', {
         weekday: 'short',
         day:     '2-digit',
         month:   'short'
      }).format (d);
   }


   FormattaOrario (date: Date): string
   {
      const hours = date.getHours ().toString ().padStart (2, '0');
      const minutes = date.getMinutes ().toString ().padStart (2, '0');
      if ((hours == "00") && (minutes == "00"))
         return "";
      else
         return `${hours}:${minutes}`;
   }


   ColoreRisorsa (evento: EventoElement): any
   {
      if ((evento) && (evento.risorsatxt != "") && (evento.risorsabck != ""))
         return {'background-color': `${evento.risorsabck}`, 'color': `${evento.risorsatxt}`};
      else
         return {};
   }


   ColoreGruppo (evento: EventoElement): any
   {
      if ((evento) && (evento.gruppotxt != "") && (evento.gruppobck != ""))
         return {'background-color': `${evento.gruppobck}`, 'color': `${evento.gruppotxt}`};
      else
         return {};
   }


   OnSeasonChange(evento: any)
   {
      utils.SaveToLocalStorage("RS_CurrSeason", this.currSeason);
      this.LoadEvents();
   }


   CreaEventiStagione()
   {
      if (this.currSeason != null)
      {
         const dlgData: MessDlgData = {
            title:               'Creazione Eventi Stagione',
            subtitle:            '',
            message:             `Sei veramente sicuro di voloer gli eventi vuoti per la stagione '<b>${this.currSeason?.nome}</b>' nel database?\n\n<b>Potrebbero venire cancellati gli eventi attualmente inseriti.</b>`,
            messtype:            'warning',
            btncaption:          'Annulla',
            showCancelButton:    true,
            cancelButtonCaption: 'Sì, procedi'
         };

         this.messageDialogService.showMessage (dlgData, '', true).subscribe (async result =>
                                                                              {
                                                                                 if (result === 'secondary')
                                                                                 {
                                                                                    if (this.currSeason != null)
                                                                                    {
                                                                                       let goOn: boolean = false;
                                                                                       let strData: string;
                                                                                       let currDay: Date = new Date (this.currSeason.datainizio);
                                                                                       let dayToStop: Date = new Date (this.currSeason.datafine);
                                                                                       dayToStop.setDate (dayToStop.getDate () + 1);
                                                                                       currDay.setHours(0,0,0,0);
                                                                                       dayToStop.setHours(0,0,0,0);
                                                                                       while (currDay.getTime () < dayToStop.getTime ())
                                                                                       {
                                                                                          currDay.setHours (0, 0, 0, 0);
                                                                                          strData = `${currDay.getFullYear()}-${currDay.getMonth()+1}-${currDay.getDate()}`;
                                                                                          goOn = false;
                                                                                          this.eventServ.addNewData(strData,
                                                                                                                    "00:00",
                                                                                                                    "00:00",
                                                                                                                    0,
                                                                                                                    0,
                                                                                                                    "",
                                                                                                                    "",
                                                                                                                    "",
                                                                                                                    "",
                                                                                                                    false,
                                                                                                                    1,
                                                                                                                    this.currSeason.id).subscribe(data => {
                                                                                                                        goOn = true;
                                                                                          });
                                                                                          //
                                                                                          while (goOn == false)
                                                                                             await utils.Dlt_Sleep(10);
                                                                                          currDay.setDate(currDay.getDate() + 1);
                                                                                       }
                                                                                    }
                                                                                    this.cdr.detectChanges ();
                                                                                    this.LoadEvents();
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


   SelectAndScrollToEvent(idToSelect: number)
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
         this.pTable?.scrollTo({'top': 25*rts});
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
               this.isLoadingEv = true;
               const response = await firstValueFrom (this.eventServ.DeleteData(this.currEvent.id));

               if (response.ok)
               {
                  await this.LoadEvents();
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
               this.isLoadingEv = true;
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
                                                                                 this.currEvent.season_id));

               if (response.ok)
               {
                  await this.LoadEvents();
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
            this.isLoadingEv = false;
         }
      }
   }


   OnFilterRisorsa()
   {
      this.fltrRisorsa = (this.fltrRisorsaItems)?((this.fltrRisorsaItems.length > 0)?true:false):false;
      try
      {
         this.fltrDlgRef = this.fltrDialogService.open(MultiSelectModalComponent, {
            //header: 'Filtro Risorse',
            width: '25vw', // Larghezza della modale
            height: '30vw',
            data: {
               options: this.listaRisorse,
               preSelectedOptions: this.fltrRisorsaItems,
               customTitle: 'Filtro per Risorse'
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
                     this.fltrRisorsaItems = result.selectedOptions;
                     console.log('Opzioni selezionate (OK):', this.fltrRisorsaItems);
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
               this.fltrRisorsa = (this.fltrRisorsaItems)?((this.fltrRisorsaItems.length > 0)?true:false):false;
               this.cdr.detectChanges ();
               this.LoadEvents();
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


   OnFilterGruppo()
   {
      try
      {
         this.fltrDlgRef = this.fltrDialogService.open(MultiSelectModalComponent, {
            //header: 'Filtro Gruppi',
            width: '25vw', // Larghezza della modale
            height: '30vw',
            data: {
               options: this.listaGruppi,
               preSelectedOptions: this.fltrGruppoItems,
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
                     this.fltrGruppoItems = result.selectedOptions;
                     console.log('Opzioni selezionate (OK):', this.fltrGruppoItems);
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
               this.fltrGruppo = (this.fltrGruppoItems)?((this.fltrGruppoItems.length > 0)?true:false):false;
               this.cdr.detectChanges ();
               this.LoadEvents();
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



}
