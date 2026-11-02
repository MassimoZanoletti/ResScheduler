
import {
   ChangeDetectorRef, Component,
   OnInit
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService} from "../../services/auth.service";
import { Router} from "@angular/router";
import { RisorseService } from "../../services/risorse.service";
import { GruppiService } from "../../services/gruppi.service";
import { EventiMasterService } from "../../services/eventi-master.service";
import { EventiService } from "../../services/eventi.service";
import {
   MessDlgData,
   SeasonElement,
   EventoMasterElement,
   globs,
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
import {utils} from "../../common/utils";
import {firstValueFrom} from "rxjs";
import {EventoElement} from "../../models/datamod";
import {DescriviEvento,
        EscapeHtml,
        IdRisorseTrasferta,
        IntervalliSovrapposti,
        IntervalloMinuti,
        OccupaRisorsa} from "../../common/sovrapposizioni";


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
                 CheckboxModule
              ],
  templateUrl: './evento-master-edit.component.html',
  styleUrl:    './evento-master-edit.component.css'
})
export class EventoMasterEditComponent implements OnInit
{
   id: number = 0;
   request: string = "";
   isAdd: boolean = false;
   year: number = 0;
   month: number = 0;
   day: number = 0;
   endyear: number = 0;
   endmonth: number = 0;
   endday: number = 0;
   season_id: number = 0;
   errorMessage: string = "Il campo non può essere vuoto";
   theError = false;
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
   isLoadingRisorse: boolean = false;
   isLoadingGrup: boolean = false;



   constructor (private authService: AuthService,
                private eventiService: EventiMasterService,
                private eventoFiglioService: EventiService,
                private resourceService: RisorseService,
                private gruppiService: GruppiService,
                private router: Router,
                private cdr: ChangeDetectorRef,
                private messageDialogService: MessageDialogService,
                private logService: LogService)
   {
   }


   async ngOnInit ()
   {
      this.id = Number(history.state.id);
      this.isAdd = Boolean(history.state.isadd);
      this.year = Number(history.state.year);
      this.month = Number(history.state.month);
      this.day = Number(history.state.day);
      this.request = history.state.request.toString();
      this.season_id = Number(history.state.season_id);
      //
      // Palestre e gruppi sono indipendenti: si caricano in parallelo
      const [dataRis, dataGrp] = await Promise.all ([firstValueFrom (this.resourceService.getAllData ()),
                                                     firstValueFrom (this.gruppiService.getAllData ())]);
      if ((dataRis) && (dataRis.ok))
         this.listaRisorse = dataRis.elements;
      if ((dataGrp) && (dataGrp.ok))
         this.listaGruppi = dataGrp.elements;
      console.log(`EDIT: 2`);
      if (this.id > 0)
      {
         console.log(`EDIT: id > 0`);
         this.operazione = `Modifica `;
         console.log(`EDIT: operazione: ${this.operazione}`);
         const dataRes = await firstValueFrom(this.eventiService.getSingleData(this.id));
         if ((dataRes) && (dataRes.ok))
         {
            this.data = new Date((dataRes.elements as EventoMasterElement).data);
            this.datafine = new Date(dataRes.elements.data_fine);
            this.orainizio = await this.TimeFromString((dataRes.elements as EventoMasterElement).data, (dataRes.elements as EventoMasterElement).orainizio);
            this.orafine = await this.TimeFromString((dataRes.elements as EventoMasterElement).data, (dataRes.elements as EventoMasterElement).orafine);
            this.risorsa_id = (dataRes.elements as EventoMasterElement).risorsa_id;
            const currr = this.listaRisorse.findIndex(elemento => elemento.id == this.risorsa_id);
            if (currr != -1)
               this.currRisorsa = this.listaRisorse[currr];
            this.gruppo_id = (dataRes.elements as EventoMasterElement).gruppo_id;
            const currg = this.listaGruppi.findIndex (elemento => elemento.id == this.gruppo_id);
            if (currg != -1)
               this.currGruppo = this.listaGruppi[currg];
            this.commento = (dataRes.elements as EventoMasterElement).commento;
         }
      }
      else
      {
         console.log(`EDIT: id == 0`);
         this.operazione = `Nuovo `;
         console.log(`EDIT: operazione: ${this.operazione}`);
         this.data = new Date();
         this.data.setFullYear(this.year);
         this.data.setMonth(this.month-1);
         this.data.setDate(this.day);
         this.data.setHours(0,0,0,0);
         //
         this.datafine = new Date();
         this.datafine.setFullYear(this.year);
         this.datafine.setMonth(this.month-1);
         this.datafine.setDate(this.day);
         this.datafine.setHours(0,0,0,0);
         //
         this.orainizio = new Date(this.data);
         this.orainizio.setHours(0,0,0,0);
         //
         this.orafine = new Date(this.data);
         this.orafine.setHours(0,0,0,0);
      }
      this.cdr.detectChanges();
   }


