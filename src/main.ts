/*
import {bootstrapApplication} from '@angular/platform-browser';
import {AppComponent} from './app/app.component';
import {importProvidersFrom} from '@angular/core';
import {provideRouter} from '@angular/router';
import {routes} from './app/app.routes';
import {BrowserModule, provideClientHydration} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {HttpClientModule} from '@angular/common/http';
import { DialogService } from 'primeng/dynamicdialog';


bootstrapApplication (AppComponent, {
   providers: [
      provideRouter (routes),
      importProvidersFrom (BrowserAnimationsModule, HttpClientModule, BrowserModule),
      provideClientHydration (),
      DialogService
   ]
}).catch (err => console.error (err));
*/

import {bootstrapApplication} from '@angular/platform-browser';
import {AppComponent} from './app/app.component';
import {importProvidersFrom} from '@angular/core';
import {provideRouter} from '@angular/router';
import {routes} from './app/app.routes';
import {BrowserModule, provideClientHydration} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {provideHttpClient} from '@angular/common/http'; // Importa la funzione
import { DialogService } from 'primeng/dynamicdialog';
import { utils } from './app/common/utils';

utils.startingPath = window.location.href;
bootstrapApplication (AppComponent, {
   providers: [
      provideRouter (routes),
      importProvidersFrom (BrowserAnimationsModule, BrowserModule),
      provideClientHydration (),
      provideHttpClient(), // Usa la funzione al posto del modulo
      DialogService
   ]
}).catch (err => console.error (err));
