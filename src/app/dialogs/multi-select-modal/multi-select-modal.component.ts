import {
   Component,
   OnInit
      } from '@angular/core';
import {
   DynamicDialogRef,
   DynamicDialogConfig
      } from 'primeng/dynamicdialog';
import { MultiSelectModule } from 'primeng/multiselect';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';



@Component({
  selector:    'app-multi-select-modal',
  standalone:  true,
  imports:     [
     FormsModule,
     ButtonModule,
     MultiSelectModule
  ],
  templateUrl: './multi-select-modal.component.html',
  styleUrl:    './multi-select-modal.component.css'
})
export class MultiSelectModalComponent implements OnInit
{

   options: any[] = [];
   selectedOptions: any[] = [];
   modalTitle: string = 'Seleziona Opzioni';

   constructor (public ref: DynamicDialogRef,
                public config: DynamicDialogConfig)
   { }


   ngOnInit(): void
   {
      if (this.config.data && this.config.data.options)
      {
         this.options = this.config.data.options;
      }
      // Pre-seleziona le opzioni se passate, creando una copia per non modificare l'originale se l'utente annulla
      if (this.config.data && this.config.data.preSelectedOptions)
      {
         this.selectedOptions = [...this.config.data.preSelectedOptions]; // Crea una copia!
      }
      if (this.config.data.customTitle)
         this.modalTitle = this.config.data.customTitle;
   }


   onOk(): void
   {
      // Chiudi la modale e restituisci un oggetto con le opzioni e l'azione 'ok'
      this.ref.close({ action: 'ok', selectedOptions: this.selectedOptions });
   }

   onCancel(): void
   {
      // Chiudi la modale e restituisci un oggetto con l'azione 'cancel' e nessuna opzione (o quelle originali, ma non serve)
      this.ref.close({ action: 'cancel', selectedOptions: null }); // Non passiamo le selectedOptions in caso di annullamento
   }


}
