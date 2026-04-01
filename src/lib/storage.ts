import { Goal, DailyRecord, VisionCard } from "./types";

const GOAL_KEY = "vision3_goal_v2";
const RECORDS_KEY = "vision3_daily_records_v2";

export const generateId = () => Math.random().toString(36).substring(2, 9);

// Goal management
export const saveGoal = (goal: Goal) => {
    localStorage.setItem(GOAL_KEY, JSON.stringify(goal));
};

export const getGoal = (): Goal | null => {
    if (typeof window === "undefined") return null;
    const data = localStorage.getItem(GOAL_KEY);
    return data ? JSON.parse(data) : null;
};

export const deleteGoal = () => {
    localStorage.removeItem(GOAL_KEY);
    localStorage.removeItem(RECORDS_KEY);
};

// Daily Record management
export const getDailyRecords = (): DailyRecord[] => {
    if (typeof window === "undefined") return [];
    const data = localStorage.getItem(RECORDS_KEY);
    return data ? JSON.parse(data) : [];
};

export const saveDailyRecord = (record: DailyRecord) => {
    const records = getDailyRecords();
    const index = records.findIndex(r => r.date === record.date);

    if (index >= 0) {
        records[index] = record;
    } else {
        records.push(record);
    }

    localStorage.setItem(RECORDS_KEY, JSON.stringify(records));
};

export const getRecordByDate = (date: string): DailyRecord | null => {
    const records = getDailyRecords();
    return records.find(r => r.date === date) || null;
};

export const toggleActionCompletion = (date: string, actionId: string) => {
    const record = getRecordByDate(date) || { date, completedActionIds: [] };
    const ids = record.completedActionIds;

    if (ids.includes(actionId)) {
        record.completedActionIds = ids.filter(id => id !== actionId);
    } else {
        record.completedActionIds = [...ids, actionId];
    }

    saveDailyRecord(record);
    return record;
};

// History management
const HISTORY_KEY = "vision3_history_v2";

export const getHistory = (): Goal[] => {
    if (typeof window === "undefined") return [];
    const data = localStorage.getItem(HISTORY_KEY);
    return data ? JSON.parse(data) : [];
};

export const archiveGoal = (goal: Goal) => {
    const history = getHistory();
    history.push(goal);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    localStorage.removeItem(GOAL_KEY);
    localStorage.removeItem(RECORDS_KEY);
};

// Vision Card management
const VISION_CARDS_KEY = "vision3_vision_cards_v2";

export const getVisionCards = (): VisionCard[] => {
    if (typeof window === "undefined") return [];
    const data = localStorage.getItem(VISION_CARDS_KEY);
    return data ? JSON.parse(data) : [];
};

export const saveVisionCard = (card: VisionCard) => {
    const cards = getVisionCards();
    const index = cards.findIndex(c => c.id === card.id);

    if (index >= 0) {
        cards[index] = card;
    } else {
        cards.push(card);
    }

    localStorage.setItem(VISION_CARDS_KEY, JSON.stringify(cards));
};

export const toggleVisionCardAchievement = (id: string) => {
    const cards = getVisionCards();
    const index = cards.findIndex(c => c.id === id);

    if (index >= 0) {
        cards[index].isAchieved = !cards[index].isAchieved;
        localStorage.setItem(VISION_CARDS_KEY, JSON.stringify(cards));
    }
};

export const deleteVisionCard = (id: string) => {
    const cards = getVisionCards();
    const filtered = cards.filter(c => c.id !== id);
    localStorage.setItem(VISION_CARDS_KEY, JSON.stringify(filtered));
};
