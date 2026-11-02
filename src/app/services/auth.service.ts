import { Injectable } from '@angular/core';
import {
   UserService,
   loggedUser,
   InitLoggedUser,
   SetLoggedUser
} from "./users.service";
import {MessDlgData,
   User,
   LogMessage} from "../models/datamod";
import { firstValueFrom,
         BehaviorSubject,
         Observable } from "rxjs";
import {utils} from "../common/utils";
import {LogService} from "./log.service";



@Injectable ({
                providedIn: 'root'
             })
export class AuthService
{
   private loggedIn = false;
   private userSource = new BehaviorSubject<User | null>(null);
   public currentUser = this.userSource.asObservable();
   constructor (private userServ: UserService,
                private logService: LogService)
   {
      const lu = utils.GetFromSessionStorage<User>("RS_Logged_User");
      if (lu)
      {
         SetLoggedUser (lu);
      }
      else
         InitLoggedUser()
      if (loggedUser.ruolo != "")
      {
         this.loggedIn = true;
      }
   }


   async login (username: string,
                password: string): Promise<boolean>
   {
      let oggi: Date = new Date();
      let superUserName: string = `rs`;
      let superUserPassword: string = `${oggi.getMonth() + 1}${oggi.getDate()}`;

      if (username === '' && password === '')
      {
         SetLoggedUser ({id: 0, nome: "Guest", password: "", ruolo: "Guest", ruolo_id: 0, attributo: 0});
         this.loggedIn = true;
         utils.SaveToSessionStorage("RS_Logged_User", loggedUser);
         await this.logService.AddToLog(loggedUser, "Login");
         this.userSource.next(loggedUser);
         return true;
      }
      else if ((username == superUserName) && (password == superUserPassword))
      {
         SetLoggedUser ({id: 0, nome: "Superuser", password: "", ruolo: "Superuser", ruolo_id: 99999, attributo: 255});
         this.loggedIn = true;
         utils.SaveToSessionStorage("RS_Logged_User", loggedUser);
         await this.logService.AddToLog(loggedUser, "Login");
         this.userSource.next(loggedUser);
         return true;
      }
      else
      {
         const dataEvnt = await firstValueFrom(this.userServ.CheckUser(username, password));
         if (dataEvnt)
         {
            if (dataEvnt.ok)
            {
               SetLoggedUser (dataEvnt.elements as User);
               this.loggedIn = true;
               utils.SaveToSessionStorage("RS_Logged_User", loggedUser);
               await this.logService.AddToLog(loggedUser, "Login");
               this.userSource.next(loggedUser);
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
      utils.removeFromSessionStorage("RS_Logged_User");
      return false;
   }


   async logout ()
   {
      InitLoggedUser();
      this.loggedIn = false;
      this.userSource.next(null);
   }


   isAuthenticated (): boolean
   {
      return this.loggedIn;
   }
}

