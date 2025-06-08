
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
import { CategorieService } from "../../services/categorie.service";
import {
   MessDlgData,
   Gruppo,
   Societa,
   Categoria } from "../../models/datamod";
import { MessageDialogService } from "../../services/message-dialog.service";
import {ButtonDirective} from "primeng/button";
import {CardModule} from "primeng/card";
import {InputTextModule} from "primeng/inputtext";
import {NgIf} from "@angular/common";
import {PaginatorModule} from "primeng/paginator";
import {PrimeTemplate} from "primeng/api";
import {DropdownModule} from 'primeng/dropdown';
import {utils} from "../../common/utils";
import {ColorPickerModule} from "primeng/colorpicker";
import {GruppiService} from "../../services/gruppi.service";



@Component({
  selector:    'app-gruppo-edit',
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
  templateUrl: './gruppo-edit.component.html',
  styleUrl:    './gruppo-edit.component.css'
})
export class GruppoEditComponent implements OnInit
{
   isLoading: boolean = false;
   isLoadingSoc: boolean = false;
   isLoadingCat: boolean = false;
   id: number = 0;
   nome = '';
   abbreviazione: string = "";
   coloreTesto: string = "#FFFFFF";
   coloreSfondo: string = "#000000";
   soc_id: number = 0;
   cat_id: number = 0;
   listaSocieta: Array<Societa> = [];
   currSoc: Societa | undefined;
   listaCategorie: Array<Categoria> = [];
   currCat: Categoria | undefined;

   theError = false;
   errorMessage: string = "Il campo non può essere vuoto";
   operazione: string = "";

   constructor (private authService: AuthService,
                private dataService: GruppiService,
                private societaService: SocietaService,
                private categoriaService: CategorieService,
                private router: Router,
                private cdr: ChangeDetectorRef,
                private messageDialogService: MessageDialogService)
   {
   }


   async ngOnInit ()
   {
      this.id = history.state.id;
      this.isLoading = true;
      this.isLoadingSoc = true;
      this.isLoadingCat = true;
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
                                                    this.isLoadingSoc = false;
                                                 });
      this.categoriaService.getAllData().subscribe(data3 =>
                                                 {
                                                    if (data3)
                                                    {
                                                       if (data3.ok)
                                                       {
                                                          this.listaCategorie = data3.elements;
                                                          //
                                                       }
                                                       else
                                                       {
                                                       }
                                                    }
                                                    else
                                                    {
                                                    }
                                                    this.isLoadingCat = false;
                                                 });
      //
      if (this.id > 0)
      {
         this.operazione = "Modifica ";
         while ((this.isLoadingSoc) || (this.isLoadingCat)) // necessario per attendere che tutti i ruoli siano caricati nell'array
            await utils.Dlt_Sleep(50);
         await utils.Dlt_Sleep(150); // anche questo necessario
         this.dataService.getSingleData (this.id).subscribe (data =>
                                                                 {
                                                                    if (data)
                                                                    {
                                                                       if (data.ok)
                                                                       {
                                                                          this.nome = (data.elements as Gruppo).nome; // data.elements NON è un array ma invece è semplicemente il solo elementp selezionato
                                                                          this.abbreviazione = (data.elements as Gruppo).abbreviazione;
                                                                          this.coloreTesto = (data.elements as Gruppo).coloretesto;
                                                                          this.coloreSfondo = (data.elements as Gruppo).coloresfondo;
                                                                          this.soc_id = (data.elements as Gruppo).societa_id;
                                                                          this.cat_id = (data.elements as Gruppo).categoria_id;
                                                                          //
                                                                          const currS = this.listaSocieta.findIndex(elemento => elemento.id == this.soc_id);
                                                                          if (currS != -1)
                                                                             this.currSoc = this.listaSocieta[currS];
                                                                          //
                                                                          const currC = this.listaCategorie.findIndex(elemento => elemento.id == this.cat_id);
                                                                          if (currC != -1)
                                                                             this.currCat = this.listaCategorie[currC];

                                                                       }
                                                                    }
                                                                    this.cdr.detectChanges();
                                                                    this.isLoading = false;
                                                                 });
      }
      else
      {
         this.operazione = "Aggiungi Nuovo ";
         await utils.Dlt_Sleep(150); // anche questo necessario
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
               this.soc_id = this.currSoc.id;
            else
               this.soc_id = 0;
            if (this.currCat)
               this.cat_id = this.currCat.id;
            else
               this.cat_id = 0;
            this.dataService.updateData (this.id,
                                         this.nome,
                                         this.abbreviazione,
                                         this.coloreTesto,
                                         this.coloreSfondo,
                                         this.soc_id,
                                         this.cat_id,
                                         "",
                                         "").subscribe ({
                                                                     next:  (response) =>
                                                                               {
                                                                                  if (response.ok)
                                                                                  {
                                                                                     console.log ('Item aggiornato:', response);
                                                                                     this.router.navigate (['/gruppitable']);
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
               this.soc_id = this.currSoc.id;
            else
               this.soc_id = 0;
            if (this.currCat)
               this.cat_id = this.currCat.id;
            else
               this.cat_id = 0;
            this.dataService.addNewData(this.nome,
                                        this.abbreviazione,
                                        this.coloreTesto,
                                        this.coloreSfondo,
                                        this.soc_id,
                                        this.cat_id,
                                        "",
                                        "").subscribe ({
                                                                       next:  (response) =>
                                                                                 {
                                                                                    if (response.ok)
                                                                                    {
                                                                                       console.log ('Item aggiunto:', response);
                                                                                       this.router.navigate (['/gruppitable']);
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
      this.router.navigate(['/gruppitable']);
   }

}
