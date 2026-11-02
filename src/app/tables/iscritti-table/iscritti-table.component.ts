import {
   ChangeDetectorRef,
   ChangeDetectionStrategy,
   Component,
   OnInit, AfterViewInit, ViewChild, HostListener, ElementRef
} from '@angular/core';
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
import {Table,
         TableModule} from "primeng/table";
import {TooltipModule} from "primeng/tooltip";
import {
   MessDlgData,
   SeasonElement,
   Iscritto,
   Gruppo,
   Societa,
   Categoria,
   IscrittoGruppo
} from "../../models/datamod";
import {Router} from "@angular/router";
import {MessageDialogService} from "../../services/message-dialog.service";
import {loggedUser,
   UserService} from "../../services/users.service";
import { IscrittiService} from "../../services/iscritti.service";
import {utils} from "../../common/utils";
import {globs} from "../../common/globals";
import {DialogModule} from "primeng/dialog";
import {InputTextModule} from "primeng/inputtext";
import {ReactiveFormsModule} from "@angular/forms";
import {firstValueFrom} from "rxjs";
import { FormsModule} from "@angular/forms";
import {CheckboxModule} from "primeng/checkbox";
import {GruppiService} from "../../services/gruppi.service";
import {DropdownModule} from "primeng/dropdown";
import {MultiSelectModule} from "primeng/multiselect";
import {SocietaService} from "../../services/societa.service";
import {CategorieService} from "../../services/categorie.service";



@Component({
  selector:    'app-iscritti-table',
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
                 BlockUIModule,
                 DialogModule,
                 InputTextModule,
                 ReactiveFormsModule,
                 FormsModule,
                 CheckboxModule,
                 DropdownModule,
                 MultiSelectModule
              ],
  templateUrl: './iscritti-table.component.html',
  styleUrl:    './iscritti-table.component.css'
})
export class IscrittiTableComponent implements OnInit, AfterViewInit
{
   isLoading: boolean = false;
   public tblData: Array<Iscritto> = [];
   theLocalStorage: globs.TLocalStorage | null = null;
   theSessionStorage: globs.TSessionStorage | null = null;
   currSelected: Iscritto | null = null;
   @ViewChild('iscrittiTable') pTable: Table | undefined;
   @ViewChild('tableContainer') tableContainer: ElementRef<HTMLElement> | undefined;
   dialogVisible_Iscritto: boolean = false;
   dialogTitle: string = "";
   dialogErrorMessage: string = "";
   dialogOperation: string = "";
   dialogValue: Iscritto = { nummaglia: "", id: 0, note: "", recapiti: "", pagamenti: "", categoria: "", societa: "", societaid: 0, gruppi: [], gruppo: "", season: "", seasonid: 0, visitafatta: "", anno: 0, cognome: "", nome: "", categoriaid: 0, visitascadenza: "", tesserato: false, myfip: false};
   listaGruppi: Array<Gruppo> = [];
   currGruppi: Array<Gruppo> = [];
   dialogMaglie: { [gruppoid: number]: string } = {};   // numero di maglia per ogni gruppo scelto
   listaSocieta: Array<Societa> = [];
   currSocieta: any | null = null;
   listaCategorie: Array<Categoria> = [];
   currCategoria: any | null = null;
   windowHeight: number = 110;
   scrollHeight: string = "110px";

   constructor (public router: Router,
                private cdr: ChangeDetectorRef,
                public theDataService: IscrittiService,
                private messageDialogService: MessageDialogService,
                private gruppiService: GruppiService,
                private societaService: SocietaService,
                private categorieService: CategorieService)
   {
      this.currSelected = null;
   }


   async ngOnInit ()
   {
      this.isLoading = true;
      //
      await this.GetWindowSize();
      //
      this.theLocalStorage = new globs.TLocalStorage();
      await this.theLocalStorage.Load();
      this.theSessionStorage = new globs.TSessionStorage();
      await this.theSessionStorage.Load();
      await this.LoadData ();
   }


