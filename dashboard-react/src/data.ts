export type Role = "super" | "gymAdmin" | "trainer" | "client";

export interface Gym {
  id: string;
  nameAr: string;
  nameEn: string;
  initial: string;
  city: string;
  accent: string;
  plan: "أساسي" | "احترافي" | "مؤسسي";
  members: number;
  trainersCount: number;
  mrr: number;
  growth: number;
  active: boolean;
  joined: string;
  retention: number;
}

export const GYMS: Gym[] = [
  { id: "g1", nameAr: "تيتان جيم", nameEn: "Titan Gym", initial: "ت", city: "الرياض", accent: "#FF8A3C", plan: "مؤسسي", members: 1240, trainersCount: 14, mrr: 48500, growth: 18.2, active: true, joined: "2023-03", retention: 91 },
  { id: "g2", nameAr: "نبض فتنس", nameEn: "Pulse Fitness", initial: "ن", city: "جدة", accent: "#45D6C0", plan: "احترافي", members: 620, trainersCount: 8, mrr: 23900, growth: 11.6, active: true, joined: "2023-07", retention: 87 },
  { id: "g3", nameAr: "بيت الحديد", nameEn: "Iron House", initial: "ح", city: "الدمام", accent: "#F4727F", plan: "احترافي", members: 445, trainersCount: 6, mrr: 17200, growth: -3.4, active: true, joined: "2024-01", retention: 79 },
  { id: "g4", nameAr: "كور ستوديو", nameEn: "Core Studio", initial: "ك", city: "الخبر", accent: "#C6F24E", plan: "أساسي", members: 210, trainersCount: 3, mrr: 8400, growth: 24.9, active: true, joined: "2024-05", retention: 93 },
  { id: "g5", nameAr: "القمة فتنس", nameEn: "Summit Fitness", initial: "ق", city: "مكة المكرمة", accent: "#7FB4FF", plan: "أساسي", members: 168, trainersCount: 2, mrr: 6100, growth: 5.1, active: false, joined: "2024-09", retention: 74 },
];

export interface Trainer {
  id: string;
  name: string;
  gymId: string;
  employeeId: string;
  spec: string[];
  certs: string[];
  clients: number;
  maxClients: number;
  sessionsMonth: number;
  rating: number;
  hireDate: string;
  rate: number;
  active: boolean;
}

export const TRAINERS: Trainer[] = [
  { id: "t1", name: "كابتن فهد العتيبي", gymId: "g1", employeeId: "T-1042", spec: ["قوة", "تضخيم"], certs: ["NASM-CPT", "Precision Nutrition L1"], clients: 26, maxClients: 30, sessionsMonth: 96, rating: 4.9, hireDate: "2022-06", rate: 85, active: true },
  { id: "t2", name: "كابتن سارة المطيري", gymId: "g1", employeeId: "T-1077", spec: ["تخسيس", "تغذية"], certs: ["ISSA-CPT", "PN L2"], clients: 31, maxClients: 35, sessionsMonth: 112, rating: 4.8, hireDate: "2021-11", rate: 90, active: true },
  { id: "t3", name: "كابتن خالد الشهري", gymId: "g1", employeeId: "T-1103", spec: ["كروس فت", "تحمل"], certs: ["CF-L2"], clients: 19, maxClients: 30, sessionsMonth: 74, rating: 4.6, hireDate: "2023-02", rate: 75, active: true },
  { id: "t4", name: "كابتن نورة القحطاني", gymId: "g2", employeeId: "T-2011", spec: ["يوغا", "مرونة"], certs: ["RYT-200"], clients: 22, maxClients: 25, sessionsMonth: 88, rating: 4.9, hireDate: "2022-09", rate: 80, active: true },
  { id: "t5", name: "كابتن عبدالله الدوسري", gymId: "g2", employeeId: "T-2034", spec: ["قوة", "باورلفتينغ"], certs: ["NSCA-CSCS"], clients: 17, maxClients: 30, sessionsMonth: 61, rating: 4.5, hireDate: "2023-06", rate: 70, active: true },
  { id: "t6", name: "كابتن ريم السبيعي", gymId: "g3", employeeId: "T-3007", spec: ["تأهيل", "كاردو"], certs: ["ACE-CPT"], clients: 14, maxClients: 25, sessionsMonth: 42, rating: 4.3, hireDate: "2024-01", rate: 65, active: false },
];

