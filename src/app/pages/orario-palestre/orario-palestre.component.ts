import {ChangeDetectorRef,
        Component,
        ElementRef,
        HostListener,
        OnInit,
        ViewChild} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {Router} from '@angular/router';
import {firstValueFrom} from 'rxjs';

// primeng
import {ButtonModule} from 'primeng/button';
import {CalendarModule} from 'primeng/calendar';
import {CardModule} from 'primeng/card';
import {MultiSelectModule} from 'primeng/multiselect';
import {DropdownModule} from 'primeng/dropdown';
import {ProgressSpinnerModule} from 'primeng/progressspinner';

// other
import {EventoMasterElement,
        Resource,
        SeasonElement} from '../../models/datamod';
import {SeasonsService} from '../../services/seasons.service';
import {RisorseService} from '../../services/risorse.service';
import {EventiMasterService} from '../../services/eventi-master.service';
import {MessageDialogService} from '../../services/message-dialog.service';
import {loggedUser} from '../../services/users.service';
import {globs} from '../../common/globals';
import {utils} from '../../common/utils';
import {ScegliStagione} from '../../common/stagioni';
import {EsportaOrarioPdf} from './orario-pdf';
import {IdRisorseTrasferta,
        IntervalliSovrapposti,
        IntervalloMin,
        IntervalloMinuti} from '../../common/sovrapposizioni';


// Altezza delle righe orarie: pixel per ogni minuto (1 ora = 42 px)
const PX_PER_MINUTO: number = 0.7;
// Fascia oraria mostrata sempre (allargata solo se qualche evento ne esce):
// dal lunedi' al venerdi' 14:30-23:30, sabato e domenica 9:00-21:00
const FASCIA_FERIALE = { inizio: 14 * 60 + 30, fine: 23 * 60 + 30 };
const FASCIA_WEEKEND = { inizio: 9 * 60,       fine: 21 * 60 };
// Passo (minuti) con cui si arrotonda l'ora quando si clicca su uno spazio libero
const PASSO_MINUTI: number = 30;
// Palestre scelte (id): ricordate anche dopo la chiusura del browser
const CHIAVE_PALESTRE: string = "RS_Orario_Palestre";
// Gruppo scelto (id, null = tutti): ricordato anche dopo la chiusura del browser
const CHIAVE_GRUPPO: string = "RS_Orario_Gruppo";


// Voce del selettore gruppi (ricavata dagli eventi periodici della stagione)
interface VoceGruppo
{
   id: number;
   nome: string;
}


// Un evento periodico disegnato nella griglia
interface Blocco
{
   evento: EventoMasterElement;
   da: number;           // minuti dalla mezzanotte (inizio)
   a: number;            // minuti dalla mezzanotte (fine)
   top: number;          // px dall'inizio della fascia oraria del giorno
   altezza: number;      // px
   sinistra: number;     // % della colonna
   larghezza: number;    // % della colonna
   stile: { [key: string]: string };
   titolo: string;       // gruppo
   orario: string;       // "18:00–19:30"
   periodo: string;      // "01/09 → 30/06"
   commento: string;     // di solito i nomi degli allenatori presenti
   conflitto: boolean;   // si sovrappone (orario e periodo) a un altro evento periodico della stessa palestra
   tooltip: string;
}


// Le celle di un giorno (macro-riga): una per palestra
interface CellaPalestra
{
   palestra: Resource;
   blocchi: Array<Blocco>;
}


// Un giorno della settimana (macro-riga)
interface Giorno
{
   giorno: number;       // 0 = domenica ... 6 = sabato (come Date.getDay())
   nome: string;
   vuoto: boolean;       // nessun evento periodico nel giorno
   inizio: number;       // minuti dalla mezzanotte della prima riga oraria
   fine: number;         // minuti dalla mezzanotte dell'ultima riga oraria
   altezza: number;      // px
   ore: Array<{ etichetta: string, top: number }>;
   mezzore: Array<number>;   // posizione (px) delle linee delle mezz'ore
   celle: Array<CellaPalestra>;
   numEventi: number;
}


