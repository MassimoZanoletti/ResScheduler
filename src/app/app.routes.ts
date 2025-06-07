import {Routes} from '@angular/router';
import {LoginPageComponent} from './pages/login-page/login-page.component';
import {MainPageComponent} from './pages/main-page/main-page.component';
import {SettingsPageComponent} from './pages/settings-page/settings-page.component';
import {AuthGuard} from './auth.guard';
import {SeasonsTableComponent} from "./tables/seasons-table/seasons-table.component";
import {SeasonEditComponent} from "./forms/season-edit/season-edit.component";
import {SocietaTableComponent} from "./tables/societa-table/societa-table.component";
import {SocietaEditComponent} from "./forms/societa-edit/societa-edit.component";


export const routes: Routes = [
   { path: 'login', component: LoginPageComponent },

   // Rotte protette (richiedono login)
   { path: '', component: MainPageComponent, canActivate: [AuthGuard] },
   { path: 'settings', component: SettingsPageComponent, canActivate: [AuthGuard] },
   { path: 'seasonstable', component: SeasonsTableComponent, canActivate: [AuthGuard] },
   { path: 'seasonedit', component: SeasonEditComponent, canActivate: [AuthGuard] },
   { path: 'societatable', component: SocietaTableComponent, canActivate: [AuthGuard] },
   { path: 'societaedit', component: SocietaEditComponent, canActivate: [AuthGuard] },

   // Questa rotta dovrebbe essere l'ULTIMA.
   // Reindirizza a 'login' per qualsiasi URL che non matcha le rotte precedenti.
   { path: '**', redirectTo: 'login' }
];

