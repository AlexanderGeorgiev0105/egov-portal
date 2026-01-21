import { useEffect, useMemo, useRef, useState } from "react";

export default function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);

  const [messages, setMessages] = useState([
    { id: "m1", from: "bot", text: "Здравей! Избери модул и натисни въпрос, за да ти обясня как става." },
  ]);

  const [view, setView] = useState("modules"); // "modules" | "questions"
  const [activeModule, setActiveModule] = useState(null);

  const endRef = useRef(null);

  useEffect(() => {
    if (isOpen) endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOpen]);

  function toggleOpen() {
    setIsOpen((p) => !p);
  }

  function pushUser(text) {
    setMessages((prev) => [...prev, { id: `u_${Date.now()}_${Math.random()}`, from: "user", text }]);
  }

  function pushBot(text) {
    setMessages((prev) => [...prev, { id: `b_${Date.now()}_${Math.random()}`, from: "bot", text }]);
  }

  function selectModule(m) {
    setActiveModule(m);
    setView("questions");
  }

  function backToModules() {
    setView("modules");
    setActiveModule(null);
  }

  function handleQuick(item) {
    pushUser(item.label);
    pushBot(item.reply);
  }

  const modules = useMemo(
    () => ["Общи", "Имущество", "Здраве", "Превозни средства", "Документи", "Докладвай проблем"],
    []
  );

  const qaByModule = useMemo(
    () => ({
      "Общи": [
        {
          label: "Къде виждам статуса на заявките си?",
          reply:
            "Във всяка секция има панел „Заявки“ (обикновено вдясно). Там виждаш последните заявки, а с „Виж всички“ – пълния списък.",
        },
        {
          label: "Какво значи „Чака проверка / Одобрена / Отказана“?",
          reply:
            "„Чака проверка“ = изпратена е и админът още не я е обработил. „Одобрена“ = приета е и промяната е приложена. „Отказана“ = отхвърлена е.",
        },
        {
          label: "Защо бутон/услуга е неактивна (сива)?",
          reply:
            "Най-често липсва предварително условие: напр. в „Здраве“ трябва да имаш личен лекар; в „Имущество → Задължения“ трябва да има имот с издадена данъчна оценка.",
        },
        {
          label: "Как да видя всички заявки, а не само последните?",
          reply:
            "Отвори панела „Заявки“ в секцията и натисни „Виж всички“, за да се покаже пълният списък (обикновено в прозорец/таблица).",
        },
      ],

      "Имущество": [
        {
          label: "Как да добавя имот?",
          reply:
            "Отиди в „Имущество“ → „Добави имот“ → попълни данните → „Изпрати заявка“. Следи статуса в панела „Заявки“.",
        },
        {
          label: "Как да поискам данъчна оценка?",
          reply:
            "Отиди в „Имущество“ → „Данъчна оценка“ → подай заявката. След одобрение ще можеш да ползваш и услуги като „Задължения“.",
        },
        {
          label: "Как да видя задължения по имот?",
          reply:
            "Отиди в „Имущество“ → „Задължения“. Ако нямаш имот с издадена данъчна оценка, първо трябва да имаш поне 1 одобрен имот с такава.",
        },
        {
          label: "Как да премахна имот?",
          reply:
            "В „Имущество“ при „Моите имоти“ натисни „Премахни“ → избери причина → „Изпрати към админ“. Ако има чакаща заявка, няма да позволи втора.",
        },
      ],

      "Здраве": [
        {
          label: "Как да добавя личен лекар?",
          reply:
            "Отиди в „Здраве“ → „Добави личен лекар“ → въведи номер на практика → „Изпрати заявка“. Следи статуса в „Заявки“.",
        },
        {
          label: "Как да запазя час при личния лекар?",
          reply:
            "Отиди в „Здраве“ → „Записани часове“ → „Отвори“ → избери ден и свободен час → потвърди. (Трябва да имаш добавен личен лекар.)",
        },
        {
          label: "Как работят направленията?",
          reply:
            "Отиди в „Здраве“ → „Направления“ → виж списъка и подай заявка за ново. Статусът се следи в „Заявки“.",
        },
        {
          label: "Къде са всички заявки за здраве?",
          reply:
            "В „Здраве“ в панела „Заявки“ натисни „Виж всички“ – ще видиш пълната таблица със заявки и статуси.",
        },
      ],

      "Превозни средства": [
        {
          label: "Как да добавя превозно средство (МПС)?",
          reply:
            "Отиди в „Превозни средства“ → „Моите превозни средства“ → подай заявка за добавяне (рег. номер и данни). После следи статуса в „Заявки“.",
        },
        {
          label: "Как да си купя винетка?",
          reply:
            "Отиди в „Превозни средства“ → „Винетка“ → избери МПС → избери период → натисни „Плати“. След покупка провери активните винетки в секцията.",
        },
        {
          label: "Как да заявя технически преглед?",
          reply:
            "Отиди в „Превозни средства“ → „Технически преглед“ → избери МПС → избери дата (ако се изисква) → прикачи PDF ако е нужно → „Изпрати заявка“.",
        },
        {
          label: "Къде виждам глоби?",
          reply:
            "Отиди в „Превозни средства“ → „Глоби“. Там се показват наличните глоби и детайли (ако са налични в системата).",
        },
      ],

      "Документи": [
        {
          label: "Как да добавя документ?",
          reply:
            "Отиди в „Документи“ → „Добави документ“ → избери тип → попълни данните → прикачи файлове (ако се изисква) → „Изпрати заявка“.",
        },
        {
          label: "Къде виждам снимките на документа?",
          reply:
            "Отиди в „Документи“ → отвори документа → „Детайли“ → секция „Снимки“. Клик върху снимка я отваря на цял екран.",
        },
        {
          label: "Как да премахна документ?",
          reply:
            "В „Документи“ при списъка с документи натисни „Премахни“. Това създава заявка към админ – следи статуса в „Заявки“.",
        },
        {
          label: "Какво значи статусът „Валиден/Невалиден“?",
          reply:
            "Това е информативно за срока на документа (валиден до дата). Ако датата е минала, статусът ще е „Невалиден“.",
        },
      ],

      "Докладвай проблем": [
        {
          label: "Как да докладвам проблем?",
          reply:
            "Отиди в „Докладвай проблем“ → избери категория → опиши проблема → „Подай сигнал“. Следи статуса в списъка/заявките.",
        },
        {
          label: "Какво да включа в сигнала?",
          reply:
            "Опиши: какво направи, какво се случи, какво очакваше, и (ако можеш) дата/час + точната секция. Това помага за по-бърза проверка.",
        },
      ],
    }),
    []
  );

  const currentQAs = activeModule ? qaByModule[activeModule] || [] : [];

  return (
    <div className="cb-wrap">
      {isOpen && (
        <div className="cb-panel" role="dialog" aria-modal="true">
          <div className="cb-head">
            <div className="cb-headTitle">Помощник</div>
            <button className="cb-iconBtn" onClick={toggleOpen} type="button" title="Затвори">
              ✕
            </button>
          </div>

          <div className="cb-body">
            {messages.map((m) => (
              <div key={m.id} className={`cb-row ${m.from === "user" ? "cb-row--user" : "cb-row--bot"}`}>
                <div className={`cb-bubble ${m.from === "user" ? "cb-bubble--user" : "cb-bubble--bot"}`}>
                  {m.text}
                </div>
              </div>
            ))}
            <div ref={endRef} />
          </div>

          <div className="cb-bottom">
            {view === "modules" ? (
              <div className="cb-modulesGrid" aria-label="Модули">
                {modules.map((m) => (
                  <button
                    key={m}
                    type="button"
                    className="cb-moduleTile"
                    onClick={() => selectModule(m)}
                    title={`Въпроси за: ${m}`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            ) : (
              <>
                <div className="cb-questionsHead">
                  <button className="cb-backBtn" type="button" onClick={backToModules} title="Назад към модулите">
                    ← Назад
                  </button>
                  <div className="cb-activeTitle">{activeModule}</div>
                </div>

                <div className="cb-quick">
                  {currentQAs.map((q) => (
                    <button key={q.label} className="cb-chip" onClick={() => handleQuick(q)} type="button">
                      {q.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          <style>{chatBotStyles}</style>
        </div>
      )}

      <button className="cb-fab" onClick={toggleOpen} type="button" aria-label="Отвори чат">
        💬
      </button>

      <style>{chatBotStyles}</style>
    </div>
  );
}

const chatBotStyles = `
  .cb-wrap{
    position: fixed;
    right: 16px;
    bottom: 16px;
    left: auto;
    z-index: 9999;

    font-family:
      ui-rounded,
      "SF Pro Rounded",
      "Segoe UI Rounded",
      "Nunito",
      "Poppins",
      "Rubik",
      system-ui,
      -apple-system,
      "Segoe UI",
      Arial,
      sans-serif;
  }

  .cb-fab{
    width: 52px;
    height: 52px;
    border-radius: 999px;
    border: 1px solid rgba(255,255,255,0.24);
    color: rgba(255,255,255,0.98);
    cursor: pointer;
    font-weight: 900;
    font-size: 18px;

    background-image: linear-gradient(90deg, #3a8dff 0%, #5aaeff 55%, #7bc7ff 100%);
    box-shadow: 0 18px 40px rgba(16, 24, 40, 0.18),
                inset 0 1px 0 rgba(255,255,255,0.26);

    transform: translateZ(0);
    transition: transform 140ms ease, box-shadow 140ms ease, filter 140ms ease;
  }

  .cb-fab:hover{
    transform: translateY(-1px) translateZ(0);
    filter: saturate(1.02);
    box-shadow: 0 22px 46px rgba(16, 24, 40, 0.22),
                inset 0 1px 0 rgba(255,255,255,0.26);
  }

  /* ✅ ОЩЕ ПО-ТЕСЕН панел, за да не пречи на „Заявки“ */
  .cb-panel{
    position: absolute;
    right: 0;
    bottom: 64px;
    width: 360px; /* беше 420 -> по-тясно */
    overflow: hidden;
    border-radius: 26px;

    border: 1px solid rgba(46, 91, 255, 0.14);
    background: linear-gradient(180deg, rgba(252,253,255,0.98), rgba(245,248,255,0.94));

    box-shadow: 0 26px 70px rgba(0,0,0,0.18);
    backdrop-filter: blur(6px);
  }

  @media (max-width: 400px){
    .cb-panel{ width: calc(100vw - 32px); }
  }

  .cb-head{
    padding: 12px 12px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;

    background-image: linear-gradient(
      90deg,
      rgba(58,141,255,0.92) 0%,
      rgba(90,174,255,0.92) 55%,
      rgba(123,199,255,0.92) 100%
    );
    border-bottom: 1px solid rgba(255,255,255,0.18);
  }

  .cb-headTitle{
    font-weight: 950;
    letter-spacing: 0.2px;
    color: rgba(255,255,255,0.98);
  }

  .cb-iconBtn{
    width: 38px;
    height: 38px;
    border-radius: 14px;
    border: 1px solid rgba(255,255,255,0.22);
    background: rgba(255,255,255,0.14);
    color: rgba(255,255,255,0.98);
    cursor: pointer;
    font-weight: 950;
    transition: transform 140ms ease, background 140ms ease;
  }

  .cb-iconBtn:hover{
    transform: translateY(-1px);
    background: rgba(255,255,255,0.18);
  }

  /* ✅ Само бяло при въпроси/отговори (махнат gradient само тук) */
  .cb-body{
    height: 340px;
    overflow-y: auto;
    padding: 12px;
    background: #ffffff;
  }

  .cb-row{ display: flex; margin-bottom: 10px; }
  .cb-row--bot{ justify-content: flex-start; }
  .cb-row--user{ justify-content: flex-end; }

  .cb-bubble{
    max-width: 86%;
    padding: 10px 12px;
    border-radius: 16px;
    white-space: pre-wrap;
    word-break: break-word;
    line-height: 1.35;
    font-size: 13px;
    letter-spacing: 0.1px;

    box-shadow: 0 10px 22px rgba(16, 24, 40, 0.06),
                inset 0 1px 0 rgba(255,255,255,0.78);
  }

  .cb-bubble--bot{
    background: rgba(255,255,255,0.96);
    border: 1px solid rgba(46, 91, 255, 0.12);
    color: #0f172a;
  }

  .cb-bubble--user{
    color: rgba(255,255,255,0.99);
    border: 1px solid rgba(255,255,255,0.22);
    background-image: linear-gradient(
      90deg,
      rgba(58,141,255,0.95) 0%,
      rgba(90,174,255,0.95) 55%,
      rgba(123,199,255,0.95) 100%
    );
  }

  .cb-bottom{
    background: rgba(255,255,255,0.72);
    border-top: 1px solid rgba(15, 23, 42, 0.08);
  }

  /* 3 реда по 2 модула */
  .cb-modulesGrid{
    padding: 12px;
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
    place-items: center;
  }

  .cb-moduleTile{
    width: 100%;
    min-height: 42px;
    border-radius: 16px;
    cursor: pointer;
    font-weight: 950;
    font-size: 12.5px;
    letter-spacing: 0.12px;

    border: 1px solid rgba(46, 91, 255, 0.14);
    background: rgba(255,255,255,0.78);
    color: #0f172a;

    box-shadow: 0 10px 22px rgba(16, 24, 40, 0.06),
                inset 0 1px 0 rgba(255,255,255,0.78);

    transition: transform 140ms ease, box-shadow 140ms ease, filter 140ms ease;
  }

  .cb-moduleTile:hover{
    transform: translateY(-1px);
    box-shadow: 0 14px 28px rgba(16, 24, 40, 0.10);
    filter: saturate(1.02);
  }

  .cb-questionsHead{
    padding: 10px 12px 0 12px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
  }

  .cb-backBtn{
    border-radius: 999px;
    padding: 7px 10px;
    font-weight: 950;
    font-size: 12px;
    cursor: pointer;

    border: 1px solid rgba(46, 91, 255, 0.14);
    background: rgba(255,255,255,0.76);
    color: #0f172a;

    transition: transform 140ms ease, box-shadow 140ms ease;
  }

  .cb-backBtn:hover{
    transform: translateY(-1px);
    box-shadow: 0 14px 28px rgba(16, 24, 40, 0.10);
  }

  .cb-activeTitle{
    font-weight: 950;
    letter-spacing: 0.15px;
    color: #0f172a;
    opacity: 0.95;
  }

  .cb-quick{
    padding: 10px 12px 12px 12px;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }

  .cb-chip{
    border-radius: 999px;
    padding: 8px 12px;
    min-height: 36px;
    cursor: pointer;
    font-weight: 900;
    letter-spacing: 0.12px;
    font-size: 12px;
    line-height: 1.2;

    border: 1px solid rgba(46, 91, 255, 0.14);
    background: rgba(255,255,255,0.78);
    color: #0f172a;

    transition: transform 140ms ease, box-shadow 140ms ease, filter 140ms ease;
    text-align: center;

    white-space: normal;
    overflow: visible;
    text-overflow: clip;
    word-break: break-word;
    hyphens: auto;

    box-shadow: 0 10px 22px rgba(16, 24, 40, 0.06),
                inset 0 1px 0 rgba(255,255,255,0.78);
  }

  .cb-chip:hover{
    transform: translateY(-1px);
    box-shadow: 0 14px 28px rgba(16, 24, 40, 0.10);
    filter: saturate(1.02);
  }
`;
