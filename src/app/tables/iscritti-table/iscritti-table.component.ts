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
import {SeasonsService} from "../../services/seasons.service";
import {ScegliStagione} from "../../common/stagioni";



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
   // Totali mostrati in fondo alla tabella (ricalcolati a ogni caricamento)
   totIscritti: number = 0;
   totTesserati: number = 0;
   totMyFip: number = 0;
   // Ordinamento per più colonne senza dover tenere premuto Ctrl
   ordinamentoMultiplo: boolean = false;
   // Righe nell'ordine arrivato dal server (la tabella le riordina "sul posto")
   private ordineIniziale: Array<Iscritto> = [];
   // Id degli iscritti con stesso cognome, nome e anno di nascita di un altro iscritto
   duplicati: Set<number> = new Set<number> ();
   readonly testoDuplicato: string = "Possibile duplicato: c'è un altro iscritto con stesso cognome, nome e anno";
   theLocalStorage: globs.TLocalStorage | null = null;
   theSessionStorage: globs.TSessionStorage | null = null;
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
   listaStagioni: Array<SeasonElement> = [];
   currSeason: SeasonElement | null = null;         // stagione mostrata nella tabella
   dialogSeason: SeasonElement | null = null;       // stagione dell'iscritto nella maschera
   // Copia di iscritti in un'altra stagione
   dialogVisible_Copia: boolean = false;
   copiaSeason: SeasonElement | null = null;        // stagione di destinazione
   copiaSelezionati: Array<Iscritto> = [];
   copiaFiltro: string = "";
   copiaElenco: Array<Iscritto> = [];               // iscritti mostrati (dopo il filtro)
   copiaStagioni: Array<SeasonElement> = [];        // stagioni di destinazione possibili
   copiaInCorso: boolean = false;
   copiaFatti: number = 0;
   windowHeight: number = 110;
   scrollHeight: string = "110px";

   constructor (public router: Router,
                private cdr: ChangeDetectorRef,
                public theDataService: IscrittiService,
                private messageDialogService: MessageDialogService,
                private gruppiService: GruppiService,
                private societaService: SocietaService,
                private categorieService: CategorieService,
                private seasonServ: SeasonsService)
   {
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
      //
      // Stessa stagione delle altre pagine (scelta in automatico se non ce n'e' una valida)
      await this.LoadSeasons ();
      this.currSeason = ScegliStagione (this.listaStagioni, this.theLocalStorage.data.currSeason);
      this.theLocalStorage.data.currSeason = this.currSeason;
      this.theLocalStorage.Save ();
      //
      await this.LoadData ();
   }


   async LoadSeasons ()
   {
      try
      {
         const dataSeas = await firstValueFrom (this.seasonServ.getAllData ());
         if ((dataSeas) && (dataSeas.ok))
            this.listaStagioni = dataSeas.elements;
         else
            this.messageDialogService.showError ("Errore durante il caricamento delle stagioni", dataSeas?.message ?? 'No data returned');
      }
      catch (err)
      {
         this.messageDialogService.showError ("Errore durante il caricamento delle stagioni", err);
      }
   }


   OnSeasonChange (evento: any)
   {
      if (this.theLocalStorage)
      {
         this.theLocalStorage.data.currSeason = this.currSeason;
         this.theLocalStorage.Save ();
      }
      this.LoadData ();
   }


   TooltipOrdinamento (): string
   {
      return (this.ordinamentoMultiplo)
         ? "Attivo: ogni clic su un'intestazione aggiunge la colonna all'ordinamento. Clic qui per disattivare."
         : "Ordina per più colonne (oppure tieni premuto Ctrl mentre clicchi le intestazioni)";
   }


   // true se la tabella è ordinata per almeno una colonna
   OrdinamentoAttivo (): boolean
   {
      return (this.pTable?.multiSortMeta?.length ?? 0) > 0;
   }


   // Toglie l'ordinamento e rimette le righe nell'ordine arrivato dal server
   TogliOrdinamento ()
   {
      this.pTable?.reset ();
      this.tblData = [...this.ordineIniziale];
   }


   // Numero di iscritti e quanti hanno attivi i flag "Tesserato" e "MyFIP"
   AggiornaTotali ()
   {
      this.ordineIniziale = [...this.tblData];
      this.totIscritti = this.tblData.length;
      this.totTesserati = this.tblData.filter (i => i.tesserato).length;
      this.totMyFip = this.tblData.filter (i => i.myfip).length;

      // Possibili duplicati: stesso cognome, nome e anno (senza badare a maiuscole e spazi)
      const chiave = (i: Iscritto): string => `${(i.cognome ?? '').trim ().toLowerCase ()}|${(i.nome ?? '').trim ().toLowerCase ()}|${i.anno}`;
      const conteggio: Map<string, number> = new Map<string, number> ();
      for (const i of this.tblData)
         conteggio.set (chiave (i), (conteggio.get (chiave (i)) ?? 0) + 1);
      this.duplicati = new Set<number> (this.tblData.filter (i => (conteggio.get (chiave (i)) ?? 0) > 1).map (i => Number (i.id)));
   }


   async LoadData ()
   {
      this.isLoading = true;
      // Senza stagione la tabella resta vuota: gli iscritti cambiano ad ogni stagione
      if (this.currSeason == null)
      {
         this.tblData = [];
         this.AggiornaTotali ();
         this.isLoading = false;
         this.cdr.detectChanges ();
         return;
      }
      let seasonId: number | null = this.currSeason.id;
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
                                                           this.AggiornaTotali ();
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
      // Con "Ordina per più colonne" attivo, un clic normale su un'intestazione ordinabile
      // viene trasformato in Ctrl+clic, che PrimeNG usa per aggiungere la colonna all'ordinamento
      this.tableContainer?.nativeElement.addEventListener ('click', (ev: MouseEvent) =>
      {
         if ((!this.ordinamentoMultiplo) || ev.ctrlKey || ev.metaKey)
            return;
         const th = (ev.target as HTMLElement | null)?.closest ('th.p-sortable-column');
         if (!th)
            return;
         ev.stopPropagation ();
         ev.preventDefault ();
         th.dispatchEvent (new MouseEvent ('click', { bubbles: true, cancelable: true, ctrlKey: true }));
      }, true);

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
      this.dialogSeason = this.currSeason;
      this.dialogVisible_Iscritto = true;
      this.dialogOperation = "ADD";
   }


   // Colonna con i pulsanti modifica/elimina: solo per chi può usarli
   AzioniVisibili (): boolean
   {
      return this.EditEnabled () || this.DeleteEnabled ();
   }


   // Pulsante "modifica" sulla riga dell'iscritto
   onEdit (iscritto: Iscritto): void
   {
      this.dialogTitle = "Modifica iscritto";
      this.dialogValue = iscritto;
      this.dialogSeason = this.listaStagioni.find (s => s.id == this.dialogValue.seasonid) ?? this.currSeason;
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


   // Pulsante "elimina" sulla riga dell'iscritto
   onDelete (iscritto: Iscritto): void
   {
      let idToDelete: number = iscritto.id;
      const dlgData: MessDlgData = {
         title:               'Cancellazione Iscritto',
         subtitle:            '',
         message:             `Sei veramente sicuro di voloer cancellare l'iscritto '<b>${iscritto.cognome} ${iscritto.nome}</b>' dal database?`,
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


   // ---------------------------------------------------------------
   //  COPIA ISCRITTI IN UN'ALTRA STAGIONE
   // ---------------------------------------------------------------

   onCopia (): void
   {
      if (this.tblData.length == 0)
      {
         const dlgData: MessDlgData = {
            title:      'ATTENZIONE',
            subtitle:   'Copia iscritti',
            message:    `Nella stagione '${this.currSeason?.nome ?? ''}' non ci sono iscritti da copiare`,
            messtype:   'warning',
            btncaption: 'Chiudi'
         };
         this.messageDialogService.showMessage (dlgData, '600px');
         return;
      }
      // Proposta: la prima stagione che inizia dopo quella mostrata
      const inizioCorrente: number = (this.currSeason) ? new Date (this.currSeason.datainizio).getTime () : 0;
      // Stagioni in cui si puo' copiare: tutte tranne quella mostrata
      this.copiaStagioni = this.listaStagioni.filter (s => s.id != this.currSeason?.id);
      const successive: Array<SeasonElement> = this.copiaStagioni
                                                   .filter (s => new Date (s.datainizio).getTime () > inizioCorrente)
                                                   .sort ((a, b) => new Date (a.datainizio).getTime () - new Date (b.datainizio).getTime ());
      this.copiaSeason = (successive.length > 0) ? successive[0] : null;
      this.copiaSelezionati = [];
      this.copiaFiltro = "";
      this.CopiaFiltra ();
      this.copiaFatti = 0;
      this.copiaInCorso = false;
      this.dialogVisible_Copia = true;
   }


   // Iscritti mostrati nella finestra di copia (filtro su cognome/nome)
   CopiaFiltra ()
   {
      const f: string = this.copiaFiltro.trim ().toLowerCase ();
      if (f == "")
      {
         this.copiaElenco = this.tblData;
         return;
      }
      this.copiaElenco = this.tblData.filter (i => `${i.cognome} ${i.nome}`.toLowerCase ().includes (f) ||
                                       `${i.nome} ${i.cognome}`.toLowerCase ().includes (f));
   }


   CopiaAnnulla ()
   {
      if (!this.copiaInCorso)
         this.dialogVisible_Copia = false;
   }


   static ChiaveIscritto (i: Iscritto): string
   {
      return `${(i.cognome ?? '').trim ().toLowerCase ()}|${(i.nome ?? '').trim ().toLowerCase ()}|${i.anno}`;
   }


   async CopiaEsegui ()
   {
      if ((this.copiaSeason == null) || (this.copiaSelezionati.length == 0) || (this.copiaInCorso))
         return;
      const dest: SeasonElement = this.copiaSeason;
      this.copiaInCorso = true;
      this.copiaFatti = 0;
      const copiati: Array<string> = [];
      const saltati: Array<string> = [];
      const errori: Array<string> = [];
      try
      {
         // Iscritti gia' presenti nella stagione di destinazione: non li duplico
         const esistenti = await firstValueFrom (this.theDataService.getAllData (dest.id, null, null, null, this.listaGruppi));
         if ((!esistenti) || (!esistenti.ok))
         {
            this.messageDialogService.showError ("Errore durante la lettura degli iscritti della stagione di destinazione", esistenti?.message ?? 'No data returned');
            return;
         }
         const giaPresenti: Set<string> = new Set ((esistenti.elements as Array<Iscritto>).map (i => IscrittiTableComponent.ChiaveIscritto (i)));
         //
         // In ordine alfabetico, una richiesta alla volta (il server accetta solo GET)
         const daCopiare: Array<Iscritto> = [...this.copiaSelezionati].sort ((a, b) => `${a.cognome} ${a.nome}`.localeCompare (`${b.cognome} ${b.nome}`));
         for (const isc of daCopiare)
         {
            const nomeCompleto: string = `${isc.cognome} ${isc.nome}`;
            const chiave: string = IscrittiTableComponent.ChiaveIscritto (isc);
            if (giaPresenti.has (chiave))
            {
               saltati.push (nomeCompleto);
            }
            else
            {
               try
               {
                  // Si copiano solo i dati anagrafici, la visita e i recapiti: gruppi, maglie,
                  // tesseramento, MyFIP, pagamenti e note ripartono vuoti nella nuova stagione
                  const response = await firstValueFrom (this.theDataService.addNewData (isc.cognome,
                                                                                         isc.nome,
                                                                                         isc.anno,
                                                                                         dest.id,
                                                                                         "",
                                                                                         isc.categoriaid,
                                                                                         isc.societaid,
                                                                                         "",
                                                                                         isc.visitafatta,
                                                                                         isc.visitascadenza,
                                                                                         false,
                                                                                         false,
                                                                                         "",
                                                                                         isc.recapiti ?? "",
                                                                                         ""));
                  if ((response) && (response.ok))
                  {
                     copiati.push (nomeCompleto);
                     giaPresenti.add (chiave);
                  }
                  else
                     errori.push (`${nomeCompleto}: ${response?.message ?? 'nessuna risposta'}`);
               }
               catch (err: any)
               {
                  errori.push (`${nomeCompleto}: ${err?.message ?? err}`);
               }
            }
            this.copiaFatti++;
            this.cdr.detectChanges ();
         }
      }
      catch (err)
      {
         this.messageDialogService.showError ("Errore durante la copia degli iscritti", err);
         return;
      }
      finally
      {
         this.copiaInCorso = false;
         this.cdr.detectChanges ();
      }
      //
      this.dialogVisible_Copia = false;
      let messaggio: string = `Copiati <b>${copiati.length}</b> iscritti nella stagione '<b>${dest.nome}</b>'.`;
      if (saltati.length > 0)
         messaggio += `<br><br>Già presenti nella stagione, non copiati (${saltati.length}):<br>${saltati.join ('<br>')}`;
      if (errori.length > 0)
         messaggio += `<br><br>Errori (${errori.length}):<br>${errori.join ('<br>')}`;
      const dlgData: MessDlgData = {
         title:      (errori.length > 0) ? 'ATTENZIONE' : 'COPIA COMPLETATA',
         subtitle:   'Copia iscritti',
         message:    messaggio,
         messtype:   (errori.length > 0) ? 'warning' : 'info',
         btncaption: 'Chiudi'
      };
      this.messageDialogService.showMessage (dlgData, '600px');
   }


   ApplicaStagione ()
   {
      const stagione: SeasonElement | null = this.dialogSeason ?? this.currSeason;
      this.dialogValue.seasonid = stagione?.id ?? 0;
      this.dialogValue.season = stagione?.nome ?? "";
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
            this.ApplicaStagione ();
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
         this.ApplicaStagione ();
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



