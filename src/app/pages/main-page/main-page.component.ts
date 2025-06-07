import {Component} from '@angular/core';
import {TableModule} from 'primeng/table';
import {FormsModule} from '@angular/forms';
import {CommonModule} from '@angular/common';
import {ButtonModule} from "primeng/button";
import {TooltipModule} from 'primeng/tooltip';
import {CardModule} from 'primeng/card';



export interface TEvento
{
   id: number;
   data: Date;
   orainizio: Date;
   orafine: Date;
   palestra: string;
   gruppo: string;
   casa: string;
   ospite: string;
}



@Component ({
               selector:    'app-main-page',
               standalone:  true,
               imports:     [
                  TableModule,
                  FormsModule,
                  CommonModule,
                  ButtonModule,
                  TooltipModule,
                  CardModule
               ],
               templateUrl: './main-page.component.html',
               styleUrl:    './main-page.component.css'
            })
export class MainPageComponent
{
   eventi: Array<TEvento> = [
      {id:          10,
         data:      new Date (2024, 10, 11),
         orainizio: new Date (2024, 10, 11, 0, 0),
         orafine:   new Date (2024, 10, 11, 0, 0),
         palestra:  "",
         gruppo:    "",
         casa:      "",
         ospite:    ""
      },
      {id:          11,
         data:      new Date (2024, 10, 12),
         orainizio: new Date (2024, 10, 12, 21, 15),
         orafine:   new Date (2024, 10, 12, 23, 15),
         palestra:  "SAR",
         gruppo:    "U19",
         casa:      "U19",
         ospite:    "Padernese"
      },
      {id:          12,
         data:      new Date (2024, 10, 13),
         orainizio: new Date (2024, 10, 13, 0, 0),
         orafine:   new Date (2024, 10, 13, 0, 0),
         palestra:  "",
         gruppo:    "",
         casa:      "",
         ospite:    ""
      },
      {id:          13,
         data:      new Date (2024, 10, 14),
         orainizio: new Date (2024, 10, 14, 0, 0),
         orafine:   new Date (2024, 10, 14, 0, 0),
         palestra:  "",
         gruppo:    "",
         casa:      "",
         ospite:    ""
      },
      {id:          14,
         data:      new Date (2024, 10, 15),
         orainizio: new Date (2024, 10, 15, 0, 0),
         orafine:   new Date (2024, 10, 15, 0, 0),
         palestra:  "",
         gruppo:    "",
         casa:      "",
         ospite:    ""
      },
      {id:          15,
         data:      new Date (2024, 10, 16),
         orainizio: new Date (2024, 10, 16, 15, 30),
         orafine:   new Date (2024, 10, 16, 17, 30),
         palestra:  "SAR",
         gruppo:    "U15",
         casa:      "U15",
         ospite:    "Lions"
      },
      {id:          16,
         data:      new Date (2024, 10, 17),
         orainizio: new Date (2024, 10, 17, 10, 30),
         orafine:   new Date (2024, 10, 17, 12, 30),
         palestra:  "GUS",
         gruppo:    "U17",
         casa:      "U17",
         ospite:    "CUS"
      },
      {id:          17,
         data:      new Date (2024, 10, 17),
         orainizio: new Date (2024, 10, 17, 14, 0),
         orafine:   new Date (2024, 10, 17, 16, 0),
         palestra:  "ZAN",
         gruppo:    "Eso",
         casa:      "Eso",
         ospite:    "Gardonese"
      },
      {id:          18,
         data:      new Date (2024, 10, 18),
         orainizio: new Date (2024, 10, 18, 0, 0),
         orafine:   new Date (2024, 10, 18, 0, 0),
         palestra:  "",
         gruppo:    "",
         casa:      "",
         ospite:    ""
      },
      {id:          19,
         data:      new Date (2024, 10, 19),
         orainizio: new Date (2024, 10, 19, 21, 15),
         orafine:   new Date (2024, 10, 19, 23, 15),
         palestra:  "TRA",
         gruppo:    "U19",
         casa:      "Lumezzane",
         ospite:    "U19"
      },
      {id:          191,
         data:      new Date (2024, 10, 19),
         orainizio: new Date (2024, 10, 19, 21, 15),
         orafine:   new Date (2024, 10, 19, 23, 15),
         palestra:  "SAR",
         gruppo:    "DR3 (ex Prima Divisione)",
         casa:      "Sarezzo",
         ospite:    "Gorle"
      },
      {id:          20,
         data:      new Date (2024, 10, 20),
         orainizio: new Date (2024, 10, 20, 0, 0),
         orafine:   new Date (2024, 10, 20, 0, 0),
         palestra:  "",
         gruppo:    "",
         casa:      "",
         ospite:    ""
      },
      {id:          21,
         data:      new Date (2024, 10, 21),
         orainizio: new Date (2024, 10, 21, 0, 0),
         orafine:   new Date (2024, 10, 21, 0, 0),
         palestra:  "",
         gruppo:    "",
         casa:      "",
         ospite:    ""
      },
      {id:          22,
         data:      new Date (2024, 10, 22),
         orainizio: new Date (2024, 10, 22, 0, 0),
         orafine:   new Date (2024, 10, 22, 0, 0),
         palestra:  "",
         gruppo:    "",
         casa:      "",
         ospite:    ""
      },
      {id:          23,
         data:      new Date (2024, 10, 23),
         orainizio: new Date (2024, 10, 23, 0, 0),
         orafine:   new Date (2024, 10, 23, 0, 0),
         palestra:  "",
         gruppo:    "",
         casa:      "",
         ospite:    ""
      },
      {id:          24,
         data:      new Date (2024, 10, 24),
         orainizio: new Date (2024, 10, 24, 0, 0),
         orafine:   new Date (2024, 10, 24, 0, 0),
         palestra:  "",
         gruppo:    "",
         casa:      "",
         ospite:    ""
      },
      {id:          25,
         data:      new Date (2024, 10, 25),
         orainizio: new Date (2024, 10, 25, 0, 0),
         orafine:   new Date (2024, 10, 25, 0, 0),
         palestra:  "",
         gruppo:    "",
         casa:      "",
         ospite:    ""
      },
      {id:          26,
         data:      new Date (2024, 10, 26),
         orainizio: new Date (2024, 10, 26, 0, 0),
         orafine:   new Date (2024, 10, 26, 0, 0),
         palestra:  "",
         gruppo:    "",
         casa:      "",
         ospite:    ""
      },
      {id:          27,
         data:      new Date (2024, 10, 27),
         orainizio: new Date (2024, 10, 27, 0, 0),
         orafine:   new Date (2024, 10, 27, 0, 0),
         palestra:  "",
         gruppo:    "",
         casa:      "",
         ospite:    ""
      },
      {id:          28,
         data:      new Date (2024, 10, 28),
         orainizio: new Date (2024, 10, 28, 0, 0),
         orafine:   new Date (2024, 10, 28, 0, 0),
         palestra:  "",
         gruppo:    "",
         casa:      "",
         ospite:    ""
      },
      {id:          29,
         data:      new Date (2024, 10, 29),
         orainizio: new Date (2024, 10, 29, 0, 0),
         orafine:   new Date (2024, 10, 29, 0, 0),
         palestra:  "",
         gruppo:    "",
         casa:      "",
         ospite:    ""
      },
   ];

