import { faker } from "@faker-js/faker";
import { Prisma, PrismaClient, QuizzSessionStatus, Role } from "@prisma/client";

const prisma = new PrismaClient();

type QuestionType = "rapport" | "degre" | "scale";

interface QuestionDefinition {
  key: string;
  criterionName: string;
  question: string;
  group: string;
  type: QuestionType;
}

const SCALE_CHOICES = [
  { choice: "pas du tout", note: 1 },
  { choice: "un peu", note: 2 },
  { choice: "neutre", note: 3 },
  { choice: "beaucoup", note: 4 },
  { choice: "adore", note: 5 },
];

const QUIZ_QUESTIONS: QuestionDefinition[] = [
  {
    key: "rapport_alcool",
    criterionName: "rapport_alcool",
    question: "Votre rapport a l'alcool",
    group: "Alcool",
    type: "rapport",
  },
  {
    key: "degre_alcool_prefere",
    criterionName: "degre_alcool_prefere",
    question: "Degre d'alcool prefere",
    group: "Alcool",
    type: "degre",
  },
  {
    key: "sucre",
    criterionName: "sucre",
    question: "Sucre",
    group: "Saveurs fondamentales",
    type: "scale",
  },
  {
    key: "acidule",
    criterionName: "acidule",
    question: "Acidule",
    group: "Saveurs fondamentales",
    type: "scale",
  },
  {
    key: "sale",
    criterionName: "sale",
    question: "Sale",
    group: "Saveurs fondamentales",
    type: "scale",
  },
  {
    key: "amer",
    criterionName: "amer",
    question: "Amer",
    group: "Saveurs fondamentales",
    type: "scale",
  },
  {
    key: "gras_huileux",
    criterionName: "gras_huileux",
    question: "Gras / huileux",
    group: "Saveurs fondamentales",
    type: "scale",
  },
  {
    key: "brule_fume",
    criterionName: "brule_fume",
    question: "Brule / fume",
    group: "Torrefie et Malte",
    type: "scale",
  },
  {
    key: "caramel",
    criterionName: "caramel",
    question: "Caramel",
    group: "Torrefie et Malte",
    type: "scale",
  },
  {
    key: "cereales_pain",
    criterionName: "cereales_pain",
    question: "Cereales / pain",
    group: "Torrefie et Malte",
    type: "scale",
  },
  {
    key: "noix_noisettes",
    criterionName: "noix_noisettes",
    question: "Noix / noisettes",
    group: "Torrefie et Malte",
    type: "scale",
  },
  {
    key: "rassis_levain",
    criterionName: "rassis_levain",
    question: "Rassis / levain",
    group: "Torrefie et Malte",
    type: "scale",
  },
  {
    key: "herbace",
    criterionName: "herbace",
    question: "Herbace",
    group: "Vegetal et Terroir",
    type: "scale",
  },
  {
    key: "resineux_pin",
    criterionName: "resineux_pin",
    question: "Resineux / pin",
    group: "Vegetal et Terroir",
    type: "scale",
  },
  {
    key: "soufre_oeuf",
    criterionName: "soufre_oeuf",
    question: "Soufre / oeuf",
    group: "Vegetal et Terroir",
    type: "scale",
  },
  {
    key: "houblon",
    criterionName: "houblon",
    question: "Houblon",
    group: "Houblon et Floral",
    type: "scale",
  },
  {
    key: "floral",
    criterionName: "floral",
    question: "Floral",
    group: "Houblon et Floral",
    type: "scale",
  },
  {
    key: "agrumes",
    criterionName: "agrumes",
    question: "Agrumes",
    group: "Fruite",
    type: "scale",
  },
  {
    key: "fruits_baie",
    criterionName: "fruits_baie",
    question: "Fruits a baie",
    group: "Fruite",
    type: "scale",
  },
  {
    key: "fruits_noyaux",
    criterionName: "fruits_noyaux",
    question: "Fruits a noyaux",
    group: "Fruite",
    type: "scale",
  },
  {
    key: "fruits_exotiques",
    criterionName: "fruits_exotiques",
    question: "Fruits exotiques",
    group: "Fruite",
    type: "scale",
  },
  {
    key: "fruits_tropicaux",
    criterionName: "fruits_tropicaux",
    question: "Fruits tropicaux",
    group: "Fruite",
    type: "scale",
  },
  {
    key: "alcool",
    criterionName: "alcool",
    question: "Alcool",
    group: "Corps et Alcool",
    type: "scale",
  },
  {
    key: "rondeur_corps",
    criterionName: "rondeur_corps",
    question: "Rondeur / corps",
    group: "Corps et Alcool",
    type: "scale",
  },
  {
    key: "petillant",
    criterionName: "petillant",
    question: "Petillant",
    group: "Corps et Alcool",
    type: "scale",
  },
];

