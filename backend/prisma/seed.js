const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const subjects = [
  {
    name: 'Türkçe',
    teacherPersona: 'Anlatımı net, paragraf çözüm tekniklerinde güçlü Türkçe hocası',
    icon: 'book-open',
    questionTypes: [
      { name: 'Sözcükte Anlam', questionCount: 6 },
      { name: 'Cümlede Anlam', questionCount: 5 },
      { name: 'Paragraf', questionCount: 12 },
      { name: 'Dil Bilgisi', questionCount: 7 },
    ],
  },
  {
    name: 'Matematik',
    teacherPersona: 'Temelden ilerleyen, pratik çözüm odaklı matematik hocası',
    icon: 'calculator',
    questionTypes: [
      { name: 'Temel Kavramlar', questionCount: 5 },
      { name: 'Rasyonel Sayılar', questionCount: 4 },
      { name: 'Problemler', questionCount: 10 },
      { name: 'Geometri', questionCount: 6 },
    ],
  },
  {
    name: 'Tarih',
    teacherPersona: 'Kronoloji ve yorum bağlantılarını güçlü kuran tarih hocası',
    icon: 'landmark',
    questionTypes: [
      { name: 'İlk Türk Devletleri', questionCount: 4 },
      { name: 'Osmanlı Kültür ve Medeniyet', questionCount: 5 },
      { name: 'Kurtuluş Savaşı', questionCount: 6 },
      { name: 'Atatürk İlkeleri ve İnkılap Tarihi', questionCount: 5 },
    ],
  },
  {
    name: 'Coğrafya',
    teacherPersona: 'Harita yorumlamaya ve güncel örneklere odaklanan coğrafya hocası',
    icon: 'globe',
    questionTypes: [
      { name: 'Türkiye Fiziki Coğrafyası', questionCount: 4 },
      { name: 'Nüfus ve Yerleşme', questionCount: 4 },
      { name: 'Ekonomik Coğrafya', questionCount: 5 },
      { name: 'Bölgeler Coğrafyası', questionCount: 5 },
    ],
  },
  {
    name: 'Vatandaşlık',
    teacherPersona: 'Kavramları sadeleştiren, anayasa ve hukuk temelini net anlatan hoca',
    icon: 'scale',
    questionTypes: [
      { name: 'Anayasa Hukuku', questionCount: 5 },
      { name: 'İdare Hukuku', questionCount: 4 },
      { name: 'Vatandaşlık Bilgisi', questionCount: 4 },
      { name: 'Güncel Hukuki Düzenlemeler', questionCount: 2 },
    ],
  },
  {
    name: 'Eğitim Bilimleri',
    teacherPersona: 'Öğrenme psikolojisi ve öğretim yöntemlerini örneklerle anlatan hoca',
    icon: 'graduation-cap',
    questionTypes: [
      { name: 'Gelişim Psikolojisi', questionCount: 8 },
      { name: 'Öğrenme Psikolojisi', questionCount: 8 },
      { name: 'Ölçme ve Değerlendirme', questionCount: 7 },
      { name: 'Program Geliştirme', questionCount: 7 },
    ],
  },
  {
    name: 'Güncel Bilgiler',
    teacherPersona: 'Güncel olayları sınav formatına uygun özetleyen içerik hocası',
    icon: 'newspaper',
    questionTypes: [
      { name: 'Türkiye Gündemi', questionCount: 3 },
      { name: 'Dünya Gündemi', questionCount: 2 },
      { name: 'Kurumlar ve Organizasyonlar', questionCount: 2 },
      { name: 'Kültür Sanat ve Spor', questionCount: 2 },
    ],
  },
];

async function main() {
  const kpss = await prisma.examType.upsert({
    where: { name: 'KPSS' },
    update: {
      isActive: true,
      description: 'KPSS adayları için deneme, sıralama ve rekabet odaklı sınav ligi.',
    },
    create: {
      name: 'KPSS',
      isActive: true,
      registrationFee: 0,
      description: 'KPSS adayları için deneme, sıralama ve rekabet odaklı sınav ligi.',
    },
  });

  for (const [subjectIndex, subject] of subjects.entries()) {
    const createdSubject = await prisma.subject.upsert({
      where: {
        examTypeId_name: {
          examTypeId: kpss.id,
          name: subject.name,
        },
      },
      update: {
        teacherPersona: subject.teacherPersona,
        icon: subject.icon,
      },
      create: {
        examTypeId: kpss.id,
        name: subject.name,
        teacherPersona: subject.teacherPersona,
        icon: subject.icon,
      },
    });

    for (const [questionTypeIndex, questionType] of subject.questionTypes.entries()) {
      await prisma.questionType.upsert({
        where: {
          subjectId_name: {
            subjectId: createdSubject.id,
            name: questionType.name,
          },
        },
        update: {
          questionCount: questionType.questionCount,
          sortOrder: subjectIndex * 10 + questionTypeIndex + 1,
        },
        create: {
          subjectId: createdSubject.id,
          name: questionType.name,
          questionCount: questionType.questionCount,
          sortOrder: subjectIndex * 10 + questionTypeIndex + 1,
        },
      });
    }
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });