// ===== OFFIZIELLE ROLLEN (gemäß Regelwerk) =====
const ROLLEN = {
  werwolf: "Einfache Werwölfe",
  urwolf: "Der Urwolf",
  grosser_wolf: "Der große, böse Wolf",
  dorfbewohner: "Einfache Dorfbewohner",
  amor: "Amor",
  seherin: "Die Seherin",
  schwestern: "Die zwei Schwestern",
  maedchen: "Das kleine Mädchen",
  fuchs: "Der Fuchs",
  ritter: "Der Ritter der rostigen Klinge",
  alte: "Der Alte",
  hexe: "Die Hexe",
  baer: "Der Bärenführer",
  jaeger: "Der Jäger",
  wilde_kind: "Das wilde Kind",
  wolfshund: "Der Wolfshund",
  weisser_wolf: "Der weiße Werwolf",
  floete: "Der Flötenspieler",
  engel: "Der Engel"
};

// ===== NEUMOND EREIGNISSE (30 offizielle) =====
const NEUMOND_EREIGNISSE = [
  "Blutmond", "Nebel", "Liebesrausch", "Hexensabbat", "Schutzzauber",
  "Verwirrung", "Todesstille", "Spiegelung", "Panik", "Frieden",
  "Dunkelheit", "Fluch der Hexe", "Liebesfluch", "Trank der Verwandlung",
  "Gesegnete Nacht", "Wolfsjagd", "Verdacht", "Dorfversammlung",
  "Schicksalsnacht", "Racheengel", "Trunkenes Dorf", "Doppeltes Spiel",
  "Mondfinsternis", "Heiliger Boden", "Fluch der Einsamkeit",
  "Gestohlene Identität", "Stille Nacht", "Opfergabe", "Neumond",
  "Ruf der Ahnen"
];

// ===== SPIELZUSTAND =====
let state = {
  spielerzahl: 8,
  spielerNamen: [],
  rollenVerteilung: {},
  neumondAktiv: false,
  spieler: [],
  aktuelleNacht: 1,
  phase: 'setup',
  liebespaar: null,
  floeteZiel: [],
  hexeHeil: true,
  hexeGift: true,
  werwolfOpfer: null,
  werwolfOpferRolle: null,
  grosserWolfOpfer: null,
  maedchenEntdeckt: false,
  toteDieseNacht: [],
  hauptmann: null,
  ersteHauptmannWahl: true,
  engelHingerichtetTag1: false,
  ereignis: null,
  wildeKindMentor: null,
  wolfshundTeam: null,
  alteLeben: {}, // pro Spieler
  ritterGetötet: false,
  ritterTöter: null
};

// ===== DOM-Referenzen =====
const el = {
  spielerzahl: document.getElementById('spielerzahl'),
  namenListe: document.getElementById('namen-liste'),
  gesamt: document.getElementById('gesamt'),
  ziel: document.getElementById('ziel'),
  rollenButtons: document.getElementById('rollen-buttons'),
  btnStart: document.getElementById('btn-start'),
  neumondAktiv: document.getElementById('neumond-aktiv'),
  phaseSetup: document.getElementById('phase-setup'),
  phaseRollen: document.getElementById('phase-rollen'),
  phaseSeherin: document.getElementById('phase-seherin'),
  phaseSpiel: document.getElementById('phase-spiel'),
  rolleTitel: document.getElementById('rolle-titel'),
  rolleInhalt: document.getElementById('rolle-inhalt'),
  btnRolleWeiter: document.getElementById('btn-rolle-weiter'),
  seherinText: document.getElementById('seherin-text'),
  btnSeherinWeiter: document.getElementById('btn-seherin-weiter'),
  spielTitel: document.getElementById('spiel-titel'),
  spielInhalt: document.getElementById('spiel-inhalt'),
  btnSpielWeiter: document.getElementById('btn-spiel-weiter'),
  lebendeListe: document.getElementById('lebende-liste'),
  toteListe: document.getElementById('tote-liste'),
  btnSpielleiter: document.getElementById('btn-spielleiter'),
  spielleiterPanel: document.getElementById('spielleiter-panel')
};

// ===== SETUP =====
el.spielerzahl.addEventListener('input', updateNamenFelder);

