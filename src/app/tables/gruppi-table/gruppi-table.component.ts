import {ChangeDetectorRef,
   ChangeDetectionStrategy,
   Component,
   OnInit} from '@angular/core';
import {
   CommonModule,
   NgIf
} from '@angular/common';
import {BlockUIModule} from "primeng/blockui";
import {Button,
   ButtonModule} from "primeng/button";
import {CardModule} from "primeng/card";
import {PrimeTemplate} from "primeng/api";
import {ProgressSpinnerModule} from "primeng/progressspinner";
import {TableModule} from "primeng/table";
import {TooltipModule} from "primeng/tooltip";
import {MessDlgData,
   Gruppo } from "../../models/datamod";
import { GruppiService } from "../../services/gruppi.service";
import {Router} from "@angular/router";
import {MessageDialogService} from "../../services/message-dialog.service";
import { loggedUser } from "../../services/users.service";

@Component({
  selector:    'app-gruppi-table',
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
  templateUrl: './gruppi-table.component.html',
  styleUrl:    './gruppi-table.component.css'
})
export class GruppiTableComponent implements OnInit
{
   isLoading: boolean = false;
   public tblData: Array<Gruppo> = [];


   constructor (public router: Router,
                private cdr: ChangeDetectorRef,
                public theDataService: GruppiService,
                private messageDialogService: MessageDialogService)
   {
   }


   ngOnInit (): void
   {
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
      this.router.navigate ([`/gruppoedit`], {state: {id: 0}});
   }


   onEdit (item: any): void
   {
      this.router.navigate ([`/gruppoedit`], {state: {id: item.id}});
   }


   onDelete (item: any): void
   {
      const dlgData: MessDlgData = {
         title:               'Cancellazione Gruppo',
         subtitle:            '',
         message:             `Sei veramente sicuro di voloer cancellare il gruppo '<b>${item.nome}</b>' dal database?`,
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


   ColoreRisorsa (gruppo: Gruppo): any
   {
      return {'background-color': `${gruppo.coloresfondo}`, 'color': `${gruppo.coloretesto}`};
   }

}

