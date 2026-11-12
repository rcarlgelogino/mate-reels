// Rule-based Spanish -> IPA (rioplatense: ll/y -> ʃ, seseo), with stress marks, for Kokoro.
const V = 'aeiouáéíóúü';
const isV = ch => V.includes(ch);
const strip = ch => ({ á: 'a', é: 'e', í: 'i', ó: 'o', ú: 'u', ü: 'u' }[ch] || ch);
function stressIndex(w) { // index (in letters) of the stressed vowel
  for (let i = 0; i < w.length; i++) if ('áéíóú'.includes(w[i])) return i;
  const nuclei = []; for (let i = 0; i < w.length; i++) { if (!isV(w[i])) continue; // merge diphthongs (weak i/u + vowel)
    const prev = nuclei.length ? nuclei[nuclei.length - 1] : null;
    if (prev && prev.end === i - 1 && ('iuü'.includes(w[i]) || 'iu'.includes(w[prev.end]))) { prev.end = i; if (!'iu'.includes(w[i])) prev.main = i; else if ('iu'.includes(w[prev.main]) && !'iu'.includes(w[i])) prev.main = i; continue; }
    nuclei.push({ start: i, end: i, main: i }); }
  if (!nuclei.length) return -1; if (nuclei.length === 1) return nuclei[0].main;
  const last = w[w.length - 1]; const n = /[aeiouns]/.test(last) ? nuclei[nuclei.length - 2] : nuclei[nuclei.length - 1];
  return n.main; }
export function wordIPA(word) {
  let w = word.toLowerCase(); if (!w) return ''; const st = stressIndex(w); let out = ''; let stressAt = -1; let skipU = -1;
  for (let i = 0; i < w.length; i++) { const c = w[i], n = w[i + 1] || '', p = w[i - 1] || ''; const vPrev = i > 0 && isV(p) && skipU !== i - 1;
    if (i === st) stressAt = out.length;
    if (isV(c)) { if (c === 'u' && (p === 'q' || (p === 'g' && 'eiéí'.includes(n)))) { skipU = i; continue; } let ch = strip(c);
      if ((ch === 'i' || ch === 'u') && i !== st && (isV(n) || vPrev)) ch = ch === 'i' ? 'j' : 'w'; if (c === 'y') ch = 'i'; out += ch; continue; }
    if (c === 'h') continue;
    if (c === 'c' && n === 'h') { out += 'tʃ'; i++; continue; }
    if (c === 'l' && n === 'l') { out += 'ʃ'; i++; continue; }
    if (c === 'r' && n === 'r') { out += 'r'; i++; continue; }
    if (c === 'q') { out += 'k'; continue; }
    if (c === 'c') { out += 'eiéí'.includes(n) ? 's' : 'k'; continue; }
    if (c === 'z') { out += 's'; continue; }
    if (c === 'g') { out += 'eiéí'.includes(n) ? 'x' : (vPrev ? 'ɣ' : 'g'); continue; }
    if (c === 'j') { out += 'x'; continue; }
    if (c === 'ñ') { out += 'ɲ'; continue; }
    if (c === 'y') { out += (!n || !isV(n)) ? 'i' : 'ʃ'; continue; }
    if (c === 'v' || c === 'b') { out += vPrev ? 'β' : 'b'; continue; }
    if (c === 'd') { out += vPrev || i === w.length - 1 ? 'ð' : 'd'; continue; }
    if (c === 'r') { out += (i === 0 || 'lns'.includes(p)) ? 'r' : 'ɾ'; continue; }
    if (c === 'x') { out += 'ks'; continue; }
    if (c === 's' && n && !isV(n) && 'bdgmnlr'.includes(n)) { out += 's'; continue; }
    out += c; }
  if (stressAt >= 0 && w.length > 3) { let k = stressAt; while (k > 0 && 'jw'.includes(out[k - 1])) k--; const C = c => c && !'aeiou'.includes(c) && c !== ' '; if (C(out[k - 1])) { k--; if ('lɾ'.includes(out[k]) && C(out[k - 1]) && 'pbtdkgfβðɣ'.includes(out[k - 1])) k--; else if (out[k] === 'ʃ' && out[k - 1] === 't') k--; } out = out.slice(0, k) + 'ˈ' + out.slice(k); }
  return out; }
export function esIPA(text) {
  return text.replace(/[¿¡]/g, '').replace(/\s+/g, ' ').trim().split(/(\s+|[.,!?;:…])/).map(t => /^[\p{L}]+$/u.test(t) ? wordIPA(t) : t).join('').replace(/\s+([.,!?;:])/g, '$1'); }
