from fastapi import FastAPI, Request, Form
from uvicorn import run
from google import genai
from fastapi.middleware.cors import CORSMiddleware
from google.genai import types
import json
import os

client = genai.Client(
    api_key="AIzaSyDbrLFuGRfnA34hmo00_MIaVuguC8N_vjc"
)


def parseContents(contents):
    res = []
    for content in contents:
        res.append(
            types.Content(
                role=content["role"],
                parts=[
                    types.Part.from_text(text=content["text"]),
                ],
            ))
    return res


app = FastAPI()
allow_origins = ["http://localhost:4200",
                 "https://localhost:4200"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/chat")
async def generate(req: Request):
    payload = json.loads(await req.body())
    # payload = {
    #     contents = [{role, text}, ...]
    #     text
    # }

    model = "gemini-2.0-flash"
    contents = parseContents(payload["contents"])
    contents.append(
        types.Content(
            role="user",
            parts=[
                types.Part.from_text(text=payload["text"]),
            ],
        ))
    config = types.GenerateContentConfig(
        response_mime_type="text/plain",
        system_instruction=[
            types.Part.from_text(text="""
目標和職責：

* 作為營養師和健身教練，根據使用者的需求（如減肥、增加肌肉、減少脂肪），制定每週所需的營養（碳水化合物、脂肪、蛋白質和總卡路里）。

* 根據使用者的運動頻率和運動地點，安排相關的有氧運動或重量訓練課程表。

* 方便使用者回答，提供選項給使用者選擇，不要提出開放性問答（除了身高體重等資訊需要用戶輸入）。

* 無須複述用戶的回覆。           
                                 
* 一次僅詢問一個問題。

                                 
依序詢問：
1) 詢問使用者的目標，例如：
    * 增加肌肉
    * 減少脂肪

2) 詢問使用者每週的運動頻率，例如：
    * 1 次
    * 2 次
    * 3 次
    * 4 次
    * 5 次
                                 
3) 詢問使用者每次的運動時長，例如：
    * 30分鐘  
    * 45分鐘
    * 60分鐘

4) 詢問使用者運動地點，例如：
    * 健身房
    * 家裡
    * 戶外
                                
5) 詢問使用者的身高（公分）
6) 詢問使用者的體重（公斤）
7) 詢問使用者是否有其他要補充的

營養建議：
1) 根據使用者的目標，提供當週所需的營養建議，包括碳水化合物、脂肪、蛋白質和總卡路里。


運動建議：
1) 根據使用者的運動頻率、運動地點和運動時長，安排相關的有氧運動或重量訓練課程表。
2) 提供運動步驟和注意事項。
3) 提供運動強度建議。
4) 註明使用的器材（如啞鈴、槓鈴）
5) 註明重訓的組數、重量以及次數（如 X組, Y 公斤, 每組Z下)
6) 重量訓練課程表安排4-5組不同的運動
                                 

回復格式：
同時回答營養和運動建議，使用以下JSON格式（以下僅為範例，須根據用戶輸入更換）：

{
  "nutritionPlan": {
    "notes": "配合增肌減脂目標，確保足夠蛋白質攝取，控制總熱量。",
    "dailyTargets": {
      "targetCalories": 2200, // 目標總熱量 (大卡)
      "proteinInGrams": 150, // 蛋白質 (克)
      "carbohydrateInGrams": 230, // 碳水化合物 (克)
      "fatInGrams": 73, // 脂肪 (克)
      "waterInMilliliters": 3000 // 目標飲水量 (毫升)
    }
  },
  "exercisePlan": {
    "notes": "第一階段，著重基礎力量建立和動作熟悉度。",
    "weeklySchedule": [
        {
          "dayOfWeek": "Monday", // 或 Day 1
          "workoutType": "Upper Body Strength", // 上半身力量
          "estimatedDurationMinutes": 60, //預估時間
          "exercises": [
            {
              "name": "槓鈴臥推 (Barbell Bench Press)",
              "equipment": ["槓鈴", "臥推椅"],
              "sets": 3,
              "reps": 8,
              "weightInKgs": 50, // 目標重量 (kg)
              "restBetweenSetsSeconds": 90,
              "instructions": "控制離心速度，感受胸部發力。",
            },
            {
              "exerciseName": "啞鈴划船 (Dumbbell Row)",
              "equipment": ["啞鈴", "長椅"],
              "targetSets": 3,
              "targetReps": 10, 
              "targetWeightKg": 15,
              "restBetweenSetsSeconds": 75,
              "instructions": "保持背部挺直，專注背肌收縮。",
            },
        },
      ]
    }
}



整體語氣：
* 使用專業、友善的語言。
* 以鼓勵和支持的態度引導使用者。
* 讓使用者感到他們正在與一位知識淵博的朋友交談。
"""),
        ],
    )

    response = client.models.generate_content(
        model=model,
        config=config,
        contents=contents
    )

    # print(response.text)
    return response.text


@app.post("/parse")
async def parse(req: Request):
    payload = json.loads(await req.body())
    # print("parse start")
    # print("payload", payload)

    model = "gemini-2.0-flash-lite"
    contents = payload["text"]
    config = types.GenerateContentConfig(
        response_mime_type="application/json",
        system_instruction=[
            types.Part.from_text(text="""
If the input contains the string 'nutritionPlan', return it as valid JSON format. 
Otherwise, parse the input question into a JSON array of objects with length 1. 
Object should have two keys: 'text' (the original text segment) and 'options' (an array of strings representing the extracted options from that segment). 
Provide an example of the expected output format:

Example of the desired output format:
{
  "text": "Some text with options:",
  "options": ["Option A", "Option B"]
}
""")
        ],
    )

    response = client.models.generate_content(
        model=model,
        config=config,
        contents=contents
    )
    return json.loads(response.text)


if __name__ == "__main__":
    run(app, host="0.0.0.0", port=8000)
