import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: Request) {
  try {
    const { goal, currentStatus, mode, completedTask, taskHistory, kpiTitle, kpis } = await req.json();

    let prompt = "";

    if (mode === "initialize_plan") {
      prompt = `あなたは目標達成の専門家です。ユーザーの目標に対して、逆算して最適なプランを提案してください。
      
目標: "${goal}"

以下の形式のJSONで回答してください。他の文章は一切不要です：
{
  "duration": "AIが判断した最適な期間 (例: 6ヶ月, 3週間)",
  "suggestedCurrentStatus": "目標から類推される現状のサンプル (例: ダイエットなら「75kg」、副業なら「月収0円」)",
  "kpis": [
    {
      "title": "カテゴリ1の名前 (例: ダイエットなら「食事管理」)",
      "actions": [
        {"title": "具体的で毎日できるアクション1 (例: 間食をしない)", "score": 3},
        {"title": "具体的で毎日できるアクション2", "score": 2},
        {"title": "具体的で毎日できるアクション3", "score": 5}
      ]
    },
    {
      "title": "カテゴリ2の名前 (例: ダイエットなら「運動習慣」)",
      "actions": [
        {"title": "具体的で毎日できるアクション1 (例: 20分歩く)", "score": 5},
        {"title": "具体的で毎日できるアクション2", "score": 3},
        {"title": "具体的で毎日できるアクション3", "score": 4}
      ]
    },
    {
      "title": "カテゴリ3の名前 (例: ダイエットなら「生活習慣」)",
      "actions": [
        {"title": "具体的で毎日できるアクション1 (例: 7時間寝る)", "score": 2},
        {"title": "具体的で毎日できるアクション2", "score": 3},
        {"title": "具体的で毎日できるアクション3", "score": 4}
      ]
    }
  ]
}

制約:
- カテゴリは必ず3つ提案してください。
- 各カテゴリのアクションは必ず3つずつ提案してください。
- アクションは「〜した」という形式で、毎日Yes/Noでチェックできる粒度にしてください。
- タイトルやアクションはすべて日本語で行ってください。`;
    } else if (mode === "regenerate_actions") {
      prompt = `あなたは目標達成の専門家です。以下のKPIカテゴリに対して、毎日実行できる具体的なアクションを3つ提案してください。

目標: "${goal}"
KPIカテゴリ: "${kpiTitle}"

以下の形式のJSONで回答してください。他の文章は一切不要です：
{
  "actions": [
    {"title": "具体的で毎日できるアクション1", "score": 3},
    {"title": "具体的で毎日できるアクション2", "score": 4},
    {"title": "具体的で毎日できるアクション3", "score": 5}
  ]
}

制約:
- アクションは「〜した」という形式で、毎日Yes/Noでチェックできる粒度にしてください。
- タイトルはすべて日本語で行ってください。`;
    } else if (mode === "analyze_gap") {
      prompt = `あなたは分析のプロです。ユーザーの「現状」と「目標」を分析し、その差分（ギャップ）を埋めるためのアドバイスを100文字程度で提供してください。
      
目標: "${goal}"
現状: "${currentStatus}"

回答はテキストのみで、ポジティブかつ論理的なトーンで行ってください。`;
    } else if (mode === "bonus_action") {
      const kpisStr = Array.isArray(kpis) ? kpis.join(", ") : "";
      prompt = `あなたは目標達成の専門家です。ユーザーは今日のすべてのアクションを完了し、「もっと頑張る」と意気込んでいます。
      
目標: "${goal}"
現在のKPIカテゴリ: ${kpisStr}

この目標とカテゴリに対して、今日追加でできる「ボーナスアクション」を各カテゴリにつき1つずつ提案してください。
以下の形式のJSONで回答してください。他の文章は一切不要です：
{
  "actions": [
    {"kpiTitle": "カテゴリ1の名前", "title": "カテゴリ1向けの今日すぐできるアクション", "score": 5},
    {"kpiTitle": "カテゴリ2の名前", "title": "カテゴリ2向けの今日すぐできるアクション", "score": 4}
  ]
}

制約:
- アクションは「〜した」という形式で、今日1回だけ実行できる粒度にしてください。
- タイトルはすべて日本語で行ってください。`;
    } else if (mode === "congrats_comment") {
      prompt = `あなたはユーザーの目標達成を心から応援するメンターです。
ユーザーが「今日のアクションをすべてやり遂げた」瞬間に贈る、短く（50文字程度）温かい、成長を感じさせるコメントを生成してください。

目標: "${goal}"

条件：
- 否定的な言葉は一切使わず、達成を最大限に称えてください。
- 「次も頑張ろう」というプレッシャーよりも、「今日やり遂げたことの価値」に焦点を当ててください。
- 目標に関係する言葉を織り交ぜて、パーソナライズされた感覚を与えてください。
- 回答はテキストのみ（純粋な文字列）で返してください。`;
    }

    const modelsToTry = ["gemini-2.0-flash", "gemini-1.5-flash", "gemini-1.5-pro"];
    let lastError = null;

    for (const modelName of modelsToTry) {
      try {
        const model = genAI.getGenerativeModel({
          model: modelName,
          generationConfig: mode === "initialize_plan" ? { responseMimeType: "application/json" } : undefined
        });

        const result = await model.generateContent(prompt);
        const text = result.response.text();

        if (mode === "initialize_plan" || mode === "regenerate_actions" || mode === "bonus_action") {
          const cleanText = text.replace(/```json/g, "").replace(/```/g, "").trim();
          // Extract JSON object or array from the text explicitly
          const jsonMatch = cleanText.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            return NextResponse.json({ result: parsed });
          } else {
            console.error("Failed to parse AI JSON response:", cleanText);
            throw new Error("Invalid format from AI");
          }
        } else {
          return NextResponse.json({ result: { text } });
        }
      } catch (e: any) {
        lastError = e;
        continue;
      }
    }

    throw lastError;

  } catch (error: any) {
    console.error("AI Generate Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
