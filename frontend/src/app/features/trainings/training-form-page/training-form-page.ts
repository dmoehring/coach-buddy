import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';

@Component({
  selector: 'app-training-form-page',
  imports: [
    RouterLink,
    ButtonModule,
    CardModule
  ],
  templateUrl: './training-form-page.html',
  styleUrl: './training-form-page.scss'
})
export class TrainingFormPage {
}