   /*
      Controllo sovrapposizioni (lato client) per l'evento periodico.
      Calcola i giorni in cui verra' creato l'evento (dal giorno iniziale, ogni 7 giorni,
      fino al giorno finale, come nel salvataggio) e cerca gli altri eventi nella stessa
      palestra, in quei giorni, con orario che si accavalla. Se ne trova, chiede conferma.
      Ritorna true se si puo' procedere con il salvataggio.
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
      // Senza date, senza palestra, in trasferta o senza orario non c'e' nulla da controllare
      if ((this.data == null) || (this.datafine == null) || (this.risorsa_id <= 0))
         return [];
      const trasferte: Set<number> = IdRisorseTrasferta (this.listaRisorse);
      if (trasferte.has (Number (this.risorsa_id)))
         return [];
      const nuovo = IntervalloMinuti (this.orainizio, this.orafine);
      if (nuovo == null)
         return [];

      // Giorni in cui verra' creato l'evento
      const giorni: Set<string> = new Set<string> ();
      const ultimo: string = utils.DataPerDb (this.datafine);
      const giorno: Date = new Date (this.data);
      while (utils.DataPerDb (giorno) <= ultimo)
      {
         giorni.add (utils.DataPerDb (giorno));
         giorno.setDate (giorno.getDate () + 7);
      }
      if (giorni.size == 0)
         return [];

      try
      {
         const stagione: number | null = (this.season_id > 0) ? this.season_id : null;
         // tipoevento -1 = tutti i tipi
         const resp = await firstValueFrom (this.eventoFiglioService.getAllData (stagione, -1, [this.risorsa_id], null, null, null));
         if ((!resp) || (!resp.ok))
            return null;
         return (resp.elements as Array<EventoElement>).filter (ev =>
         {
            // In modifica, gli eventi generati da questo stesso periodico vengono cancellati e ricreati
            if ((this.id > 0) && (ev.master_id == this.id))
               return false;
            if ((!OccupaRisorsa (ev, trasferte)) || (ev.risorsa_id != this.risorsa_id))
               return false;
            if (!giorni.has (utils.DataPerDb (ev.data)))
               return false;
            const altro = IntervalloMinuti (ev.orainizio, ev.orafine);
            return ((altro != null) && (IntervalliSovrapposti (nuovo, altro)));
         }).sort ((a, b) => a.orainizio.getTime () - b.orainizio.getTime ());
      }
      catch (e)
      {
         console.error ("CercaSovrapposizioni:", e);
         return null;
      }
   }


   /*
      Controlli prima del salvataggio. Ritorna l'elenco degli errori (una riga ciascuno),
      stringa vuota se e' tutto a posto. Stesse regole del form evento normale,
      piu' il controllo sul periodo (giorno finale non prima di quello iniziale).
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
      if (this.currRisorsa == null)
         errori.push ("• Selezionare la palestra.");
      if (this.currGruppo == null)
         errori.push ("• Selezionare il gruppo.");
      errori.push (...utils.ErroriOrario (this.orainizio, this.orafine));
      return errori.join ("\n");
   }


   async TimeFromString(aDate: Date,
                        aTime: Date): Promise<Date>
   {
      const sTime: string = aTime.toString();
      let result: Date = new Date (aDate);
      const hours: number = parseInt(sTime.substring(0, 2), 10);
      const minutes: number = parseInt(sTime.substring(3, 5), 10);
      result.setHours(hours, minutes, 0, 0);
      return result;
   }


   async Salva()
   {
      try
      {
         console.log("Salva");
         const errori: string = this.Valida ();
         if (errori != "")
         {
            const dlgData: MessDlgData = {
               title:      'ATTENZIONE',
               subtitle:   'Dati incompleti o non validi',
               message:    errori,
               messtype:   'warning',
               btncaption: 'Chiudi'
            };
            this.messageDialogService.showMessage (dlgData, '600px');
            return;
         }
         if (this.currRisorsa)
         {
            this.risorsa_id = this.currRisorsa.id;
         }
         else
            this.risorsa_id = 0;
         //
         if (this.currGruppo)
         {
            this.gruppo_id = this.currGruppo.id;
         }
         else
            this.gruppo_id = 0;
         //
         if (!(await this.ConfermaSovrapposizioni ()))
            return;
         //
         if (this.isAdd)
         {
            const response = await firstValueFrom (this.eventiService.addNewData((this.data) ? utils.DataPerDb (this.data) : "",
                                                                                 (this.datafine) ? utils.DataPerDb (this.datafine) : "",
                                                                                 utils.OraPerDb (this.orainizio),
                                                                                 utils.OraPerDb (this.orafine),
                                                                                 this.risorsa_id,
                                                                                 this.gruppo_id,
                                                                                 this.commento,
                                                                                 this.season_id));

            if (response.ok)
            {
               let newId: number = 0;
               // Il server restituisce l'id del nuovo evento periodico come primo elemento
               if (response.elements.length > 0)
                  newId = Number (response.elements[0]) || 0;
               console.log (`Item aggiunto: `, response);
               if ((newId > 0) && (this.data) && (this.datafine) && (this.orainizio) && (this.orafine))
               {
                  // aggiungo tutti gli eventi figli nella tabella degli eventi
                  // Come prima cosa prendo il giorno della settimana dell'evento
                  let currDay: Date = new Date(this.data);
                  while (currDay <= this.datafine)
                  {
                     currDay.setHours(0);
                     currDay.setMinutes(0);
                     currDay.setSeconds(0);
                     await firstValueFrom (this.eventoFiglioService.addNewData(utils.DataPerDb (currDay),
                                                                               utils.OraPerDb (this.orainizio),
                                                                               utils.OraPerDb (this.orafine),
                                                                               this.risorsa_id,
                                                                               this.gruppo_id,
                                                                               "", // casa
                                                                               "", // ospite
                                                                               "", // luogo
                                                                               this.commento,
                                                                               false,
                                                                               TipoEvento.EventoPeriodico,
                                                                               this.season_id,
                                                                               newId));
                     //
                     currDay.setDate(currDay.getDate() + 7);   // incremento di 7 giorni
                  }
               }
               this.router.navigate (['/eventimastertable']);
            }
            else
            {
               const dlgData: MessDlgData = {
                  title:      'ERRORE',
                  subtitle:   "Errore nell'inserimento dei dati",
                  message:    `${response.message}`,
                  messtype:   'error',
                  btncaption: 'Chiudi'
               };
               this.messageDialogService.showMessage (dlgData, '600px');
            }
         }
         else
         {
            const response = await firstValueFrom (this.eventiService.updateData (this.id,
                                                                                  (this.data) ? utils.DataPerDb (this.data) : "",
                                                                                  (this.datafine) ? utils.DataPerDb (this.datafine) : "",
                                                                                  utils.OraPerDb (this.orainizio),
                                                                                  utils.OraPerDb (this.orafine),
                                                                                  this.risorsa_id,
                                                                                  this.gruppo_id,
                                                                                  this.commento,
                                                                                  this.season_id));

            if (response.ok)
            {
               console.log ('Item aggiornato:', response);
               if ((this.data) && (this.datafine) && (this.orainizio) && (this.orafine))
               {
                  // cancello tutti gli eventi periodici figli
                  await firstValueFrom (this.eventoFiglioService.DeletePeriodic(this.id));
                  // .. e poi li ricreo
                  let currDay: Date = new Date(this.data);
                  while (currDay <= this.datafine)
                  {
                     currDay.setHours(0);
                     currDay.setMinutes(0);
                     currDay.setSeconds(0);
                     await firstValueFrom (this.eventoFiglioService.addNewData(utils.DataPerDb (currDay),
                                                                               utils.OraPerDb (this.orainizio),
                                                                               utils.OraPerDb (this.orafine),
                                                                               this.risorsa_id,
                                                                               this.gruppo_id,
                                                                               "", // casa
                                                                               "", // ospite
                                                                               "", // luogo
                                                                               this.commento,
                                                                               false,
                                                                               TipoEvento.EventoPeriodico,
                                                                               this.season_id,
                                                                               this.id));
                     //
                     currDay.setDate(currDay.getDate() + 7);   // incremento di 7 giorni
                  }
               }
               this.router.navigate (['/eventimastertable']);
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
      catch (error: any)
      { // Cattura sia gli errori HTTP che altri errori di codice
         console.error("Errore durante l'inserimento dell'item:", error);
         await this.logService.AddToLog (loggedUser, `Errore durante l'inserimento dell'item: '${JSON.stringify(error,null,-1)}'`);
         const dlgData: MessDlgData = {
            title: 'ERRORE',
            subtitle: "Errore nell'inserimento dei dati",
            message: `${error.message || 'Si è verificato un errore inatteso.'}`,
            messtype: 'error',
            btncaption: 'Chiudi'
         };
         this.messageDialogService.showMessage(dlgData, '600px');
      }

      /*
      if (this.nome.trim() == "")
      {
         this.errorMessage = "Il nome non può essere vuoto.";
         this.theError = true;
      }
      else
      {
         if (this.id > 0)
         {
            // EDIT
            if ((this.dataInizio != null) && (this.dataFine != null))
               this.resourceService.updateData (this.id,
                                                this.nome,
                                                this.dataInizio.toLocaleDateString('ja-JP'),
                                                this.dataFine.toLocaleDateString('ja-JP')).subscribe ({
                                                                                                         next:  (response) =>
                                                                                                                   {
                                                                                                                      if (response.ok)
                                                                                                                      {
                                                                                                                         console.log ('Item aggiornato:', response);
                                                                                                                         this.router.navigate (['/seasonstable']);
                                                                                                                      }
                                                                                                                      else
                                                                                                                      {
                                                                                                                         const dlgData: MessDlgData = {
                                                                                                                            title: 'ERRORE',
                                                                                                                            subtitle: "Errore nell'aggiornamento dei dati",
                                                                                                                            message: `${response.message}`,
                                                                                                                            messtype: 'error',
                                                                                                                            btncaption: 'Chiudi'
                                                                                                                         };
                                                                                                                         this.messageDialogService.showMessage(dlgData, '600px');
                                                                                                                      }
                                                                                                                   },
                                                                                                         error: (error) =>
                                                                                                                   {
                                                                                                                      const dlgData: MessDlgData = {
                                                                                                                         title: 'ERRORE',
                                                                                                                         subtitle: "Errore nell'aggiornamento dei dati",
                                                                                                                         message: `${error.message}`,
                                                                                                                         messtype: 'error',
                                                                                                                         btncaption: 'Chiudi'
                                                                                                                      };
                                                                                                                      this.messageDialogService.showMessage(dlgData, '600px');
                                                                                                                   }
                                                                                                      });
         }
         else
         {
            // ADD NEW
            if ((this.dataInizio != null) && (this.dataFine != null))
               this.resourceService.addNewData(this.nome,
                                               this.dataInizio.toLocaleDateString('ja-JP'),
                                               this.dataFine.toLocaleDateString('ja-JP')).subscribe ({
                                                                                                        next:  (response) =>
                                                                                                                  {
                                                                                                                     if (response.ok)
                                                                                                                     {
                                                                                                                        console.log ('Item aggiunto:', response);
                                                                                                                        this.router.navigate (['/seasonstable']);
                                                                                                                     }
                                                                                                                     else
                                                                                                                     {
                                                                                                                        const dlgData: MessDlgData = {
                                                                                                                           title: 'ERRORE',
                                                                                                                           subtitle: "Errore nella scrittura dei dati",
                                                                                                                           message: `${response.message}`,
                                                                                                                           messtype: 'error',
                                                                                                                           btncaption: 'Chiudi'
                                                                                                                        };
                                                                                                                        this.messageDialogService.showMessage(dlgData, '600px');
                                                                                                                     }
                                                                                                                  },
                                                                                                        error: (error) =>
                                                                                                                  {
                                                                                                                     const dlgData: MessDlgData = {
                                                                                                                        title: 'ERRORE',
                                                                                                                        subtitle: "Errore nella scrittura dei dati",
                                                                                                                        message: `${error.message}`,
                                                                                                                        messtype: 'error',
                                                                                                                        btncaption: 'Chiudi'
                                                                                                                     };
                                                                                                                     this.messageDialogService.showMessage(dlgData, '600px');
                                                                                                                  }
                                                                                                     });
         }
      }
      */
   }


   async Annulla()
   {
      this.router.navigate(['/eventimastertable']);
   }


   async SetOraFine()
   {
      if ((this.orainizio) && (this.orafine))
      {
         const newOraFine = new Date(this.orainizio || new Date());
         newOraFine.setHours(this.orainizio.getHours() + 1, this.orainizio.getMinutes() + 30, 0, 0);
         this.orafine = newOraFine;
      }
   }
}
