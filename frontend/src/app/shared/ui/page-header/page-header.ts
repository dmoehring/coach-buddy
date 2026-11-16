import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

/**
 * Title block shared by all pages. Buttons placed inside the element end up on the right
 * (below the title on narrow screens).
 */
@Component({
  selector: 'app-page-header',
  imports: [RouterLink],
  templateUrl: './page-header.html',
  styleUrl: './page-header.scss'
})
export class PageHeader {
  readonly title = input.required<string>();
  readonly subtitle = input<string | null>(null);
  readonly backLink = input<string | unknown[] | null>(null);
  readonly backLabel = input('Zurück');
  readonly backQueryParams = input<Record<string, string> | null>(null);
}
