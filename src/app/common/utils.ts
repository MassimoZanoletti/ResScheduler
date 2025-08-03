//import {KontrollerConfiguration} from "../ktrlconfiguration";
//import { ILoggerConfig, LoggerBase } from "dlt-kube-logger/logger";

//import { globs } from "./globals";
//var ip = require('ip');

//var path = require("path");
//var fs = require("fs");



export const RecMsgClientPrefix:    string = `${String.fromCharCode(0x2192)}${String.fromCharCode(0x2192)}        `;// →→ freccia destra
export const RecMsgServerPrefix:    string = `${String.fromCharCode(0x21D2)}${String.fromCharCode(0x21D2)}${String.fromCharCode(0x21D2)}               `;  // ⇒⇒⇒ freccia destra doppia
export const SendMsgPrefix:         string = `${String.fromCharCode(0x2190)} `; // ← freccia sinistra
export const SendHTTPMsgPrefix:     string = `${String.fromCharCode(0x2B9C)} `; // ⮜ DART a sinistra
export const RecHTTPMsgPrefix:      string = `${String.fromCharCode(0x2B9E)}        `; // ⮞ DART a destra
export const GenericInfoPrefix:     string = `👀 `; // 👀 numero 1 su fondo nero
export const RabbitMessagePrefix:   string = `📣 `; // 📣





/*==============================================================
      interface ICliServInfo
      Interface used to specify additional info for logs
      Fields (all optional):
         client
         server
         engine
         Usage examples in function calls:
            MyFunc ({server: "MyServer-02"});
            MyFunc ({engine: "Aston-01", client: "TestCtrl"});
===============================================================*/
export interface ICliServInfo
{
   client?: string;
   server?: string;
   engine?: string;
};








/*==============================================================
      CLSDEF class utils
      class with static utilities functions
===============================================================*/
export class utils
{
   static MillisecPerHour: number = (60*60*1000);
   static BurnSessionTimeoutH: number = 2; // hours
   static BurnSessionCheckTimeout: boolean = false;
   static BurnSessionQuery_CheckLock: boolean = true;
   static BurnSessionQuery_CheckLockFreqS: number = 30; // seconds
   static IsDevMode: boolean | null = null;
   static startingPath: string = "/";


   static __internalFnCounter: number = 1;
   static __internalEngCmdCounter: number = 0;


   /*-------------------------------------------
      Dlt_Delay
         Wait for milliseconds (should be intended for use in SYNC functions)
         Called FROM ASYNC function:
            if called with await please see Dlt_Sleep (it is the same)
            if called WITHOUT await doesn't stop enysthing
   -------------------------------------------*/
   static Dlt_Delay (msec: number)
   {
      return new Promise(resolve => setTimeout (resolve, msec));
   }


   /*-------------------------------------------
      Dlt_Sleep
         Wait for milliseconds (should be intended for use in ASYNC functions)
         Called from async function:
            waits the function BUT let all the other threads to go on
            await utils.Dlt_Sleep (...);
   -------------------------------------------*/
   static async Dlt_Sleep (msec: number)
   {
      await utils.Dlt_Delay (msec);
   }


   /*-------------------------------------------
      WriteException
         Writes in log exception information
         err: it is the exception information from catch
         fn: it is the function name where exception occurred
         msg: [optional] additional message to write
   -------------------------------------------*/
   static WriteException (err: any,
                          fn: string,
                          msg?: string)
   {
      if (err != null)
      {
         if (typeof msg !== 'undefined')
         {
            console.error (`${fn} Exception ${err.name} : ${msg}!`);
         }
         else
         {
            console.error (`${fn} Exception ${err.name}!`);
         }
         if (err.stack)
         {
            let tmp = err.stack.split("\n");
            tmp.splice(0,1);
            if (tmp.length > 0)
            {
               console.error (`${fn}     ${err.message}\n     ${tmp[0].trim ()}`);
            }
            else
            {
               console.error (`${fn}     ${err.message}`);
            }
         }
         else
            console.error(`${fn}     ${err.message}`);
      }
   }


   /*-------------------------------------------
      WriteException2
         Writes in log exception information
         err: it is the exception information from catch
         md: are meta data of the function
         msg: [optional] additional message to write
   -------------------------------------------*/
   static WriteException2 (err: any,
                           md: any,
                           msg?: string)
   {
      if (err != null)
      {
         if (typeof msg !== 'undefined')
         {
            console.error (`Exception ${err.name} : ${msg}!`, md);
         }
         else
         {
            console.error (`Exception ${err.name}!`, md);
         }
         if (err.stack)
         {
            let tmp = err.stack.split("\n");
            tmp.splice(0,1);
            if (tmp.length > 0)
            {
               console.error (`     ${err.message}\n     ${tmp[0].trim ()}`, md);
            }
            else
            {
               console.error (`     ${err.message}`, md);
            }
         }
         else
            console.error(`     ${err.message}`, md);
      }
   }


