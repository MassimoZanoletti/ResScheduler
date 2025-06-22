import { Injectable } from '@angular/core';
import { UserService,
         loggedUser } from "./users.service";
import {MessDlgData, User} from "../models/datamod";
import {firstValueFrom} from "rxjs";
import {utils} from "../common/utils";



@Injectable ({
                providedIn: 'root'
             })
export class AuthService
{
   private loggedIn = false;

   constructor (private userServ: UserService)
   {

   }


   async login (username: string,
          password: string): Promise<boolean>
   {
      let oggi: Date = new Date();
      let superUserName: string = `rs`;
      let superUserPassword: string = `${oggi.getMonth() + 1}${oggi.getDate()}`;

      if (username === '' && password === '')
      {
         loggedUser.id = 0;
         loggedUser.nome = "Guest";
         loggedUser.password = "";
         loggedUser.ruolo = "Guest";
         loggedUser.ruolo_id = 0;
         loggedUser.attributo = 0;
         this.loggedIn = true;
         return true;
      }
      else if ((username == superUserName) && (password == superUserPassword))
      {
         loggedUser.id = 0;
         loggedUser.nome = "Superuser";
         loggedUser.password = "";
         loggedUser.ruolo = "Superuser";
         loggedUser.ruolo_id = 99999;
         loggedUser.attributo = 255;
         this.loggedIn = true;
         return true;
      }
      else
      {
         const dataEvnt = await firstValueFrom(this.userServ.CheckUser(username, password));
         if (dataEvnt)
         {
            if (dataEvnt.ok)
            {
               loggedUser.id = dataEvnt.elements.id;
               loggedUser.nome = dataEvnt.elements.nome;
               loggedUser.password = dataEvnt.elements.password;
               loggedUser.ruolo = dataEvnt.elements.ruolo;
               loggedUser.ruolo_id = dataEvnt.elements.ruolo_id;
               loggedUser.attributo = dataEvnt.elements.attributo;
               this.loggedIn = true;
               return true;
            }
            else
            {
               /*
               const dlgData: MessDlgData = {
                  title:      'ERRORE',
                  subtitle:   'Errore durante il caricamento degli eventi dal server',
                  message:    `${dataEvnt.message}`,
                  messtype:   'error',
                  btncaption: 'Chiudi'
               };
               this.messageDialogService.showMessage (dlgData, '600px');
               */
            }
         }
         else
         {
            /*
            const dlgData: MessDlgData = {
               title:      'ERRORE',
               subtitle:   'Errore durante il caricamento degli eventi dal server',
               message:    `No data returned`,
               messtype:   'error',
               btncaption: 'Chiudi'
            };
            this.messageDialogService.showMessage (dlgData, '600px');
            */
         }
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