function updateNamenFelder() {
  const n = Math.max(6, Math.min(48, parseInt(el.spielerzahl.value) || 8));
  el.spielerzahl.value = n;
  state.spielerzahl = n;
  el.ziel.textContent = n;

  let html = '';
  for (let i = 1; i <= n; i++) {
    const name = state.spielerNamen[i-1] || `Spieler ${i}`;
    html += `<div style="margin:10px 0;"><label>Spieler ${i}:</label> <input type="text" id="name-${i}" value="${name}" style="width:100%;"></div>`;
  }
  el.namenListe.innerHTML = html;
  updateGesamt();
}

// Rollen-Buttons
for (const key in ROLLEN) {
  const btn = document.createElement('div');
  btn.className = 'rolle-btn';
  btn.dataset.rolle = key;
  btn.textContent = `${ROLLEN[key]} (0)`;
  btn.onclick = () => {
    state.rollenVerteilung[key] = (state.rollenVerteilung[key] || 0) + 1;
    renderRollen();
    updateGesamt();
  };
  el.rollenButtons.appendChild(btn);
}

function renderRollen() {
  for (const key in ROLLEN) {
    const btn = document.querySelector(`[data-rolle="${key}"]`);
    const count = state.rollenVerteilung[key] || 0;
    btn.textContent = `${ROLLEN[key]} (${count})`;
    btn.classList.toggle('active', count > 0);
  }
}

function updateGesamt() {
  let total = 0;
  for (const key in state.rollenVerteilung) {
    const count = state.rollenVerteilung[key] || 0;
    total += count * (key === 'schwestern' ? 2 : 1);
  }
  el.gesamt.textContent = total;
  el.btnStart.disabled = (total !== state.spielerzahl);
}

el.neumondAktiv.addEventListener('change', function() {
  state.neumondAktiv = this.checked;
});

el.btnStart.addEventListener('click', starteSpiel);

function starteSpiel() {
  // Namen speichern
  state.spielerNamen = [];
  for (let i = 1; i <= state.spielerzahl; i++) {
    state.spielerNamen.push(document.getElementById(`name-${i}`)?.value || `Spieler ${i}`);
  }

  // Rollenliste erstellen
  let rollenListe = [];
  for (const rolleKey in state.rollenVerteilung) {
    const count = state.rollenVerteilung[rolleKey] || 0;
    for (let i = 0; i < count; i++) {
      if (rolleKey === 'schwestern') {
        rollenListe.push(rolleKey);
        rollenListe.push(rolleKey);
      } else {
        rollenListe.push(rolleKey);
      }
    }
  }

  // ZUFÄLLIG MISCHEN!
  for (let i = rollenListe.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [rollenListe[i], rollenListe[j]] = [rollenListe[j], rollenListe[i]];
  }

  // Spieler erstellen
  state.spieler = [];
  for (let i = 0; i < state.spielerzahl; i++) {
    const name = state.spielerNamen[i];
    const rolle = rollenListe[i] || 'dorfbewohner';
    state.spieler.push({
      id: i + 1,
      name,
      lebend: true,
      rolle,
      rolleName: ROLLEN[rolle]
    });
    if (rolle === 'alte') {
      state.alteLeben[i + 1] = 2;
    }
  }

  // Zur Rollen-Phase
  el.phaseSetup.classList.remove('active');
  el.phaseRollen.classList.add('active');
  state.phase = 'rollen';
  state.aktuelleNacht = 1;
  state.toteDieseNacht = [];
  state.liebespaar = null;
  state.floeteZiel = [];
  state.hexeHeil = true;
  state.hexeGift = true;
  state.ersteHauptmannWahl = true;
  state.engelHingerichtetTag1 = false;
  state.wildeKindMentor = null;
  state.wolfshundTeam = null;
  state.ritterGetötet = false;
  state.ritterTöter = null;
  zeigeNaechsteRolle(0);
}

// ===== ROLLEN VERTEILEN =====
function zeigeNaechsteRolle(index) {
  if (index >= state.spieler.length) {
    el.phaseRollen.classList.remove('active');
    el.phaseSpiel.classList.add('active');
    state.phase = 'nacht';
    starteNachtPhase();
    return;
  }

  const p = state.spieler[index];
  el.rolleTitel.textContent = p.name;
  el.rolleInhalt.innerHTML = `
    <div class="info-box">
      <p>Drücke auf „Anzeigen“, um deine Rolle zu sehen.</p>
      <button id="btn-rolle-anzeigen" class="success"><i class="fas fa-eye"></i> Rolle anzeigen</button>
      <div id="rolle-text" class="hidden" style="margin-top:15px; padding:15px; background:#e8f5e8; border-radius:10px; font-weight:bold;"></div>
    </div>
  `;

  el.btnRolleWeiter.classList.add('hidden');

  document.getElementById('btn-rolle-anzeigen').onclick = () => {
    document.getElementById('rolle-text').textContent = `Du bist: ${p.rolleName}`;
    document.getElementById('rolle-text').classList.remove('hidden');
    el.btnRolleWeiter.classList.remove('hidden');
    el.btnRolleWeiter.onclick = () => zeigeNaechsteRolle(index + 1);
  };
}

