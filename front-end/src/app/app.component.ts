import { Component, OnInit } from '@angular/core';
import { DailyNutrition } from './components/nutrition/nutrition.component';
import { ExercisePlan } from './components/training/training.component';
// Removed HtmlService import
import { ChatService, Content, Question, ParseResponse } from './services/chat.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  constructor(
    private chatService: ChatService,
    // Removed HtmlService injection
  ) {}

  title = 'ai-lab';
  questions: Question[] = [
    {
      text: 'Loading...',
      options: []
    }
  ];
  history: Content[] = [];
  userTextInput = '';
  selectedOption: string | null = null; // Added for ngModel binding
  isLoading = true;
  errorMessage: string | null = null;

  exercisePlan: ExercisePlan | null = null;
  nutritionPlan: DailyNutrition | null = null;


  submit() {
    this.errorMessage = null; // Clear error on new submission
    let response: string | null = null;

    // Prioritize text input if it exists
    if (this.userTextInput && this.userTextInput.trim() !== '') {
      response = this.userTextInput.trim();
    } else if (this.selectedOption) { // Otherwise, use the selected radio option
      response = this.selectedOption;
    }

    if (response) {
      this.chat(response);
      // Reset inputs after successful submission
      this.userTextInput = '';
      this.selectedOption = null;
    } else {
      this.errorMessage = "Please select an option or enter text.";
      console.warn("Submit called with no selection or text input.");
    }
  }

  // Added to clear radio selection when text is typed
  clearRadioSelection() {
    if (this.userTextInput && this.userTextInput.trim() !== '') {
      this.selectedOption = null; // Deselect radio button
    }
  }

  handleParseResponse(text: string) {
    this.isLoading = true;
    this.errorMessage = null;
    this.chatService.parseResponseText(text).subscribe({
      next: (res: ParseResponse) => {
        console.log("Parsed response:", res);
        if (Array.isArray(res)) {
          this.questions = res;
          this.exercisePlan = null;
          this.nutritionPlan = null;
        } else if (res && (res.exercisePlan || res.nutritionPlan)) {
          this.exercisePlan = res.exercisePlan || null;
          this.nutritionPlan = res.nutritionPlan || null;
          this.questions = [
            {
              text: "Here is your plan. Need any adjustments?",
              options: ["Looks good!", "Let's tweak it."]
            }
          ];
        } else {
           console.error("Unexpected format received from /parse:", res);
           this.errorMessage = "Received an unexpected response format from the server.";
           this.questions = [{ text: "An error occurred processing the response.", options: [] }];
        }
        this.isLoading = false;
      },
      error: (err: Error) => {
        console.error("Error parsing response:", err);
        this.errorMessage = `Error processing response: ${err.message}`;
        this.questions = [{ text: "An error occurred. Please try again.", options: [] }];
        this.isLoading = false;
      }
    });
  }


  chat(text: string) {
    if (!text || text.trim() === '') return;

    this.isLoading = true;
    this.errorMessage = null;

    const userMessage: Content = { role: 'user', text: text.trim() }; // Trim text
    this.history = [...this.history, userMessage];

    this.chatService.sendChatMessage(this.history, text.trim()).subscribe({ // Trim text
      next: (res: string) => {
        console.log("Chat response:", res);
        const modelMessage: Content = { role: 'model', text: res };
        this.history = [...this.history, modelMessage];
        this.handleParseResponse(res);
      },
      error: (err: Error) => {
        console.error("Error sending chat message:", err);
        this.errorMessage = `Error sending message: ${err.message}`;
        // Optional: Remove the optimistic user message from history on failure
        // this.history = this.history.slice(0, -1);
        this.isLoading = false;
      }
    });
  }

  ngOnInit(): void {
    this.history = [];
    this.selectedOption = null; // Ensure null on init
    this.userTextInput = '';
    this.chat('你好');
  }
}
