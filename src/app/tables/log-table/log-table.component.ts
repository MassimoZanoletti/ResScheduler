import {ChangeDetectorRef, Component, ElementRef, HostListener, OnInit, ViewChild } from '@angular/core';
import {BlockUIModule} from "primeng/blockui";
import {Button, ButtonModule} from "primeng/button";
import {CardModule} from "primeng/card";
import {CommonModule, NgIf} from "@angular/common";
import {PrimeTemplate} from "primeng/api";
import {ProgressSpinnerModule} from "primeng/progressspinner";
import {TableModule} from "primeng/table";
import {TooltipModule} from "primeng/tooltip";
import { LogMessage,
   MessDlgData} from "../../models/datamod";
import {Router} from "@angular/router";
import {MessageDialogService} from "../../services/message-dialog.service";
import {loggedUser} from "../../services/users.service";
import {LogService} from "../../services/log.service";

@Component({
  selector:    'app-log-table',
  standalone:  true,
              imports: [
                 Button,
                 PrimeTemplate,
                 TableModule,
                 TooltipModule,
                 CommonModule,
                 ButtonModule,
                 TooltipModule,
                 CardModule,
                 ProgressSpinnerModule,
                 BlockUIModule
              ],
  templateUrl: './log-table.component.html',
  styleUrl:    './log-table.component.css'
})
export class LogTableComponent implements OnInit
{
   windowHeight: number = 110;
   scrollHeight: string = "110px";
   isLoading: boolean = false;
   public tblData: Array<LogMessage> = [];
   @ViewChild ('tableContainer') tableContainer?: ElementRef<HTMLElement>;
   filtroSessione: string | null = null;


   // Mostra le righe più recenti: porta la tabella all'ultima riga.
   // Dopo un setTimeout, così le righe sono già state disegnate.
   VaiInFondo (): void
   {
      setTimeout (() =>
                  {
                     const wrapper = this.tableContainer?.nativeElement.querySelector ('.p-datatable-wrapper') as HTMLElement | null;
                     if (wrapper)
                        wrapper.scrollTop = wrapper.scrollHeight;
                  });
   }
   private righeFiltrate: Array<LogMessage> = [];
   private righeFiltrateDa: Array<LogMessage> | null = null;
   private righeFiltratePer: string | null = null;


   // Le prime 8 cifre bastano a distinguere le sessioni a colpo d'occhio
   CodiceBreve (sessione: string | null): string
   {
      return (sessione ?? "").substring (0, 8);
   }


   FiltraSessione (sessione: string | null): void
   {
      this.filtroSessione = sessione;
      this.VaiInFondo ();
   }


   // Filtro calcolato solo quando cambiano dati o sessione scelta, non a ogni ciclo di change detection
   RigheVisibili (): Array<LogMessage>
   {
      if (!this.filtroSessione)
         return this.tblData;
      if ((this.righeFiltrateDa !== this.tblData) || (this.righeFiltratePer !== this.filtroSessione))
      {
         this.righeFiltrate = this.tblData.filter (r => r.sessione === this.filtroSessione);
         this.righeFiltrateDa = this.tblData;
         this.righeFiltratePer = this.filtroSessione;
      }
      return this.righeFiltrate;
   }


   constructor (public router: Router,
                private cdr: ChangeDetectorRef,
                public theDataService: LogService,
                private messageDialogService: MessageDialogService)
   {
   }


   ngOnInit (): void
   {
      this.GetWindowSize ();
      //
      this.isLoading = true;
      this.LoadData ();
   }


   LoadData ()
   {
      this.isLoading = true;
      this.theDataService.getAllData().subscribe (data =>
                                                  {
                                                     if (data)
                                                     {
                                                        if (data.ok)
                                                        {
                                                           this.tblData = data.elements;
                                                        }
                                                        else
                                                        {
                                                           const dlgData: MessDlgData = {
                                                              title:      'ERRORE',
                                                              subtitle:   'Errore durante il caricamento dei dati dal server',
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
                                                           subtitle:   'Errore durante il caricamento dei dati dal server',
                                                           message:    `No data returned`,
                                                           messtype:   'error',
                                                           btncaption: 'Chiudi'
                                                        };
                                                        this.messageDialogService.showMessage (dlgData, '600px');
                                                     }
                                                     this.isLoading = false;
                                                     this.cdr.detectChanges ();
                                                     this.VaiInFondo ();
                                                  });
   }


   AddEnabled (): boolean
   {
      return (loggedUser.attributo > 0);
   }


   EditEnabled (row: any): boolean
   {
      return (loggedUser.attributo > 0);
   }


   DeleteEnabled (row: any): boolean
   {
      return (loggedUser.attributo > 1);
   }


   onAdd (): void
   {
      this.router.navigate ([`/categoriaedit`], {state: {id: 0}});
   }


   onEdit (item: any): void
   {
      this.router.navigate ([`/categoriaedit`], {state: {id: item.id}});
   }


   onDelete (item: any): void
   {
      const dlgData: MessDlgData = {
         title:               'Cancellazione Log',
         subtitle:            '',
         message:             `Sei veramente sicuro di voloer cancellare il log '<b>${item.nome}</b>' dal database?`,
         messtype:            'warning',
         btncaption:          'Annulla',
         showCancelButton:    true,
         cancelButtonCaption: 'Sì, procedi'
      };

      this.messageDialogService.showMessage (dlgData, '', true).subscribe (result =>
                                                                           {
                                                                              if (result === 'secondary')
                                                                              {
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


   getRowColorClass (rowIndex: number): string
   {
      if ((rowIndex % 3) == 1)
         return "row-bck-1";
      if ((rowIndex % 3) == 2)
         return "row-bck-2";
      return "row-bck-0";
   }


   async GetWindowSize ()
   {
      this.windowHeight = window.innerHeight;
      // 48 px recuperati dalla barra in alto più compatta
      let sh: number = this.windowHeight - 80 - 10 - 180 + 48;
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