// ===== NACHTPHASE =====
function starteNachtPhase() {
  el.spielTitel.textContent = `Nacht ${state.aktuelleNacht}`;
  state.toteDieseNacht = [];
  
  // Neumond-Ereignis
  if (state.neumondAktiv) {
    const idx = Math.floor(Math.random() * NEUMOND_EREIGNISSE.length);
    state.ereignis = NEUMOND_EREIGNISSE[idx];
  } else {
    state.ereignis = null;
  }

  let html = `<h3><i class="fas fa-moon"></i> Nacht ${state.aktuelleNacht}</h3>`;
  
  if (state.ereignis) {
    html += `<div class="info-box" style="background:#fff8e1; border-left-color:#ffc107;">
      <h4><i class="fas fa-meteor"></i> Neumond-Ereignis</h4>
      <p><strong>${state.ereignis}</strong></p>
    </div>`;
  }

  // Amor (Nacht 1)
  if (state.aktuelleNacht === 1) {
    const amor = state.spieler.find(p => p.lebend && p.rolle === 'amor');
    if (amor) {
      html += `<div class="info-box"><h4><i class="fas fa-heart"></i> Amor</h4><p>Wähle zwei Spieler für das Liebespaar:</p>`;
      html += `<select id="amor-1">`;
      state.spieler.forEach(p => html += `<option value="${p.id}">${p.name}</option>`);
      html += `</select> und <select id="amor-2">`;
      state.spieler.forEach(p => html += `<option value="${p.id}">${p.name}</option>`);
      html += `</select></div>`;
    }
  }

  // Wilde Kind (Nacht 1)
  if (state.aktuelleNacht === 1) {
    const wk = state.spieler.find(p => p.lebend && p.rolle === 'wilde_kind');
    if (wk) {
      html += `<div class="info-box"><h4><i class="fas fa-child"></i> Das wilde Kind</h4><p>Wähle dein Vorbild:</p>`;
      html += `<select id="wilde-kind-mentor">`;
      state.spieler.filter(p => p.id !== wk.id).forEach(p => html += `<option value="${p.id}">${p.name}</option>`);
      html += `</select></div>`;
    }
  }

  // Wolfshund (Nacht 1)
  if (state.aktuelleNacht === 1) {
    const wh = state.spieler.find(p => p.lebend && p.rolle === 'wolfshund');
    if (wh) {
      html += `<div class="info-box"><h4><i class="fas fa-dog"></i> Der Wolfshund</h4>`;
      html += `<p>Auf welcher Seite spielst du?</p>`;
      html += `<label><input type="radio" name="wolfshund-team" value="dorfbewohner" checked> Dorf</label> `;
      html += `<label><input type="radio" name="wolfshund-team" value="werwolf"> Werwölfe</label>`;
      html += `</div>`;
    }
  }

  // Flötenspieler
  const floete = state.spieler.find(p => p.lebend && p.rolle === 'floete');
  if (floete) {
    html += `<div class="info-box"><h4><i class="fas fa-music"></i> Der Flötenspieler</h4><p>Wähle zwei Spieler zum Verzaubern:</p>`;
    html += `<select id="floete-1">`;
    state.spieler.filter(p => p.lebend && p.id !== floete.id).forEach(p => html += `<option value="${p.id}">${p.name}</option>`);
    html += `</select> und <select id="floete-2">`;
    state.spieler.filter(p => p.lebend && p.id !== floete.id).forEach(p => html += `<option value="${p.id}">${p.name}</option>`);
    html += `</select></div>`;
  }

  // Werwölfe
  const werwoelfe = state.spieler.filter(p => p.lebend && 
    (p.rolle === 'werwolf' || 
     p.rolle === 'urwolf' || 
     p.rolle === 'grosser_wolf' ||
     (p.rolle === 'wilde_kind' && state.wildeKindMentor && !state.spieler.find(x => x.id === state.wildeKindMentor)?.lebend) ||
     (p.rolle === 'wolfshund' && state.wolfshundTeam === 'werwolf')
    )
  );
  if (werwoelfe.length > 0) {
    html += `<div class="info-box"><h4><i class="fas fa-wolf-pack"></i> Werwölfe</h4><p>Wen tötet ihr?</p>`;
    html += `<select id="werwolf-opfer">`;
    state.spieler.filter(p => p.lebend).forEach(p => html += `<option value="${p.id}">${p.name}</option>`);
    html += `</select></div>`;
  }

  // Großer Wolf (jede Nacht, solange kein Werwolf tot)
  const lebendeWerwoelfe = state.spieler.filter(p => p.lebend && ['werwolf','urwolf','grosser_wolf'].includes(p.rolle));
  if (lebendeWerwoelfe.length > 0) {
    const gw = state.spieler.find(p => p.lebend && p.rolle === 'grosser_wolf');
    if (gw) {
      html += `<div class="info-box"><h4><i class="fas fa-dragon"></i> Großer böser Wolf</h4><p>Zweites Opfer:</p>`;
      html += `<select id="grosser-opfer">`;
      state.spieler.filter(p => p.lebend).forEach(p => html += `<option value="${p.id}">${p.name}</option>`);
      html += `</select></div>`;
    }
  }

  // Hexe
  const hexe = state.spieler.find(p => p.lebend && p.rolle === 'hexe');
  if (hexe && (state.hexeHeil || state.hexeGift)) {
    html += `<div class="info-box"><h4><i class="fas fa-potion"></i> Die Hexe</h4>`;
    if (state.hexeHeil) {
      html += `<p><label><input type="checkbox" id="hexe-heilen"> Opfer der Werwölfe heilen</label></p>`;
    }
    if (state.hexeGift) {
      html += `<p>Gifttrank: <select id="hexe-gift">`;
      state.spieler.filter(p => p.lebend).forEach(p => html += `<option value="${p.id}">${p.name}</option>`);
      html += `</select></p>`;
    }
    html += `</div>`;
  }

  // Seherin
  const seherin = state.spieler.find(p => p.lebend && p.rolle === 'seherin');
  if (seherin) {
    html += `<div class="info-box"><h4><i class="fas fa-eyes"></i> Die Seherin</h4><p>Wen willst du ausspähen?</p>`;
    html += `<select id="seherin-ziel">`;
    state.spieler.filter(p => p.lebend).forEach(p => html += `<option value="${p.id}">${p.name}</option>`);
    html += `</select>`;
    html += `<button id="btn-seherin-pruefen" class="success" style="margin-top:10px;"><i class="fas fa-search"></i> Ausspähen</button></div>`;
  }

  // Fuchs
  const fuchs = state.spieler.find(p => p.lebend && p.rolle === 'fuchs');
  if (fuchs) {
    html += `<div class="info-box"><h4><i class="fas fa-fox"></i> Der Fuchs</h4><p>Wähle die mittlere Person von 3 Nebeneinanderstehenden:</p>`;
    html += `<select id="fuchs-mitte">`;
    state.spieler.filter(p => p.lebend).forEach(p => html += `<option value="${p.id}">${p.name}</option>`);
    html += `</select></div>`;
  }

  // Kleines Mädchen
  const maedchen = state.spieler.find(p => p.lebend && p.rolle === 'maedchen');
  if (maedchen) {
    html += `<div class="info-box"><h4><i class="fas fa-child"></i> Das kleine Mädchen</h4>`;
    html += `<p>Nachdem die Werwölfe eingeschlafen sind: Wurde es entdeckt?</p>`;
    html += `<label><input type="radio" name="maedchen-entdeckt" value="nein" checked> Nein</label> `;
    html += `<label><input type="radio" name="maedchen-entdeckt" value="ja"> Ja</label>`;
    html += `</div>`;
  }

  el.spielInhalt.innerHTML = html;
  el.btnSpielWeiter.classList.add('hidden');

  // Seherin-Button
  document.getElementById('btn-seherin-pruefen')?.addEventListener('click', () => {
    const zielId = document.getElementById('seherin-ziel')?.value;
    if (zielId) {
      const ziel = state.spieler.find(p => p.id === parseInt(zielId));
      if (ziel) {
        el.phaseSpiel.classList.remove('active');
        el.phaseSeherin.classList.add('active');
        el.seherinText.textContent = `${ziel.name} ist ${ziel.rolleName}`;
        el.btnSeherinWeiter.onclick = () => {
          el.phaseSeherin.classList.remove('active');
          el.phaseSpiel.classList.add('active');
        };
      }
    }
  });

  el.btnSpielWeiter.onclick = verarbeiteNacht;
  renderSpielerListen();
  renderSpielleiterPanel();
}

