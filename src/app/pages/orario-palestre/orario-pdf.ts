import {EventoMasterElement,
        Resource} from '../../models/datamod';


/*
   Esportazione in PDF della vista "Orario palestre".
   La griglia viene ridisegnata (non fotografata): A4 orizzontale, sfondo bianco,
   colonne = palestre, un riquadro per giorno con le righe orarie.
   I giorni non vengono mai spezzati tra due pagine; l'intestazione con le palestre
   e' ripetuta su ogni pagina.
   In fondo, le pagine con gli orari gruppo per gruppo (giorno, ora, palestra).
*/


// Dati di un evento periodico gia' posizionato nella griglia (minuti dalla mezzanotte)
export interface PdfBlocco
{
   evento: EventoMasterElement;
   da: number;
   a: number;
   sinistra: number;     // % della colonna
   larghezza: number;    // % della colonna
   conflitto: boolean;
}


export interface PdfGiorno
{
   nome: string;
   inizio: number;       // minuti
   fine: number;         // minuti
   celle: Array<Array<PdfBlocco>>;   // una cella per palestra, nello stesso ordine di 'palestre'
}


export interface PdfOrario
{
   stagione: string;
   dataRiferimento: Date | null;
   gruppo: string | null;            // gruppo scelto nel filtro (null = tutti)
   palestre: Array<Resource>;
   giorni: Array<PdfGiorno>;
   senzaOrario: Array<EventoMasterElement>;
   numConflitti: number;
}


// Pagina e scala (millimetri)
const PAG_L: number = 297;
const PAG_A: number = 210;
const MARGINE: number = 10;
const COL_ORE: number = 11;          // colonna delle etichette orarie
const MM_PER_MINUTO: number = 0.115; // 1 ora = 6,9 mm: due giorni feriali per pagina
const ALT_INTESTAZIONE: number = 12; // titolo e sottotitolo
const ALT_PALESTRE: number = 7;      // riga con i nomi delle palestre
const ALT_GIORNO: number = 6;        // barra con il nome del giorno