const toDecimal = (value: number): Prisma.Decimal =>
  new Prisma.Decimal(value.toFixed(2));

const randomScore = (): Prisma.Decimal =>
  toDecimal(faker.number.float({ min: 1, max: 5, fractionDigits: 2 }));

const pickUniqueIndices = (maxExclusive: number, count: number): number[] => {
  const indices = new Set<number>();
  while (indices.size < count) {
    indices.add(faker.number.int({ min: 0, max: maxExclusive - 1 }));
  }
  return [...indices];
};

async function resetDatabase(): Promise<void> {
  await prisma.answerUser.deleteMany();
  await prisma.quizzSession.deleteMany();
  await prisma.questionChoice.deleteMany();
  await prisma.quizzQuestion.deleteMany();
  await prisma.quizz.deleteMany();
  await prisma.pairingByCategory.deleteMany();
  await prisma.pairing.deleteMany();
  await prisma.beerByCategory.deleteMany();
  await prisma.category.deleteMany();
  await prisma.rating.deleteMany();
  await prisma.beerRecommendedUser.deleteMany();
  await prisma.beerCriteria.deleteMany();
  await prisma.userCriteria.deleteMany();
  await prisma.criterion.deleteMany();
  await prisma.beerByBrewery.deleteMany();
  await prisma.beer.deleteMany();
  await prisma.brewery.deleteMany();
  await prisma.user.deleteMany();
}