function verarbeiteNacht() {
  // Amor
  if (state.aktuelleNacht === 1) {
    const a1 = document.getElementById('amor-1')?.value;
    const a2 = document.getElementById('amor-2')?.value;
    if (a1 && a2 && a1 !== a2) {
      state.liebespaar = [parseInt(a1), parseInt(a2)];
    }
  }

  // Wilde Kind
  if (state.aktuelleNacht === 1) {
    const mentorId = document.getElementById('wilde-kind-mentor')?.value;
    if (mentorId) {
      state.wildeKindMentor = parseInt(mentorId);
    }
  }

  // Wolfshund
  if (state.aktuelleNacht === 1) {
    const team = document.querySelector('input[name="wolfshund-team"]:checked')?.value;
    if (team) {
      state.wolfshundTeam = team;
    }
  }

  // Flötenspieler
  const f1 = document.getElementById('floete-1')?.value;
  const f2 = document.getElementById('floete-2')?.value;
  if (f1 && f2 && f1 !== f2) {
    state.floeteZiel = [parseInt(f1), parseInt(f2)];
  }

  // Werwolf-Opfer speichern
  const wwOpferId = document.getElementById('werwolf-opfer')?.value;
  if (wwOpferId) {
    const opfer = state.spieler.find(p => p.id === parseInt(wwOpferId));
    if (opfer) {
      state.werwolfOpfer = opfer.id;
      state.werwolfOpferRolle = opfer.rolleName;
    }
  }

  // Hexe
  let opferGerettet = false;
  if (document.getElementById('hexe-heilen')?.checked && state.hexeHeil) {
    state.hexeHeil = false;
    opferGerettet = true;
  }

  const giftId = document.getElementById('hexe-gift')?.value;
  if (giftId && state.hexeGift) {
    state.hexeGift = false;
    const p = state.spieler.find(x => x.id === parseInt(giftId));
    if (p && p.lebend) {
      p.lebend = false;
      state.toteDieseNacht.push({ name: p.name, rolle: p.rolleName });
    }
  }

  // Kleines Mädchen
  state.maedchenEntdeckt = document.querySelector('input[name="maedchen-entdeckt"]:checked')?.value === 'ja';
  if (state.maedchenEntdeckt) {
    const m = state.spieler.find(p => p.rolle === 'maedchen');
    if (m && m.lebend) {
      m.lebend = false;
      state.toteDieseNacht.push({ name: m.name, rolle: m.rolleName });
    }
  }

  // Werwolf-Opfer (wenn nicht gerettet)
  if (state.werwolfOpfer && !opferGerettet) {
    const opfer = state.spieler.find(p => p.id === state.werwolfOpfer);
    if (opfer && opfer.lebend) {
      // Ritter-Spezialfall
      if (opfer.rolle === 'ritter') {
        state.ritterGetötet = true;
        // Finde nächsten Werwolf im Uhrzeigersinn
        const idx = state.spieler.findIndex(p => p.id === opfer.id);
        let nextWerwolf = null;
        for (let i = 1; i < state.spieler.length; i++) {
          const nextIdx = (idx + i) % state.spieler.length;
          const p = state.spieler[nextIdx];
          if (p.lebend && ['werwolf','urwolf','grosser_wolf'].includes(p.rolle)) {
            nextWerwolf = p;
            break;
          }
        }
        if (nextWerwolf) {
          state.ritterTöter = nextWerwolf.id;
        }
      }
      opfer.lebend = false;
      state.toteDieseNacht.push({ name: opfer.name, rolle: state.werwolfOpferRolle });
    }
  }

  // Großer Wolf
  const gwOpferId = document.getElementById('grosser-opfer')?.value;
  if (gwOpferId) {
    const opfer = state.spieler.find(p => p.id === parseInt(gwOpferId));
    if (opfer && opfer.lebend) {
      opfer.lebend = false;
      state.toteDieseNacht.push({ name: opfer.name, rolle: opfer.rolleName });
    }
  }

  // Fuchs
  const fuchsMitteId = document.getElementById('fuchs-mitte')?.value;
  if (fuchsMitteId) {
    const mitteIdx = state.spieler.findIndex(p => p.id === parseInt(fuchsMitteId));
    if (mitteIdx !== -1) {
      const linksIdx = (mitteIdx - 1 + state.spieler.length) % state.spieler.length;
      const rechtsIdx = (mitteIdx + 1) % state.spieler.length;
      const gruppe = [state.spieler[linksIdx], state.spieler[mitteIdx], state.spieler[rechtsIdx]];
      const hatWerwolf = gruppe.some(p => p.lebend && ['werwolf','urwolf','grosser_wolf'].includes(p.rolle));
      alert(`Der Fuchs erfährt: ${hatWerwolf ? 'Mindestens ein Werwolf dabei.' : 'Alle unschuldig.'}`);
    }
  }

  // Liebespaar-Tode (Nacht)
  if (state.liebespaar) {
    const [a, b] = state.liebespaar;
    const pA = state.spieler.find(p => p.id === a);
    const pB = state.spieler.find(p => p.id === b);
    let neueTote = false;
    if (pA && !pA.lebend && pB && pB.lebend) {
      pB.lebend = false;
      state.toteDieseNacht.push({ name: pB.name, rolle: pB.rolleName });
      neueTote = true;
    } else if (pB && !pB.lebend && pA && pA.lebend) {
      pA.lebend = false;
      state.toteDieseNacht.push({ name: pA.name, rolle: pA.rolleName });
      neueTote = true;
    }
  }

  // Zur Tagphase
  starteTagPhase();
}

