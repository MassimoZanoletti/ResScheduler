/*
   Font dell'app scelto dall'utente, salvato nel browser.
   Il CSS (src/styles.css) usa l'attributo data-font su <html>; index.html lo imposta già all'avvio.
*/

export type NomeFont = 'rubik' | 'zalando' | 'inter';

export const FONT_DISPONIBILI: Array<{ nome: string, valore: NomeFont }> = [
   { nome: 'Rubik', valore: 'rubik' },
   { nome: 'Zalando Sans', valore: 'zalando' },
   { nome: 'Inter', valore: 'inter' }
];

const CHIAVE_FONT: string = 'RS_Font';
const FONT_PREDEFINITO: NomeFont = 'rubik';


export function LeggiFont (): NomeFont
{
   try
   {
      const f: string | null = localStorage.getItem (CHIAVE_FONT);
      if (FONT_DISPONIBILI.some (x => x.valore == f))
         return f as NomeFont;
   }
   catch (e)
   {
   }
   return FONT_PREDEFINITO;
}


export function ImpostaFont (font: NomeFont)
{
   document.documentElement.setAttribute ('data-font', font);
   try
   {
      localStorage.setItem (CHIAVE_FONT, font);
   }
   catch (e)
   {
   }
}
