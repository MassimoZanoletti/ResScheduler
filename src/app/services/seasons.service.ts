import {map} from 'rxjs/operators';
import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {
   SeasonDb,
   Season
} from "../models/datamod";



@Injectable ({
                providedIn: 'root'
             })
export class SeasonsService
{
   private apiUrl = 'https://www.basketsarezzo.com/code/backend/yessched/season/api.php';

   constructor (private http: HttpClient)
   {
   }


   getAllData (): Observable<any>
   {
      const operation: string = "all";
      const url: string = `${this.apiUrl}?operation=${operation}`;
      return this.http.get<SeasonDb> (url).pipe (
         map ((dataFromDb) => ({
            ok:       dataFromDb.ok,
            message:  dataFromDb.message,
            elements: dataFromDb.elements.map (element => ({
               id:         element.id,
               nome:       element.nome,
               datainizio: new Date (element.datainizio),
               datafine:   new Date (element.datafine)
            }))
         }))
      );
   }


   getSingleData (aId: number): Observable<any>
   {
      const operation: string = "single";
      const url: string = `${this.apiUrl}?operation=${operation}&id=${aId}`;
      return this.http.get<any> (url).pipe (
         map ((dataFromDb) => ({
            ok:      dataFromDb.ok,
            message: dataFromDb.message,
            element: [
               {
                  id:         parseInt (dataFromDb.elements.id, 10),
                  nome:       dataFromDb.elements.nome,
                  datainizio: new Date (dataFromDb.elements.datainizio),
                  datafine:   new Date (dataFromDb.elements.datafine)
               }
            ]
            /*
            elements: dataFromDb.elements.map(element => ({
               id: element.id,
               nome: element.nome,
               datainizio: new Date(element.datainizio),
               datafine: new Date(element.datafine)
            }))
            */
         }))
      );
   }


   updateData (aId: number,
               aName: string,
               aDataInizio: string,
               aDataFine: string): Observable<any>
   {
      const operation: string = "edit";
      const url: string = `${this.apiUrl}?operation=${operation}&id=${aId}&nome=${aName}&datainizio=${aDataInizio}&datafine=${aDataFine}`;
      return this.http.get<any> (url);
   }


   addNewData (aName: string,
               aDataInizio: string,
               aDataFine: string): Observable<any>
   {
      const operation: string = "add";
      const url: string = `${this.apiUrl}?operation=${operation}&nome=${aName}&datainizio=${aDataInizio}&datafine=${aDataFine}`;
      return this.http.get<any> (url);
   }


   DeleteData (aId: number): Observable<any>
   {
      const operation: string = "delete";
      const url: string = `${this.apiUrl}?operation=${operation}&id=${aId}`;
      return this.http.get<any> (url);
   }

}