   selectedEvent: TEvento | null;


   constructor ()
   {
      this.selectedEvent = null;
   }


   getRowColorClass (evento: TEvento): string
   {
      const wDay = evento.data.getDay ();

      switch (wDay)
      {
         case 1:
            return "row-lun";
         case 2:
            return "row-mar";
         case 3:
            return "row-mer";
         case 4:
            return "row-gio";
         case 5:
            return "row-ven";
         case 6:
            return "row-sab";
         case 0:
            return "row-dom";
         default:
            return "row-lun";
      }
      /*
      if (indexMod3 === 0)
      {
        return 'row-0';
      }
      else if (indexMod3 === 1)
      {
        return 'row-1';
      } else
      {
        return 'row-2';
      }
      */
   }


   onEdit (evento: any): void
   {
      console.log ('Modifica evento:', evento);
      // Qui puoi aprire un dialog, navigare a una pagina, ecc.
   }


   onDelete (evento: any): void
   {
      console.log ('Elimina evento:', evento);
      // Puoi mostrare un messaggio di conferma o chiamare un servizio
   }


   FormattaData (data: Date | string): string
   {
      const d = new Date (data);

      return new Intl.DateTimeFormat ('it-IT', {
         weekday: 'short',
         day:     '2-digit',
         month:   'short'
      }).format (d);
   }


   FormattaOrario (date: Date): string
   {
      const hours = date.getHours ().toString ().padStart (2, '0');
      const minutes = date.getMinutes ().toString ().padStart (2, '0');
      if ((hours == "00") && (minutes == "00"))
         return "";
      else
         return `${hours}:${minutes}`;
   }


   ColoreRisorsa (risorsa: string): any
   {
      const sar_bck = "#FF8800";
      const sar_col = "#FFFFFF";
      const gus_bck = "#FF0000";
      const gus_col = "#000000";
      if (risorsa == "SAR")
         return {'background-color': `${sar_bck}`, 'color': `${sar_col}`};
      if (risorsa == "GUS")
         return {'background-color': `${gus_bck}`, 'color': `${gus_col}`};
      return {};
   }


   ColoreGruppo (risorsa: string): any
   {
      const u19_bck = "#007c05";
      const u19_col = "#FFFFFF";
      const u17_bck = "#005d04";
      const u17_col = "#FFFFFF";
      const u15_bck = "#004803";
      const u15_col = "#FFFFFF";
      const eso_bck = "#00447c";
      const eso_col = "#FFFFFF";
      const dr3_bck = "#9d7f00";
      const dr3_col = "#FFFF00";
      if (risorsa == "U19")
         return {'background-color': `${u19_bck}`, 'color': `${u19_col}`};
      if (risorsa == "U17")
         return {'background-color': `${u17_bck}`, 'color': `${u17_col}`};
      if (risorsa == "U15")
         return {'background-color': `${u15_bck}`, 'color': `${u15_col}`};
      if (risorsa == "Eso")
         return {'background-color': `${eso_bck}`, 'color': `${eso_col}`};
      if (risorsa.includes ("DR3"))
         return {'background-color': `${dr3_bck}`, 'color': `${dr3_col}`};
      return {};
   }
}
