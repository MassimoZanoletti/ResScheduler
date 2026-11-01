import {EventoElement, TipoEvento} from "../models/datamod";


/*
   Funzioni per il controllo delle sovrapposizioni tra eventi nella stessa risorsa (palestra).
   Usate sia dal form di modifica evento (controllo al salvataggio)
   sia dalla pagina principale (evidenziazione nella tabella).
*/


// Durata ipotizzata per un evento senza ora di fine valida (come il pulsante "+2h")
export const DURATA_DEFAULT_MIN: number = 120;

// Nome della risorsa usata per le partite fuori casa: non occupa nessuna palestra
export const NOME_RISORSA_TRASFERTA: string = "Trasferta";


export interface IntervalloMin
{
   da: number;
   a: number;
}


/*
   Converte ora inizio/fine in minuti dalla mezzanotte: { da, a }.
   Ritorna null se l'evento non ha orario (00:00 - 00:00).
   Se la fine manca o e' prima dell'inizio si assume una durata di 2 ore.
*/
export function IntervalloMinuti (inizio: Date | null,
                                  fine: Date | null): IntervalloMin | null
{
   if (inizio == null)
      return null;
   const da: number = inizio.getHours () * 60 + inizio.getMinutes ();
   let a: number = (fine != null) ? (fine.getHours () * 60 + fine.getMinutes ()) : 0;
   if ((da == 0) && (a == 0))
      return null;
   if (a <= da)
      a = da + DURATA_DEFAULT_MIN;
   return { da: da, a: a };
}


// Due intervalli si sovrappongono se uno inizia prima che l'altro finisca (estremi esclusi)
export function IntervalliSovrapposti (x: IntervalloMin,
                                       y: IntervalloMin): boolean
{
   return ((x.da < y.a) && (y.da < x.a));
}


export function StessoGiorno (d1: Date,
                              d2: Date): boolean
{
   return ((d1.getFullYear () == d2.getFullYear ()) &&
           (d1.getMonth () == d2.getMonth ()) &&
           (d1.getDate () == d2.getDate ()));
}


/*
   Id delle risorse di tipo "Trasferta", ricavati dall'elenco completo delle risorse.
   Nota: negli eventi il campo 'risorsa' contiene l'abbreviazione (es. "TRA"), non il nome,
   quindi la trasferta va riconosciuta tramite risorsa_id.
*/
export function IdRisorseTrasferta (risorse: Array<{ id: number, nome: string }>): Set<number>
{
   return new Set<number> (risorse.filter (r => r.nome == NOME_RISORSA_TRASFERTA).map (r => Number (r.id)));
}


// true se l'evento occupa davvero una palestra (esclusi giorni vuoti, eventi senza palestra e trasferte)
export function OccupaRisorsa (ev: EventoElement,
                               trasferte: Set<number>): boolean
{
   return ((ev.tipoevento != TipoEvento.EventoVuoto) &&
           (ev.risorsa_id > 0) &&
           (!trasferte.has (Number (ev.risorsa_id))));
}


export function FormattaOra (d: Date | null): string
{
   if (d == null)
      return "--:--";
   return `${String (d.getHours ()).padStart (2, '0')}:${String (d.getMinutes ()).padStart (2, '0')}`;
}


// Descrizione breve in testo semplice: "17:30-19:30 Under-19 (Casa - Ospite)"
export function DescriviEvento (ev: EventoElement): string
{
   const partita: string = [ev.casa, ev.ospite].filter (s => (s) && (s.trim () != "")).join (' - ');
   let result: string = `${FormattaOra (ev.orainizio)}-${FormattaOra (ev.orafine)}  ${ev.gruppo ?? ''}`;
   if (partita != "")
      result += `  (${partita})`;
   if ((ev.commento) && (ev.commento.trim () != ""))
      result += `  ${ev.commento}`;
   return result;
}


// Il dialogo messaggi mostra il testo come HTML: i dati inseriti dagli utenti vanno protetti
export function EscapeHtml (s: string): string
{
   return s.replace (/&/g, '&amp;')
           .replace (/</g, '&lt;')
           .replace (/>/g, '&gt;')
           .replace (/"/g, '&quot;');
}


/*
   Calcola tutte le sovrapposizioni in un elenco di eventi.
   Ritorna una mappa: id evento -> eventi con cui si sovrappone
   (presenti solo gli eventi che hanno almeno un conflitto).
   Gli eventi vengono raggruppati per palestra + giorno, quindi il confronto
   a coppie avviene solo dentro gruppi piccoli.
*/
export function CalcolaSovrapposizioni (eventi: Array<EventoElement>,
                                        trasferte: Set<number>): Map<number, Array<EventoElement>>
{
   const result = new Map<number, Array<EventoElement>> ();
   const gruppi = new Map<string, Array<{ ev: EventoElement, int: IntervalloMin }>> ();

   for (const ev of eventi)
   {
      if ((!OccupaRisorsa (ev, trasferte)) || (ev.data == null))
         continue;
      const int = IntervalloMinuti (ev.orainizio, ev.orafine);
      if (int == null)
         continue;
      const key: string = `${ev.risorsa_id}|${ev.data.getFullYear ()}-${ev.data.getMonth ()}-${ev.data.getDate ()}`;
      let lista = gruppi.get (key);
      if (lista == null)
      {
         lista = [];
         gruppi.set (key, lista);
      }
      lista.push ({ ev: ev, int: int });
   }

   for (const lista of gruppi.values ())
   {
      for (let i = 0; i < lista.length; i++)
      {
         for (let j = i + 1; j < lista.length; j++)
         {
            if ((lista[i].ev.id != lista[j].ev.id) && (IntervalliSovrapposti (lista[i].int, lista[j].int)))
            {
               AggiungiConflitto (result, lista[i].ev, lista[j].ev);
               AggiungiConflitto (result, lista[j].ev, lista[i].ev);
            }
         }
      }
   }
   return result;
}


function AggiungiConflitto (mappa: Map<number, Array<EventoElement>>,
                            ev: EventoElement,
                            altro: EventoElement)
{
   let lista = mappa.get (ev.id);
   if (lista == null)
   {
      lista = [];
      mappa.set (ev.id, lista);
   }
   lista.push (altro);
}
