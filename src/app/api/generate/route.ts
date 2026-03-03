import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export const maxDuration = 60; // タイムアウト制限を60秒に引き上げ

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
- 各カテゴリのアクションは「2つ〜3つ」提案してください（簡潔さを優先）。
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
- 達成を最大限に称え、今日やり遂げたことの価値に焦点を当ててください。
- 目標に関係する言葉を織り交ぜて、パーソナライズされた感覚を与えてください。
- 回答はテキストのみ（純粋な文字列）で返してください。`;
    }

    const modelsToTry = [
      "gemini-2.0-flash-lite",      // 軽量版、分離クォータ
      "gemini-1.5-flash-latest",    // 安定最新版
      "gemini-2.0-flash",           // メイン（クォータ超過の場合は次へ）
      "gemini-2.0-flash-exp",       // 実験版（別クォータの可能性）
    ];
    let errors: string[] = [];

    for (const modelName of modelsToTry) {
      try {
        console.log(`Trying model: ${modelName} for mode: ${mode}`);
        const model = genAI.getGenerativeModel({
          model: modelName,
          generationConfig: mode === "initialize_plan" && modelName !== "gemini-pro" ? { responseMimeType: "application/json" } : undefined
        });

        const result = await model.generateContent(prompt);
        const text = result.response.text();
        console.log(`AI Response (${modelName}):`, text);

        if (mode === "initialize_plan" || mode === "regenerate_actions" || mode === "bonus_action") {
          // Robust JSON extraction
          let cleanText = text.trim();

          // Try to find JSON block if it's wrapped in markdown
          const jsonMatch = cleanText.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
          if (jsonMatch) {
            try {
              console.log("Extracted JSON candidate:", jsonMatch[0]);
              const parsed = JSON.parse(jsonMatch[0]);
              console.log("Successfully parsed JSON:", parsed);
              return NextResponse.json({ result: parsed });
            } catch (pE: any) {
              console.error(`JSON.parse failed for model ${modelName}:`, jsonMatch[0]);
              throw new Error(`JSON parse error: ${pE.message}`);
            }
          } else {
            console.error(`No JSON pattern found in response from model ${modelName}`);
            throw new Error(`Invalid format from AI (${modelName})`);
          }
        } else {
          return NextResponse.json({ result: { text } });
        }
      } catch (e: any) {
        console.error(`Error with model ${modelName}:`, e.message);
        errors.push(`[${modelName}]: ${e.message}`);
        continue;
      }
    }

    throw new Error(`All models failed. Details -> ${errors.join(" | ")}`);

  } catch (error: any) {
    console.error("AI Generate Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