export async function EsportaOrarioPdf (dati: PdfOrario,
                                        nomeFile: string)
{
   // Caricata solo quando serve: non appesantisce l'avvio dell'applicazione
   const { jsPDF } = await import ('jspdf');
   const doc = new jsPDF ({ orientation: 'landscape', unit: 'mm', format: 'a4' });
   const n: number = Math.max (dati.palestre.length, 1);
   const larghCol: number = (PAG_L - 2 * MARGINE - COL_ORE) / n;
   const xCol = (i: number): number => MARGINE + COL_ORE + i * larghCol;
   const fondoPagina: number = PAG_A - MARGINE - 4;

   const intestazione = (): number =>
   {
      let y: number = MARGINE + 5;
      doc.setTextColor (0, 0, 0);
      doc.setFont ('helvetica', 'bold');
      doc.setFontSize (13);
      doc.text (Testo (`Orario palestre - Stagione ${dati.stagione}` + ((dati.gruppo) ? ` - Gruppo ${dati.gruppo}` : '')), MARGINE, y);
      doc.setFont ('helvetica', 'normal');
      doc.setFontSize (8);
      let note: string = (dati.dataRiferimento) ? `Eventi periodici attivi il ${dati.dataRiferimento.toLocaleDateString ('it-IT')}` : 'Tutti gli eventi periodici della stagione';
      if (dati.numConflitti > 0)
         note += `   -   ${dati.numConflitti} eventi si sovrappongono (bordo rosso)`;
      doc.text (Testo (note), MARGINE, y + 4);
      doc.text (Testo (`Stampato il ${new Date ().toLocaleDateString ('it-IT')}`), PAG_L - MARGINE, y, { align: 'right' });
      y = MARGINE + ALT_INTESTAZIONE;

      // nomi delle palestre nei loro colori
      dati.palestre.forEach ((p, i) =>
      {
         const sfondo = Colore (p.coloresfondo, [66, 45, 107]);
         const testo = Colore (p.coloretesto, [255, 255, 255]);
         doc.setFillColor (sfondo[0], sfondo[1], sfondo[2]);
         doc.setDrawColor (255, 255, 255);
         doc.rect (xCol (i), y, larghCol, ALT_PALESTRE, 'FD');
         doc.setTextColor (testo[0], testo[1], testo[2]);
         doc.setFont ('helvetica', 'bold');
         doc.setFontSize (8);
         doc.text (Taglia (doc, Testo (p.nome), larghCol - 2), xCol (i) + larghCol / 2, y + 4.7, { align: 'center' });
      });
      return y + ALT_PALESTRE + 1;
   };

   let y: number = intestazione ();
   for (const g of dati.giorni)
   {
      const altGriglia: number = (g.fine - g.inizio) * MM_PER_MINUTO;
      if ((y + ALT_GIORNO + altGriglia > fondoPagina) && (y > MARGINE + ALT_INTESTAZIONE + ALT_PALESTRE + 2))
      {
         doc.addPage ();
         y = intestazione ();
      }

      // barra del giorno
      doc.setFillColor (232, 227, 243);
      doc.rect (MARGINE, y, PAG_L - 2 * MARGINE, ALT_GIORNO, 'F');
      doc.setTextColor (40, 30, 80);
      doc.setFont ('helvetica', 'bold');
      doc.setFontSize (9);
      doc.text (Testo (g.nome), MARGINE + 2, y + 4.2);
      y += ALT_GIORNO;

      // righe orarie e separatori delle colonne
      const yMin = (m: number): number => y + (m - g.inizio) * MM_PER_MINUTO;
      for (let m = Math.ceil (g.inizio / 30) * 30; m <= g.fine; m += 30)
      {
         const intera: boolean = (m % 60 == 0);
         doc.setDrawColor (intera ? 190 : 225, intera ? 190 : 225, intera ? 190 : 225);
         doc.setLineWidth (intera ? 0.2 : 0.1);
         doc.line (MARGINE + COL_ORE, yMin (m), PAG_L - MARGINE, yMin (m));
         if ((intera) && (m < g.fine))
         {
            doc.setTextColor (90, 90, 90);
            doc.setFont ('helvetica', 'normal');
            doc.setFontSize (6.5);
            doc.text (`${String (Math.floor (m / 60) % 24).padStart (2, '0')}:00`, MARGINE + COL_ORE - 1, yMin (m) + 1, { align: 'right' });
         }
      }
      doc.setDrawColor (190, 190, 190);
      doc.setLineWidth (0.2);
      for (let i = 0; i <= n; i++)
         doc.line (xCol (i), y, xCol (i), y + altGriglia);

      // eventi
      g.celle.forEach ((blocchi, i) =>
      {
         for (const b of blocchi)
            DisegnaBlocco (doc, b, xCol (i) + larghCol * b.sinistra / 100 + 0.3, yMin (b.da),
                           larghCol * b.larghezza / 100 - 0.6, Math.max ((b.a - b.da) * MM_PER_MINUTO, 3));
      });
      y += altGriglia + 3;
   }

   // eventi senza orario (non presenti nella griglia)
   if (dati.senzaOrario.length > 0)
   {
      if (y + 10 > fondoPagina)
      {
         doc.addPage ();
         y = intestazione ();
      }
      doc.setTextColor (0, 0, 0);
      doc.setFont ('helvetica', 'normal');
      doc.setFontSize (8);
      const elenco: string = dati.senzaOrario.map (ev => `${ev.gruppo ?? ''} (${ev.risorsa ?? ''}, ${ev.data.toLocaleDateString ('it-IT', { weekday: 'long' })})`).join (';  ');
      doc.text (doc.splitTextToSize (Testo (`Eventi periodici senza orario: ${elenco}`), PAG_L - 2 * MARGINE), MARGINE, y + 3);
   }

   // orari gruppo per gruppo, in pagine nuove
   OrariPerGruppo (doc, dati);

   // numeri di pagina
   const pagine: number = doc.getNumberOfPages ();
   for (let p = 1; p <= pagine; p++)
   {
      doc.setPage (p);
      doc.setTextColor (120, 120, 120);
      doc.setFont ('helvetica', 'normal');
      doc.setFontSize (7);
      doc.text (`Pagina ${p} di ${pagine}`, PAG_L - MARGINE, PAG_A - MARGINE + 3, { align: 'right' });
   }

   doc.save (nomeFile);
}


