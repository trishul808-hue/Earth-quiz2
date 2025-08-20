
// Earth Quiz app.js
const startBtn = document.getElementById('start-btn');
const statusEl = document.getElementById('status');
const quizScreen = document.getElementById('quiz-screen');
const startScreen = document.getElementById('start-screen');
const resultScreen = document.getElementById('result-screen');
const qnumEl = document.getElementById('qnum');
const qtotalEl = document.getElementById('qtotal');
const questionEl = document.getElementById('question');
const optionsEl = document.getElementById('options');
const xpEl = document.getElementById('xp');
const nextBtn = document.getElementById('next-btn');
const endBtn = document.getElementById('end-btn');
const retryBtn = document.getElementById('retry-btn');
const resultSummary = document.getElementById('result-summary');

let allQA = [];
let currentIndex = 0;
let score = 0;
let xp = 0;
let totalQuestions = 20;

// Bundled fallback (if offline) - a small sample
const fallback = [
  {country:'India',capital:'New Delhi'},
  {country:'United States',capital:'Washington, D.C.'},
  {country:'United Kingdom',capital:'London'},
  {country:'France',capital:'Paris'},
  {country:'Germany',capital:'Berlin'},
  {country:'Japan',capital:'Tokyo'},
  {country:'Australia',capital:'Canberra'},
  {country:'Canada',capital:'Ottawa'},
  {country:'Brazil',capital:'Brasília'},
  {country:'South Africa',capital:'Pretoria'}
];

// Utility: shuffle
function shuffle(a){for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}

// Try to fetch list from Wikipedia and parse table
async function fetchCapitalsFromWikipedia(){
  try{
    statusEl.textContent = 'Fetching capitals from Wikipedia...';
    const res = await fetch('https://en.wikipedia.org/wiki/List_of_national_capitals');
    if(!res.ok) throw new Error('Network response not ok');
    const text = await res.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(text, 'text/html');
    // Many Wikipedia pages have tables with country and capital columns. We'll find rows with two columns that look like country-capital.
    const rows = Array.from(doc.querySelectorAll('table.wikitable tr'));
    const tmp = [];
    for(const r of rows){
      const cols = r.querySelectorAll('td,th');
      if(cols.length>=2){
        const country = cols[0].innerText.trim().replace(/\[.*?\]/g,'').split('\n')[0];
        const capital = cols[1].innerText.trim().replace(/\[.*?\]/g,'').split('\n')[0];
        if(country && capital && country.length<60 && capital.length<60){
          tmp.push({country:country,capital:capital});
        }
      }
    }
    // If we couldn't parse enough, try a different selector: lists in the page
    if(tmp.length < 160){
      // try another Wikipedia page which is a more comprehensive list
      const res2 = await fetch('https://en.wikipedia.org/wiki/List_of_countries_and_capitals_with_currency_and_language');
      if(res2.ok){
        const t2 = await res2.text();
        const d2 = parser.parseFromString(t2,'text/html');
        const rows2 = Array.from(d2.querySelectorAll('table.wikitable tr'));
        for(const r of rows2){
          const cols = r.querySelectorAll('td,th');
          if(cols.length>=2){
            const country = cols[0].innerText.trim().replace(/\[.*?\]/g,'').split('\n')[0];
            const capital = cols[1].innerText.trim().replace(/\[.*?\]/g,'').split('\n')[0];
            if(country && capital && country.length<60 && capital.length<60){
              tmp.push({country:country,capital:capital});
            }
          }
        }
      }
    }
    // Deduplicate by country
    const map = new Map();
    tmp.forEach(it => { if(!map.has(it.country)) map.set(it.country, it); });
    const list = Array.from(map.values());
    return list;
  }catch(err){
    console.warn('Fetch failed',err);
    return null;
  }
}

async function prepareQuestions(){
  // Check localStorage cache
  const cached = localStorage.getItem('earthquiz_questions_v1');
  if(cached){
    try{
      const parsed = JSON.parse(cached);
      if(Array.isArray(parsed) && parsed.length>=160){
        allQA = parsed;
        statusEl.textContent = 'Loaded questions from cache.';
        return;
      }
    }catch(e){}
  }

  const fetched = await fetchCapitalsFromWikipedia();
  if(fetched && fetched.length>=160){
    statusEl.textContent = 'Fetched ' + fetched.length + ' capitals. Ready!';
    allQA = fetched;
    localStorage.setItem('earthquiz_questions_v1', JSON.stringify(allQA));
    return;
  }else if(fetched && fetched.length>0){
    statusEl.textContent = 'Fetched ' + fetched.length + ' capitals (less than 160). Using fetched + fallback.';
    // merge with fallback and dedupe
    const map = new Map();
    fetched.concat(fallback).forEach(it => { if(!map.has(it.country)) map.set(it.country, it); });
    allQA = Array.from(map.values());
    localStorage.setItem('earthquiz_questions_v1', JSON.stringify(allQA));
    return;
  }else{
    statusEl.textContent = 'Offline or failed to fetch. Using bundled fallback ('+fallback.length+' entries).';
    allQA = fallback;
    localStorage.setItem('earthquiz_questions_v1', JSON.stringify(allQA));
    return;
  }
}