   async LoadData ()
   {
      this.isLoading = true;
      let seasonId: number | null = null;
      let societaId: Array<number> | null = null;
      let gruppoId: Array<number> | null = null;
      let categoriaId: Array<number> | null = null;
      //
      const dataGrp = await firstValueFrom (this.gruppiService.getAllData ());
      if (dataGrp)
         this.listaGruppi = dataGrp.elements;
      const socGrp = await firstValueFrom (this.societaService.getAllData ());
      if (socGrp)
         this.listaSocieta = socGrp.elements;
      const catGrp = await firstValueFrom (this.categorieService.getAllData ());
      if (catGrp)
         this.listaCategorie = catGrp.elements;
      //
      this.theDataService.getAllData(seasonId, gruppoId, societaId, categoriaId, this.listaGruppi).subscribe (data =>
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


   ngAfterViewInit ()
   {
      // Misuro dopo il rendering: qui la pagina precedente può essere ancora nel DOM
      // (viene tolta a fine animazione) e falserebbe la posizione della tabella
      setTimeout (() =>
      {
         this.GetWindowSize ();
         this.cdr.detectChanges ();
      });
   }


   // Altezza della tabella: dallo spazio sotto l'intestazione fino al piè di pagina fisso
   async GetWindowSize()
   {
      this.windowHeight = window.innerHeight;
      let sh: number = this.windowHeight - 110 - 90 - 180;
      const container = this.tableContainer?.nativeElement;
      if (container)
      {
         const footer = document.querySelector ('.app-footer');
         const fondo: number = footer ? footer.getBoundingClientRect ().top : this.windowHeight;
         const misurato: number = Math.floor (fondo - container.getBoundingClientRect ().top - 8);
         // Misura non attendibile (pagina non ancora disegnata): resta la formula fissa
         if (misurato >= 110)
            sh = misurato;
      }
      if (sh < 110)
         sh = 110;
      this.scrollHeight = `${sh}px`;
   }


   @HostListener('window:resize', ['$event'])
   async onResize(event: any)
   {
      await this.GetWindowSize();
   }


   AddEnabled (): boolean
   {
      return (loggedUser.attributo >= 2);
   }


   EditEnabled (): boolean
   {
      return (loggedUser.attributo >= 2);
   }


   DeleteEnabled (): boolean
   {
      return (loggedUser.attributo >= 2);
   }


   onAdd (): void
   {
      this.dialogTitle = "Aggiungi nuovo iscritto";
      this.dialogValue = { nummaglia: "",
                           id: 0,
                           note: "",
                           recapiti: "",
                           pagamenti: "",
                           categoria: "",
                           societa: "",
                           societaid: 0,
                           gruppi: [],
                           gruppo: "",
                           season: "",
                           seasonid: 0,
                           visitafatta: "",
                           anno: 0,
                           cognome: "",
                           nome: "",
                           categoriaid: 0,
                           visitascadenza: "",
                           tesserato: false,
                           myfip: false };
      this.currGruppi = [];
      this.dialogMaglie = {};
      this.dialogVisible_Iscritto = true;
      this.dialogOperation = "ADD";
   }


   onEdit (): void
   {
      if (this.currSelected == null)
      {
         const dlgData: MessDlgData = {
            title:      'ATTENZIONE',
            subtitle:   'Modifica iscritto',
            message:    `Non è stato selezionato alcun iscritto`,
            messtype:   'warning',
            btncaption: 'Chiudi'
         };
         this.messageDialogService.showMessage (dlgData, '600px');
         return;
      }

      this.dialogTitle = "Modifica iscritto";
      this.dialogValue = this.currSelected;
      this.currGruppi = [];
      this.dialogMaglie = {};
      for (const g of this.dialogValue.gruppi)
      {
         const gruppo = this.listaGruppi.find (elemento => elemento.id == g.gruppoid);
         if (gruppo)
            this.currGruppi.push (gruppo);
         this.dialogMaglie[g.gruppoid] = g.nummaglia;
      }
      if (this.dialogValue.societaid > 0)
      {
         const currs = this.listaSocieta.findIndex (elemento => elemento.id == this.dialogValue.societaid);
         if (currs != -1)
            this.currSocieta = this.listaSocieta[currs];
      }
      if (this.dialogValue.categoriaid > 0)
      {
         const currc = this.listaCategorie.findIndex (elemento => elemento.id == this.dialogValue.categoriaid);
         if (currc != -1)
            this.currCategoria = this.listaCategorie[currc];
      }

      this.dialogVisible_Iscritto = true;
      this.dialogOperation = "EDIT";
   }


   onDelete (): void
   {
      if (this.currSelected == null)
      {
         const dlgData: MessDlgData = {
            title:      'ATTENZIONE',
            subtitle:   'Cancellazione iscritto',
            message:    `Non è stato selezionato alcun iscritto`,
            messtype:   'warning',
            btncaption: 'Chiudi'
         };
         this.messageDialogService.showMessage (dlgData, '600px');
         return;
      }

      let idToDelete: number = this.currSelected.id;
      const dlgData: MessDlgData = {
         title:               'Cancellazione Iscritto',
         subtitle:            '',
         message:             `Sei veramente sicuro di voloer cancellare l'iscritto '<b>${this.currSelected.cognome} ${this.currSelected.nome}</b>' dal database?`,
         messtype:            'warning',
         btncaption:          'Annulla',
         showCancelButton:    true,
         cancelButtonCaption: 'Sì, procedi'
      };

      this.messageDialogService.showMessage (dlgData, '', true).subscribe (result =>
                                                                           {
                                                                              if (result === 'secondary')
                                                                              {
                                                                                 this.theDataService.DeleteData (idToDelete).subscribe (data =>
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


   OnRowSelected (evento: any)
   {
      if (this.currSelected != null)
         utils.SaveToSessionStorage ("RS_Editing_Iscritto_Id", this.currSelected.id);
   }


   OnRowUnselected (evento: any)
   {
      utils.removeFromSessionStorage("RS_Editing_Iscritto_Id");
   }


   // Riporta nell'iscritto i gruppi scelti nella maschera, ciascuno con il suo numero di maglia
   ApplicaGruppi ()
   {
      this.dialogValue.gruppi = this.currGruppi.map (g => ({
         gruppoid:  g.id,
         gruppo:    g.nome,
         nummaglia: (this.dialogMaglie[g.id] ?? '').trim ()
      }));
      this.dialogValue.gruppo = IscrittiService.GruppiTesto (this.dialogValue.gruppi);
      this.dialogValue.nummaglia = IscrittiService.MaglieTesto (this.dialogValue.gruppi);
   }


   async DialogAnnulla(senderName: string)
   {
      this.dialogVisible_Iscritto = false;
   }


   async DialogSalva(senderName: string)
   {
      this.dialogVisible_Iscritto = false;
      if (this.dialogOperation == "ADD")
      {
         try
         {
            this.ApplicaGruppi ();
            this.dialogValue.societaid = this.currSocieta.id;
            this.dialogValue.societa = this.currSocieta.nome;
            this.dialogValue.categoriaid = this.currCategoria.id;
            this.dialogValue.categoria = this.currCategoria.nome;
            const response = await firstValueFrom (this.theDataService.addNewData (this.dialogValue.cognome,
                                                                                   this.dialogValue.nome,
                                                                                   this.dialogValue.anno,
                                                                                   this.dialogValue.seasonid,
                                                                                   IscrittiService.GruppiIdsPerDb (this.dialogValue.gruppi),
                                                                                   this.dialogValue.categoriaid,
                                                                                   this.dialogValue.societaid,
                                                                                   IscrittiService.MagliePerDb (this.dialogValue.gruppi),
                                                                                   this.dialogValue.visitafatta,
                                                                                   this.dialogValue.visitascadenza,
                                                                                   Boolean (this.dialogValue.tesserato),
                                                                                   Boolean (this.dialogValue.myfip),
                                                                                   this.dialogValue.pagamenti,
                                                                                   this.dialogValue.recapiti,
                                                                                   this.dialogValue.note));
            if (response.ok)
            {
               await this.LoadData ();
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
         catch(err)
         {
            const dlgData: MessDlgData = {
               title:      'EXCEPTION',
               subtitle:   "Errore nell'inserimento dei dati",
               message:    `${JSON.stringify(err,null,-1)}`,
               messtype:   'error',
               btncaption: 'Chiudi'
            };
            this.messageDialogService.showMessage (dlgData, '600px');
         }
         this.cdr.detectChanges ();
      }
      if (this.dialogOperation == "EDIT")
      {
         this.ApplicaGruppi ();
         this.dialogValue.societaid = this.currSocieta.id;
         this.dialogValue.societa = this.currSocieta.nome;
         this.dialogValue.categoriaid = this.currCategoria.id;
         this.dialogValue.categoria = this.currCategoria.nome;
         try
         {
            const response = await firstValueFrom (this.theDataService.updateData(this.dialogValue.id,
                                                                                  this.dialogValue.cognome,
                                                                                  this.dialogValue.nome,
                                                                                  this.dialogValue.anno,
                                                                                  this.dialogValue.seasonid,
                                                                                  IscrittiService.GruppiIdsPerDb (this.dialogValue.gruppi),
                                                                                  this.dialogValue.categoriaid,
                                                                                  this.dialogValue.societaid,
                                                                                  IscrittiService.MagliePerDb (this.dialogValue.gruppi),
                                                                                  this.dialogValue.visitafatta,
                                                                                  this.dialogValue.visitascadenza,
                                                                                  Boolean(this.dialogValue.tesserato),
                                                                                  Boolean(this.dialogValue.myfip),
                                                                                  this.dialogValue.pagamenti,
                                                                                  this.dialogValue.recapiti,
                                                                                  this.dialogValue.note));
            if (response.ok)
            {
               await this.LoadData();
            }
            else
            {
               const dlgData: MessDlgData = {
                  title:      'ERRORE',
                  subtitle:   "Errore nella modifica dei dati",
                  message:    `${response.message}`,
                  messtype:   'error',
                  btncaption: 'Chiudi'
               };
               this.messageDialogService.showMessage (dlgData, '600px');
            }
         }
         catch(err)
         {
            const dlgData: MessDlgData = {
               title:      'EXCEPTION',
               subtitle:   "Errore nella modifica dei dati",
               message:    `${JSON.stringify(err,null,-1)}`,
               messtype:   'error',
               btncaption: 'Chiudi'
            };
            this.messageDialogService.showMessage (dlgData, '600px');
         }
         this.cdr.detectChanges ();
      }
   }


}



