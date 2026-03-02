export type Action = {
    id: string;
    title: string;
    score: number;
};

export type KPI = {
    id: string;
    title: string;
    actions: Action[]; // AI suggested + user custom ones
};

export type Goal = {
    id: string;
    title: string;          // 目標 (例: -10kg)
    currentStatus: string;  // 現状 (例: 70kg)
    duration: string;       // 期間 (例: 6ヶ月)
    kpis: KPI[];            // 3つのカテゴリ
    createdAt: string;
    isInitialSetup: boolean; // セットアップ中かどうか
};

// 毎日の達成記録
export type DailyRecord = {
    date: string; // YYYY-MM-DD
    completedActionIds: string[]; // 完了したアクションのIDリスト
};

export type TaskStatus = "pending" | "completed";

// タブメニュー
export type AppTab = "home" | "graph" | "me";
