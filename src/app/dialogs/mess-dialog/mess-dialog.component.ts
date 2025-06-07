import {Component, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ButtonModule} from 'primeng/button';
import {DialogModule} from 'primeng/dialog';
import {DynamicDialogConfig, DynamicDialogRef} from 'primeng/dynamicdialog'; // Per ricevere i dati e chiudere il dialogo
import {MessDlgData, MessDialogResult} from '../../models/datamod';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Component ({
               selector:    'app-mess-dialog-primeng',
               standalone:  true, // Essenziale per la tua architettura
               imports:     [
                  CommonModule,
                  ButtonModule,
                  DialogModule // Importa il modulo p-dialog qui
               ],
               templateUrl: './mess-dialog.component.html',
               styleUrls:   ['./mess-dialog.component.css']
            })
export class MessDialogPrimeNgComponent implements OnInit
{

   // I dati del dialogo verranno iniettati tramite DynamicDialogConfig
   public data: MessDlgData;
   public sanitizedMessage: SafeHtml;
   public dialogVisible: boolean = true; // Controlla la visibilità del p-dialog interno

   constructor (
      public ref: DynamicDialogRef,
      public config: DynamicDialogConfig,
      private sanitizer: DomSanitizer)
   {
      // I dati sono disponibili in config.data
      this.data = this.config.data;
      this.sanitizedMessage = this.sanitizer.bypassSecurityTrustHtml(this.data.message);

      // Imposta un valore di default per messtype se non fornito
      if (!this.data.messtype)
      {
         this.data.messtype = 'info';
      }
   }


   ngOnInit (): void
   {
      // Non è necessario fare nulla qui se i dati sono già nel costruttore
   }


   // Metodo per chiudere il dialogo (passando true come risultato)
   onPrimary (): void
   {
      this.dialogVisible = false;
      this.ref.close ('primary' as MessDialogResult); // Passa 'confirm' o true per distinguere
   }


   // NUOVO: Metodo per il bottone di annullamento (No/Annulla)
   onSecondary (): void
   {
      this.dialogVisible = false;
      this.ref.close ('secondary' as MessDialogResult); // Passa 'cancel' o false per distinguere
   }


   // Metodo per gestire la chiusura da pulsante X o ESC
   onHide (): void
   {
      // Se il dialogo viene chiuso dall'utente tramite 'X' o ESC,
      // chiudiamo il ref senza un risultato specifico o con undefined.
      this.ref.close (undefined);
   }


}