export interface Client {
  id: string;
  name: string;
  gymId: string;
  trainerId: string;
  membership: "basic" | "premium" | "vip" | "trial";
  membershipEnd: string;
  goals: string[];
  weight: number;
  startWeight: number;
  targetWeight: number;
  adherence: number;
  lastWorkout: string;
  streak: number;
  joinedWeeks: number;
}

export const MEMBERSHIP_LABEL: Record<Client["membership"], string> = {
  basic: "أساسية", premium: "بريميوم", vip: "VIP", trial: "تجريبية",
};

export const CLIENTS: Client[] = [
  { id: "c1", name: "محمد السالم", gymId: "g1", trainerId: "t1", membership: "vip", membershipEnd: "2026-08-14", goals: ["تضخيم", "قوة"], weight: 84.2, startWeight: 76.0, targetWeight: 88, adherence: 92, lastWorkout: "اليوم", streak: 12, joinedWeeks: 20 },
  { id: "c2", name: "عبدالعزيز الحربي", gymId: "g1", trainerId: "t1", membership: "premium", membershipEnd: "2026-04-02", goals: ["تخسيس"], weight: 91.4, startWeight: 103.5, targetWeight: 85, adherence: 84, lastWorkout: "أمس", streak: 7, joinedWeeks: 14 },
  { id: "c3", name: "لمى العنزي", gymId: "g1", trainerId: "t2", membership: "premium", membershipEnd: "2026-05-30", goals: ["تخسيس", "شد الجسم"], weight: 63.8, startWeight: 71.2, targetWeight: 60, adherence: 88, lastWorkout: "اليوم", streak: 9, joinedWeeks: 11 },
  { id: "c4", name: "تركي الغامدي", gymId: "g1", trainerId: "t1", membership: "basic", membershipEnd: "2026-03-18", goals: ["قوة"], weight: 78.9, startWeight: 74.4, targetWeight: 82, adherence: 71, lastWorkout: "منذ 3 أيام", streak: 0, joinedWeeks: 8 },
  { id: "c5", name: "هيا الشمري", gymId: "g1", trainerId: "t2", membership: "trial", membershipEnd: "2026-02-25", goals: ["لياقة عامة"], weight: 58.3, startWeight: 60.1, targetWeight: 57, adherence: 65, lastWorkout: "أمس", streak: 4, joinedWeeks: 3 },
  { id: "c6", name: "بدر الشهراني", gymId: "g1", trainerId: "t3", membership: "premium", membershipEnd: "2026-07-09", goals: ["تحمل", "كروس فت"], weight: 82.0, startWeight: 86.8, targetWeight: 80, adherence: 90, lastWorkout: "اليوم", streak: 15, joinedWeeks: 17 },
  { id: "c7", name: "جود المالكي", gymId: "g2", trainerId: "t4", membership: "vip", membershipEnd: "2026-09-01", goals: ["مرونة", "تأهيل"], weight: 55.1, startWeight: 57.0, targetWeight: 55, adherence: 95, lastWorkout: "اليوم", streak: 21, joinedWeeks: 26 },
  { id: "c8", name: "راكان العتيق", gymId: "g2", trainerId: "t5", membership: "basic", membershipEnd: "2026-03-11", goals: ["باورلفتينغ"], weight: 95.7, startWeight: 90.2, targetWeight: 100, adherence: 78, lastWorkout: "أمس", streak: 5, joinedWeeks: 10 },
];

export interface Exercise {
  id: string;
  nameAr: string;
  nameEn: string;
  muscle: string;
  equipment: string;
  difficulty: "مبتدئ" | "متوسط" | "متقدم";
  defaultSets: number;
  defaultReps: string;
}

export const MUSCLES = ["صدر", "ظهر", "أرجل", "كتف", "ذراعين", "بطن", "كامل الجسم"] as const;

