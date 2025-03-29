import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { BrowserModule } from '@angular/platform-browser';
import { CalculatorComponent } from './calculator/calculator.component';
import { NgModule } from '@angular/core';
import { ResultComponent } from './result/result.component';

@NgModule({
  declarations: [
    AppComponent,
    CalculatorComponent,
    ResultComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
