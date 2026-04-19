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

  await resetDatabase();

  const users = await Promise.all([
    prisma.user.create({
      data: {
        name: "Admin",
        firstname: "System",
        mail: "admin@zythonomie.local",
        password: "password123",
        birthday: new Date("1990-01-10"),
        adress: "1 Rue de la Brasserie, Lille",
        role: Role.ADMIN,
      },
    }),
    prisma.user.create({
      data: {
        name: "Martin",
        firstname: "Luc",
        mail: "luc.martin@zythonomie.local",
        password: "password123",
        birthday: new Date("1995-03-04"),
        adress: "12 Avenue des Houblons, Lille",
        role: Role.USER,
      },
    }),
    prisma.user.create({
      data: {
        name: "Dupont",
        firstname: "Camille",
        mail: "camille.dupont@zythonomie.local",
        password: "password123",
        birthday: new Date("1998-06-18"),
        adress: "8 Rue des Malteries, Paris",
        role: Role.USER,
      },
    }),
    prisma.user.create({
      data: {
        name: "Bernard",
        firstname: "Nora",
        mail: "nora.bernard@zythonomie.local",
        password: "password123",
        birthday: new Date("1992-09-12"),
        adress: "31 Rue des Saveurs, Lyon",
        role: Role.USER,
      },
    }),
    prisma.user.create({
      data: {
        name: "Petit",
        firstname: "Yanis",
        mail: "yanis.petit@zythonomie.local",
        password: "password123",
        birthday: new Date("1996-12-02"),
        adress: "5 Quai des Bieres, Nantes",
        role: Role.USER,
      },
    }),
  ]);

  const breweries = await Promise.all([
    prisma.brewery.create({
      data: {
        name: "Brasserie du Nord",
        description: "Brasserie artisanale orientee IPA et Pale Ale.",
        image: "https://images.example.com/brewery/nord.jpg",
        origin_date: new Date("2012-03-20"),
      },
    }),
    prisma.brewery.create({
      data: {
        name: "Les Malts de Loire",
        description: "Maison de brassage axee sur les recettes maltees.",
        image: "https://images.example.com/brewery/loire.jpg",
        origin_date: new Date("2008-11-14"),
      },
    }),
    prisma.brewery.create({
      data: {
        name: "Atelier des Houblons",
        description: "Brasserie experimentale aux aromes houblonnes.",
        image: "https://images.example.com/brewery/houblons.jpg",
        origin_date: new Date("2017-07-01"),
      },
    }),
  ]);

  const beerData = [
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

  const beers = await Promise.all(beerData.map((beer) => prisma.beer.create({ data: beer })));

  await prisma.beerByBrewery.createMany({
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

  const categoryAles = await prisma.category.create({
    data: {
      name: "Ales",
      description: "Famille principale des ales.",
    },
  });

  const categoryIpa = await prisma.category.create({
    data: {
      id_parent_category: categoryAles.id,
      name: "IPA",
      description: "India Pale Ale, aromatique et houblonnee.",
    },
  });

  const categoryDark = await prisma.category.create({
    data: {
      id_parent_category: categoryAles.id,
      name: "Brune et Stout",
      description: "Bieres torrefiees, malt ees et intenses.",
    },
  });

  await prisma.beerByCategory.createMany({
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

  const pairings = await Promise.all([
    prisma.pairing.create({
      data: {
        name: "Fromages affines",
        description: "Accords sur brunes, triples et ales de caractere.",
      },
    }),
    prisma.pairing.create({
      data: {
        name: "Poissons et agrumes",
        description: "Accords sur blanches et bi eres acidulees.",
      },
    }),
  ]);

  await prisma.pairingByCategory.createMany({
    data: [
      { id_pairing: pairings[0].id, id_category: categoryDark.id },
      { id_pairing: pairings[0].id, id_category: categoryAles.id },
      { id_pairing: pairings[1].id, id_category: categoryIpa.id },
      { id_pairing: pairings[1].id, id_category: categoryAles.id },
    ],
  });

  for (let i = 0; i < 18; i += 1) {
    const user = faker.helpers.arrayElement(users);
    const beer = faker.helpers.arrayElement(beers);
    await prisma.rating.create({
      data: {
        id_user: user.id,
        id_beer: beer.id,
        content: faker.helpers.arrayElement([
          "Equilibree et facile a boire.",
          "Bonne intensite aromatique.",
          "Profil interessant mais un peu amer.",
          "Finale propre, tres agreable.",
          "Belle surprise sur la longueur.",
        ]),
        rate: faker.number.int({ min: 2, max: 5 }),
      },
    });
  }

  const criteriaByKey = new Map<string, number>();
  for (const q of QUIZ_QUESTIONS) {
    const created = await prisma.criterion.create({
      data: {
        name: q.criterionName,
        description: `Critere quiz - ${q.group}`,
      },
    });
    criteriaByKey.set(q.key, created.id);
  }

  for (const user of users) {
    const selected = pickUniqueIndices(QUIZ_QUESTIONS.length, 8);
    for (const index of selected) {
      const question = QUIZ_QUESTIONS[index];
      const criterionId = criteriaByKey.get(question.key);
      if (!criterionId) continue;
      await prisma.userCriteria.create({
        data: {
          id_user: user.id,
          id_criterion: criterionId,
          score: randomScore(),
        },
      });
    }
  }

  for (const beer of beers) {
    for (const question of QUIZ_QUESTIONS) {
      const criterionId = criteriaByKey.get(question.key);
      if (!criterionId) continue;
      await prisma.beerCriteria.create({
        data: {
          id_beer: beer.id,
          id_criterion: criterionId,
          score: randomScore(),
        },
      });
    }
  }

  const recommendationPairs = new Set<string>();
  while (recommendationPairs.size < 10) {
    const user = faker.helpers.arrayElement(users);
    const beer = faker.helpers.arrayElement(beers);
    const key = `${user.id}-${beer.id}`;
    if (recommendationPairs.has(key)) {
      continue;
    }
    recommendationPairs.add(key);
    await prisma.beerRecommendedUser.create({
      data: {
        id_user: user.id,
        id_beer: beer.id,
        score_compatibility: randomScore(),
      },
    });
  }

  const quiz = await prisma.quizz.create({
    data: {
      name: "Quiz Preference Bieres",
      description: "Questionnaire sensoriel pour recommander des bieres.",
    },
  });

  const questionChoiceMap = new Map<number, number[]>();
  const orderedQuestionIds: number[] = [];

  for (const question of QUIZ_QUESTIONS) {
    const criterionId = criteriaByKey.get(question.key);
    if (!criterionId) continue;

    const createdQuestion = await prisma.quizzQuestion.create({
      data: {
        id_criterion: criterionId,
        id_quizz: quiz.id,
        question: question.question,
      },
    });

    orderedQuestionIds.push(createdQuestion.id);

    let createdChoices: { id: number }[] = [];
    if (question.type === "rapport") {
      createdChoices = await Promise.all([
        prisma.questionChoice.create({
          data: {
            id_quizz_question: createdQuestion.id,
            choice: "0%",
            note_value: 0,
          },
        }),
        prisma.questionChoice.create({
          data: {
            id_quizz_question: createdQuestion.id,
            choice: "inferieur a 1%",
            note_value: 1,
          },
        }),
        prisma.questionChoice.create({
          data: {
            id_quizz_question: createdQuestion.id,
            choice: "avec alcool",
            note_value: 2,
          },
        }),
      ]);
    } else if (question.type === "degre") {
      createdChoices = await Promise.all([
        prisma.questionChoice.create({
          data: {
            id_quizz_question: createdQuestion.id,
            choice: "Tous",
            note_value: 3,
          },
        }),
        prisma.questionChoice.create({
          data: {
            id_quizz_question: createdQuestion.id,
            choice: "<5%",
            note_value: 2,
          },
        }),
        prisma.questionChoice.create({
          data: {
            id_quizz_question: createdQuestion.id,
            choice: "5-7%",
            note_value: 4,
          },
        }),
        prisma.questionChoice.create({
          data: {
            id_quizz_question: createdQuestion.id,
            choice: ">7%",
            note_value: 5,
          },
        }),
      ]);
    } else {
      createdChoices = await Promise.all(
        SCALE_CHOICES.map((scaleChoice) =>
          prisma.questionChoice.create({
            data: {
              id_quizz_question: createdQuestion.id,
              choice: scaleChoice.choice,
              note_value: scaleChoice.note,
            },
          }),
        ),
      );
    }

    questionChoiceMap.set(
      createdQuestion.id,
      createdChoices.map((choice) => choice.id),
    );
  }

  const sessions = await Promise.all([
    prisma.quizzSession.create({
      data: {
        id_user: users[1].id,
        id_quizz: quiz.id,
        status: QuizzSessionStatus.COMPLETED,
        started_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        completed_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 25 * 60 * 1000),
      },
    }),
    prisma.quizzSession.create({
      data: {
        id_user: users[2].id,
        id_quizz: quiz.id,
        status: QuizzSessionStatus.COMPLETED,
        started_at: new Date(Date.now() - 24 * 60 * 60 * 1000),
        completed_at: new Date(Date.now() - 24 * 60 * 60 * 1000 + 20 * 60 * 1000),
      },
    }),
    prisma.quizzSession.create({
      data: {
        id_user: users[3].id,
        id_quizz: quiz.id,
        status: QuizzSessionStatus.ABANDONED,
        started_at: new Date(Date.now() - 12 * 60 * 60 * 1000),
        completed_at: null,
      },
    }),
  ]);

  for (const questionId of orderedQuestionIds) {
    const choices = questionChoiceMap.get(questionId);
    if (!choices || choices.length === 0) continue;
    const choiceId = faker.helpers.arrayElement(choices);
    await prisma.answerUser.create({
      data: {
        id_quizz_session: sessions[0].id,
        id_question_choice: choiceId,
      },
    });
  }

  for (const questionId of orderedQuestionIds) {
    const choices = questionChoiceMap.get(questionId);
    if (!choices || choices.length === 0) continue;
    const choiceId = faker.helpers.arrayElement(choices);
    await prisma.answerUser.create({
      data: {
        id_quizz_session: sessions[1].id,
        id_question_choice: choiceId,
      },
    });
  }

  for (const questionId of orderedQuestionIds.slice(0, 10)) {
    const choices = questionChoiceMap.get(questionId);
    if (!choices || choices.length === 0) continue;
    const choiceId = faker.helpers.arrayElement(choices);
    await prisma.answerUser.create({
      data: {
        id_quizz_session: sessions[2].id,
        id_question_choice: choiceId,
      },
    });
  }

  const questionCount = await prisma.quizzQuestion.count({ where: { id_quizz: quiz.id } });
  const choiceCount = await prisma.questionChoice.count({
    where: {
      quizzQuestion: {
        id_quizz: quiz.id,
      },
    },
  });

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