// Un evento: riquadro nel colore del gruppo con gruppo, orario, commento (allenatori) e periodo
function DisegnaBlocco (doc: any,
                        b: PdfBlocco,
                        x: number,
                        y: number,
                        w: number,
                        h: number)
{
   const ev: EventoMasterElement = b.evento;
   const sfondo = Colore (ev.gruppobck, [57, 73, 171]);
   const testo = Colore (ev.gruppotxt, [255, 255, 255]);
   doc.setFillColor (sfondo[0], sfondo[1], sfondo[2]);
   if (b.conflitto)
   {
      doc.setDrawColor (229, 0, 40);
      doc.setLineWidth (0.7);
   }
   else
   {
      doc.setDrawColor (60, 60, 60);
      doc.setLineWidth (0.15);
   }
   doc.roundedRect (x, y, w, h, 0.8, 0.8, 'FD');

   const fmt = (d: Date): string => d.toLocaleDateString ('it-IT', { day: '2-digit', month: '2-digit' });
   const ora = (d: Date): string => `${String (d.getHours ()).padStart (2, '0')}:${String (d.getMinutes ()).padStart (2, '0')}`;
   const righe: Array<{ testo: string, grassetto: boolean }> = [];
   righe.push ({ testo: Testo (ev.gruppo ?? ''), grassetto: true });
   righe.push ({ testo: `${ora (ev.orainizio)}-${ora (ev.orafine)}`, grassetto: false });
   const commento: string = Testo ((ev.commento ?? '').trim ());
   doc.setFontSize (6);
   if (commento != '')
   {
      for (const r of doc.splitTextToSize (commento, w - 1.2))
         righe.push ({ testo: r, grassetto: false });
   }
   righe.push ({ testo: `${fmt (ev.data)} - ${fmt (ev.datafine)}`, grassetto: false });

   // solo le righe che stanno nel riquadro
   const altRiga: number = 2.3;
   const maxRighe: number = Math.max (1, Math.floor ((h - 0.6) / altRiga));
   doc.setTextColor (testo[0], testo[1], testo[2]);
   righe.slice (0, maxRighe).forEach ((r, i) =>
   {
      doc.setFont ('helvetica', r.grassetto ? 'bold' : 'normal');
      doc.text (Taglia (doc, r.testo, w - 1.2), x + 0.6, y + 2.0 + i * altRiga);
   });
}


// Una riga dell'orario di un gruppo
interface RigaGruppo
{
   giorno: string;
   ordine: number;       // giorno della settimana (ordine della griglia) e ora, per ordinare
   ora: string;
   palestra: string;
   periodo: string;
   note: string;
}


interface OrarioGruppo
{
   nome: string;
   sfondo: [number, number, number];
   testo: [number, number, number];
   righe: Array<RigaGruppo>;
}


