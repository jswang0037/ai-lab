import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  result: number | null = null;
  title = 'ai-lab';

  onCalculate(result: number) {
    this.result = result;
  }
}