export const EXERCISES: Exercise[] = [
  { id: "e1", nameAr: "بنش برس بالبار", nameEn: "Barbell Bench Press", muscle: "صدر", equipment: "أثقال حرة", difficulty: "متوسط", defaultSets: 4, defaultReps: "8-10" },
  { id: "e2", nameAr: "تفتيف دمبل مائل", nameEn: "Incline DB Fly", muscle: "صدر", equipment: "أثقال حرة", difficulty: "مبتدئ", defaultSets: 3, defaultReps: "10-12" },
  { id: "e3", nameAr: "ضغط كابل علوي", nameEn: "Cable Crossover", muscle: "صدر", equipment: "كابل", difficulty: "مبتدئ", defaultSets: 3, defaultReps: "12-15" },
  { id: "e4", nameAr: "ديدلفت روماني", nameEn: "Romanian Deadlift", muscle: "ظهر", equipment: "أثقال حرة", difficulty: "متقدم", defaultSets: 4, defaultReps: "6-8" },
  { id: "e5", nameAr: "تجديف بالبار", nameEn: "Barbell Row", muscle: "ظهر", equipment: "أثقال حرة", difficulty: "متوسط", defaultSets: 4, defaultReps: "8-10" },
  { id: "e6", nameAr: "سحب أرضي كابل", nameEn: "Seated Cable Row", muscle: "ظهر", equipment: "كابل", difficulty: "مبتدئ", defaultSets: 3, defaultReps: "10-12" },
  { id: "e7", nameAr: "عقلة واسعة", nameEn: "Wide Pull-up", muscle: "ظهر", equipment: "وزن الجسم", difficulty: "متوسط", defaultSets: 3, defaultReps: "فشل" },
  { id: "e8", nameAr: "سكوات بالبار", nameEn: "Barbell Squat", muscle: "أرجل", equipment: "أثقال حرة", difficulty: "متقدم", defaultSets: 4, defaultReps: "6-8" },
  { id: "e9", nameAr: "رفعة سمانة واقف", nameEn: "Standing Calf Raise", muscle: "أرجل", equipment: "آلات", difficulty: "مبتدئ", defaultSets: 4, defaultReps: "15-20" },
  { id: "e10", nameAr: "لانجز مشي", nameEn: "Walking Lunges", muscle: "أرجل", equipment: "أثقال حرة", difficulty: "متوسط", defaultSets: 3, defaultReps: "12 لكل رجل" },
  { id: "e11", nameAr: "رفعة حوض بالبار", nameEn: "Barbell Hip Thrust", muscle: "أرجل", equipment: "أثقال حرة", difficulty: "متوسط", defaultSets: 4, defaultReps: "10-12" },
  { id: "e12", nameAr: "ضغط كتف بالدمبل", nameEn: "DB Shoulder Press", muscle: "كتف", equipment: "أثقال حرة", difficulty: "متوسط", defaultSets: 4, defaultReps: "8-10" },
  { id: "e13", nameAr: "رفرفة جانبية", nameEn: "Lateral Raise", muscle: "كتف", equipment: "أثقال حرة", difficulty: "مبتدئ", defaultSets: 4, defaultReps: "12-15" },
  { id: "e14", nameAr: "سحبة وجه بالكابل", nameEn: "Face Pull", muscle: "كتف", equipment: "كابل", difficulty: "مبتدئ", defaultSets: 3, defaultReps: "15" },
  { id: "e15", nameAr: "مرجحة بايسبس بالبار", nameEn: "Barbell Curl", muscle: "ذراعين", equipment: "أثقال حرة", difficulty: "مبتدئ", defaultSets: 3, defaultReps: "10-12" },
  { id: "e16", nameAr: "تمديد ترايسبس كابل", nameEn: "Triceps Rope Pushdown", muscle: "ذراعين", equipment: "كابل", difficulty: "مبتدئ", defaultSets: 3, defaultReps: "12-15" },
  { id: "e17", nameAr: "مرجحة مطرقة", nameEn: "Hammer Curl", muscle: "ذراعين", equipment: "أثقال حرة", difficulty: "مبتدئ", defaultSets: 3, defaultReps: "10-12" },
  { id: "e18", nameAr: "كرانش بالكابل", nameEn: "Cable Crunch", muscle: "بطن", equipment: "كابل", difficulty: "مبتدئ", defaultSets: 3, defaultReps: "15-20" },
  { id: "e19", nameAr: "رفع أرجل معلق", nameEn: "Hanging Leg Raise", muscle: "بطن", equipment: "وزن الجسم", difficulty: "متوسط", defaultSets: 3, defaultReps: "10-12" },
  { id: "e20", nameAr: "بلانك", nameEn: "Plank", muscle: "بطن", equipment: "وزن الجسم", difficulty: "مبتدئ", defaultSets: 3, defaultReps: "60 ثانية" },
  { id: "e21", nameAr: "ثرسترز بالدمبل", nameEn: "DB Thrusters", muscle: "كامل الجسم", equipment: "أثقال حرة", difficulty: "متقدم", defaultSets: 4, defaultReps: "10" },
  { id: "e22", nameAr: "بيربي", nameEn: "Burpees", muscle: "كامل الجسم", equipment: "وزن الجسم", difficulty: "متوسط", defaultSets: 3, defaultReps: "15" },
  { id: "e23", nameAr: "سوينغ kettlebell", nameEn: "KB Swing", muscle: "كامل الجسم", equipment: "أثقال حرة", difficulty: "متوسط", defaultSets: 4, defaultReps: "20" },
  { id: "e24", nameAr: "مشية المزارع", nameEn: "Farmer's Walk", muscle: "كامل الجسم", equipment: "أثقال حرة", difficulty: "مبتدئ", defaultSets: 3, defaultReps: "40 متر" },
];

