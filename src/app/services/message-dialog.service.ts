import { Injectable } from '@angular/core';
import { DialogService } from 'primeng/dynamicdialog';
import { DynamicDialogRef } from 'primeng/dynamicdialog';
import { MessDlgData, MessDialogResult  } from '../models/datamod';
import { MessDialogPrimeNgComponent } from '../dialogs/mess-dialog/mess-dialog.component';
import { Observable } from 'rxjs';
import { LogService } from './log.service';
import { loggedUser } from './users.service';
import { EscapeHtml } from '../common/sovrapposizioni';

@Injectable({
               providedIn: 'root' // Disponibile globalmente nell'applicazione standalone
            })
export class MessageDialogService {

   private dialogRef: DynamicDialogRef | undefined;

   constructor(private dialogService: DialogService,
               private logService: LogService) { }


   /**
    * Mostra un errore all'utente, lo scrive in console e nel log sul server.
    * @param subtitle Descrizione dell'operazione fallita (es. 'Errore durante il caricamento delle stagioni').
    * @param err Messaggio (es. 'message' di una risposta ok:false) oppure eccezione.
    */
   showError(subtitle: string, err: unknown): void {
      let testo: string;
      if (typeof err === 'string')
         testo = err;
      else if (err instanceof Error)
         testo = err.message;
      else {
         try {
            testo = JSON.stringify(err);
         }
         catch {
            testo = `${err}`;
         }
      }
      console.error(`${subtitle}:`, err);
      // Senza await: il log non deve bloccare. Se fallisce anche il log (es. server irraggiungibile)
      // l'errore e' gia' stato mostrato all'utente e scritto in console.
      this.logService.AddToLog(loggedUser, `${subtitle}: '${testo}'`).catch(logErr => console.error('AddToLog:', logErr));
      this.showMessage({
         title:      'ERRORE',
         subtitle:   subtitle,
         message:    EscapeHtml(testo),
         messtype:   'error',
         btncaption: 'Chiudi'
      }, '600px');
   }

   /**
    * Mostra un dialogo di messaggio personalizzato.
    * @param data I dati del messaggio (titolo, messaggio, tipo, ecc.)
    * @param width La larghezza del dialogo (es. '500px', '70%').
    * @param disableClose Impedisce la chiusura cliccando fuori o con ESC (default: true).
    * @returns Un Observable che emette il risultato alla chiusura del dialogo.
    */
   showMessage(data: MessDlgData, width: string = '500px', disableClose: boolean = true): Observable<MessDialogResult> {
      this.dialogRef = this.dialogService.open(MessDialogPrimeNgComponent, {
         data: data,
         header: '', // Mantenuto vuoto per usare il tuo header interno
         width: width,
         modal: true,
         closable: !disableClose,
         dismissableMask: !disableClose,
         styleClass: `messagedlg-${data.messtype || 'info'}`
      });

      // Restituisci l'observable onClose per il componente chiamante
      return this.dialogRef.onClose as Observable<MessDialogResult>;
   }

   closeDialog(result?: MessDialogResult): void {
      if (this.dialogRef) {
         this.dialogRef.close(result);
         this.dialogRef = undefined;
      }
   }
}
