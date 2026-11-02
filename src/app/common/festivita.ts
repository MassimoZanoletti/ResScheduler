import {utils} from "./utils";


/*
   Festivita' nazionali italiane di un anno: chiave "YYYY-MM-DD" -> nome.
   Comprende Pasqua e Pasquetta (calcolate).
*/
export function FestivitaItaliane (anno: number): Map<string, string>
{
   const result = new Map<string, string> ();
   const aggiungi = (mese: number, giorno: number, nome: string) =>
      result.set (utils.DataPerDb (new Date (anno, mese - 1, giorno)), nome);

   aggiungi (1, 1, "Capodanno");
   aggiungi (1, 6, "Epifania");
   aggiungi (4, 25, "Festa della Liberazione");
   aggiungi (5, 1, "Festa del Lavoro");
   aggiungi (6, 2, "Festa della Repubblica");
   aggiungi (8, 15, "Ferragosto");
   aggiungi (11, 1, "Ognissanti");
   aggiungi (12, 8, "Immacolata");
   aggiungi (12, 25, "Natale");
   aggiungi (12, 26, "Santo Stefano");

   const pasqua: Date = Pasqua (anno);
   result.set (utils.DataPerDb (pasqua), "Pasqua");
   const pasquetta: Date = new Date (pasqua);
   pasquetta.setDate (pasquetta.getDate () + 1);
   result.set (utils.DataPerDb (pasquetta), "Lunedì dell'Angelo");
   return result;
}


/*
   Festivita' comprese tra due date (estremi inclusi): chiave "YYYY-MM-DD" -> nome.
*/
export function FestivitaTra (da: Date,
                              a: Date): Map<string, string>
{
   const result = new Map<string, string> ();
   const primo: string = utils.DataPerDb (da);
   const ultimo: string = utils.DataPerDb (a);
   for (let anno = da.getFullYear (); anno <= a.getFullYear (); anno++)
   {
      for (const [chiave, nome] of FestivitaItaliane (anno))
      {
         if ((chiave >= primo) && (chiave <= ultimo))
            result.set (chiave, nome);
      }
   }
   return result;
}


// Domenica di Pasqua (calendario gregoriano, algoritmo di Meeus/Jones/Butcher)
function Pasqua (anno: number): Date
{
   const a = anno % 19;
   const b = Math.floor (anno / 100);
   const c = anno % 100;
   const d = Math.floor (b / 4);
   const e = b % 4;
   const f = Math.floor ((b + 8) / 25);
   const g = Math.floor ((b - f + 1) / 3);
   const h = (19 * a + b - d - g + 15) % 30;
   const i = Math.floor (c / 4);
   const k = c % 4;
   const l = (32 + 2 * e + 2 * i - h - k) % 7;
   const m = Math.floor ((a + 11 * h + 22 * l) / 451);
   const mese = Math.floor ((h + l - 7 * m + 114) / 31);
   const giorno = ((h + l - 7 * m + 114) % 31) + 1;
   return new Date (anno, mese - 1, giorno);
}
