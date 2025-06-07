
import {
   ChangeDetectorRef, Component,
   OnInit
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService} from "../../services/auth.service";
import { Router} from "@angular/router";
import { SeasonsService} from "../../services/seasons.service";
import {MessDlgData, Season, SeasonElement} from "../../models/datamod";
import { MessageDialogService } from "../../services/message-dialog.service";

// PrimeNG modules
import { InputTextModule } from 'primeng/inputtext';
import { CalendarModule } from 'primeng/calendar';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';

@Component({
  selector:    'app-season-edit',
  standalone:  true,
  imports:     [

     CommonModule,
     FormsModule,
     InputTextModule,
     CalendarModule,
     ButtonModule,
     CardModule

  ],
  templateUrl: './season-edit.component.html',
  styleUrl:    './season-edit.component.css'
})
export class SeasonEditComponent implements OnInit
{
   id: number = 0;
   nome = '';
   dataInizio: Date | null = null;
   dataFine: Date | null = null;
   theError = false;
   errorMessage: string = "Il campo non può essere vuoto";
   operazione: string = "";

   constructor (private authService: AuthService,
                private resourceService: SeasonsService,
                private router: Router,
                private cdr: ChangeDetectorRef,
                private messageDialogService: MessageDialogService)
   {
   }


   ngOnInit ()
   {
      this.id = history.state.id;
      if (this.id > 0)
      {
         this.operazione = "Modifica ";
         this.resourceService.getSingleData (this.id).subscribe (data =>
                                                                 {
                                                                    if (data)
                                                                    {
                                                                       if (data.ok)
                                                                       {
                                                                          this.nome = (data.element[0] as SeasonElement).nome; // data.elements NON è un array ma invece è semplicemente il solo elementp selezionato
                                                                          this.dataInizio = new Date ((data.element[0] as SeasonElement).datainizio);
                                                                          this.dataFine = new Date ((data.element[0] as SeasonElement).datafine);
                                                                       }
                                                                    }
                                                                    this.cdr.detectChanges();
                                                                 });
      }
      else
      {
         this.operazione = "Aggiungi Nuova ";
      }
   }


   async Salva()
   {
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
   }


   async Annulla()
   {
      this.router.navigate(['/seasonstable']);
   }

}