/*
   Pagine finali: un riquadro per gruppo con i suoi orari, su due colonne.
   Usa gli stessi eventi della griglia (stessi filtri), piu' quelli senza orario.
*/
function OrariPerGruppo (doc: any,
                         dati: PdfOrario)
{
   const fmt = (d: Date): string => d.toLocaleDateString ('it-IT', { day: '2-digit', month: '2-digit', year: '2-digit' });
   const ora = (d: Date): string => `${String (d.getHours ()).padStart (2, '0')}:${String (d.getMinutes ()).padStart (2, '0')}`;
   const gruppi = new Map<string, OrarioGruppo> ();
   const visti = new Set<number> ();

   const aggiungi = (ev: EventoMasterElement, riga: RigaGruppo) =>
   {
      const chiave: string = `${ev.gruppo_id}|${ev.gruppo ?? ''}`;
      let g = gruppi.get (chiave);
      if (g == null)
      {
         g = { nome:   Testo (ev.gruppo ?? '(senza gruppo)'),
               sfondo: Colore (ev.gruppobck, [57, 73, 171]),
               testo:  Colore (ev.gruppotxt, [255, 255, 255]),
               righe:  [] };
         gruppi.set (chiave, g);
      }
      g.righe.push (riga);
   };

   dati.giorni.forEach ((giorno, iGiorno) =>
   {
      giorno.celle.forEach ((blocchi, iPalestra) =>
      {
         for (const b of blocchi)
         {
            const ev: EventoMasterElement = b.evento;
            if (visti.has (ev.id))
               continue;
            visti.add (ev.id);
            aggiungi (ev, {
               giorno:   Testo (giorno.nome),
               ordine:   iGiorno * 10000 + b.da,
               ora:      `${ora (ev.orainizio)} - ${ora (ev.orafine)}`,
               palestra: Testo (dati.palestre[iPalestra]?.nome ?? ev.risorsa ?? ''),
               periodo:  `${fmt (ev.data)} - ${fmt (ev.datafine)}`,
               note:     Testo ((ev.commento ?? '').trim ())
            });
         }
      });
   });
   for (const ev of dati.senzaOrario)
   {
      if (visti.has (ev.id))
         continue;
      visti.add (ev.id);
      const nomeGiorno: string = ev.data.toLocaleDateString ('it-IT', { weekday: 'long' });
      aggiungi (ev, {
         giorno:   Testo (nomeGiorno.charAt (0).toUpperCase () + nomeGiorno.slice (1)),
         ordine:   1000000 + ((ev.data.getDay () + 6) % 7),   // in fondo all'elenco del gruppo
         ora:      'senza orario',
         palestra: Testo (ev.risorsa ?? ''),
         periodo:  `${fmt (ev.data)} - ${fmt (ev.datafine)}`,
         note:     Testo ((ev.commento ?? '').trim ())
      });
   }
   if (gruppi.size == 0)
      return;

   const elenco: Array<OrarioGruppo> = [...gruppi.values ()].sort ((a, b) => a.nome.localeCompare (b.nome, 'it', { numeric: true }));
   for (const g of elenco)
      g.righe.sort ((a, b) => a.ordine - b.ordine);

   // Impaginazione su due colonne: un riquadro va a capo intero se non sta nello spazio rimasto
   const SPAZIO: number = 6;
   const larghCol: number = (PAG_L - 2 * MARGINE - SPAZIO) / 2;
   const COLONNE: Array<{ titolo: string, largh: number }> = [
      { titolo: 'Giorno',   largh: 20 },
      { titolo: 'Ora',      largh: 22 },
      { titolo: 'Palestra', largh: 32 },
      { titolo: 'Periodo',  largh: 30 },
      { titolo: 'Note',     largh: larghCol - 104 }
   ];
   const ALT_TITOLO: number = 6.5;
   const ALT_TESTATA: number = 4.5;
   const ALT_RIGA: number = 4.6;
   const fondo: number = PAG_A - MARGINE - 4;
   let colonna: number = 0;
   let y: number = 0;
   let inizioColonna: number = 0;

   const nuovaPagina = () =>
   {
      doc.addPage ();
      doc.setTextColor (0, 0, 0);
      doc.setFont ('helvetica', 'bold');
      doc.setFontSize (13);
      doc.text (Testo (`Orari per gruppo - Stagione ${dati.stagione}` + ((dati.gruppo) ? ` - Gruppo ${dati.gruppo}` : '')), MARGINE, MARGINE + 5);
      doc.setFont ('helvetica', 'normal');
      doc.setFontSize (8);
      doc.text (Testo ((dati.dataRiferimento) ? `Eventi periodici attivi il ${dati.dataRiferimento.toLocaleDateString ('it-IT')}` : 'Tutti gli eventi periodici della stagione'), MARGINE, MARGINE + 9);
      doc.text (Testo (`Stampato il ${new Date ().toLocaleDateString ('it-IT')}`), PAG_L - MARGINE, MARGINE + 5, { align: 'right' });
      colonna = 0;
      inizioColonna = MARGINE + ALT_INTESTAZIONE + 2;
      y = inizioColonna;
   };
   const prossimaColonna = () =>
   {
      if (colonna == 0)
      {
         colonna = 1;
         y = inizioColonna;
      }
      else
         nuovaPagina ();
   };
   const x0 = (): number => MARGINE + colonna * (larghCol + SPAZIO);

   const titoloGruppo = (g: OrarioGruppo, segue: boolean) =>
   {
      doc.setFillColor (g.sfondo[0], g.sfondo[1], g.sfondo[2]);
      doc.setDrawColor (60, 60, 60);
      doc.setLineWidth (0.15);
      doc.rect (x0 (), y, larghCol, ALT_TITOLO, 'FD');
      doc.setTextColor (g.testo[0], g.testo[1], g.testo[2]);
      doc.setFont ('helvetica', 'bold');
      doc.setFontSize (10);
      doc.text (Taglia (doc, g.nome + ((segue) ? ' (segue)' : ''), larghCol - 4), x0 () + 2, y + 4.5);
      y += ALT_TITOLO;
      // testata delle colonne
      doc.setFillColor (232, 227, 243);
      doc.rect (x0 (), y, larghCol, ALT_TESTATA, 'F');
      doc.setTextColor (40, 30, 80);
      doc.setFontSize (7.5);
      let x: number = x0 () + 1.5;
      for (const c of COLONNE)
      {
         doc.text (c.titolo, x, y + 3.2);
         x += c.largh;
      }
      y += ALT_TESTATA;
   };

   nuovaPagina ();
   for (const g of elenco)
   {
      const altezza: number = ALT_TITOLO + ALT_TESTATA + g.righe.length * ALT_RIGA;
      if ((y > inizioColonna) && (y + altezza > fondo))
         prossimaColonna ();
      titoloGruppo (g, false);
      g.righe.forEach ((r, i) =>
      {
         // gruppo con piu' righe di quante ne stanno in una colonna: continua nella successiva
         if (y + ALT_RIGA > fondo)
         {
            prossimaColonna ();
            titoloGruppo (g, true);
         }
         if (i % 2 == 1)
         {
            doc.setFillColor (243, 243, 247);
            doc.rect (x0 (), y, larghCol, ALT_RIGA, 'F');
         }
         doc.setTextColor (0, 0, 0);
         doc.setFontSize (8);
         let x: number = x0 () + 1.5;
         [r.giorno, r.ora, r.palestra, r.periodo, r.note].forEach ((t, k) =>
         {
            doc.setFont ('helvetica', (k == 0) ? 'bold' : 'normal');
            doc.text (Taglia (doc, t, COLONNE[k].largh - 2), x, y + 3.3);
            x += COLONNE[k].largh;
         });
         y += ALT_RIGA;
      });
      doc.setDrawColor (160, 160, 160);
      doc.setLineWidth (0.2);
      doc.line (x0 (), y, x0 () + larghCol, y);
      y += SPAZIO;
   }
}


