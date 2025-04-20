import { Component, OnInit } from '@angular/core';

import { DailyNutrition } from './components/nutrition/nutrition.component';
import { ExercisePlan } from './components/training/training.component';
import { HtmlService } from './services/html.service';
import { HttpClient } from '@angular/common/http';

interface Question {
  text: string;
  options: string[];
}

enum Role {
  User = 'user',
  Model = 'model'
}

interface Content {
  role: Role;
  text: string;
  filename?: string;
}

interface ChatReqAttr {
  contents: Content[];
  text: string;
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  constructor(
    private http: HttpClient,
    private htmlService: HtmlService
  ) {}

  title = 'ai-lab';
  question: string = '';
  options: string[] = [];
  questions: Question[] = [
    {
      text: 'Loading...',
      options: []
    }
  ];
  history: Content[] = [];
  userTextInput = '';
  url = 'http://localhost:8000';
  isLoading = true;

  exercisePlan!: ExercisePlan; // Initialize with empty array
  nutritionPlan! : DailyNutrition; // Initialize with empty array
  selectedFile: File | null = null; // To store the actual file for upload
  selectedImagePreview: string | ArrayBuffer | null = null; // To store the Data URL for preview

  onFileSelected(event: any) {
    const file: File | undefined = event.target.files?.[0]; // Get the File object safely
    if (file) {
      this.selectedFile = file; // <-- Store the File object
      this.selectedImagePreview = null; // Reset preview

      // --- Read the file for preview ---
      const reader = new FileReader();
      reader.readAsDataURL(file); // Read as Data URL
      reader.onload = (e) => {
        // Store the result (which is a string) for preview
        this.selectedImagePreview = e.target?.result ?? null;
      };
      // --- End reading for preview ---

    } else {
      // No file selected or selection cancelled
      this.selectedFile = null;
      this.selectedImagePreview = null;
    }
  }


  submit() {
    const response = this.htmlService.getRadioChecked('options');
    this.userTextInput = ''
    this.chat(response);
  }

  parseQuestion(text: string) {
    const body = {
      text: text
    };
    this.http.post(this.url + '/parse', body).subscribe(res => {
      console.log(res)
      if (Array.isArray(res) && res.length > 0 && 'text' in res[0] && 'options' in res[0]) {
        this.questions = res as Question[];
      } else {
        if ('exercisePlan' in res) {
          this.exercisePlan = res.exercisePlan as ExercisePlan;
        }
        if ('nutritionPlan' in res) {
          this.nutritionPlan = res.nutritionPlan as DailyNutrition;
        }
        this.questions = [
          {
            text: "需要進行什麼樣的調整？",
            options: []
          }
        ];
      }
      this.isLoading = false;
    });
  }


  chat(text: string) {
    this.isLoading = true;
    this.history.push({
      role: Role.User,
      text: text,
      filename: this.selectedFile?.name
    });

    const formData = new FormData();
    formData.append('text', text);
    formData.append('history', JSON.stringify(this.history));

    if (this.selectedFile) {
      // 'file' is the key the backend will look for.
      // The third argument is the filename the server will receive.
      formData.append('file', this.selectedFile, this.selectedFile.name);
    }
    this.http.post<string>(this.url + '/chat', formData).subscribe(res => {
      this.history.push({
        role: Role.Model,
        text: res,
      });
      this.parseQuestion(res);

      this.selectedFile = null;
      this.selectedImagePreview = null;
    });
  }

  init() {
  }

  ngOnInit(): void {
    this.history = [];
    this.chat('你好');
  }
}
