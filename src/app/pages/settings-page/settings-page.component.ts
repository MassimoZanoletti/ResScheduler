import {Component} from '@angular/core';
import {InputTextModule} from 'primeng/inputtext';
import {FormsModule} from '@angular/forms';
import {FloatLabelModule} from 'primeng/floatlabel';
import {InputNumberModule} from 'primeng/inputnumber';
import {ColorPickerModule} from 'primeng/colorpicker';
import {CalendarModule} from 'primeng/calendar';
import {DropdownModule} from 'primeng/dropdown';
import {BlockUIModule} from "primeng/blockui";
import {CardModule} from "primeng/card";
import {CheckboxModule} from "primeng/checkbox";
import {DividerModule} from "primeng/divider";
import {NgIf} from "@angular/common";
import {ProgressSpinnerModule} from "primeng/progressspinner";
import {TableModule} from "primeng/table";
import {TooltipModule} from "primeng/tooltip";
import {Router} from "@angular/router";
import {loggedUser} from "../../services/users.service";



@Component ({
               selector:    'app-settings-page',
               standalone:  true,
               imports: [
                  FormsModule,
                  InputTextModule,
                  FloatLabelModule,
                  InputNumberModule,
                  ColorPickerModule,
                  CalendarModule,
                  DropdownModule,
                  BlockUIModule,
                  CardModule,
                  CheckboxModule,
                  DividerModule,
                  NgIf,
                  ProgressSpinnerModule,
                  TableModule,
                  TooltipModule
               ],
               templateUrl: './settings-page.component.html',
               styleUrl:    './settings-page.component.css'
            })
export class SettingsPageComponent
{


   constructor (public router: Router)
   {
   }


   CfgUtentiEnabled(): boolean
   {
      return (loggedUser.attributo >= 255);
   }


   CfgUtenteEnabled(): boolean
   {
      return ((loggedUser.attributo > 0) && (loggedUser.attributo < 255));
   }


   TabellaUtenti()
   {
      this.router.navigate ([`/userstable`]);
   }


   EditUtente()
   {
      this.router.navigate ([`/useraedit`], {state: {id: loggedUser.id, from: "single"}});
   }
}
