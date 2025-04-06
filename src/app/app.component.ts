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
        console.log('exercisePlan' in res)
        if ('exercisePlan' in res) {
          this.exercisePlan = res.exercisePlan as ExercisePlan;
        }
        if ('nutritionPlan' in res) {
          this.nutritionPlan = res.nutritionPlan as DailyNutrition;
        }
      }
      this.isLoading = false;
    });
  }


  chat(text: string) {
    this.isLoading = true;
    this.history.push({
      role: Role.User,
      text: text
    });
    const body = {
      contents: this.history,
      text: text
    };
    this.http.post<string>(this.url + '/chat', body).subscribe(res => {
      this.history.push({
        role: Role.Model,
        text: res
      });
      this.parseQuestion(res);
    });
  }

  init() {
  }

  ngOnInit(): void {
    this.history = [];
    this.chat('你好');
  }
}
