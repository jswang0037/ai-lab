import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'ai-lab';
  question: string = '';
  options: string[] = ["option A", "option B"];
  selectedOption: string = '';

  submitQuestion() {
    // Handle question submission here
    console.log('Question submitted:', this.question, 'Option selected:', this.selectedOption);
  }
}
