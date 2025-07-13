import {Routes} from '@angular/router';
import {LoginPageComponent} from './pages/login-page/login-page.component';
import {MainPageComponent} from './pages/main-page/main-page.component';
import {SettingsPageComponent} from './pages/settings-page/settings-page.component';
import {AuthGuard} from './auth.guard';
import {SeasonsTableComponent} from "./tables/seasons-table/seasons-table.component";
import {SeasonEditComponent} from "./forms/season-edit/season-edit.component";
import {SocietaTableComponent} from "./tables/societa-table/societa-table.component";
import {SocietaEditComponent} from "./forms/societa-edit/societa-edit.component";
import {RuoliTableComponent} from "./tables/ruoli-table/ruoli-table.component";
import {RuoloEditComponent} from "./forms/ruolo-edit/ruolo-edit.component";
import {CategorieTableComponent} from "./tables/categorie-table/categorie-table.component";
import {CategoriaEditComponent} from "./forms/categoria-edit/categoria-edit.component";
import {UsersTableComponent} from "./tables/users-table/users-table.component";
import {UserEditComponent} from "./forms/user-edit/user-edit.component";
import {RisorseTableComponent} from "./tables/risorse-table/risorse-table.component";
import {RisorseEditComponent} from "./forms/risorse-edit/risorse-edit.component";
import {GruppiTableComponent} from "./tables/gruppi-table/gruppi-table.component";
import {GruppoEditComponent} from "./forms/gruppo-edit/gruppo-edit.component";
import {EventoEditComponent} from "./forms/evento-edit/evento-edit.component";
import {LogTableComponent} from "./tables/log-table/log-table.component";
import {EventiMasterTableComponent} from "./tables/eventi-master-table/eventi-master-table.component";
import {EventoMasterEditComponent} from "./forms/evento-master-edit/evento-master-edit.component";


export const routes: Routes = [
   { path: 'login', component: LoginPageComponent },

   // Rotte protette (richiedono login)
   { path: '', component: MainPageComponent, canActivate: [AuthGuard] },
   { path: 'settings', component: SettingsPageComponent, canActivate: [AuthGuard] },
   { path: 'seasonstable', component: SeasonsTableComponent, canActivate: [AuthGuard] },
   { path: 'seasonedit', component: SeasonEditComponent, canActivate: [AuthGuard] },
   { path: 'societatable', component: SocietaTableComponent, canActivate: [AuthGuard] },
   { path: 'societaedit', component: SocietaEditComponent, canActivate: [AuthGuard] },
   { path: 'ruolitable', component: RuoliTableComponent, canActivate: [AuthGuard] },
   { path: 'ruoloedit', component: RuoloEditComponent, canActivate: [AuthGuard] },
   { path: 'categorietable', component: CategorieTableComponent, canActivate: [AuthGuard] },
   { path: 'categoriaedit', component: CategoriaEditComponent, canActivate: [AuthGuard] },
   { path: 'userstable', component: UsersTableComponent, canActivate: [AuthGuard] },
   { path: 'useraedit', component: UserEditComponent, canActivate: [AuthGuard] },
   { path: 'risorsetable', component: RisorseTableComponent, canActivate: [AuthGuard] },
   { path: 'risorsaedit', component: RisorseEditComponent, canActivate: [AuthGuard] },
   { path: 'gruppitable', component: GruppiTableComponent, canActivate: [AuthGuard] },
   { path: 'gruppoedit', component: GruppoEditComponent, canActivate: [AuthGuard] },
   { path: 'eventoedit', component: EventoEditComponent, canActivate: [AuthGuard] },
   { path: 'logtable', component: LogTableComponent, canActivate: [AuthGuard] },
   { path: 'eventimastertable', component: EventiMasterTableComponent, canActivate: [AuthGuard] },
   { path: 'eventomasteredit', component: EventoMasterEditComponent, canActivate: [AuthGuard] },

   // Questa rotta dovrebbe essere l'ULTIMA.
   // Reindirizza a 'login' per qualsiasi URL che non matcha le rotte precedenti.
   { path: '**', redirectTo: 'login' }
];