// Accorcia un testo (con "...") perche' stia nella larghezza indicata
function Taglia (doc: any,
                 testo: string,
                 larghezza: number): string
{
   if (doc.getTextWidth (testo) <= larghezza)
      return testo;
   let t: string = testo;
   while ((t.length > 1) && (doc.getTextWidth (t + '...') > larghezza))
      t = t.slice (0, -1);
   return t + '...';
}


// I font standard del PDF non hanno alcuni simboli: li sostituisco con equivalenti semplici
function Testo (s: string): string
{
   return `${s ?? ''}`.replace (/[–—]/g, '-').replace (/→/g, '->').replace (/[‘’]/g, "'");
}


// "#rrggbb" o "#rgb" -> [r, g, b]; se non valido usa il colore di riserva
function Colore (hex: string | null | undefined,
                 riserva: [number, number, number]): [number, number, number]
{
   const h: string = `${hex ?? ''}`.trim ().replace ('#', '');
   const pieno: string = (h.length == 3) ? h.split ('').map (c => c + c).join ('') : h;
   if (!/^[0-9a-fA-F]{6}$/.test (pieno))
      return riserva;
   return [parseInt (pieno.substring (0, 2), 16), parseInt (pieno.substring (2, 4), 16), parseInt (pieno.substring (4, 6), 16)];
}