function makeQuestionPool(n){
  const pool = shuffle(allQA.slice());
  // some entries may have capitals like '—' or multiple; normalize
  const clean = pool.map(it=>{
    return {country: it.country, capital: it.capital.split(/;|,|\(|\/|-/)[0].trim()};
  }).filter(it => it.capital && it.capital !== '—' && it.capital !== 'N/A');
  return clean.slice(0, n);
}

function renderQuestion(qobj, index, total){
  qnumEl.textContent = index+1;
  qtotalEl.textContent = total;
  questionEl.textContent = 'What is the capital of ' + qobj.country + '?';
  optionsEl.innerHTML = '';
  // prepare options: correct + 3 random capitals
  const otherCaps = allQA.map(a=>a.capital).filter(c=>c && c!==qobj.capital);
  const opts = shuffle([qobj.capital, ...shuffle(otherCaps).slice(0,3)]).slice(0,4);
  opts.forEach(opt=>{
    const b = document.createElement('div');
    b.className = 'option';
    b.textContent = opt;
    b.addEventListener('click', ()=> onAnswer(b, opt, qobj.capital));
    optionsEl.appendChild(b);
  });
}

function onAnswer(buttonEl, chosen, correct){
  // disable all options
  Array.from(optionsEl.children).forEach(c=>c.style.pointerEvents='none');
  nextBtn.classList.remove('hidden');
  // mark correct/wrong visually and show icons
  if(chosen === correct){
    buttonEl.classList.add('correct');
    buttonEl.innerHTML = chosen + ' <span class="icon">✅️</span>';
    score++;
    xp += 10;
  }else{
    buttonEl.classList.add('wrong');
    buttonEl.innerHTML = chosen + ' <span class="icon">❌️</span>';
    // highlight correct option
    for(const c of Array.from(optionsEl.children)){
      if(c.textContent.trim().startsWith(correct)){
        c.classList.add('correct');
        c.innerHTML = correct + ' <span class="icon">✅️</span>';
      }
    }
    xp += 2; // consolation XP
  }
  xpEl.textContent = xp;
}

function startQuiz(){
  // set totalQuestions depending on pool size
  totalQuestions = Math.min(30, Math.max(10, Math.floor((allQA.length))));
  // If we have a large pool, use 20 questions; if 160+, set to 25 or 30
  if(allQA.length >= 160) totalQuestions = 30;
  if(allQA.length >= 100 && allQA.length < 160) totalQuestions = 25;
  const pool = makeQuestionPool(totalQuestions);
  // attach to state
  window.quizPool = pool;
  currentIndex = 0;
  score = 0;
  xp = 0;
  startScreen.classList.add('hidden');
  resultScreen.classList.add('hidden');
  quizScreen.classList.remove('hidden');
  renderQuestion(window.quizPool[currentIndex], currentIndex, window.quizPool.length);
}

nextBtn.addEventListener('click', ()=>{
  currentIndex++;
  nextBtn.classList.add('hidden');
  if(currentIndex >= window.quizPool.length){
    endQuiz();
  }else{
    renderQuestion(window.quizPool[currentIndex], currentIndex, window.quizPool.length);
  }
});

endBtn.addEventListener('click', endQuiz);
retryBtn.addEventListener('click', ()=>{
  startScreen.classList.remove('hidden');
  resultScreen.classList.add('hidden');
  quizScreen.classList.add('hidden');
});

function endQuiz(){
  quizScreen.classList.add('hidden');
  resultScreen.classList.remove('hidden');
  const percent = Math.round((score/window.quizPool.length)*100);
  resultSummary.innerHTML = `You scored <strong>${score}</strong> out of <strong>${window.quizPool.length}</strong> (${percent}%).<br>XP earned: <strong>${xp}</strong>.`;
  // save best
  const best = parseInt(localStorage.getItem('earthquiz_best') || '0',10);
  if(score>best) localStorage.setItem('earthquiz_best', score);
}

startBtn.addEventListener('click', ()=>{
  // Ensure questions ready
  if(allQA.length===0){
    statusEl.textContent = 'Preparing questions...';
    prepareQuestions().then(()=> {
      statusEl.textContent = 'Ready — press Start';
      startQuiz();
    });
  }else{
    startQuiz();
  }
});

// On load: prepare questions in background
prepareQuestions();

// Install prompt / PWA niceties (minimal)
if('serviceWorker' in navigator){
  window.addEventListener('load', ()=> {
    navigator.serviceWorker.register('sw.js').then(()=>console.log('SW registered')).catch(()=>{});
  });
}
