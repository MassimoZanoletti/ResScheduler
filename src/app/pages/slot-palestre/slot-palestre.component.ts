import {ChangeDetectorRef,
        Component,
        OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {Router} from '@angular/router';
import {firstValueFrom} from 'rxjs';

// primeng
import {ButtonModule} from 'primeng/button';
import {CalendarModule} from 'primeng/calendar';
import {CardModule} from 'primeng/card';
import {DialogModule} from 'primeng/dialog';
import {DropdownModule} from 'primeng/dropdown';
import {SelectButtonModule} from 'primeng/selectbutton';
import {ProgressSpinnerModule} from 'primeng/progressspinner';

// other
import {MessDlgData,
        Resource,
        SeasonElement,
        SlotPalestra} from '../../models/datamod';
import {SeasonsService} from '../../services/seasons.service';
import {RisorseService} from '../../services/risorse.service';
import {SlotPalestreService} from '../../services/slot-palestre.service';
import {MessageDialogService} from '../../services/message-dialog.service';
import {LogService} from '../../services/log.service';
import {loggedUser} from '../../services/users.service';
import {globs} from '../../common/globals';
import {utils} from '../../common/utils';
import {ScegliStagione} from '../../common/stagioni';
import {IdRisorseTrasferta} from '../../common/sovrapposizioni';


// Giorni in colonna: da lunedi' a domenica (valori di Date.getDay())
const ORDINE_GIORNI: Array<number> = [1, 2, 3, 4, 5, 6, 0];
const NOMI_GIORNI: Array<string> = ["Domenica", "Lunedì", "Martedì", "Mercoledì", "Giovedì", "Venerdì", "Sabato"];
const NOMI_BREVI: Array<string> = ["Dom", "Lun", "Mar", "Mer", "Gio", "Ven", "Sab"];


/*
   Slot orari che le amministrazioni assegnano a ogni palestra, per la stagione scelta:
   una riga per palestra, una colonna per giorno della settimana.
   Gli slot vengono poi evidenziati nell'orario palestre.
*/
@Component ({
               selector:    'app-slot-palestre',
               standalone:  true,
               imports:     [
                  CommonModule,
                  FormsModule,
                  ButtonModule,
                  CalendarModule,
                  CardModule,
                  DialogModule,
                  DropdownModule,
                  SelectButtonModule,
                  ProgressSpinnerModule
               ],
               templateUrl: './slot-palestre.component.html',
               styleUrl:    './slot-palestre.component.css'
            })
export class SlotPalestreComponent implements OnInit
{
   caricamento: boolean = false;
   inCorso: boolean = false;                       // salvataggio / cancellazione / copia
   theLocalStorage: globs.TLocalStorage | null = null;
   listaStagioni: Array<SeasonElement> = [];
   currSeason: SeasonElement | null = null;
   stagioneDaCopiare: SeasonElement | null = null;
   listaPalestre: Array<Resource> = [];
   slot: Array<SlotPalestra> = [];

   readonly giorni: Array<{ giorno: number, nome: string }> = ORDINE_GIORNI.map (g => ({ giorno: g, nome: NOMI_GIORNI[g] }));
   readonly opzioniGiorni: Array<{ label: string, value: number }> = ORDINE_GIORNI.map (g => ({ label: NOMI_BREVI[g], value: g }));

   // Finestra di inserimento / modifica
   dialogVisibile: boolean = false;
   slotInModifica: SlotPalestra | null = null;     // null = nuovo slot
   palestraDialog: Resource | null = null;
   giorniDialog: Array<number> = [];               // nuovo: uno o piu' giorni; modifica: un giorno solo
   oraDa: Date | null = null;
   oraA: Date | null = null;


   constructor (private router: Router,
                private seasonServ: SeasonsService,
                private resourceService: RisorseService,
                private slotService: SlotPalestreService,
                private messageDialogService: MessageDialogService,
                private logService: LogService,
                private cdr: ChangeDetectorRef)
   {
   }


   async ngOnInit ()
   {
      this.caricamento = true;
      try
      {
         const [dataSea, dataRis] = await Promise.all ([firstValueFrom (this.seasonServ.getAllData ()),
                                                        firstValueFrom (this.resourceService.getAllData ())]);
         if ((dataSea) && (dataSea.ok))
            this.listaStagioni = dataSea.elements;
         else
            this.messageDialogService.showError ("Errore durante il caricamento delle stagioni", dataSea?.message ?? 'No data returned');
         if ((dataRis) && (dataRis.ok))
         {
            const trasferte: Set<number> = IdRisorseTrasferta (dataRis.elements);
            this.listaPalestre = (dataRis.elements as Array<Resource>).filter (r => !trasferte.has (Number (r.id)));
         }
         else
            this.messageDialogService.showError ("Errore durante il caricamento delle palestre", dataRis?.message ?? 'No data returned');

         // Stessa stagione delle altre pagine
         this.theLocalStorage = new globs.TLocalStorage ();
         await this.theLocalStorage.Load ();
         this.currSeason = ScegliStagione (this.listaStagioni, this.theLocalStorage.data.currSeason);
         await this.CaricaSlot ();
      }
      catch (e)
      {
         this.messageDialogService.showError ("Errore durante l'apertura degli slot palestre", e);
      }
      finally
      {
         this.caricamento = false;
         this.cdr.detectChanges ();
      }
   }


   PuoModificare (): boolean
   {
      return (loggedUser.attributo > 0);
   }


   async OnStagioneChange ()
   {
      if (this.theLocalStorage)
      {
         this.theLocalStorage.data.currSeason = this.currSeason;
         this.theLocalStorage.Save ();
      }
      await this.CaricaSlot ();
   }


   async CaricaSlot ()
   {
      this.slot = [];
      if (this.currSeason == null)
         return;
      this.caricamento = true;
      this.cdr.detectChanges ();
      try
      {
         const resp = await firstValueFrom (this.slotService.getAllData (this.currSeason.id));
         if (resp.ok)
            this.slot = resp.elements;
         else
            this.messageDialogService.showError ("Errore durante il caricamento degli slot", resp.message);
      }
      catch (e)
      {
         this.messageDialogService.showError ("Errore durante il caricamento degli slot", e);
      }
      finally
      {
         // stagione da proporre per la copia: la precedente che ha date prima di questa
         this.stagioneDaCopiare = this.listaStagioni.filter (s => (s.id != this.currSeason?.id) &&
                                                                  (utils.DataPerDb (s.datainizio) < utils.DataPerDb (this.currSeason!.datainizio)))
                                                    .sort ((a, b) => utils.DataPerDb (b.datainizio).localeCompare (utils.DataPerDb (a.datainizio)))[0] ?? null;
         this.caricamento = false;
         this.cdr.detectChanges ();
      }
   }


   AltreStagioni (): Array<SeasonElement>
   {
      return this.listaStagioni.filter (s => s.id != this.currSeason?.id);
   }


   SlotDi (palestra: Resource, giorno: number): Array<SlotPalestra>
   {
      return this.slot.filter (s => (s.risorsa_id == palestra.id) && (s.giorno == giorno))
                      .sort ((a, b) => a.da - b.da);
   }


   Etichetta (s: SlotPalestra): string
   {
      return `${SlotPalestreService.Ora (s.da)}–${SlotPalestreService.Ora (s.a)}`;
   }


   StilePalestra (p: Resource): { [key: string]: string }
   {
      return ((p.coloresfondo) && (p.coloretesto)) ? { 'background-color': p.coloresfondo, 'color': p.coloretesto } : {};
   }


   // Ora (Date) per i campi orario a partire dai minuti
   private DataDaMinuti (minuti: number): Date
   {
      const d: Date = new Date ();
      d.setHours (Math.floor (minuti / 60), minuti % 60, 0, 0);
      return d;
   }


   NuovoSlot (palestra: Resource, giorno: number)
   {
      if ((!this.PuoModificare ()) || (this.inCorso))
         return;
      this.slotInModifica = null;
      this.palestraDialog = palestra;
      this.giorniDialog = [giorno];
      // proposta: l'ultimo slot gia' inserito per la palestra, altrimenti 16:30-23:00
      const altri: Array<SlotPalestra> = this.slot.filter (s => s.risorsa_id == palestra.id);
      const modello: SlotPalestra | undefined = altri[altri.length - 1];
      this.oraDa = this.DataDaMinuti ((modello) ? modello.da : 16 * 60 + 30);
      this.oraA = this.DataDaMinuti ((modello) ? modello.a : 23 * 60);
      this.dialogVisibile = true;
      this.cdr.detectChanges ();
   }


   ApriSlot (s: SlotPalestra)
   {
      if ((!this.PuoModificare ()) || (this.inCorso))
         return;
      this.slotInModifica = s;
      this.palestraDialog = this.listaPalestre.find (p => p.id == s.risorsa_id) ?? null;
      this.giorniDialog = [s.giorno];
      this.oraDa = this.DataDaMinuti (s.da);
      this.oraA = this.DataDaMinuti (s.a);
      this.dialogVisibile = true;
      this.cdr.detectChanges ();
   }


   // Errori nei dati della finestra ("" se tutto a posto)
   private Valida (da: number, a: number): string
   {
      if (this.giorniDialog.length == 0)
         return "Scegliere almeno un giorno.";
      if ((this.oraDa == null) || (this.oraA == null))
         return "Indicare l'ora di inizio e l'ora di fine.";
      if (a <= da)
         return "L'ora di fine deve essere dopo l'ora di inizio.";
      const palestraId: number = Number (this.palestraDialog?.id ?? 0);
      for (const g of this.giorniDialog)
      {
         const sovrapposto = this.slot.find (s => (s.risorsa_id == palestraId) && (s.giorno == g) &&
                                                  (s.id != this.slotInModifica?.id) && (s.da < a) && (da < s.a));
         if (sovrapposto)
            return `${NOMI_GIORNI[g]}: si sovrappone allo slot ${this.Etichetta (sovrapposto)} già presente.`;
      }
      return "";
   }


   async SalvaSlot ()
   {
      if ((this.inCorso) || (this.palestraDialog == null) || (this.currSeason == null))
         return;
      const da: number = utils.MinutiDelGiorno (this.oraDa);
      const a: number = utils.MinutiDelGiorno (this.oraA);
      const errore: string = this.Valida (da, a);
      if (errore != "")
      {
         this.MostraAvviso (errore);
         return;
      }
      this.inCorso = true;
      try
      {
         const palestraId: number = Number (this.palestraDialog.id);
         if (this.slotInModifica)
         {
            const resp = await firstValueFrom (this.slotService.updateData (this.slotInModifica.id, palestraId, this.giorniDialog[0], da, a));
            if ((!resp) || (!resp.ok))
               throw new Error (resp?.message ?? 'No data returned');
         }
         else
         {
            for (const g of this.giorniDialog)
            {
               const resp = await firstValueFrom (this.slotService.addNewData (this.currSeason.id, palestraId, g, da, a));
               if ((!resp) || (!resp.ok))
                  throw new Error (resp?.message ?? 'No data returned');
            }
         }
         await this.logService.AddToLog (loggedUser, `Slot palestra ${this.palestraDialog.nome}: ` +
                                                     `${this.giorniDialog.map (g => NOMI_BREVI[g]).join (', ')} ${SlotPalestreService.Ora (da)}-${SlotPalestreService.Ora (a)}` +
                                                     ((this.slotInModifica) ? ' (modificato)' : ' (aggiunto)'));
         this.dialogVisibile = false;
      }
      catch (e)
      {
         this.messageDialogService.showError ("Errore durante il salvataggio dello slot", e);
      }
      finally
      {
         this.inCorso = false;
         await this.CaricaSlot ();
      }
   }


   async EliminaSlot ()
   {
      const s: SlotPalestra | null = this.slotInModifica;
      if ((this.inCorso) || (s == null))
         return;
      this.inCorso = true;
      try
      {
         const resp = await firstValueFrom (this.slotService.DeleteData (s.id));
         if ((!resp) || (!resp.ok))
            throw new Error (resp?.message ?? 'No data returned');
         await this.logService.AddToLog (loggedUser, `Slot palestra ${this.palestraDialog?.nome ?? ''}: ${NOMI_BREVI[s.giorno]} ${this.Etichetta (s)} (cancellato)`);
         this.dialogVisibile = false;
      }
      catch (e)
      {
         this.messageDialogService.showError ("Errore durante la cancellazione dello slot", e);
      }
      finally
      {
         this.inCorso = false;
         await this.CaricaSlot ();
      }
   }


   // Copia tutti gli slot di un'altra stagione in quella scelta (solo se questa non ne ha)
   async CopiaDaStagione ()
   {
      if ((this.inCorso) || (this.currSeason == null) || (this.stagioneDaCopiare == null) || (this.slot.length > 0))
         return;
      const da: SeasonElement = this.stagioneDaCopiare;
      const dlgData: MessDlgData = {
         title:               'Copia slot',
         subtitle:            '',
         message:             `Copiare nella stagione <b>${this.currSeason.nome}</b> tutti gli slot della stagione <b>${da.nome}</b>?\nPotranno poi essere modificati.`,
         messtype:            'info',
         btncaption:          'Annulla',
         showCancelButton:    true,
         cancelButtonCaption: 'Sì, copia'
      };
      const result = await firstValueFrom (this.messageDialogService.showMessage (dlgData, '550px', true));
      if (result !== 'secondary')
         return;
      this.inCorso = true;
      try
      {
         const resp = await firstValueFrom (this.slotService.CopiaStagione (da.id, this.currSeason.id));
         if ((!resp) || (!resp.ok))
            throw new Error (resp?.message ?? 'No data returned');
         const copiati: number = Number (resp.elements?.[0]?.copiati ?? 0);
         await this.logService.AddToLog (loggedUser, `Copiati ${copiati} slot palestre dalla stagione ${da.nome} alla stagione ${this.currSeason.nome}`);
         if (copiati == 0)
            this.MostraAvviso (`La stagione ${da.nome} non ha slot da copiare.`);
      }
      catch (e)
      {
         this.messageDialogService.showError ("Errore durante la copia degli slot", e);
      }
      finally
      {
         this.inCorso = false;
         await this.CaricaSlot ();
      }
   }


   private MostraAvviso (messaggio: string)
   {
      this.messageDialogService.showMessage ({
         title:      'ATTENZIONE',
         subtitle:   'Slot palestre',
         message:    messaggio,
         messtype:   'warning',
         btncaption: 'Chiudi'
      }, '500px');
   }


   TornaAgliOrari ()
   {
      this.router.navigate (['/orariopalestre']);
   }
}
