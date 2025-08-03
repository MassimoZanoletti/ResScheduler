
import {
   ChangeDetectorRef,
   Component,
   OnInit
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService} from "../../services/auth.service";
import { Router} from "@angular/router";
import {loggedUser, UserService} from "../../services/users.service";
import {RuoliService} from "../../services/ruoli.service";
import { MessDlgData,
   User,
  Ruolo} from "../../models/datamod";
import { MessageDialogService } from "../../services/message-dialog.service";
import {ButtonDirective} from "primeng/button";
import {CardModule} from "primeng/card";
import {InputTextModule} from "primeng/inputtext";
import {InputNumberModule} from "primeng/inputnumber";
import {NgIf} from "@angular/common";
import {PaginatorModule} from "primeng/paginator";
import {PrimeTemplate} from "primeng/api";
import {DropdownModule} from 'primeng/dropdown';
import {utils} from "../../common/utils";
import { LogService } from "../../services/log.service";



@Component({
  selector:    'app-user-edit',
  standalone:  true,
              imports: [
                 ButtonDirective,
                 InputNumberModule,
                 CardModule,
                 InputTextModule,
                 NgIf,
                 PaginatorModule,
                 PrimeTemplate,
                 DropdownModule
              ],
  templateUrl: './user-edit.component.html',
  styleUrl:    './user-edit.component.css'
})
export class UserEditComponent implements OnInit
{
   fromWhere: string = "";
   isLoading: boolean = false;
   id: number = 0;
   nome = '';
   password: string = "";
   ruolo_id: number = 0;
   ruolo: string = "";
   listaRuoli: Array<Ruolo> = [];
   currRuolo: Ruolo | undefined;

   theError = false;
   errorMessage: string = "Il campo non può essere vuoto";
   operazione: string = "";

   constructor (private authService: AuthService,
                private resourceService: UserService,
                private ruoliService: RuoliService,
                private router: Router,
                private cdr: ChangeDetectorRef,
                private messageDialogService: MessageDialogService,
                private logService: LogService)
   {
   }


   async ngOnInit ()
   {
      this.id = history.state.id;
      if (history.state.from)
         this.fromWhere = history.state.from;
      //
      this.ruoliService.getAllData().subscribe(data2 =>
                                               {
                                                  if (data2)
                                                  {
                                                     if (data2.ok)
                                                     {
                                                        this.listaRuoli = data2.elements;
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
         this.isLoading = true;
         this.resourceService.getSingleData (this.id).subscribe (data =>
                                                                 {
                                                                    if (data)
                                                                    {
                                                                       if (data.ok)
                                                                       {
                                                                          this.nome = (data.elements as User).nome; // data.elements NON è un array ma invece è semplicemente il solo elementp selezionato
                                                                          this.password = (data.elements as User).password;
                                                                          this.ruolo = (data.elements as User).ruolo;
                                                                          this.ruolo_id = (data.elements as User).ruolo_id;
                                                                          //
                                                                          const curr = this.listaRuoli.findIndex(elemento => elemento.id == this.ruolo_id);
                                                                          if (curr != -1)
                                                                             this.currRuolo = this.listaRuoli[curr];

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
            if (this.currRuolo)
              this.ruolo_id = this.currRuolo.id;
            this.resourceService.updateData (this.id,
                                             this.nome,
                                             this.password,
                                             this.ruolo_id).subscribe ({
                                                                        next:  (response) =>
                                                                                  {
                                                                                     if (response.ok)
                                                                                     {
                                                                                        console.log ('Item aggiornato:', response);
                                                                                        this.logService.AddToLog (loggedUser, `Modificato Utente '${this.id} : ${this.nome}'`);
                                                                                        this.router.navigate (['/userstable']);
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
            if (this.currRuolo)
              this.ruolo_id = this.currRuolo.id;
            this.resourceService.addNewData(this.nome,
                                            this.password,
                                            this.ruolo_id).subscribe ({
                                                                       next:  (response) =>
                                                                                 {
                                                                                    if (response.ok)
                                                                                    {
                                                                                       console.log ('Item aggiunto:', response);
                                                                                       this.logService.AddToLog (loggedUser, `Aggiunto Nuovo Utente '${this.nome}'`);
                                                                                       this.router.navigate (['/userstable']);
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
      if (this.fromWhere == "single")
         this.router.navigate(['/settings']);
      else
         this.router.navigate(['/userstable']);
   }


   ShowRuolo(): boolean
   {
      return (loggedUser.attributo >= 255);
   }
}