async function main(): Promise<void> {
  faker.seed(2026);

  // ─── Users (upsert par mail) ─────────────────────────────────────────────
  const userDefs = [
    {
      name: "Admin",
      firstname: "System",
      mail: "admin@zythonomie.local",
      password: "password123",
      birthday: new Date("1990-01-10"),
      adress: "1 Rue de la Brasserie, Lille",
      role: Role.ADMIN,
    },
    {
      name: "Martin",
      firstname: "Luc",
      mail: "luc.martin@zythonomie.local",
      password: "password123",
      birthday: new Date("1995-03-04"),
      adress: "12 Avenue des Houblons, Lille",
      role: Role.USER,
    },
    {
      name: "Dupont",
      firstname: "Camille",
      mail: "camille.dupont@zythonomie.local",
      password: "password123",
      birthday: new Date("1998-06-18"),
      adress: "8 Rue des Malteries, Paris",
      role: Role.USER,
    },
    {
      name: "Bernard",
      firstname: "Nora",
      mail: "nora.bernard@zythonomie.local",
      password: "password123",
      birthday: new Date("1992-09-12"),
      adress: "31 Rue des Saveurs, Lyon",
      role: Role.USER,
    },
    {
      name: "Petit",
      firstname: "Yanis",
      mail: "yanis.petit@zythonomie.local",
      password: "password123",
      birthday: new Date("1996-12-02"),
      adress: "5 Quai des Bieres, Nantes",
      role: Role.USER,
    },
  ];

  const users = await Promise.all(
    userDefs.map((u) =>
      prisma.user.upsert({
        where: { mail: u.mail },
        update: {},
        create: u,
      }),
    ),
  );

  // ─── Breweries (upsert par name) ────────────────────────────────────────
  const breweryDefs = [
    {
      name: "Brasserie du Nord",
      description: "Brasserie artisanale orientee IPA et Pale Ale.",
      image: "https://images.example.com/brewery/nord.jpg",
      origin_date: new Date("2012-03-20"),
    },
    {
      name: "Les Malts de Loire",
      description: "Maison de brassage axee sur les recettes maltees.",
      image: "https://images.example.com/brewery/loire.jpg",
      origin_date: new Date("2008-11-14"),
    },
    {
      name: "Atelier des Houblons",
      description: "Brasserie experimentale aux aromes houblonnes.",
      image: "https://images.example.com/brewery/houblons.jpg",
      origin_date: new Date("2017-07-01"),
    },
  ];

  const breweries = await Promise.all(
    breweryDefs.map((b) =>
      prisma.brewery.upsert({
        where: { name: b.name },
        update: {},
        create: b,
      }),
    ),
  );

  // ─── Beers (upsert par EAN) ──────────────────────────────────────────────
  const beerDefs = [
    {
      name: "Blonde des Dunes",
      description: "Blonde legere aux notes florales.",
      alcool: true,
      percentage_alcool: toDecimal(4.8),
      EAN: 1001001,
      image: "https://images.example.com/beer/blonde-dunes.jpg",
    },
    {
      name: "IPA Cotiere",
      description: "IPA amere sur des notes d'agrumes.",
      alcool: true,
      percentage_alcool: toDecimal(6.3),
      EAN: 1001002,
      image: "https://images.example.com/beer/ipa-cotiere.jpg",
    },
    {
      name: "Session 0.9",
      description: "Biere tres faible en alcool, vive et petillante.",
      alcool: true,
      percentage_alcool: toDecimal(0.9),
      EAN: 1001003,
      image: "https://images.example.com/beer/session-09.jpg",
    },
    {
      name: "Rouge Levain",
      description: "Ambr ee malt ee avec une touche caramel.",
      alcool: true,
      percentage_alcool: toDecimal(5.5),
      EAN: 1001004,
      image: "https://images.example.com/beer/rouge-levain.jpg",
    },
    {
      name: "Stout Brulee",
      description: "Stout torrefiee, cafe et cacao.",
      alcool: true,
      percentage_alcool: toDecimal(7.8),
      EAN: 1001005,
      image: "https://images.example.com/beer/stout-brulee.jpg",
    },
    {
      name: "Wheat Citrus",
      description: "Blanche acidulee aux notes d'orange.",
      alcool: true,
      percentage_alcool: toDecimal(4.5),
      EAN: 1001006,
      image: "https://images.example.com/beer/wheat-citrus.jpg",
    },
    {
      name: "Zero Malt",
      description: "Biere sans alcool au profil cereales et pain.",
      alcool: false,
      percentage_alcool: toDecimal(0),
      EAN: 1001007,
      image: "https://images.example.com/beer/zero-malt.jpg",
    },
    {
      name: "Tropical Haze",
      description: "Hazy pale ale sur fruits tropicaux.",
      alcool: true,
      percentage_alcool: toDecimal(6.8),
      EAN: 1001008,
      image: "https://images.example.com/beer/tropical-haze.jpg",
    },
  ];

  const beers = await Promise.all(
    beerDefs.map((b) =>
      prisma.beer.upsert({
        where: { EAN: b.EAN },
        update: {},
        create: b,
      }),
    ),
  );

  // ─── Beer-Brewery links (createMany + skipDuplicates) ────────────────────
  await prisma.beerByBrewery.createMany({
    skipDuplicates: true,
    data: [
      { id_beer: beers[0].id, id_brewery: breweries[0].id },
      { id_beer: beers[1].id, id_brewery: breweries[0].id },
      { id_beer: beers[2].id, id_brewery: breweries[0].id },
      { id_beer: beers[3].id, id_brewery: breweries[1].id },
      { id_beer: beers[4].id, id_brewery: breweries[1].id },
      { id_beer: beers[5].id, id_brewery: breweries[2].id },
      { id_beer: beers[6].id, id_brewery: breweries[2].id },
      { id_beer: beers[7].id, id_brewery: breweries[2].id },
    ],
  });

  // ─── Categories (upsert par name) ───────────────────────────────────────
  const categoryAles = await prisma.category.upsert({
    where: { name: "Ales" },
    update: {},
    create: { name: "Ales", description: "Famille principale des ales." },
  });

  const categoryIpa = await prisma.category.upsert({
    where: { name: "IPA" },
    update: {},
    create: {
      id_parent_category: categoryAles.id,
      name: "IPA",
      description: "India Pale Ale, aromatique et houblonnee.",
    },
  });

  const categoryDark = await prisma.category.upsert({
    where: { name: "Brune et Stout" },
    update: {},
    create: {
      id_parent_category: categoryAles.id,
      name: "Brune et Stout",
      description: "Bieres torrefiees, malt ees et intenses.",
    },
  });

  // ─── Beer-Category links ─────────────────────────────────────────────────
  await prisma.beerByCategory.createMany({
    skipDuplicates: true,
    data: [
      { id_beer: beers[0].id, id_category: categoryAles.id },
      { id_beer: beers[1].id, id_category: categoryIpa.id },
      { id_beer: beers[2].id, id_category: categoryAles.id },
      { id_beer: beers[3].id, id_category: categoryAles.id },
      { id_beer: beers[4].id, id_category: categoryDark.id },
      { id_beer: beers[5].id, id_category: categoryAles.id },
      { id_beer: beers[6].id, id_category: categoryAles.id },
      { id_beer: beers[7].id, id_category: categoryIpa.id },
    ],
  });

  // ─── Pairings (upsert par name) ──────────────────────────────────────────
  const pairings = await Promise.all([
    prisma.pairing.upsert({
      where: { name: "Fromages affines" },
      update: {},
      create: {
        name: "Fromages affines",
        description: "Accords sur brunes, triples et ales de caractere.",
      },
    }),
    prisma.pairing.upsert({
      where: { name: "Poissons et agrumes" },
      update: {},
      create: {
        name: "Poissons et agrumes",
        description: "Accords sur blanches et bi eres acidulees.",
      },
    }),
  ]);

  await prisma.pairingByCategory.createMany({
    skipDuplicates: true,
    data: [
      { id_pairing: pairings[0].id, id_category: categoryDark.id },
      { id_pairing: pairings[0].id, id_category: categoryAles.id },
      { id_pairing: pairings[1].id, id_category: categoryIpa.id },
      { id_pairing: pairings[1].id, id_category: categoryAles.id },
    ],
  });

  // ─── Ratings (skip si deja present pour couple user-beer) ───────────────
  const ratingContents = [
    "Equilibree et facile a boire.",
    "Bonne intensite aromatique.",
    "Profil interessant mais un peu amer.",
    "Finale propre, tres agreable.",
    "Belle surprise sur la longueur.",
  ];
  faker.seed(2026);
  const ratingPairs = new Set<string>();
  const ratingAttempts = 40;
  for (let i = 0; i < ratingAttempts && ratingPairs.size < 18; i += 1) {
    const user = faker.helpers.arrayElement(users);
    const beer = faker.helpers.arrayElement(beers);
    const key = `${user.id}-${beer.id}`;
    if (ratingPairs.has(key)) continue;
    ratingPairs.add(key);
    const exists = await prisma.rating.findFirst({ where: { id_user: user.id, id_beer: beer.id } });
    if (!exists) {
      await prisma.rating.create({
        data: {
          id_user: user.id,
          id_beer: beer.id,
          content: faker.helpers.arrayElement(ratingContents),
          rate: faker.number.int({ min: 2, max: 5 }),
        },
      });
    }
  }

  // ─── Criteria (upsert par name) ─────────────────────────────────────────
  const criteriaByKey = new Map<string, number>();
  for (const q of QUIZ_QUESTIONS) {
    const criterion = await prisma.criterion.upsert({
      where: { name: q.criterionName },
      update: {},
      create: { name: q.criterionName, description: `Critere quiz - ${q.group}` },
    });
    criteriaByKey.set(q.key, criterion.id);
  }

  // ─── UserCriteria (upsert par id_user + id_criterion) ───────────────────
  faker.seed(2026);
  for (const user of users) {
    const selected = pickUniqueIndices(QUIZ_QUESTIONS.length, 8);
    for (const index of selected) {
      const question = QUIZ_QUESTIONS[index];
      const criterionId = criteriaByKey.get(question.key);
      if (!criterionId) continue;
      await prisma.userCriteria.upsert({
        where: { id_user_id_criterion: { id_user: user.id, id_criterion: criterionId } },
        update: {},
        create: { id_user: user.id, id_criterion: criterionId, score: randomScore() },
      });
    }
  }

  // ─── BeerCriteria (upsert par id_beer + id_criterion) ───────────────────
  for (const beer of beers) {
    for (const question of QUIZ_QUESTIONS) {
      const criterionId = criteriaByKey.get(question.key);
      if (!criterionId) continue;
      await prisma.beerCriteria.upsert({
        where: { id_beer_id_criterion: { id_beer: beer.id, id_criterion: criterionId } },
        update: {},
        create: { id_beer: beer.id, id_criterion: criterionId, score: randomScore() },
      });
    }
  }

  // ─── Recommendations (upsert par id_user + id_beer) ────────────────────
  faker.seed(2026);
  const recommendationPairs = new Set<string>();
  let attempts = 0;
  while (recommendationPairs.size < 10 && attempts < 100) {
    attempts += 1;
    const user = faker.helpers.arrayElement(users);
    const beer = faker.helpers.arrayElement(beers);
    const key = `${user.id}-${beer.id}`;
    if (recommendationPairs.has(key)) continue;
    recommendationPairs.add(key);
    await prisma.beerRecommendedUser.upsert({
      where: { id_user_id_beer: { id_user: user.id, id_beer: beer.id } },
      update: {},
      create: { id_user: user.id, id_beer: beer.id, score_compatibility: randomScore() },
    });
  }

  // ─── Quiz (upsert par name) ──────────────────────────────────────────────
  const quiz = await prisma.quizz.upsert({
    where: { name: "Quiz Preference Bieres" },
    update: {},
    create: {
      name: "Quiz Preference Bieres",
      description: "Questionnaire sensoriel pour recommander des bieres.",
    },
  });

  // ─── QuizzQuestions + QuestionChoices (idempotent par criterion+quiz) ───
  const questionChoiceMap = new Map<number, number[]>();
  const orderedQuestionIds: number[] = [];

  for (const question of QUIZ_QUESTIONS) {
    const criterionId = criteriaByKey.get(question.key);
    if (!criterionId) continue;

    let createdQuestion = await prisma.quizzQuestion.findFirst({
      where: { id_criterion: criterionId, id_quizz: quiz.id },
      select: { id: true },
    });
    if (!createdQuestion) {
      createdQuestion = await prisma.quizzQuestion.create({
        data: { id_criterion: criterionId, id_quizz: quiz.id, question: question.question },
        select: { id: true },
      });
    }

    orderedQuestionIds.push(createdQuestion.id);

    const existingChoices = await prisma.questionChoice.findMany({
      where: { id_quizz_question: createdQuestion.id },
      select: { id: true },
    });

    if (existingChoices.length > 0) {
      questionChoiceMap.set(createdQuestion.id, existingChoices.map((c) => c.id));
      continue;
    }

    let newChoices: { id: number }[] = [];
    if (question.type === "rapport") {
      newChoices = await Promise.all([
        prisma.questionChoice.create({ data: { id_quizz_question: createdQuestion.id, choice: "0%", note_value: 0 } }),
        prisma.questionChoice.create({ data: { id_quizz_question: createdQuestion.id, choice: "inferieur a 1%", note_value: 1 } }),
        prisma.questionChoice.create({ data: { id_quizz_question: createdQuestion.id, choice: "avec alcool", note_value: 2 } }),
      ]);
    } else if (question.type === "degre") {
      newChoices = await Promise.all([
        prisma.questionChoice.create({ data: { id_quizz_question: createdQuestion.id, choice: "Tous", note_value: 3 } }),
        prisma.questionChoice.create({ data: { id_quizz_question: createdQuestion.id, choice: "<5%", note_value: 2 } }),
        prisma.questionChoice.create({ data: { id_quizz_question: createdQuestion.id, choice: "5-7%", note_value: 4 } }),
        prisma.questionChoice.create({ data: { id_quizz_question: createdQuestion.id, choice: ">7%", note_value: 5 } }),
      ]);
    } else {
      newChoices = await Promise.all(
        SCALE_CHOICES.map((scaleChoice) =>
          prisma.questionChoice.create({
            data: { id_quizz_question: createdQuestion.id, choice: scaleChoice.choice, note_value: scaleChoice.note },
          }),
        ),
      );
    }
    questionChoiceMap.set(createdQuestion.id, newChoices.map((c) => c.id));
  }

  // ─── QuizzSessions (creer seulement si absentes pour cet user+quiz) ─────
  async function ensureSession(userId: number, status: QuizzSessionStatus, startedAgo: number, duration: number | null) {
    const existing = await prisma.quizzSession.findFirst({ where: { id_user: userId, id_quizz: quiz.id, status } });
    if (existing) return existing;
    return prisma.quizzSession.create({
      data: {
        id_user: userId,
        id_quizz: quiz.id,
        status,
        started_at: new Date(Date.now() - startedAgo),
        completed_at: duration !== null ? new Date(Date.now() - startedAgo + duration) : null,
      },
    });
  }

  const sessions = await Promise.all([
    ensureSession(users[1].id, QuizzSessionStatus.COMPLETED, 2 * 24 * 60 * 60 * 1000, 25 * 60 * 1000),
    ensureSession(users[2].id, QuizzSessionStatus.COMPLETED, 24 * 60 * 60 * 1000, 20 * 60 * 1000),
    ensureSession(users[3].id, QuizzSessionStatus.ABANDONED, 12 * 60 * 60 * 1000, null),
  ]);

  // ─── AnswerUser (findFirst + create si absent) ───────────────────────────
  for (const questionId of orderedQuestionIds) {
    const choices = questionChoiceMap.get(questionId);
    if (!choices || choices.length === 0) continue;
    const choiceId = faker.helpers.arrayElement(choices);
    const exists = await prisma.answerUser.findFirst({ where: { id_quizz_session: sessions[0].id, id_question_choice: choiceId } });
    if (!exists) {
      await prisma.answerUser.create({ data: { id_quizz_session: sessions[0].id, id_question_choice: choiceId } });
    }
  }

  for (const questionId of orderedQuestionIds) {
    const choices = questionChoiceMap.get(questionId);
    if (!choices || choices.length === 0) continue;
    const choiceId = faker.helpers.arrayElement(choices);
    const exists = await prisma.answerUser.findFirst({ where: { id_quizz_session: sessions[1].id, id_question_choice: choiceId } });
    if (!exists) {
      await prisma.answerUser.create({ data: { id_quizz_session: sessions[1].id, id_question_choice: choiceId } });
    }
  }

  for (const questionId of orderedQuestionIds.slice(0, 10)) {
    const choices = questionChoiceMap.get(questionId);
    if (!choices || choices.length === 0) continue;
    const choiceId = faker.helpers.arrayElement(choices);
    const exists = await prisma.answerUser.findFirst({ where: { id_quizz_session: sessions[2].id, id_question_choice: choiceId } });
    if (!exists) {
      await prisma.answerUser.create({ data: { id_quizz_session: sessions[2].id, id_question_choice: choiceId } });
    }
  }

  const questionCount = await prisma.quizzQuestion.count({ where: { id_quizz: quiz.id } });
  const choiceCount = await prisma.questionChoice.count({ where: { quizzQuestion: { id_quizz: quiz.id } } });

  console.log("Seed termine avec succes.");
  console.log(`Users: ${users.length}`);
  console.log(`Bieres: ${beers.length}`);
  console.log(`Crit eres: ${QUIZ_QUESTIONS.length}`);
  console.log(`Questions quiz: ${questionCount}`);
  console.log(`Choix quiz: ${choiceCount}`);
}

main()
  .catch((error) => {
    console.error("Erreur pendant le seed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