function starteTagPhase() {
  // Ritter-Vergiftung am Morgen
  if (state.ritterGetötet && state.ritterTöter) {
    const töter = state.spieler.find(p => p.id === state.ritterTöter);
    if (töter && töter.lebend) {
      töter.lebend = false;
      state.toteDieseNacht.push({ name: töter.name, rolle: töter.rolleName });
    }
    state.ritterGetötet = false;
    state.ritterTöter = null;
  }

  el.spielTitel.textContent = `Tag ${state.aktuelleNacht}`;
  let html = `<h3><i class="fas fa-sun"></i> Tag ${state.aktuelleNacht}</h3>`;

  // Bärenführer am Morgen
  const baer = state.spieler.find(p => p.lebend && p.rolle === 'baer');
  if (baer) {
    const idx = state.spieler.findIndex(p => p.id === baer.id);
    const links = state.spieler[(idx - 1 + state.spieler.length) % state.spieler.length];
    const rechts = state.spieler[(idx + 1) % state.spieler.length];
    const hatWerwolfNachbar = (links.lebend && ['werwolf','urwolf','grosser_wolf'].includes(links.rolle)) ||
                             (rechts.lebend && ['werwolf','urwolf','grosser_wolf'].includes(rechts.rolle));
    if (hatWerwolfNachbar) {
      html += `<div class="info-box" style="background:#fff3e0;"><p><i class="fas fa-bear"></i> Der Bär brummt! Ein Werwolf sitzt neben dem Bärenführer.</p></div>`;
    }
  }

  // Tote anzeigen
  if (state.toteDieseNacht.length > 0) {
    html += `<div class="info-box"><h4><i class="fas fa-skull"></i> Tote der Nacht</h4><ul>`;
    state.toteDieseNacht.forEach(t => {
      html += `<li><strong>${t.name}</strong> war ${t.rolle}</li>`;
    });
    html += `</ul></div>`;
  } else {
    html += `<div class="info-box"><p>Keine Toten in der Nacht.</p></div>`;
  }

  // Hauptmann-Wahl (erster Tag)
  if (state.aktuelleNacht === 1 && state.ersteHauptmannWahl) {
    html += `<div class="info-box"><h4><i class="fas fa-crown"></i> Hauptmann wählen</h4>`;
    html += `<p>Wer soll der Hauptmann sein?</p>`;
    html += `<select id="hauptmann-wahl">`;
    state.spieler.filter(p => p.lebend).forEach(p => {
      html += `<option value="${p.id}">${p.name}</option>`;
    });
    html += `</select></div>`;
  }

  // Hinrichtung
  html += `<div class="info-box"><h4><i class="fas fa-gavel"></i> Hinrichtung</h4>`;
  html += `<p>Wen beschuldigt das Dorf?</p>`;
  html += `<select id="hinrichtung">`;
  state.spieler.filter(p => p.lebend).forEach(p => {
    html += `<option value="${p.id}">${p.name}</option>`;
  });
  html += `</select>`;
  html += `<button onclick="fuehreHinrichtungAus()" class="danger"><i class="fas fa-skull-crossbones"></i> Hinrichten</button></div>`;

  el.spielInhalt.innerHTML = html;
  el.btnSpielWeiter.classList.add('hidden');
  renderSpielerListen();
  renderSpielleiterPanel();
}

