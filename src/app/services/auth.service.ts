import {Injectable} from '@angular/core';



@Injectable ({
                providedIn: 'root'
             })
export class AuthService
{
   private loggedIn = false;


   login (username: string, password: string): boolean
   {
      if (username === '' && password === '')
      {
         this.loggedIn = true;
         return true;
      }
      this.loggedIn = false;
      return false;
   }


   logout (): void
   {
      this.loggedIn = false;
   }


   isAuthenticated (): boolean
   {
      return this.loggedIn;
   }
}

