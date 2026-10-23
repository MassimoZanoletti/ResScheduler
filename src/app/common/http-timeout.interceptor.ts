import {HttpErrorResponse,
        HttpEvent,
        HttpInterceptorFn,
        HttpResponse} from '@angular/common/http';
import {Observable, of, throwError, TimeoutError} from 'rxjs';
import {catchError, timeout} from 'rxjs/operators';


// Tempo massimo di attesa per una risposta dal server (millisecondi)
export const HTTP_TIMEOUT_MS: number = 20000;


/*
   Interceptor applicato a TUTTE le chiamate http.

   1) Timeout: se il server (o la connessione) non risponde entro HTTP_TIMEOUT_MS
      la richiesta viene interrotta, invece di restare appesa per sempre
      lasciando lo spinner (p-blockUI) attivo.

   2) Errori: qualsiasi errore (timeout, rete assente, HTTP 500, risposta non JSON
      perche' PHP ha stampato un warning, ...) viene trasformato in una risposta
      "normale" nel formato usato dagli script PHP:
         { ok: false, message: '...', elements: [] }
      In questo modo il codice dei componenti, che controlla sempre "data.ok",
      mostra il messaggio d'errore e soprattutto arriva sempre al punto in cui
      spegne lo spinner, anche dove la subscribe non gestisce l'errore.
*/
export const httpTimeoutInterceptor: HttpInterceptorFn = (req, next): Observable<HttpEvent<unknown>> =>
{
   return next (req).pipe (
      timeout (HTTP_TIMEOUT_MS),
      catchError ((err: unknown) =>
      {
         const message: string = BuildErrorMessage (err);
         console.error (`HTTP error [${req.urlWithParams}]: ${message}`, err);
         // Per richieste non JSON (es. file/blob) si lascia passare l'errore originale
         if (req.responseType !== 'json')
            return throwError (() => err);
         return of (new HttpResponse ({
            status: 200,
            url:    req.urlWithParams,
            body:   { ok: false, message: message, elements: [] }
         }));
      })
   );
};


function BuildErrorMessage (err: unknown): string
{
   if (err instanceof TimeoutError)
      return `Il server non ha risposto entro ${HTTP_TIMEOUT_MS / 1000} secondi. Riprovare.`;
   if (err instanceof HttpErrorResponse)
   {
      // Lo script PHP in caso di errore risponde con { ok:false, message:'...' } e codice 500
      if ((err.error) && (typeof err.error === 'object') && (typeof err.error.message === 'string') && (err.error.message != ''))
         return err.error.message;
      if (err.status === 0)
         return 'Impossibile contattare il server (connessione assente o interrotta).';
      if (err.status === 200)
         return 'Risposta del server non valida (non e\' JSON).';
      return `Errore HTTP ${err.status} ${err.statusText}`;
   }
   return `${err}`;
}
