import {utils} from "./utils";
import {Gruppo, Resource} from "../models/datamod";



export namespace globs
{

   export class TLocalStorage
   {
      public keyName: string = "RS_LocStor";
      public data: any = {
         currSeason:         {},
         currTipoEvento:     {}
      };


      public async Load ()
      {
         this.data = utils.GetFromLocalStorage<any> (this.keyName);
         if (this.data == null)
         {
            this.data = {};
            this.data.currSeason = {
               "id":         "5",
               "nome":       "2025/2026",
               "datainizio": "2025-09-01T00:00:00.000Z",
               "datafine":   "2026-06-30T00:00:00.000Z"
            };
            this.data.currTipoEvento = {"id": 1, "nome": "Solo Eventi classici"};
            //
            await this.Save ();
         }
         else
         {
            if (this.data.currSeason == null)
            {
               this.data.currSeason = {};
               this.data.currSeason = {
                  "id":         "5",
                  "nome":       "2025/2026",
                  "datainizio": "2025-09-01T00:00:00.000Z",
                  "datafine":   "2026-06-30T00:00:00.000Z"
               };
            }
            if (this.data.currTipoEvento == null)
            {
               this.data.currTipoEvento = {};
               this.data.currTipoEvento = {"id": 1, "nome": "Solo Eventi classici"};
            }
         }
      }


      public async Save ()
      {
         utils.SaveToLocalStorage (this.keyName, this.data);
      }
   };



   export class TSessionStorageData
   {
      fltrRisorsa: boolean;
      fltrRisorsaItems: Array<any>;
      fltrGruppo: boolean;
      fltrGruppoItems: Array<any>;

      constructor()
      {
         this.fltrRisorsa = false;
         this.fltrRisorsaItems = [];
         this.fltrGruppo = false;
         this.fltrGruppoItems = [];
      }
   }


   export class TSessionStorage
   {
      public keyName: string = "RS_SessStor";
      public data: TSessionStorageData;


      constructor()
      {
         this.data = new  TSessionStorageData();
      }


      public async Load ()
      {
         this.data = utils.GetFromSessionStorage<any> (this.keyName);
         if (this.data == null)
         {
            this.data = new  TSessionStorageData();
            //
            await this.Save ();
         }
         else
         {
         }
      }


      public async Save ()
      {
         utils.SaveToSessionStorage(this.keyName, this.data);
      }

   };


   //export let localStorage: TLocalStorage | null = null;
};
