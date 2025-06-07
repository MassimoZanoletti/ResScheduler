import {Component} from '@angular/core';
import {InputTextModule} from 'primeng/inputtext';
import {FormsModule} from '@angular/forms';
import {FloatLabelModule} from 'primeng/floatlabel';
import {InputNumberModule} from 'primeng/inputnumber';
import {ColorPickerModule} from 'primeng/colorpicker';
import {CalendarModule} from 'primeng/calendar';
import {DropdownModule} from 'primeng/dropdown';



@Component ({
               selector:    'app-settings-page',
               standalone:  true,
               imports:     [
                  FormsModule,
                  InputTextModule,
                  FloatLabelModule,
                  InputNumberModule,
                  ColorPickerModule,
                  CalendarModule,
                  DropdownModule
               ],
               templateUrl: './settings-page.component.html',
               styleUrl:    './settings-page.component.css'
            })
export class SettingsPageComponent
{
   textValue: string | null;
   numValue: number = 0;
   colorValue: string = "#FF0000";
   dateValue: Date;
   timeValue: Date;
   comboValue: string = "";
   comboList: Array<string> = [
      "Sarezzo",
      "Gussago",
      "Ome",
      "Rodengo"
   ];


   constructor ()
   {
      this.textValue = "";
      this.dateValue = new Date ();
      this.timeValue = new Date ();
      this.timeValue.setHours (0, 0, 0, 0);
   }
}
