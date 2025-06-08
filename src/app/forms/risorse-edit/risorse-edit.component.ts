
import {
   ChangeDetectorRef,
   Component,
   OnInit
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService} from "../../services/auth.service";
import { Router} from "@angular/router";
import { RisorseService } from "../../services/risorse.service";
import { SocietaService } from "../../services/societa.service";
import {
   MessDlgData,
   Resource,
   Societa } from "../../models/datamod";
import { MessageDialogService } from "../../services/message-dialog.service";
import {ButtonDirective} from "primeng/button";
import {CardModule} from "primeng/card";
import {InputTextModule} from "primeng/inputtext";
import {NgIf} from "@angular/common";
import {PaginatorModule} from "primeng/paginator";
import {PrimeTemplate} from "primeng/api";
import {DropdownModule} from 'primeng/dropdown';
import {utils} from "../../common/utils";
import {UserService} from "../../services/users.service";
import {RuoliService} from "../../services/ruoli.service";
import {ColorPickerModule} from "primeng/colorpicker";



@Component({
  selector:    'app-risorse-edit',
  standalone:  true,
              imports: [
                 ButtonDirective,
                 CardModule,
                 DropdownModule,
                 InputTextModule,
                 NgIf,
                 PaginatorModule,
                 PrimeTemplate,
                 ColorPickerModule,
                 CommonModule
              ],
  templateUrl: './risorse-edit.component.html',
  styleUrl:    './risorse-edit.component.css'
})
export class RisorseEditComponent implements OnInit
{
   isLoading: boolean = false;
   id: number = 0;
   nome = '';
   abbreviazione: string = "";
   indirizzo: string = "";
   coloreTesto: string = "#FFFFFF";
   coloreSfondo: string = "#000000";
   soc_id: number = 0;
   listaSocieta: Array<Societa> = [];
   currSoc: Societa | undefined;

   theError = false;
   errorMessage: string = "Il campo non può essere vuoto";
   operazione: string = "";

   constructor (private authService: AuthService,
                private resourceService: RisorseService,
                private societaService: SocietaService,
                private router: Router,
                private cdr: ChangeDetectorRef,
                private messageDialogService: MessageDialogService)
   {
   }


   async ngOnInit ()
   {
      this.id = history.state.id;
      //
      this.societaService.getAllData().subscribe(data2 =>
                                               {
                                                  if (data2)
                                                  {
                                                     if (data2.ok)
                                                     {
                                                        this.listaSocieta = data2.elements;
                                                        //
                                                     }
                                                     else
                                                     {
                                                     }
                                                  }
                                                  else
                                                  {
                                                  }
                                                  this.isLoading = false;
                                               });
      //
      if (this.id > 0)
      {
         this.operazione = "Modifica ";
         while (this.isLoading) // necessario per attendere che tutti i ruoli siano caricati nell'array
            await utils.Dlt_Sleep(50);
         await utils.Dlt_Sleep(150); // anche questo necessario
         this.isLoading = true;
         this.resourceService.getSingleData (this.id).subscribe (data =>
                                                                 {
                                                                    if (data)
                                                                    {
                                                                       if (data.ok)
                                                                       {
                                                                          this.nome = (data.elements as Resource).nome; // data.elements NON è un array ma invece è semplicemente il solo elementp selezionato
                                                                          this.abbreviazione = (data.elements as Resource).abbreviazione;
                                                                          this.indirizzo = (data.elements as Resource).indirizzo;
                                                                          this.coloreTesto = (data.elements as Resource).coloretesto;
                                                                          this.coloreSfondo = (data.elements as Resource).coloresfondo;
                                                                          this.soc_id = (data.elements as Resource).societa_id;
                                                                          //
                                                                          const curr = this.listaSocieta.findIndex(elemento => elemento.id == this.soc_id);
                                                                          if (curr != -1)
                                                                             this.currSoc = this.listaSocieta[curr];

                                                                       }
                                                                    }
                                                                    this.cdr.detectChanges();
                                                                    this.isLoading = false;
                                                                 });
      }
      else
      {
         this.operazione = "Aggiungi Nuovo ";
         this.isLoading = false;
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
            if (this.currSoc)
            {
               this.soc_id = this.currSoc.id;
            }
            else
               this.soc_id = 0;
            this.resourceService.updateData (this.id,
                                       this.nome,
                                       this.abbreviazione,
                                       this.indirizzo,
                                       this.coloreTesto,
                                       this.coloreSfondo,
                                       this.soc_id).subscribe ({
                                                                    next:  (response) =>
                                                                              {
                                                                                 if (response.ok)
                                                                                 {
                                                                                    console.log ('Item aggiornato:', response);
                                                                                    this.router.navigate (['/risorsetable']);
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
            if (this.currSoc)
            {
               this.soc_id = this.currSoc.id;
            }
            else
               this.soc_id = 0;
            this.resourceService.addNewData(this.nome,
                                            this.abbreviazione,
                                            this.indirizzo,
                                            this.coloreTesto,
                                            this.coloreSfondo,
                                            this.soc_id).subscribe ({
                                                                         next:  (response) =>
                                                                                   {
                                                                                      if (response.ok)
                                                                                      {
                                                                                         console.log ('Item aggiunto:', response);
                                                                                         this.router.navigate (['/risorsetable']);
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
      this.router.navigate(['/risorsetable']);
   }

}
