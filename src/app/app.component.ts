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
import {loggedUser} from "./services/users.service";
import {utils} from "./common/utils";
import {LogService} from "./services/log.service";
import { Subscription } from 'rxjs';
import { AuthGuard } from "./auth.guard";



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

   private userSubscription: Subscription | undefined;

   protected readonly loggedUser = loggedUser;

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
      this.userSubscription = this.authService.currentUser.subscribe(user => {
         this.InitMenu();
      });      //
      if (utils.IsDevMode == null)
         utils.IsDevMode = isDevMode();
      //
      this.InitMenu();
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
      //
   }


   async logout ()
   {
      // Il log va scritto PRIMA di ricaricare la pagina: prima la richiesta partiva senza
      // attenderla e il reload immediato poteva annullarla.
      try
      {
         await this.logService.AddToLog (loggedUser, "Logout");
      }
      catch (e)
      {
         console.error ("Logout - scrittura log non riuscita:", e);
      }
      utils.removeFromSessionStorage ("RS_Logged_User");
      this.logService.ChiudiSessione ();
      await this.authService.logout ();
      // Ricarica completa dell'app dall'indirizzo di partenza: azzera lo stato di tutte le pagine.
      // Basta una sola navigazione (prima: href + reload() immediato + altro reload dopo 1,5 s).
      window.location.assign ((utils.IsDevMode) ? '/' : utils.startingPath);
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
      const result: boolean = (loggedUser.attributo >= 255);
      return result;
   }


   IsDirigente (): boolean
   {
      const result: boolean = (loggedUser.attributo >= 2);
      return result;
   }


   InitMenu()
   {
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
               {label: "Categorie", icon: 'pi pi-table', routerLink: ['/categorietable']},
               {label: "Iscritti", icon: 'pi pi-table', routerLink: ['/iscrittitable'], visible: this.IsDirigente ()},
               {label: "Ruoli", icon: 'pi pi-table', routerLink: ['/ruolitable'], visible: this.IsAdmin ()}
            ]
         },
         {
            separator: true
         },
         {
            label: "Sistema",
            items: [
               {label: "Eventi periodici", icon: 'pi pi-table', routerLink: ['/eventimastertable']},
               {label: "Log", icon: 'pi pi-table', routerLink: ['/logtable'], visible: this.IsAdmin ()}
            ]
         }
      ];
   }
}

