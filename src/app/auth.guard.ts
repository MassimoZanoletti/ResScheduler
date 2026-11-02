import {Injectable} from '@angular/core';
import {CanActivate, Router} from '@angular/router';
import {AuthService} from './services/auth.service';
import {loggedUser} from './services/users.service';



@Injectable ({
                providedIn: 'root'
             })
export class AuthGuard implements CanActivate
{

   constructor (private authService: AuthService,
                private router: Router)
   {

   }


   canActivate (): boolean
   {
      if (this.authService.isAuthenticated ())
      {
         return true;
      }
      else
      {
         this.router.navigate (['/login']);
         return false;
      }
   }
}



// Consente l'accesso solo ad amministratori e superuser (attributo >= 255).
@Injectable ({
                providedIn: 'root'
             })
export class AdminGuard implements CanActivate
{

   constructor (private authService: AuthService,
                private router: Router)
   {

   }


   canActivate (): boolean
   {
      if (!this.authService.isAuthenticated ())
      {
         this.router.navigate (['/login']);
         return false;
      }
      if (loggedUser.attributo >= 255)
         return true;
      this.router.navigate (['/']);
      return false;
   }
}