export interface Food {
  id: string;
  nameAr: string;
  category: string;
  cal: number;
  protein: number;
  carbs: number;
  fat: number;
  serving: string;
}

export const FOODS: Food[] = [
  { id: "f1", nameAr: "صدر دجاج مشوي", category: "بروتين", cal: 165, protein: 31, carbs: 0, fat: 3.6, serving: "100غ" },
  { id: "f2", nameAr: "أرز بسمتي مطبوخ", category: "كربوهيدرات", cal: 130, protein: 2.7, carbs: 28, fat: 0.3, serving: "100غ" },
  { id: "f3", nameAr: "كبسة دجاج", category: "وجبات", cal: 210, protein: 12, carbs: 24, fat: 8, serving: "100غ" },
  { id: "f4", nameAr: "تمر سكري", category: "فواكه", cal: 277, protein: 1.8, carbs: 75, fat: 0.2, serving: "100غ" },
  { id: "f5", nameAr: "لبن زبادي يوناني", category: "بروتين", cal: 97, protein: 9, carbs: 3.9, fat: 5, serving: "100غ" },
  { id: "f6", nameAr: "شوفان", category: "كربوهيدرات", cal: 389, protein: 16.9, carbs: 66, fat: 6.9, serving: "100غ" },
  { id: "f7", nameAr: "بيض مسلوق", category: "بروتين", cal: 155, protein: 13, carbs: 1.1, fat: 11, serving: "100غ" },
  { id: "f8", nameAr: "سمك سلمون مشوي", category: "بروتين", cal: 208, protein: 20, carbs: 0, fat: 13, serving: "100غ" },
  { id: "f9", nameAr: "برغل مطبوخ", category: "كربوهيدرات", cal: 83, protein: 3.1, carbs: 19, fat: 0.2, serving: "100غ" },
  { id: "f10", nameAr: "سلطة فتوش", category: "خضار", cal: 45, protein: 1.5, carbs: 6, fat: 2, serving: "100غ" },
  { id: "f11", nameAr: "حمص بالطحينة", category: "بروتين", cal: 166, protein: 8, carbs: 14, fat: 9.6, serving: "100غ" },
  { id: "f12", nameAr: "خبز بر أسمر", category: "كربوهيدرات", cal: 247, protein: 13, carbs: 41, fat: 3.4, serving: "100غ" },
  { id: "f13", nameAr: "لحم غنم هبر مشوي", category: "بروتين", cal: 258, protein: 25, carbs: 0, fat: 17, serving: "100غ" },
  { id: "f14", nameAr: "موز", category: "فواكه", cal: 89, protein: 1.1, carbs: 23, fat: 0.3, serving: "100غ" },
  { id: "f15", nameAr: "لوز نيء", category: "دهون", cal: 579, protein: 21, carbs: 22, fat: 50, serving: "100غ" },
  { id: "f16", nameAr: "جبن قريش", category: "بروتين", cal: 98, protein: 11, carbs: 3.4, fat: 4.3, serving: "100غ" },
  { id: "f17", nameAr: "بطاطا حلوة مشوية", category: "كربوهيدرات", cal: 90, protein: 2, carbs: 21, fat: 0.1, serving: "100غ" },
  { id: "f18", nameAr: "واي بروتين سكوب", category: "مكملات", cal: 120, protein: 24, carbs: 3, fat: 1.5, serving: "سكوب" },
  { id: "f19", nameAr: "زبدة فول سوداني", category: "دهون", cal: 588, protein: 25, carbs: 20, fat: 50, serving: "100غ" },
  { id: "f20", nameAr: "بروكلي مسلوق", category: "خضار", cal: 35, protein: 2.4, carbs: 7, fat: 0.4, serving: "100غ" },
];

