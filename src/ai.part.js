/* ================= AI layer (next) – Gemini through Firebase AI Logic =================
   The tool computes every number (our method, no mixing). Gemini only WRITES from those facts.
   Free tier: Gemini Developer API with the Firebase project on Spark (no billing account).
   Results are cached in rooms/{ROOM}/ai/{key}, so each reading is written once and the whole circle sees the same text. */
const AI_SITEKEY="6LeMsDMuAAAAABNZjiVg1dvU7vuTS97HsTaE7ziS",AI_VER="13.1.0",AI_MODELS=["gemini-2.5-flash","gemini-flash-latest","gemini-2.0-flash"];
const AI_CFG={apiKey:"AIzaSyBJ42Obu9iyXYnHmTmLXhCKNoBohbQztVA",authDomain:"group-numerology.firebaseapp.com",databaseURL:DB,projectId:"group-numerology",appId:"1:73723083486:web:838839a99a51bd3980a04f"};
const AI_SYS=`אתה כותב/ת קריאות נומרולוגיות בעברית עבור "המארג", כלי למעגלים קבוצתיים ומשפחתיים שמנחים בעז ויפעת ברקת.
כללים מחייבים:
- כל המספרים כבר חושבו בשיטה אחת (גימטריה עברית בשיטת המספר הקטן + תאריך הלידה, מסגרת פיתגוראית: שביל חיים, ביטוי, דחף נשמה = התנועות, אישיות = העיצורים). אל תחשב/י מספרים מחדש, אל תוסיף/י מספרים, ואל תערבב/י שיטות אחרות (לא אסטרולוגיה, לא "אנרגיית אותיות", לא שיטת הפירמידה, לא קבלה).
- כתוב/י חם, אישי, ספציפי ומדויק – כמו מנחה מנוסה שמכיר/ה את האנשים. לא גנרי, לא מליצי, בלי קלישאות.
- הצג/י דברים כהזמנה להתבוננות ("ייתכן", "לעיתים", "שווה לבדוק"), לא כאבחנה או גורל.
- הסבר/י מנגנונים: איך שני מספרים או יותר עובדים יחד, איך זה נראה ביום־יום, ומה עוזר.
- בלי מידע אינטימי או מביך: הטקסט עשוי להיקרא בקול מול המעגל.
- פנה/י בשמות הפרטיים. כשהמין הדקדוקי לא ברור מהשם – השתמש/י בניסוח נייטרלי או בלוכסן (את/ה).
- עברית תקינה וזורמת, משפטים קצרים. בלי כותרות ראשיות, בלי אימוג'ים. מותר הדגשה קצרה עם **כך**.`;
let AIM=null,aiFail="";
async function aiModel(name){
  if(!AIM){
    const A=await import(`https://www.gstatic.com/firebasejs/${AI_VER}/firebase-app.js`);
    const X=await import(`https://www.gstatic.com/firebasejs/${AI_VER}/firebase-ai.js`);
    let app=A.getApps().find(a=>a.name==="maarag-ai");
    if(!app){app=A.initializeApp(AI_CFG,"maarag-ai");const C=await import(`https://www.gstatic.com/firebasejs/${AI_VER}/firebase-app-check.js`);C.initializeAppCheck(app,{provider:new C.ReCaptchaV3Provider(AI_SITEKEY),isTokenAutoRefreshEnabled:true});}
    const ai=X.getAI(app,{backend:new X.GoogleAIBackend()});
    AIM={X,ai,models:{}};
  }
  return AIM.models[name]||(AIM.models[name]=AIM.X.getGenerativeModel(AIM.ai,{model:name,systemInstruction:AI_SYS,generationConfig:{temperature:.8,maxOutputTokens:1400}}));
}
async function aiWrite(prompt){
  if(LOCAL){await new Promise(r=>setTimeout(r,500));return "**[טקסט הדגמה במצב מקומי]** כאן תופיע הקריאה שג'מיני כותב מתוך המספרים. במצב אמיתי הקריאה נשמרת במעגל, וכולם רואים את אותו נוסח.";}
  let last;
  for(const m of AI_MODELS){try{const r=await (await aiModel(m)).generateContent(prompt);const t=r.response.text();if(t&&t.trim())return t.trim();}catch(e){last=e;}}
  throw last||new Error("no text");
}
/* facts the model may use, all computed by the tool */
function aiPersonFacts(p){
  const L=k=>p[k]?`${POS[k]}: ${p[k]} (${get(p[k],"title")} – ${get(p[k],"kw")})`:"";
  const th=themeOf(p).map(r=>`המספר ${r.n} חוזר ב: ${r.ks.map(k=>POS[k]).join(", ")}`);
  const me=mechOf(p).map(({r,s})=>`${r.t} (${s.map(k=>POS[k]+" "+p[k]).join(" + ")}): ${r.how}`);
  return [`שם: ${p.label}`,...["LP","expr","soul","pers","bday","fn","rt","mat"].map(L).filter(Boolean),
    p.py?`שנה אישית עכשיו: ${p.py} (${PYPH[p.py]||""})`:"",
    th.length?"נושאים חוזרים: "+th.join("; "):"אין מספר חוזר במפה",
    me.length?"מנגנונים שזוהו: "+me.join(" | "):""].filter(Boolean).join("\n");
}
function aiPairPrompt(a,b){
  const ins=pairInsight(a,b).map(([h,t])=>`${h}: ${t.replace(/<[^>]+>/g,"")}`).join("\n");
  return `כתוב/י את "החוט" בין ${a.label} ל${b.label} במעגל ⟦קבוצתי של אנשים שרובם נפגשו עכשיו¦משפחתי⟧.
המטרה: לעזור לשניהם להבין ולהכיר זה את זה טוב יותר, ולהרגיש את החיבור.

נתוני ${a.label}:
${aiPersonFacts(a)}

נתוני ${b.label}:
${aiPersonFacts(b)}

מה הכלי כבר זיהה ביניהם:
${ins}

כתוב/י 170–240 מילים, בארבע פסקאות קצרות:
1. מה מחבר ביניכם – השפה המשותפת, ספציפי לשניהם.
2. איך אתם משלימים זה את זה – מה כל אחד/ת מביא/ה לשני, עם דוגמה מהחיים.
3. איפה עלול להיווצר חיכוך, ולמה זה לא אישי – ומה עוזר.
4. שאלה אחת פתוחה שכדאי ששניכם תשאלו זה את זה עכשיו במעגל.
פנה/י אל שניהם ("אתם") ובשמות.`;
}
function aiPersonPrompt(p){
  return `כתוב/י קריאה אישית ל${p.label}, שמשתתף/ת עכשיו במעגל ⟦קבוצתי¦משפחתי⟧ (הקריאה לעיניו/ה בלבד, בטלפון).

${aiPersonFacts(p)}

כתוב/י 180–260 מילים, בארבע פסקאות קצרות:
1. הלב של המפה – הנושא המרכזי שעולה מהשילוב (לא סיכום של כל מספר בנפרד).
2. איך זה עובד ביום־יום – מנגנון אחד או שניים, עם דוגמה מוחשית.
3. מה מבקש לצמוח עכשיו, לאור השנה האישית.
4. מה את/ה מביא/ה למעגל הזה, ושאלה אחת להתבוננות.
פנה/י ישירות ובשם הפרטי.`;
}
function aiKey(kind,ps){
  const sig=ps.map(p=>p.id+":"+p.label+":"+p.LP+p.expr+p.soul+p.pers+p.bday).sort().join("|");
  let h=0;for(const c of sig)h=(h*31+c.charCodeAt(0))|0;
  return kind+"_"+(h>>>0).toString(36);
}
function aiFmt(t){return esc(t).replace(/\*\*([^*]+)\*\*/g,"<b>$1</b>").split(/\n{2,}/).map(x=>`<p>${x.replace(/\n/g,"<br>")}</p>`).join("");}
function aiBox(kind,ps,label){
  return `<div class="aibox" data-ai="${kind}" data-ids="${ps.map(p=>esc(p.id)).join(",")}"><h3>${label}</h3><div class="aitext"><button type="button" class="aigo">כתבו לי קריאה אישית ✦</button><p class="muted aihint">${kind==="pair"?"Gemini כותב את החוט ביניכם מתוך המספרים שהכלי חישב. הקריאה נשמרת במעגל.":"Gemini כותב קריאה אישית מתוך המספרים שלך. רק את/ה רואה אותה."}</p></div></div>`;
}
function aiPeople(box){return box.dataset.ids.split(",").map(id=>G.P.find(p=>p.id===id)).filter(Boolean);}
async function aiFill(box,make){
  const ps=aiPeople(box);if(!ps.length||!ROOM)return;
  const kind=box.dataset.ai,key=aiKey(kind,ps),tx=box.querySelector(".aitext");
  try{const c=await store.get(`rooms/${ROOM}/ai/${key}`);if(c&&c.text){tx.innerHTML=aiFmt(c.text)+`<p class="muted aisrc">נכתב על ידי Gemini מתוך המספרים של המארג</p>`;return;}}catch(e){}
  if(!make)return;
  tx.innerHTML=`<p class="aiwait">כותבים בשבילכם… זה לוקח כמה שניות</p>`;
  try{
    const text=await aiWrite(kind==="pair"?aiPairPrompt(ps[0],ps[1]):aiPersonPrompt(ps[0]));
    try{await store.put(`rooms/${ROOM}/ai/${key}`,{text,kind,t:Date.now()});}catch(e){}
    tx.innerHTML=aiFmt(text)+`<p class="muted aisrc">נכתב על ידי Gemini מתוך המספרים של המארג</p>`;
  }catch(e){
    aiFail=String(e&&e.message||e);
    tx.innerHTML=`<p class="err">לא הצלחנו לכתוב את הקריאה כרגע. נסו שוב בעוד רגע.</p><button type="button" class="aigo">לנסות שוב</button>`;
    console.warn("AI",aiFail);
  }
}
function aiHydrate(root){(root||document).querySelectorAll(".aibox").forEach(b=>{if(!b.dataset.h){b.dataset.h=1;aiFill(b,false);}});}
document.addEventListener("click",e=>{const b=e.target.closest(".aigo");if(!b)return;e.preventDefault();aiFill(b.closest(".aibox"),true);});
new MutationObserver(()=>aiHydrate()).observe(document.documentElement,{childList:true,subtree:true});