function fuehreHinrichtungAus() {
  // Hauptmann speichern
  if (state.aktuelleNacht === 1 && state.ersteHauptmannWahl) {
    const hId = document.getElementById('hauptmann-wahl')?.value;
    if (hId) state.hauptmann = parseInt(hId);
    state.ersteHauptmannWahl = false;
  }

  const id = parseInt(document.getElementById('hinrichtung').value);
  const opfer = state.spieler.find(p => p.id === id);
  let hingerichteteTote = [];
  if (opfer && opfer.lebend) {
    // Alte: stirbt sofort bei Hinrichtung
    if (opfer.rolle === 'alte') {
      opfer.lebend = false;
      hingerichteteTote.push({ name: opfer.name, rolle: opfer.rolleName });
    } 
    // Engel: gewinnt bei Tag 1
    else if (state.aktuelleNacht === 1 && opfer.rolle === 'engel') {
      state.engelHingerichtetTag1 = true;
      opfer.lebend = false;
      hingerichteteTote.push({ name: opfer.name, rolle: opfer.rolleName });
    }
    // Normale Rollen
    else {
      opfer.lebend = false;
      hingerichteteTote.push({ name: opfer.name, rolle: opfer.rolleName });
    }
  }

  // Liebespaar-Tode (Tag)
  let liebespaarTote = [];
  if (state.liebespaar) {
    const [a, b] = state.liebespaar;
    const pA = state.spieler.find(p => p.id === a);
    const pB = state.spieler.find(p => p.id === b);
    if (pA && !pA.lebend && pB && pB.lebend) {
      pB.lebend = false;
      liebespaarTote.push({ name: pB.name, rolle: pB.rolleName });
    } else if (pB && !pB.lebend && pA && pA.lebend) {
      pA.lebend = false;
      liebespaarTote.push({ name: pA.name, rolle: pA.rolleName });
    }
  }

  // Alle Tote sammeln
  state.toteDieseNacht = [...hingerichteteTote, ...liebespaarTote];

  // Siegbedingungen prüfen
  pruefeSiegbedingungen();
}