export interface PlanExercise { exId: string; sets: number; reps: string; rest: number; }
export interface PlanDay { name: string; focus: string; exercises: PlanExercise[]; }

export const WORKOUT_TEMPLATE: { name: string; level: string; goal: string; weeks: number; days: PlanDay[] } = {
  name: "خطة التضخيم — دفع/سحب/أرجل",
  level: "متوسط",
  goal: "تضخيم",
  weeks: 8,
  days: [
    {
      name: "اليوم ١", focus: "دفع — صدر وكتف وترايسبس",
      exercises: [
        { exId: "e1", sets: 4, reps: "8-10", rest: 120 },
        { exId: "e2", sets: 3, reps: "10-12", rest: 90 },
        { exId: "e12", sets: 4, reps: "8-10", rest: 90 },
        { exId: "e13", sets: 4, reps: "12-15", rest: 60 },
        { exId: "e16", sets: 3, reps: "12-15", rest: 60 },
      ],
    },
    {
      name: "اليوم ٢", focus: "سحب — ظهر وبايسبس",
      exercises: [
        { exId: "e4", sets: 4, reps: "6-8", rest: 150 },
        { exId: "e5", sets: 4, reps: "8-10", rest: 120 },
        { exId: "e7", sets: 3, reps: "فشل", rest: 120 },
        { exId: "e14", sets: 3, reps: "15", rest: 60 },
        { exId: "e15", sets: 3, reps: "10-12", rest: 60 },
      ],
    },
    {
      name: "اليوم ٣", focus: "أرجل وبطن",
      exercises: [
        { exId: "e8", sets: 4, reps: "6-8", rest: 180 },
        { exId: "e11", sets: 4, reps: "10-12", rest: 120 },
        { exId: "e10", sets: 3, reps: "12 لكل رجل", rest: 90 },
        { exId: "e9", sets: 4, reps: "15-20", rest: 60 },
        { exId: "e19", sets: 3, reps: "10-12", rest: 60 },
      ],
    },
    {
      name: "اليوم ٤", focus: "كامل الجسم + شرطية",
      exercises: [
        { exId: "e21", sets: 4, reps: "10", rest: 90 },
        { exId: "e23", sets: 4, reps: "20", rest: 60 },
        { exId: "e22", sets: 3, reps: "15", rest: 60 },
        { exId: "e24", sets: 3, reps: "40 متر", rest: 90 },
      ],
    },
  ],
};

export interface MealItem { foodId: string; grams: number; }
export interface Meal { name: string; time: string; items: MealItem[]; }

export const MEAL_TEMPLATE: { name: string; goal: string; targets: { cal: number; protein: number; carbs: number; fat: number }; meals: Meal[] } = {
  name: "خطة تضخيم نظيف — 2800 سعرة",
  goal: "تضخيم",
  targets: { cal: 2800, protein: 180, carbs: 350, fat: 80 },
  meals: [
    { name: "فطور", time: "7:00 ص", items: [{ foodId: "f6", grams: 80 }, { foodId: "f7", grams: 120 }, { foodId: "f14", grams: 100 }] },
    { name: "سناك صباحي", time: "10:30 ص", items: [{ foodId: "f5", grams: 200 }, { foodId: "f15", grams: 30 }] },
    { name: "غداء", time: "1:30 م", items: [{ foodId: "f1", grams: 200 }, { foodId: "f2", grams: 250 }, { foodId: "f10", grams: 150 }] },
    { name: "قبل التمرين", time: "5:00 م", items: [{ foodId: "f4", grams: 50 }, { foodId: "f18", grams: 30 }] },
    { name: "عشاء", time: "9:00 م", items: [{ foodId: "f8", grams: 180 }, { foodId: "f17", grams: 200 }, { foodId: "f20", grams: 120 }] },
  ],
};

