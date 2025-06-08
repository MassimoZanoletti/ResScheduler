
import {
   ChangeDetectorRef,
   Component,
   OnInit
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService} from "../../services/auth.service";
import { Router} from "@angular/router";
import { CategorieService} from "../../services/categorie.service";
import { MessDlgData,
   Categoria} from "../../models/datamod";
import { MessageDialogService } from "../../services/message-dialog.service";
import {ButtonDirective} from "primeng/button";
import {CardModule} from "primeng/card";
import {InputTextModule} from "primeng/inputtext";
import {InputNumberModule} from "primeng/inputnumber";
import {NgIf} from "@angular/common";
import {PaginatorModule} from "primeng/paginator";
import {PrimeTemplate} from "primeng/api";

@Component({
  selector:    'app-categoria-edit',
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
  templateUrl: './categoria-edit.component.html',
  styleUrl:    './categoria-edit.component.css'
})
export class CategoriaEditComponent implements OnInit
{
   id: number = 0;
   nome = '';
   theError = false;
   errorMessage: string = "Il campo non può essere vuoto";
   operazione: string = "";

   constructor (private authService: AuthService,
                private resourceService: CategorieService,
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
                                                                          this.nome = (data.elements as Categoria).nome; // data.elements NON è un array ma invece è semplicemente il solo elementp selezionato
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
            this.resourceService.updateData (this.id,
                                             this.nome).subscribe ({
                                                                        next:  (response) =>
                                                                                  {
                                                                                     if (response.ok)
                                                                                     {
                                                                                        console.log ('Item aggiornato:', response);
                                                                                        this.router.navigate (['/categorietable']);
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
            this.resourceService.addNewData(this.nome).subscribe ({
                                                                       next:  (response) =>
                                                                                 {
                                                                                    if (response.ok)
                                                                                    {
                                                                                       console.log ('Item aggiunto:', response);
                                                                                       this.router.navigate (['/categorietable']);
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
      this.router.navigate(['/categorietable']);
   }

}