function pruefeSiegbedingungen() {
  const lebende = state.spieler.filter(p => p.lebend);
  const boese = lebende.filter(p => ['werwolf','urwolf','grosser_wolf'].includes(p.rolle));
  const gut = lebende.filter(p => !['werwolf','urwolf','grosser_wolf'].includes(p.rolle));

  let sieger = null;
  let nachricht = "";

  // Engel
  if (state.engelHingerichtetTag1) {
    sieger = "engel";
    nachricht = "🎉 <strong>Der Engel gewinnt!</strong><br>Er wurde am ersten Tag hingerichtet.";
  }
  // Liebespaar
  else if (state.liebespaar && lebende.length === 2 && 
           lebende.some(p => p.id === state.liebespaar[0]) && 
           lebende.some(p => p.id === state.liebespaar[1])) {
    sieger = "liebespaar";
    nachricht = "💖 <strong>Das Liebespaar gewinnt!</strong><br>Nur sie beide überleben.";
  }
  // Flötenspieler
  else if (state.floeteZiel.length === 2) {
    const floeteSpieler = state.spieler.find(p => p.rolle === 'floete' && p.lebend);
    if (floeteSpieler) {
      const alleVerzaubert = lebende.every(p => 
        p.id === floeteSpieler.id || 
        state.floeteZiel.includes(p.id)
      );
      if (alleVerzaubert && lebende.length >= 2) {
        sieger = "floete";
        nachricht = "🎵 <strong>Der Flötenspieler gewinnt!</strong><br>Nur Verzauberte leben.";
      }
    }
  }
  // Dorf
  else if (boese.length === 0) {
    sieger = "dorf";
    nachricht = "🏡 <strong>Das Dorf gewinnt!</strong><br>Alle Werwölfe sind besiegt.";
  }
  // Werwölfe
  else if (boese.length >= gut.length) {
    sieger = "werwoelfe";
    nachricht = "🐺 <strong>Die Werwölfe gewinnen!</strong><br>Sie haben das Dorf übernommen.";
  }

  if (sieger) {
    let html = `<div class="info-box" style="text-align:center; padding:30px;">`;
    html += `<h2 style="margin-bottom:20px;">Spielende</h2>`;
    html += `<p style="font-size:1.3rem; margin:20px 0;">${nachricht}</p>`;
    html += `<button onclick="neueRundeGleicheSpieler()" class="success" style="margin:10px;"><i class="fas fa-redo"></i> Neue Runde (gleiche Spieler)</button>`;
    html += `<button onclick="neuesSpiel()" class="secondary" style="margin:10px;"><i class="fas fa-plus-circle"></i> Neues Spiel</button>`;
    html += `</div>`;
    el.spielInhalt.innerHTML = html;
  } else {
    state.aktuelleNacht++;
    starteNachtPhase();
  }
  renderSpielerListen();
  renderSpielleiterPanel();
}