/* ---- series ---- */
export const WEIGHT_SERIES = [91.5, 91.1, 90.6, 90.8, 90.0, 89.3, 88.7, 88.9, 88.1, 87.4, 86.8, 86.2];
export const REVENUE_SERIES = [62, 68, 71, 79, 84, 88, 95, 101, 98, 108, 114, 122];
export const SESSIONS_WEEK = [
  { day: "السبت", v: 184 }, { day: "الأحد", v: 216 }, { day: "الاثنين", v: 198 },
  { day: "الثلاثاء", v: 231 }, { day: "الأربعاء", v: 205 }, { day: "الخميس", v: 152 }, { day: "الجمعة", v: 96 },
];
export const GOAL_MIX = [
  { label: "تخسيس", value: 38, color: "#FF8A3C" },
  { label: "تضخيم", value: 27, color: "#C6F24E" },
  { label: "قوة", value: 16, color: "#45D6C0" },
  { label: "لياقة عامة", value: 12, color: "#7FB4FF" },
  { label: "تأهيل", value: 7, color: "#F4727F" },
];

export interface Checkin {
  week: string; weight: number; energy: number; sleep: number; stress: number; adherence: number; note: string; feedback: string;
}
export const CHECKINS: Checkin[] = [
  { week: "قبل أسبوعين", weight: 87.4, energy: 3, sleep: 3, stress: 4, adherence: 80, note: "ضغط شغل، نوم متأخر", feedback: "خففنا الكارديو وركزنا على الأساسيات" },
  { week: "الأسبوع الماضي", weight: 86.8, energy: 4, sleep: 4, stress: 3, adherence: 88, note: "تحسن النوم كثيراً", feedback: "ممتاز! زدنا أحمال السكوات 2.5كغ" },
  { week: "هذا الأسبوع", weight: 86.2, energy: 4, sleep: 4, stress: 2, adherence: 92, note: "التزام كامل بالخطة", feedback: "استمر، الجمعة راحة نشطة فقط" },
];

export interface Goal { label: string; target: string; current: string; pct: number; status: "نشط" | "محقق" | "متأخر"; }
export const GOALS: Goal[] = [
  { label: "الوصول لوزن 85 كغ", target: "85.0", current: "86.2", pct: 82, status: "نشط" },
  { label: "سكوات 140 كغ", target: "140", current: "122.5", pct: 68, status: "نشط" },
  { label: "نسبة دهون 15%", target: "15", current: "17.8", pct: 74, status: "نشط" },
  { label: "10,000 خطوة يومياً", target: "10k", current: "10.4k", pct: 100, status: "محقق" },
];

export const ACTIVITY = [
  { icon: "userPlus", text: "انضم متدرب جديد «فيصل النمر» إلى تيتان جيم", time: "منذ 4 دقائق", tone: "mint" },
  { icon: "dumbbell", text: "أنهى محمد السالم تمرين «دفع» بتقييم 5/5", time: "منذ 18 دقيقة", tone: "brand" },
  { icon: "palette", text: "نبض فتنس حدّث ألوان علامته التجارية", time: "منذ ساعة", tone: "ember" },
  { icon: "apple", text: "كابتن سارة خصصت خطة تغذية جديدة لـ «لمى»", time: "منذ ساعتين", tone: "mint" },
  { icon: "chart", text: "تقرير الاحتفاظ الشهري جاهز للمراجعة", time: "منذ 3 ساعات", tone: "sky" },
  { icon: "shield", text: "نسخة احتياطية تلقائية اكتملت (قاعدة البيانات)", time: "منذ 5 ساعات", tone: "moss" },
];

export const fmt = (n: number) => n.toLocaleString("en-US");
export const money = (n: number) => `${n.toLocaleString("en-US")} ر.س`;