@Component ({
               selector:    'app-orario-palestre',
               standalone:  true,
               imports:     [
                  CommonModule,
                  FormsModule,
                  ButtonModule,
                  CalendarModule,
                  CardModule,
                  MultiSelectModule,
                  DropdownModule,
                  ProgressSpinnerModule
               ],
               templateUrl: './orario-palestre.component.html',
               styleUrl:    './orario-palestre.component.css'
            })
export class OrarioPalestreComponent implements OnInit
{
   caricamento: boolean = false;
   esportazioneInCorso: boolean = false;
   theLocalStorage: globs.TLocalStorage | null = null;
   listaStagioni: Array<SeasonElement> = [];
   currSeason: SeasonElement | null = null;
   listaPalestre: Array<Resource> = [];            // tutte le palestre (senza la trasferta)
   palestreMostrate: Array<Resource> = [];         // colonne della griglia
   palestreSelezionate: Array<Resource> = [];      // scelte dall'utente nel selettore
   private selezioneDaImpostare: boolean = false;  // nessuna selezione salvata: la prima volta si propongono le palestre con eventi
   // Solo su iOS: le tendine ignorano gli eventi di scroll (altrimenti si richiudono subito, come nella pagina eventi)
   comboOverlayOptions: any = utils.IsIOS ()
                              ? { listener: (event: Event, opts: { type: string, valid: boolean }) => (opts.type === 'scroll') ? false : opts.valid }
                              : undefined;
   dataRiferimento: Date | null = null;            // se indicata: solo eventi periodici attivi in quella data
   listaGruppi: Array<VoceGruppo> = [];            // gruppi che hanno eventi periodici nella stagione
   gruppoSelezionato: VoceGruppo | null = null;    // null = tutti i gruppi
   private idGruppoSalvato: number | null = null;

   eventi: Array<EventoMasterElement> = [];
   giorni: Array<Giorno> = [];
   senzaOrario: Array<EventoMasterElement> = [];
   numConflitti: number = 0;
   colonneGriglia: string = "";                    // grid-template-columns
   altezzaGriglia: number | null = null;           // px fino al piè di pagina (null = valore di riserva del CSS)
   @ViewChild ('grigliaScroll') grigliaScroll?: ElementRef<HTMLElement>;


   /*
      Altezza della griglia: dallo suo inizio fino al piè di pagina (fisso in basso).
      Misurata perché l'intestazione può andare su due righe quando la finestra è stretta.
      Dopo un setTimeout, così la griglia è già disegnata.
   */
   AggiornaAltezzaGriglia ()
   {
      setTimeout (() =>
                  {
                     const griglia = this.grigliaScroll?.nativeElement;
                     const footer = document.querySelector ('.app-footer') as HTMLElement | null;
                     if ((!griglia) || (!footer))
                        return;
                     const altezza: number = Math.floor (footer.getBoundingClientRect ().top - griglia.getBoundingClientRect ().top - 8);
                     if (altezza >= 150)
                     {
                        this.altezzaGriglia = altezza;
                        this.cdr.detectChanges ();
                     }
                  });
   }


   @HostListener ('window:resize')
   OnResize ()
   {
      this.AggiornaAltezzaGriglia ();
   }


   constructor (private router: Router,
                private seasonServ: SeasonsService,
                private resourceService: RisorseService,
                private eventiMasterService: EventiMasterService,
                private messageDialogService: MessageDialogService,
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
            // La trasferta non e' una palestra nostra
            const trasferte: Set<number> = IdRisorseTrasferta (dataRis.elements);
            this.listaPalestre = (dataRis.elements as Array<Resource>).filter (r => !trasferte.has (Number (r.id)));
         }
         else
            this.messageDialogService.showError ("Errore durante il caricamento delle palestre", dataRis?.message ?? 'No data returned');

         // Stessa stagione delle altre pagine
         this.theLocalStorage = new globs.TLocalStorage ();
         await this.theLocalStorage.Load ();
         this.currSeason = ScegliStagione (this.listaStagioni, this.theLocalStorage.data.currSeason);
         this.theLocalStorage.data.currSeason = this.currSeason;
         this.theLocalStorage.Save ();

