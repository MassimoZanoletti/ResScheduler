import {SeasonElement} from "../models/datamod";
import {utils} from "./utils";


/*
   Stagione da mostrare all'apertura di una pagina (pagina eventi, tabella eventi periodici):
    - quella scelta in precedenza dall'utente, se esiste ancora e non e' finita
      (cosi' si puo' preparare in anticipo la stagione successiva);
    - se quella salvata e' finita, o non c'e', la stagione in corso oggi;
    - se oggi non c'e' una stagione in corso, quella salvata (se esiste),
      altrimenti la piu' recente gia' iniziata, altrimenti la prima dell'elenco.
   Le date si confrontano come testo "YYYY-MM-DD", quindi solo per giorno.
*/
export function ScegliStagione (listaStagioni: Array<SeasonElement>,
                                salvata: any): SeasonElement | null
{
   const oggi: string = utils.DataPerDb (new Date ());
   const inizio = (s: SeasonElement): string => utils.DataPerDb (s.datainizio);
   const fine = (s: SeasonElement): string => utils.DataPerDb (s.datafine);

   const trovata: SeasonElement | undefined = (salvata != null) ? listaStagioni.find (s => s.id == salvata.id) : undefined;
   if ((trovata) && (oggi <= fine (trovata)))
      return trovata;
   const inCorso: SeasonElement | undefined = listaStagioni.find (s => (inizio (s) <= oggi) && (oggi <= fine (s)));
   if (inCorso)
      return inCorso;
   if (trovata)
      return trovata;
   const iniziate: Array<SeasonElement> = listaStagioni.filter (s => inizio (s) <= oggi)
                                                       .sort ((a, b) => inizio (b).localeCompare (inizio (a)));
   if (iniziate.length > 0)
      return iniziate[0];
   return (listaStagioni.length > 0) ? listaStagioni[0] : null;
}
