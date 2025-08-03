
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User } from '../models/datamod';



export let loggedUser: User = {
   id: 0,
   nome: "",
   password: "",
   ruolo: "",
   ruolo_id: 0,
   attributo: 0
}


export function InitLoggedUser()
{
   loggedUser = {
      id: 0,
      nome: "",
      password: "",
      ruolo_id: 0,
      ruolo: "",
      attributo: 0
   };
}

@Injectable({
               providedIn: 'root'
            })
export class UserService
{
   private apiUrl = 'https://www.basketsarezzo.com/code/backend/yessched/users/api.php'; // Assicurati che questo sia corretto

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
      const url: string = `${this.apiUrl}?operation=${operation}&id=${aId}&nome=${aName}&password=${aPassword}&ruoloid=${aRole}`;
      return this.http.get<any>(url);
   }


   addNewData (aName: string,
               aPassword: string,
               aRole: number): Observable<any>
   {
      const operation: string = "add";
      const url: string = `${this.apiUrl}?operation=${operation}&nome=${aName}&password=${aPassword}&ruoloid=${aRole}`;
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
      const url: string = `${this.apiUrl}?operation=${operation}&nome=${aName}&password=${aPassword}`;
      return this.http.get<any>(url);
   }

}