   /*-------------------------------------------
      Dlt_GetStringFromJson
         Extracts a string value from a json object, searching for the aKey property
         If aKey is not present, function returns the provided aDefault value
   -------------------------------------------*/
   static Dlt_GetStringFromJson (aJson: any,
                                 aKey: string,
                                 aDefault: string): string
   {
      let result: string = aDefault;
      let tmp: any;

      try
      {
         if (aJson.hasOwnProperty (aKey))
         {
            tmp = aJson[aKey];
            result = String(tmp.toString());
         }
      }
      catch(err)
      {
         //globs.llog.logger.error (`${fn} Exception!`);
         //globs.llog.logger.error (`     Error: '${err}'`);
         result = aDefault;
      }
      return result;
   }


   /*-------------------------------------------
      Dlt_GetNumberFromJson
         Extracts a numeric value from a json object, searching for the aKey property
         If aKey is not present (or is not a number type), function returns the provided aDefault value
   -------------------------------------------*/
   static Dlt_GetNumberFromJson (aJson: any,
                                 aKey: string,
                                 aDefault: number): number
   {
      let result: number = aDefault;
      let tmp: any;

      try
      {
         if (aJson.hasOwnProperty (aKey))
         {
            tmp = aJson[aKey];
            result = Number(tmp.toString());
         }
      }
      catch(err)
      {
         //globs.llog.logger.error (`${fn} Exception!`);
         //globs.llog.logger.error (`     Error: '${err}'`);
         result = aDefault;
      }
      return result;
   }


   /*-------------------------------------------
      Dlt_GetBooleanFromJson
         Extracts a boolean value from a json object, searching for the aKey property
         If aKey is not present (or is not a boolean type), function returns the provided aDefault value
   -------------------------------------------*/
   static Dlt_GetBooleanFromJson (aJson: any,
                                  aKey: string,
                                  aDefault: boolean): boolean
   {
      let result: boolean = aDefault;
      let tmp: any;

      try
      {
         if (aJson.hasOwnProperty (aKey))
         {
            tmp = aJson[aKey];
            const ss: string = tmp.toString().toLowerCase();
            if (ss == "true")
               result = true;
            else
               result = false;
         }
      }
      catch(err)
      {
         //globs.llog.logger.error (`${fn} Exception!`);
         //globs.llog.logger.error (`     Error: '${err}'`);
         result = aDefault;
      }
      return result;
   }


   /*-------------------------------------------
      Dlt_GetAnyFromJson
         Extracts an object value from a json object, searching for the aKey property
         If aKey is not present, function returns the provided aDefault value
   -------------------------------------------*/
   static Dlt_GetAnyFromJson (aJson: any,
                              aKey: string,
                              aDefault: any): any
   {
      let result: any = aDefault;

      try
      {
         if (aJson.hasOwnProperty (aKey))
         {
            result = aJson[aKey];
         }
      }
      catch(err)
      {
         //globs.llog.logger.error (`${fn} Exception!`);
         //globs.llog.logger.error (`     Error: '${err}'`);
         result = aDefault;
      }
      return result;
   }


   /*-------------------------------------------
      Dlt_PadDigits
         Converts a number to a string padding with 0 at the left
         Examples:
            Dlt_PadDigits(123, 5)   ->   "00123"
            Dlt_PadDigits(123, 2)   ->   "123"
   -------------------------------------------*/
   static Dlt_PadDigits(num: number, digits: number): string
   {
      //return ( Math.pow(10, digits) + ~~num).toString().substring(1);
      return String(num).padStart(digits, "0");
   }


   /*-------------------------------------------
      Dlt_RandomNumber
         Returns a random integer number between aMin and aMax, including both aMin and aMax
   -------------------------------------------*/
   static Dlt_RandomNumber (aMin: number,
                            aMax: number): number
   {
      let result: number;
      result = Math.floor(Math.random() * (aMax-aMin + 1)) + aMin;
      return result;
   }


   /*-------------------------------------------
      Dlt_RandomStr
         Returns a random string composed by Uppercase, lowercase and numbers
         If the length of the string is not provided or minor that 1 also the
         length is random between 4 and 20 character
   -------------------------------------------*/
   static Dlt_RandomStr (aLen?: number): string
   {
      const characters ='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
      const charactersLength = characters.length;
      let result: string = "";
      if (typeof aLen === 'undefined')
         aLen = utils.Dlt_RandomNumber(4, 20);
      if (aLen < 1)
         aLen = utils.Dlt_RandomNumber(4, 20);
      for (let i=0;   i<aLen;   i++)
         result += characters.charAt(utils.Dlt_RandomNumber(0, charactersLength-1));
      return result;
   }