// ===== NEUE RUNDE / NEUES SPIEL =====
function neueRundeGleicheSpieler() {
  el.phaseSpiel.classList.remove('active');
  el.phaseSetup.classList.add('active');
  state.phase = 'setup';
  updateNamenFelder();
  state.rollenVerteilung = {};
  renderRollen();
  updateGesamt();
}

function neuesSpiel() {
  state = {
    spielerzahl: 8,
    spielerNamen: [],
    rollenVerteilung: {},
    neumondAktiv: false,
    spieler: [],
    aktuelleNacht: 1,
    phase: 'setup',
    liebespaar: null,
    floeteZiel: [],
    hexeHeil: true,
    hexeGift: true,
    werwolfOpfer: null,
    werwolfOpferRolle: null,
    grosserWolfOpfer: null,
    maedchenEntdeckt: false,
    toteDieseNacht: [],
    hauptmann: null,
    ersteHauptmannWahl: true,
    engelHingerichtetTag1: false,
    ereignis: null,
    wildeKindMentor: null,
    wolfshundTeam: null,
    alteLeben: {},
    ritterGetötet: false,
    ritterTöter: null
  };
  el.phaseSpiel.classList.remove('active');
  el.phaseSetup.classList.add('active');
  el.neumondAktiv.checked = false;
  updateNamenFelder();
  renderRollen();
  updateGesamt();
}

// ===== SPIELLEITER ANSICHT =====
el.btnSpielleiter.addEventListener('click', function() {
  if (el.spielleiterPanel.classList.contains('hidden')) {
    renderSpielleiterPanel();
    el.spielleiterPanel.classList.remove('hidden');
    this.innerHTML = '<i class="fas fa-user-secret"></i> Spielleiter-Ansicht ausblenden';
  } else {
    el.spielleiterPanel.classList.add('hidden');
    this.innerHTML = '<i class="fas fa-user-secret"></i> Spielleiter-Ansicht';
  }
});

function renderSpielleiterPanel() {
  let html = `<h3><i class="fas fa-user-secret"></i> Spielleiter-Übersicht</h3>`;
  
  // Alle Rollen
  html += `<h4>Rollenverteilung:</h4><ul>`;
  state.spieler.forEach(p => {
    html += `<li>${p.name}: ${p.rolleName} ${p.lebend ? '' : '(tot)'}</li>`;
  });
  html += `</ul>`;

  // Liebespaar
  if (state.liebespaar) {
    const p1 = state.spieler.find(p => p.id === state.liebespaar[0]);
    const p2 = state.spieler.find(p => p.id === state.liebespaar[1]);
    html += `<h4>Liebespaar:</h4><p>${p1?.name || '?'} ❤️ ${p2?.name || '?'}</p>`;
  }

  // Flötenspieler
  if (state.floeteZiel.length === 2) {
    const p1 = state.spieler.find(p => p.id === state.floeteZiel[0]);
    const p2 = state.spieler.find(p => p.id === state.floeteZiel[1]);
    html += `<h4>Flötenspieler-Ziele:</h4><p>${p1?.name || '?'} & ${p2?.name || '?'}</p>`;
  }

  el.spielleiterPanel.innerHTML = html;
}

function renderSpielerListen() {
  // Lebende
  el.lebendeListe.innerHTML = '';
  state.spieler.filter(p => p.lebend).forEach(p => {
    const div = document.createElement('div');
    div.className = 'spieler-card';
    if (state.hauptmann === p.id) {
      div.innerHTML = `<i class="fas fa-crown" style="color:gold;"></i> ${p.name}`;
    } else {
      div.textContent = p.name;
    }
    el.lebendeListe.appendChild(div);
  });

  // Tote
  el.toteListe.innerHTML = '';
  state.spieler.filter(p => !p.lebend).forEach(p => {
    const div = document.createElement('div');
    div.className = 'spieler-card tot';
    div.textContent = `${p.name} (${p.rolleName})`;
    el.toteListe.appendChild(div);
  });
}

// Init
updateNamenFelder();