         const salvate = utils.GetFromLocalStorage<Array<number>> (CHIAVE_PALESTRE);
         if (Array.isArray (salvate))
            this.palestreSelezionate = this.listaPalestre.filter (p => salvate.some (id => id == p.id));
         else
            this.selezioneDaImpostare = true;
         this.idGruppoSalvato = utils.GetFromLocalStorage<number> (CHIAVE_GRUPPO);

         await this.CaricaEventi ();
      }
      catch (e)
      {
         this.messageDialogService.showError ("Errore durante l'apertura dell'orario palestre", e);
      }
      finally
      {
         this.caricamento = false;
         this.cdr.detectChanges ();
      }
   }


   async OnStagioneChange ()
   {
      if (this.theLocalStorage)
      {
         this.theLocalStorage.data.currSeason = this.currSeason;
         this.theLocalStorage.Save ();
      }
      await this.CaricaEventi ();
   }


   OnPalestreChange ()
   {
      utils.SaveToLocalStorage (CHIAVE_PALESTRE, this.palestreSelezionate.map (p => p.id));
      this.CostruisciGriglia ();
   }


   OnDataRiferimentoChange ()
   {
      this.CostruisciGriglia ();
   }


   OnGruppoChange ()
   {
      this.idGruppoSalvato = (this.gruppoSelezionato) ? this.gruppoSelezionato.id : null;
      if (this.idGruppoSalvato == null)
         utils.removeFromLocalStorage (CHIAVE_GRUPPO);
      else
         utils.SaveToLocalStorage (CHIAVE_GRUPPO, this.idGruppoSalvato);
      this.CostruisciGriglia ();
   }


   // Elenco dei gruppi presenti negli eventi periodici caricati, in ordine alfabetico.
   // Mantiene il gruppo scelto se c'è anche nella nuova stagione.
   AggiornaListaGruppi ()
   {
      const gruppi: Map<number, string> = new Map<number, string> ();
      for (const ev of this.eventi)
      {
         const id: number = Number (ev.gruppo_id);
         if ((id > 0) && (!gruppi.has (id)))
            gruppi.set (id, ev.gruppo ?? `Gruppo ${id}`);
      }
      this.listaGruppi = Array.from (gruppi, ([id, nome]) => ({ id: id, nome: nome }))
                              .sort ((a, b) => a.nome.localeCompare (b.nome, 'it'));
      this.gruppoSelezionato = this.listaGruppi.find (g => g.id == this.idGruppoSalvato) ?? null;
   }


   // Tutti gli eventi periodici della stagione (tutte le palestre) con una sola chiamata
   async CaricaEventi ()
   {
      this.caricamento = true;
      this.cdr.detectChanges ();
      try
      {
         const seasonId: number | null = (this.currSeason) ? this.currSeason.id : null;
         const resp = await firstValueFrom (this.eventiMasterService.getAllData (seasonId, null, null, null));
         if ((resp) && (resp.ok))
            this.eventi = resp.elements;
         else
         {
            this.eventi = [];
            this.messageDialogService.showError ("Errore durante il caricamento degli eventi periodici", resp?.message ?? 'No data returned');
         }
      }
      catch (e)
      {
         this.eventi = [];
         this.messageDialogService.showError ("Errore durante il caricamento degli eventi periodici", e);
      }
      finally
      {
         this.caricamento = false;
         this.AggiornaListaGruppi ();
         // Prima apertura (nessuna selezione salvata): le palestre con eventi nella stagione, o tutte se non ce ne sono
         if (this.selezioneDaImpostare)
         {
            const conEventi: Set<number> = new Set<number> (this.eventi.map (ev => Number (ev.risorsa_id)));
            this.palestreSelezionate = this.listaPalestre.filter (p => conEventi.has (Number (p.id)));
            if (this.palestreSelezionate.length == 0)
               this.palestreSelezionate = [...this.listaPalestre];
            this.selezioneDaImpostare = false;
         }
         this.CostruisciGriglia ();
         this.cdr.detectChanges ();
      }
   }


   /*
      Costruisce la griglia: una macro-riga per giorno della settimana (da lunedi' a domenica),
      e in ognuna le righe orarie; una colonna per palestra.
      Eventi della stessa palestra e dello stesso giorno con orario che si accavalla vengono affiancati.
   */
   CostruisciGriglia ()
   {
      const fmt = (d: Date): string => d.toLocaleDateString ('it-IT', { day: '2-digit', month: '2-digit' });
      const riferimento: string | null = (this.dataRiferimento) ? utils.DataPerDb (this.dataRiferimento) : null;
      const idPalestre: Set<number> = new Set<number> (this.listaPalestre.map (p => Number (p.id)));

      const idGruppo: number | null = (this.gruppoSelezionato) ? this.gruppoSelezionato.id : null;

      // Eventi delle nostre palestre, con orario, eventualmente attivi nella data di riferimento.
      // 'tutti' serve a riconoscere le sovrapposizioni anche con i gruppi nascosti dal filtro;
      // 'conOrario' sono quelli disegnati (solo il gruppo scelto, se c'è).
      const tutti: Array<{ ev: EventoMasterElement, int: IntervalloMin }> = [];
      const conOrario: Array<{ ev: EventoMasterElement, int: IntervalloMin }> = [];
      this.senzaOrario = [];
      for (const ev of this.eventi)
      {
         if (!idPalestre.has (Number (ev.risorsa_id)))
            continue;
         if ((riferimento != null) && ((utils.DataPerDb (ev.data) > riferimento) || (riferimento > utils.DataPerDb (ev.datafine))))
            continue;
         const delGruppo: boolean = ((idGruppo == null) || (Number (ev.gruppo_id) == idGruppo));
         const int = IntervalloMinuti (ev.orainizio, ev.orafine);
         if (int == null)
         {
            if (delGruppo)
               this.senzaOrario.push (ev);
         }
         else
         {
            tutti.push ({ ev: ev, int: int });
            if (delGruppo)
               conOrario.push ({ ev: ev, int: int });
         }
      }

      // Colonne: le palestre scelte, nell'ordine dell'elenco palestre
      const scelte: Set<number> = new Set<number> (this.palestreSelezionate.map (p => Number (p.id)));
      this.palestreMostrate = this.listaPalestre.filter (p => scelte.has (Number (p.id)));
      this.colonneGriglia = `56px repeat(${Math.max (this.palestreMostrate.length, 1)}, minmax(120px, 1fr))`;

      // Macro-righe: da lunedi' a domenica
      const ordine: Array<number> = [1, 2, 3, 4, 5, 6, 0];
      const nomi: Array<string> = ["Domenica", "Lunedì", "Martedì", "Mercoledì", "Giovedì", "Venerdì", "Sabato"];
      this.numConflitti = 0;
      this.giorni = ordine.map (giorno =>
      {
         const delGiorno = conOrario.filter (x => x.ev.data.getDay () == giorno);
         const tuttiDelGiorno = tutti.filter (x => x.ev.data.getDay () == giorno);

         // Fascia oraria sempre visibile (feriale o weekend), allargata (alla mezz'ora) se qualche
         // evento ne esce: cosi' si puo' cliccare anche negli orari ancora liberi
         const fascia = ((giorno == 0) || (giorno == 6)) ? FASCIA_WEEKEND : FASCIA_FERIALE;
         let inizio: number = fascia.inizio;
         let fine: number = fascia.fine;
         if (delGiorno.length > 0)
         {
            inizio = Math.min (inizio, Math.floor (Math.min (...delGiorno.map (x => x.int.da)) / 30) * 30);
            fine = Math.max (fine, Math.min (Math.ceil (Math.max (...delGiorno.map (x => x.int.a)) / 30) * 30, 26 * 60));
         }
         const ore: Array<{ etichetta: string, top: number }> = [];
         const mezzore: Array<number> = [];
         for (let m = inizio; m < fine; m += 30)
         {
            if (m % 60 == 0)
               ore.push ({ etichetta: `${String (Math.floor (m / 60) % 24).padStart (2, '0')}:00`, top: (m - inizio) * PX_PER_MINUTO });
            else
               mezzore.push ((m - inizio) * PX_PER_MINUTO);
         }

         const celle: Array<CellaPalestra> = this.palestreMostrate.map (palestra =>
         {
            const eventiCella = delGiorno.filter (x => x.ev.risorsa_id == palestra.id)
                                         .sort ((a, b) => (a.int.da - b.int.da) || (a.int.a - b.int.a));
            const confronto = tuttiDelGiorno.filter (x => x.ev.risorsa_id == palestra.id);
            return { palestra: palestra, blocchi: this.CostruisciBlocchi (eventiCella, confronto, inizio, fmt) };
         });
         return {
            giorno:    giorno,
            nome:      nomi[giorno],
            vuoto:     delGiorno.length == 0,
            inizio:    inizio,
            fine:      fine,
            altezza:   (fine - inizio) * PX_PER_MINUTO,
            ore:       ore,
            mezzore:   mezzore,
            celle:     celle,
            numEventi: delGiorno.length
         };
      });
      this.AggiornaAltezzaGriglia ();
   }


   /*
      Blocchi di una cella (stessa palestra, stesso giorno), gia' ordinati per orario.
      Corsie: un evento va nella prima corsia libera; gli eventi di un gruppo che si accavalla
      dividono la larghezza della cella per il numero di corsie usate dal gruppo.
   */
   CostruisciBlocchi (eventi: Array<{ ev: EventoMasterElement, int: IntervalloMin }>,
                      confronto: Array<{ ev: EventoMasterElement, int: IntervalloMin }>,
                      inizio: number,
                      fmt: (d: Date) => string): Array<Blocco>
   {
      const corsia: Array<number> = [];
      const gruppo: Array<number> = [];
      const corsiePerGruppo: Array<number> = [];
      let fineCorsie: Array<number> = [];
      let gruppoCorrente: number = -1;
      let fineGruppo: number = -1;
      eventi.forEach ((x, i) =>
      {
         if (x.int.da >= fineGruppo)
         {
            gruppoCorrente++;
            fineCorsie = [];
            corsiePerGruppo.push (0);
         }
         let c: number = fineCorsie.findIndex (f => f <= x.int.da);
         if (c < 0)
         {
            c = fineCorsie.length;
            fineCorsie.push (0);
         }
         fineCorsie[c] = x.int.a;
         fineGruppo = Math.max (fineGruppo, x.int.a);
         corsia[i] = c;
         gruppo[i] = gruppoCorrente;
         corsiePerGruppo[gruppoCorrente] = Math.max (corsiePerGruppo[gruppoCorrente], c + 1);
      });

      return eventi.map ((x, i) =>
      {
         // Conflitto vero: orario che si accavalla E periodi che si sovrappongono.
         // Si confronta con tutti gli eventi della cella, anche quelli dei gruppi nascosti dal filtro.
         const conflitto: boolean = confronto.some (y => (y.ev !== x.ev) &&
            (IntervalliSovrapposti (x.int, y.int)) &&
            (utils.DataPerDb (x.ev.data) <= utils.DataPerDb (y.ev.datafine)) &&
            (utils.DataPerDb (y.ev.data) <= utils.DataPerDb (x.ev.datafine)));
         if (conflitto)
            this.numConflitti++;
         const n: number = corsiePerGruppo[gruppo[i]];
         const orario: string = `${utils.OraPerDb (x.ev.orainizio)}–${utils.OraPerDb (x.ev.orafine)}`;
         const stile: { [key: string]: string } = {};
         if ((x.ev.gruppobck) && (x.ev.gruppotxt))
         {
            stile['background-color'] = x.ev.gruppobck;
            stile['color'] = x.ev.gruppotxt;
         }
         return {
            evento:    x.ev,
            da:        x.int.da,
            a:         x.int.a,
            top:       (x.int.da - inizio) * PX_PER_MINUTO,
            altezza:   Math.max ((x.int.a - x.int.da) * PX_PER_MINUTO, 16),
            sinistra:  (100 / n) * corsia[i],
            larghezza: 100 / n,
            stile:     stile,
            titolo:    x.ev.gruppo ?? "",
            orario:    orario,
            periodo:   `${fmt (x.ev.data)} → ${fmt (x.ev.datafine)}`,
            commento:  (x.ev.commento ?? "").trim (),
            conflitto: conflitto,
            tooltip:   `${x.ev.gruppo ?? ''}  ${orario}\nDal ${x.ev.data.toLocaleDateString ('it-IT')} al ${x.ev.datafine.toLocaleDateString ('it-IT')}` +
                       ((x.ev.commento) ? `\n${x.ev.commento}` : '') +
                       ((conflitto) ? '\n⚠ Si sovrappone a un altro evento periodico' : '')
         };
      });
   }


   // Esporta in PDF la vista attuale (stagione, palestre scelte e filtro "Attivi il")
   async EsportaPdf ()
   {
      if ((this.IsGuest ()) || (this.esportazioneInCorso) || (this.palestreMostrate.length == 0))
         return;
      this.esportazioneInCorso = true;
      this.cdr.detectChanges ();
      try
      {
         const stagione: string = this.currSeason?.nome ?? '';
         const nomeFile: string = `Orario palestre ${stagione}` + ((this.gruppoSelezionato) ? ` ${this.gruppoSelezionato.nome}` : '');
         await EsportaOrarioPdf ({
            stagione:        stagione,
            dataRiferimento: this.dataRiferimento,
            gruppo:          this.gruppoSelezionato?.nome ?? null,
            palestre:        this.palestreMostrate,
            giorni:          this.giorni.map (g => ({
               nome:   g.nome,
               inizio: g.inizio,
               fine:   g.fine,
               celle:  g.celle.map (c => c.blocchi.map (b => ({
                  evento:    b.evento,
                  da:        b.da,
                  a:         b.a,
                  sinistra:  b.sinistra,
                  larghezza: b.larghezza,
                  conflitto: b.conflitto
               })))
            })),
            senzaOrario:     this.senzaOrario,
            numConflitti:    this.numConflitti
         }, `${nomeFile.replace (/[\/:*?"<>|]/g, '-').trim ()}.pdf`);
      }
      catch (e)
      {
         this.messageDialogService.showError ("Errore durante la creazione del PDF", e);
      }
      finally
      {
         this.esportazioneInCorso = false;
         this.cdr.detectChanges ();
      }
   }


   StilePalestra (p: Resource): { [key: string]: string }
   {
      return ((p.coloresfondo) && (p.coloretesto)) ? { 'background-color': p.coloresfondo, 'color': p.coloretesto } : {};
   }


   // Utente entrato senza nome utente e password
   IsGuest (): boolean
   {
      return ((loggedUser.id == 0) && (loggedUser.ruolo == "Guest"));
   }


   PuoModificare (): boolean
   {
      return (loggedUser.attributo > 0);
   }


   // Clic su un evento: apre l'evento periodico in modifica
   ApriEvento (blocco: Blocco, event: MouseEvent)
   {
      event.stopPropagation ();
      if (!this.PuoModificare ())
         return;
      const ev: EventoMasterElement = blocco.evento;
      this.router.navigate (['/eventomasteredit'], {
         state: {
            id:        ev.id,
            isadd:     false,
            season_id: Number (ev.season_id) || ((this.currSeason) ? this.currSeason.id : 0),
            ritorno:   '/orariopalestre'
         }
      });
   }


   // Clic su uno spazio libero: nuovo evento periodico gia' impostato con giorno, ora e palestra
   NuovoEvento (giorno: Giorno, cella: CellaPalestra, event: MouseEvent)
   {
      if ((!this.PuoModificare ()) || (this.currSeason == null))
         return;
      let minuti: number = giorno.inizio + Math.floor (event.offsetY / PX_PER_MINUTO / PASSO_MINUTI) * PASSO_MINUTI;
      minuti = Math.max (0, Math.min (minuti, 23 * 60 + 30));
      this.router.navigate (['/eventomasteredit'], {
         state: {
            id:          0,
            isadd:       true,
            season_id:   this.currSeason.id,
            giorno:      giorno.giorno,
            ora:         minuti,
            risorsa_id:  cella.palestra.id,
            ritorno:     '/orariopalestre'
         }
      });
   }
}
