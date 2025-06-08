
import {
   ChangeDetectorRef,
   Component,
   OnInit
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService} from "../../services/auth.service";
import { Router} from "@angular/router";
import { RuoliService } from "../../services/ruoli.service";
import { MessDlgData,
   Ruolo } from "../../models/datamod";
import { MessageDialogService } from "../../services/message-dialog.service";
import {ButtonDirective} from "primeng/button";
import {CardModule} from "primeng/card";
import {InputTextModule} from "primeng/inputtext";
import {InputNumberModule} from "primeng/inputnumber";
import {NgIf} from "@angular/common";
import {PaginatorModule} from "primeng/paginator";
import {PrimeTemplate} from "primeng/api";


@Component({
  selector:    'app-ruolo-edit',
  standalone:  true,
              imports: [
                 ButtonDirective,
                 InputNumberModule,
                 CardModule,
                 InputTextModule,
                 NgIf,
                 PaginatorModule,
                 PrimeTemplate
              ],
  templateUrl: './ruolo-edit.component.html',
  styleUrl:    './ruolo-edit.component.css'
})
export class RuoloEditComponent implements OnInit
{
   id: number = 0;
   ruolo = '';
   attributo: number = 0;
   theError = false;
   errorMessage: string = "Il campo non può essere vuoto";
   operazione: string = "";

   constructor (private authService: AuthService,
                private resourceService: RuoliService,
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
                                                                          this.ruolo = (data.elements as Ruolo).ruolo; // data.elements NON è un array ma invece è semplicemente il solo elementp selezionato
                                                                          this.attributo = (data.elements as Ruolo).attributo;
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
      if (this.ruolo.trim() == "")
      {
         this.errorMessage = "Il nome non può essere vuoto.";
         this.theError = true;
      }
      else
      {
         if (this.id > 0)
         {
            // EDIT
            this.resourceService.updateData (this.id,
                                             this.ruolo,
                                             this.attributo).subscribe ({
                                                                        next:  (response) =>
                                                                                  {
                                                                                     if (response.ok)
                                                                                     {
                                                                                        console.log ('Item aggiornato:', response);
                                                                                        this.router.navigate (['/ruolitable']);
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
            this.resourceService.addNewData(this.ruolo,
                                            this.attributo).subscribe ({
                                                                       next:  (response) =>
                                                                                 {
                                                                                    if (response.ok)
                                                                                    {
                                                                                       console.log ('Item aggiunto:', response);
                                                                                       this.router.navigate (['/ruolitable']);
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
      this.router.navigate(['/ruolitable']);
   }

}
