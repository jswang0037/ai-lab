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
  }
  parseQuestion(text: string){
    const body = {
      text: text
    }
    this.http.post<Question[]>(this.url + "/parse", body).subscribe(res => {
      this.questions = res
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
      this.parseQuestion(res)
      this.history.push({
        role: Role.Model,
        // TODO: check need origin text or not
        text: res
      })
    })
  }

  init(){
  }

  ngOnInit(): void {
    this.history = []
    this.chat("你好")
  }
}