   static Dlt_CloneObj (aSrc: any): any
   {
      let result: any = null;
      let error: boolean = false;

      try
      {
         //result = _.cloneDeep(aSrc);
      }
      catch (err)
      {
         error = true;
         console.warn (`Dlt_CloneObj lodash.cloneDeep error: '${err}'`);
      }
      if (error)
      {
         try
         {
            result = Object.assign(aSrc);
         }
         catch (err)
         {
            console.error (`Dlt_CloneObj Object.assign error: '${err}'`);
            result = null;
         }
      }
      return result;
   }


   /*
      Esempi
         SaveToLocalStorage ("nome", "Massimo");
         SaveToLocalStorage ("eta", 58);
         SaveToLocalStorage ("dati", variabileComplessa);  dove variabileComplessa è di tipo variabileComplessa: MioTipoComplesso;
   */
   static SaveToLocalStorage<T>(key: string,
                                value: T)
   {
      try
      {
         const serializedValue = JSON.stringify(value);
         localStorage.setItem(key, serializedValue);
         //console.log(`Valore salvato con successo nella localStorage per la chiave: ${key}`);
      }
      catch (error)
      {
         //console.error(`Errore durante il salvataggio nella localStorage per la chiave "${key}":`, error);
      }
   }


   /*
      Esempi
         const nome: string = GetToLocalStorage<string> ("nome");
         const eta: number = GetToLocalStorage<number> ("eta");
         const varCompl: MioTipoComplesso = GetToLocalStorage<MioTipoComplesso> ("dati");
   */
   static GetFromLocalStorage<T>(key: string): T | null
   {
      try
      {
         const serializedValue = localStorage.getItem(key);
         if (serializedValue === null)
         {
            //console.log(`Nessun valore trovato nella localStorage per la chiave: ${key}`);
            return null;
         }
         const value: T = JSON.parse(serializedValue);
         //console.log(`Valore letto con successo dalla localStorage per la chiave "${key}":`, value);
         return value;
      }
      catch (error)
      {
         //console.error(`Errore durante la lettura o il parsing dalla localStorage per la chiave "${key}":`, error);
         return null;
      }
   }


   static removeFromLocalStorage(key: string): void
   {
      try
      {
         localStorage.removeItem(key);
         //console.log(`Valore rimosso con successo dalla localStorage per la chiave: ${key}`);
      }
      catch (error)
      {
         //console.error(`Errore durante la rimozione dalla localStorage per la chiave "${key}":`, error);
      }
   }


   /*
      Esempi
         SaveToSessionStorage ("nome", "Massimo");
         SaveToSessionStorage ("eta", 58);
         SaveToSessionStorage ("dati", variabileComplessa);  dove variabileComplessa è di tipo variabileComplessa: MioTipoComplesso;
   */
   static SaveToSessionStorage<T>(key: string,
                                value: T)
   {
      try
      {
         const serializedValue = JSON.stringify(value);
         sessionStorage.setItem(key, serializedValue);
         //console.log(`Valore salvato con successo nella sessionStorage per la chiave: ${key}`);
      }
      catch (error)
      {
         //console.error(`Errore durante il salvataggio nella sessionStorage per la chiave "${key}":`, error);
      }
   }


   /*
      Esempi
         const nome: string = GetToSessionStorage<string> ("nome");
         const eta: number = GetToSessionStorage<number> ("eta");
         const varCompl: MioTipoComplesso = GetToSessionStorage<MioTipoComplesso> ("dati");
   */
   static GetFromSessionStorage<T>(key: string): T | null
   {
      try
      {
         const serializedValue = sessionStorage.getItem(key);
         if (serializedValue === null)
         {
            //console.log(`Nessun valore trovato nella sessionStorage per la chiave: ${key}`);
            return null;
         }
         const value: T = JSON.parse(serializedValue);
         //console.log(`Valore letto con successo dalla sessionStorage per la chiave "${key}":`, value);
         return value;
      }
      catch (error)
      {
         //console.error(`Errore durante la lettura o il parsing dalla sessionStorage per la chiave "${key}":`, error);
         return null;
      }
   }


   static removeFromSessionStorage(key: string): void
   {
      try
      {
         sessionStorage.removeItem(key);
         //console.log(`Valore rimosso con successo dalla sessionStorage per la chiave: ${key}`);
      }
      catch (error)
      {
         //console.error(`Errore durante la rimozione dalla sessionStorage per la chiave "${key}":`, error);
      }
   }


}// class utils






