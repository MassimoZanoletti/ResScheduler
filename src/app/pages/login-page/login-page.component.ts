import {Component, isDevMode} from '@angular/core';
import {AuthService} from '../../services/auth.service';
import {Router, RouterModule} from '@angular/router';
import {FormsModule} from '@angular/forms';
import {InputTextModule} from 'primeng/inputtext';
import {ButtonModule} from 'primeng/button';
import {NgIf} from '@angular/common';
import {utils} from "../../common/utils";



@Component ({
               selector:    'app-login-page',
               standalone:  true,
               imports:     [FormsModule, InputTextModule, ButtonModule, NgIf, RouterModule],
               templateUrl: './login-page.component.html',
               styleUrl:    './login-page.component.css'
            })
export class LoginPageComponent
{
   username = '';
   password = '';
   loginFailed = false;


   constructor (private authService: AuthService, private router: Router)
   {
   }


   async login ()
   {
      const loginRes: boolean = await this.authService.login (this.username, this.password);
      if (loginRes)
      {
         this.router.navigate (['/']);
      }
      else
      {
         this.loginFailed = true;
      }
   }
}

