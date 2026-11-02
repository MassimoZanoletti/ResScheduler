
import {environment} from "../../environments/environment";
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User } from '../models/datamod';



/*
   Utente collegato.
   E' UN SOLO oggetto per tutta la vita dell'app: non viene mai sostituito, solo aggiornato
   (con InitLoggedUser / SetLoggedUser, chiamate da AuthService). Cosi' chi ne tiene un
   riferimento (es. app.component) vede sempre i dati correnti.
   Le altre parti dell'app devono solo LEGGERLO.
*/
export const loggedUser: User = {
   id: 0,
   nome: "",
   password: "",
   ruolo: "",
   ruolo_id: 0,
   attributo: 0
};


// Azzera l'utente collegato (nessun utente)
export function InitLoggedUser ()
{
   SetLoggedUser ({id: 0, nome: "", password: "", ruolo: "", ruolo_id: 0, attributo: 0});
}


// Copia i dati dell'utente nell'oggetto loggedUser (senza sostituirlo)
export function SetLoggedUser (u: User)
{
   loggedUser.id = u.id;
   loggedUser.nome = u.nome;
   loggedUser.password = u.password;
   loggedUser.ruolo = u.ruolo;
   loggedUser.ruolo_id = u.ruolo_id;
   loggedUser.attributo = u.attributo;
}

@Injectable({
               providedIn: 'root'
            })
export class UserService
{
   private apiUrl: string = `${environment.apiBaseUrl}/users/api.php`;

   constructor(private http: HttpClient)
   {
   }


   getAllData(): Observable<any>
   {
      const operation: string = "all";
      const url: string = `${this.apiUrl}?operation=${operation}`;
      return this.http.get<any>(url);
   }


   getSingleData(aId: number): Observable<any>
   {
      const operation: string = "single";
      const url: string = `${this.apiUrl}?operation=${operation}&id=${aId}`;
      return this.http.get<any>(url);
   }


   updateData (aId: number,
               aName: string,
               aPassword: string,
               aRole: number): Observable<any>
   {
      const operation: string = "edit";
      const url: string = `${this.apiUrl}?operation=${operation}&id=${aId}&nome=${encodeURIComponent(aName)}&password=${encodeURIComponent(aPassword)}&ruoloid=${aRole}`;
      return this.http.get<any>(url);
   }


   addNewData (aName: string,
               aPassword: string,
               aRole: number): Observable<any>
   {
      const operation: string = "add";
      const url: string = `${this.apiUrl}?operation=${operation}&nome=${encodeURIComponent(aName)}&password=${encodeURIComponent(aPassword)}&ruoloid=${aRole}`;
      return this.http.get<any>(url);
   }


   DeleteData (aId: number): Observable<any>
   {
      const operation: string = "delete";
      const url: string = `${this.apiUrl}?operation=${operation}&id=${aId}`;
      return this.http.get<any>(url);
   }


   CheckUser (aName: string,
              aPassword: string): Observable<any>
   {
      const operation: string = "check";
      const url: string = `${this.apiUrl}?operation=${operation}&nome=${encodeURIComponent(aName)}&password=${encodeURIComponent(aPassword)}`;
      return this.http.get<any>(url);
   }

}
