export const categories = [
  { id: "property", name: "Имущество" },
  { id: "documents", name: "Документи" },
  { id: "health", name: "Здраве" },
  { id: "social", name: "Социални" },
  { id: "education", name: "Образование" },
  { id: "transport", name: "Транспорт" },
  { id: "reports", name: "Докладвай проблем" },
];

export const servicesByCategory = {
  property: [
    { id: "prop-1", title: "Данъчна оценка", description: "Заявка за издаване на данъчна оценка." },
    { id: "prop-2", title: "Скица на имот", description: "Заявка за скица/схема." },
    { id: "prop-3", title: "Удостоверение за тежести", description: "Проверка и издаване на удостоверение." },
    { id: "prop-4", title: "Адресна регистрация", description: "Заявка за промяна на адрес." },
  ],
  health: [
    { id: "hlth-1", title: "Запис при личен лекар", description: "Заявка за избор/смяна на ОПЛ." },
    { id: "hlth-2", title: "Рецепта", description: "Преглед на рецепти и заявки." },
    { id: "hlth-3", title: "Е-преглед", description: "Онлайн консултация." },
    { id: "hlth-4", title: "Ваксинации", description: "Справки и записване." },
  ],
  social: [
    { id: "soc-1", title: "Социална помощ", description: "Кандидатстване за социална помощ." },
    { id: "soc-2", title: "Детски надбавки", description: "Подаване на заявление за помощи." },
    { id: "soc-3", title: "Помощ за отопление", description: "Заявка за сезонна помощ." },
    { id: "soc-4", title: "Инвалидност (услуги)", description: "Справки и заявления по ТЕЛК/НЕЛК." },
  ],
  education: [
    { id: "edu-1", title: "Удостоверение за ученик/студент", description: "Издаване на удостоверение." },
    { id: "edu-2", title: "Записване в детска градина", description: "Кандидатстване и класиране." },
    { id: "edu-3", title: "Справка за дипломи", description: "Преглед на издадени дипломи." },
    { id: "edu-4", title: "Стипендии", description: "Кандидатстване за стипендия." },
  ],
  transport: [
    { id: "tr-1", title: "Регистрация на МПС", description: "Подаване на заявление за регистрация." },
    { id: "tr-2", title: "Смяна на собственост", description: "Прехвърляне на МПС." },
    { id: "tr-3", title: "Техн. преглед", description: "Справка и записване за преглед." },
    { id: "tr-4", title: "Глоби", description: "Справка за наложени глоби." },
  ],
};
