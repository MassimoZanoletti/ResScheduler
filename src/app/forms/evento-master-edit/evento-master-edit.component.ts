
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
      const dataRis = await firstValueFrom(this.resourceService.getAllData());
      const dataGrp = await firstValueFrom(this.gruppiService.getAllData());
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
            const currg = this.listaRisorse.findIndex(elemento => elemento.id == this.gruppo_id);
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
         //
         if (this.isAdd)
         {
            const response = await firstValueFrom (this.eventiService.addNewData((this.data) ? this.data.toLocaleDateString ('ja-JP') : "",
                                                                                 (this.datafine) ? this.datafine.toLocaleDateString ('ja-JP') : "",
                                                                                 `${this.orainizio?.getHours ()}:${this.orainizio?.getMinutes ()}`,
                                                                                 `${this.orafine?.getHours ()}:${this.orafine?.getMinutes ()}`,
                                                                                 this.risorsa_id,
                                                                                 this.gruppo_id,
                                                                                 this.commento,
                                                                                 this.season_id));

            if (response.ok)
            {
               let newId: number = 0;
               if (response.elements.length > 0)
               {
                  try
                  {
                     newId = Number(response.elements[0]);
                  }
                  catch(err)
                  {
                  }
               }
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
                     await firstValueFrom (this.eventoFiglioService.addNewData(currDay.toLocaleDateString ('ja-JP'),
                                                                               `${this.orainizio.getHours ()}:${this.orainizio.getMinutes ()}`,
                                                                               `${this.orafine.getHours ()}:${this.orafine.getMinutes ()}`,
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
                                                                                  (this.data) ? this.data.toLocaleDateString ('ja-JP') : "",
                                                                                  (this.datafine) ? this.datafine.toLocaleDateString ('ja-JP') : "",
                                                                                  `${this.orainizio?.getHours ()}:${this.orainizio?.getMinutes ()}`,
                                                                                  `${this.orafine?.getHours ()}:${this.orafine?.getMinutes ()}`,
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
                     await firstValueFrom (this.eventoFiglioService.addNewData(currDay.toLocaleDateString ('ja-JP'),
                                                                               `${this.orainizio.getHours ()}:${this.orainizio.getMinutes ()}`,
                                                                               `${this.orafine.getHours ()}:${this.orafine.getMinutes ()}`,
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
