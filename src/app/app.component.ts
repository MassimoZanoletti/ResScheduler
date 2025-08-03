import {
   Component,
   ViewChild,
   OnInit,
   AfterViewInit,
   ChangeDetectionStrategy,
   ChangeDetectorRef, isDevMode
} from '@angular/core';
import {
   RouterOutlet,
   RouterModule,
   RouterLink,
   RouterLinkActive, Router
} from '@angular/router';
import {ToolbarModule} from 'primeng/toolbar';
import {ButtonModule} from 'primeng/button';
import {AuthService} from './services/auth.service';
import {
   CommonModule,
   NgIf
} from '@angular/common';
import {MenuItem} from 'primeng/api';
import {MenuModule} from 'primeng/menu';
import {Menu} from 'primeng/menu';
import { PrimeNGConfig } from 'primeng/api';
import * as currentPackage from "../../package.json";
import {InitLoggedUser, loggedUser} from "./services/users.service";
import {utils} from "./common/utils";
import {LogService} from "./services/log.service";



@Component ({
               selector:        'app-root',
               standalone:      true,
               imports:         [
                  RouterOutlet,
                  RouterLink,
                  ToolbarModule,
                  ButtonModule,
                  NgIf,
                  RouterModule,
                  MenuModule,
                  CommonModule
               ],
               templateUrl:     './app.component.html',
               styleUrl:        './app.component.css',
               changeDetection: ChangeDetectionStrategy.OnPush
            })
export class AppComponent implements AfterViewInit, OnInit
{
   public pkg: { name: string; version: string; copyrights: string } = currentPackage;

   title = 'ResSchedulerAuth';
   mnuTabelle: MenuItem[] | undefined;
   appVersion: string = "V. ";
   appTitle: string = "RS";
   appCopyrights: string = "";
   separatore: string = "   ::     ";

   // Rimuovi la dichiarazione diretta tabelleMenuRef!: Menu;
   // Useremo un setter privato per gestirlo

   constructor (public router: Router,
                public authService: AuthService,
                private cdr: ChangeDetectorRef,
                private primengConfig: PrimeNGConfig,
                private logService: LogService)
   {
      if (utils.IsDevMode == null)
         utils.IsDevMode = isDevMode();
      //
      this.mnuTabelle = [
         {
            label: "Normali",
            items: [
               {label: "Risorse", icon: 'pi pi-table', routerLink: ['/risorsetable']},
               {label: "Gruppi", icon: 'pi pi-table', routerLink: ['/gruppitable']}
            ]
         },
         {
            separator: true
         },
         {
            label: "Base",
            items: [
               {label: "Stagioni", icon: 'pi pi-table', routerLink: ['/seasonstable']},
               {label: "Società", icon: 'pi pi-table', routerLink: ['/societatable']},
               {label: "Ruoli", icon: 'pi pi-table', routerLink: ['/ruolitable'], visible: this.IsAdmin ()},
               {label: "Categorie", icon: 'pi pi-table', routerLink: ['/categorietable']}
            ]
         },
         {
            separator: true
         },
         {
            label: "Sistema",
            items: [
               {label: "Eventi Master", icon: 'pi pi-table', routerLink: ['/eventimastertable']},
               {label: "Log", icon: 'pi pi-table', routerLink: ['/logtable']}
            ]
         }
      ];
      //
      this.appTitle = this.pkg.name;
      ;
      this.appVersion = `  (v. ${this.pkg.version})   `;
      this.appCopyrights = `${this.pkg.copyrights}`;
   }


   // Definisci una variabile privata per il riferimento al menu
   private _tabelleMenuInstance!: Menu;


   // Usa un setter per @ViewChild per reagire quando il menu diventa disponibile
   @ViewChild ('tabelleMenu', {static: false})
   set tabelleMenuRef (menu: Menu)
   {
      if (menu)
      {
         this._tabelleMenuInstance = menu;
      }
   }


   ngOnInit ()
   {
      this.cdr.detectChanges ();
      console.log (`User: ${loggedUser.nome}`);
   }


   ngAfterViewInit (): void
   {
      // Questo hook si esegue presto, prima che il menu sia nel DOM.
      // La logica di gestione del menu iniziale ora è nel setter di tabelleMenuRef.
      this.primengConfig.setTranslation ({
                                            firstDayOfWeek:  1,
                                            dayNames:        ["Domenica", "Lunedì", "Martedì", "Mercoledì", "Giovedì", "Venerdì", "Sabato"],
                                            dayNamesShort:   ["Dom", "Lun", "Mar", "Mer", "Gio", "Ven", "Sab"],
                                            dayNamesMin:     ["D", "L", "M", "M", "G", "V", "S"],
                                            monthNames:      [
                                               "Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno",
                                               "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"
                                            ],
                                            monthNamesShort: [
                                               "Gen", "Feb", "Mar", "Apr", "Mag", "Giu",
                                               "Lug", "Ago", "Set", "Ott", "Nov", "Dic"
                                            ],
                                            today:           'Oggi',
                                            clear:           'Pulisci',
                                            dateFormat:      'dd/mm/yyyy'
                                         });

   }


   logout (): void
   {
      this.logService.AddToLog (loggedUser, "Logout");
      utils.removeFromSessionStorage ("RS_Logged_User");
      InitLoggedUser ();
      this.cdr.detectChanges ();
      this.authService.logout ();
      InitLoggedUser ();
      this.cdr.detectChanges ();
      if (utils.IsDevMode)
      {
         setTimeout (() => { window.location.reload(); }, 1500);
         window.location.href = '/';
         window.location.reload();
      }
      else
      {
         setTimeout (() => { window.location.reload(); }, 1500);
         window.location.href = utils.startingPath;
         window.location.reload();
      }
   }


   // Il metodo toggleTabelleMenu può continuare a usare il riferimento passato dal template
   TabelleMenuClick (event: MouseEvent, menu: Menu)
   {
      // Qui `menu` è il riferimento valido passato dal template
      menu.toggle (event);
      this.cdr.detectChanges (); // Forziamo un ciclo di change detection
   }


   IsAdmin (): boolean
   {
      return (loggedUser.attributo >= 255);
   }


   protected readonly loggedUser = loggedUser;
}
