import { Component, OnInit, Query } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';

import { HtmlService } from './services/html.service';

interface Question{
  text: string;
  options: string[];
}
enum Role{
  User = 'user',
  Model = 'model'
}
interface Content{
  role: Role;
  text: string;
}
interface ChatReqAttr{
  contents: Content[];
  text: string
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit  {
  constructor(
    private http: HttpClient,
    private htmlService: HtmlService
  ){}

  title = 'ai-lab';
  question: string = '';
  options: string[] = [];
  questions: Question[] = [
    {
      text: "Loading...",
      options: []
    }
  ];
  history: Content[] = []
  userTextInput = ""
  url = "http://localhost:8000"
  isLoading = true


  submit() {
    const response = this.htmlService.getRadioChecked("options")
    this.chat(response)
    this.htmlService.setInputValue("question-text-input", "")
  }
  parseQuestion(text: string){
    const body = {
      text: text
    }
    this.http.post(this.url + "/parse", body).subscribe(res => {
      if (Array.isArray(res) && res.length > 0 && 'text' in res[0] && 'options' in res[0]) {
        this.questions = res as Question[];
      } else {
        // TODO: handle example
        // {
        //   "nutritionPlan": {
        //     "startDate": "2024-07-05",
        //     "endDate": "2024-07-12",
        //     "notes": "配合增肌目標，確保足夠蛋白質攝取，並略為增加總熱量攝取。",
        //     "dailyTargets": {
        //       "targetCalories": 2700,
        //       "macronutrients": {
        //         "proteinGrams": 140,
        //         "carbohydrateGrams": 340,
        //         "fatGrams": 73
        //       },
        //       "waterIntakeMilliliters": 3500
        //     }
        //   },
        //   "exercise_plan": {
        //     "startDate": "2024-07-05",
        //     "endDate": "2024-07-12",
        //     "notes": "第一階段，著重基礎力量建立和動作熟悉度。每週三次全身性訓練，確保每個肌群都得到鍛鍊。",
        //     "weeklySchedule": [
        //       {
        //         "dayOfWeek": "Monday",
        //         "workoutType": "Full Body Strength",
        //         "estimatedDurationMinutes": 60,
        //         "mainWorkout": [
        //           {
        //             "exerciseName": "深蹲 (Barbell Squat)",
        //             "equipment": [
        //               "槓鈴",
        //               "深蹲架"
        //             ],
        //             "targetSets": 3,
        //             "targetReps": 8,
        //             "targetWeightKg": 40,
        //             "restBetweenSetsSeconds": 90,
        //             "instructions": "保持背部挺直，核心穩定。下蹲至大腿與地面平行。"
        //           },
        //           {
        //             "exerciseName": "槓鈴臥推 (Barbell Bench Press)",
        //             "equipment": [
        //               "槓鈴",
        //               "臥推椅"
        //             ],
        //             "targetSets": 3,
        //             "targetReps": 8,
        //             "targetWeightKg": 30,
        //             "restBetweenSetsSeconds": 90,
        //             "instructions": "控制離心速度，感受胸部發力。"
        //           },
        //           {
        //             "exerciseName": "硬舉 (Deadlift)",
        //             "equipment": [
        //               "槓鈴"
        //             ],
        //             "targetSets": 1,
        //             "targetReps": 5,
        //             "targetWeightKg": 50,
        //             "restBetweenSetsSeconds": 120,
        //             "instructions": "背部保持挺直，利用臀部和腿部力量抬起。"
        //           },
        //           {
        //             "exerciseName": "引體向上 (Pull-up)",
        //             "equipment": [
        //               "單槓"
        //             ],
        //             "targetSets": 3,
        //             "targetReps": "盡可能多 (AMRAP)",
        //             "targetWeightKg": 0,
        //             "restBetweenSetsSeconds": 75,
        //             "instructions": "如果無法完成引體向上，可以使用輔助器材。"
        //           }
        //         ]
        //       },
        //       {
        //         "dayOfWeek": "Wednesday",
        //         "workoutType": "Full Body Strength",
        //         "estimatedDurationMinutes": 60,
        //         "mainWorkout": [
        //           {
        //             "exerciseName": "肩推 (Overhead Press)",
        //             "equipment": [
        //               "槓鈴",
        //               "深蹲架"
        //             ],
        //             "targetSets": 3,
        //             "targetReps": 8,
        //             "targetWeightKg": 25,
        //             "restBetweenSetsSeconds": 90,
        //             "instructions": "核心穩定，將槓鈴向上推起至手臂伸直。"
        //           },
        //           {
        //             "exerciseName": "划船 (Barbell Row)",
        //             "equipment": [
        //               "槓鈴"
        //             ],
        //             "targetSets": 3,
        //             "targetReps": 8,
        //             "targetWeightKg": 35,
        //             "restBetweenSetsSeconds": 90,
        //             "instructions": "保持背部挺直，將槓鈴拉向腹部。"
        //           },
        //           {
        //             "exerciseName": "弓箭步 (Lunge)",
        //             "equipment": [
        //               "啞鈴"
        //             ],
        //             "targetSets": 3,
        //             "targetReps": 10,
        //             "targetWeightKg": 8,
        //             "restBetweenSetsSeconds": 75,
        //             "instructions": "保持身體平衡，下蹲至前腿與地面平行。"
        //           },
        //           {
        //             "exerciseName": "滑輪下拉 (Lat Pulldown)",
        //             "equipment": [
        //               "滑輪下拉機"
        //             ],
        //             "targetSets": 3,
        //             "targetReps": 10,
        //             "targetWeightKg": 30,
        //             "restBetweenSetsSeconds": 75,
        //             "instructions": "控制速度，感受背肌收縮。"
        //           }
        //         ]
        //       },
        //       {
        //         "dayOfWeek": "Friday",
        //         "workoutType": "Full Body Strength",
        //         "estimatedDurationMinutes": 60,
        //         "mainWorkout": [
        //           {
        //             "exerciseName": "深蹲 (Barbell Squat)",
        //             "equipment": [
        //               "槓鈴",
        //               "深蹲架"
        //             ],
        //             "targetSets": 3,
        //             "targetReps": 8,
        //             "targetWeightKg": 40,
        //             "restBetweenSetsSeconds": 90,
        //             "instructions": "保持背部挺直，核心穩定。下蹲至大腿與地面平行。"
        //           },
        //           {
        //             "exerciseName": "啞鈴臥推 (Dumbbell Bench Press)",
        //             "equipment": [
        //               "啞鈴",
        //               "臥推椅"
        //             ],
        //             "targetSets": 3,
        //             "targetReps": 10,
        //             "targetWeightKg": 12,
        //             "restBetweenSetsSeconds": 90,
        //             "instructions": "控制離心速度，感受胸部發力。"
        //           },
        //           {
        //             "exerciseName": "硬舉 (Deadlift)",
        //             "equipment": [
        //               "槓鈴"
        //             ],
        //             "targetSets": 1,
        //             "targetReps": 5,
        //             "targetWeightKg": 50,
        //             "restBetweenSetsSeconds": 120,
        //             "instructions": "背部保持挺直，利用臀部和腿部力量抬起。"
        //           },
        //           {
        //             "exerciseName": "啞鈴划船 (Dumbbell Row)",
        //             "equipment": [
        //               "啞鈴",
        //               "長椅"
        //             ],
        //             "targetSets": 3,
        //             "targetReps": 10,
        //             "targetWeightKg": 15,
        //             "restBetweenSetsSeconds": 75,
        //             "instructions": "保持背部挺直，專注背肌收縮。"
        //           }
        //         ]
        //       }
        //     ]
        //   }
        // }
      }
      this.isLoading = false
    })
  }

  chat(text: string){
    this.isLoading = true
    this.history.push({
      role: Role.User,
      text: text
    })
    const body = {
      contents: this.history,
      text: text
    }
    this.http.post<string>(this.url + "/chat", body).subscribe(res => {
      console.log(res)

      this.history.push({
        role: Role.Model,
        text: res
      })
      this.parseQuestion(res)
    })
  }

  init(){
  }

  ngOnInit(): void {
    this.history = []
    this.chat("你好")
  }
}
