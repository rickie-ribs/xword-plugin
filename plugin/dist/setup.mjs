import{copyFileSync as $,existsSync as D,mkdirSync as y,readFileSync as g,renameSync as E,writeFileSync as m}from"node:fs";import{dirname as x,join as u}from"node:path";import{fileURLToPath as I}from"node:url";import{parseArgs as R}from"node:util";import{homedir as O}from"node:os";import{join as l}from"node:path";var d=process.env.GRID_GUIDE_HOME??l(O(),".grid-guide"),r=l(d,"wordlists","spreadthewordlist.txt"),w=l(d,"nyt"),k=l(w,"cookie.txt"),_=l(w,"word-data.json"),b=l(d,"contact.txt");var p=`Spread the Word(list) by Brooke Husic and Enrique Henestroza Anguiano
https://www.spreadthewordlist.com/
Licensed under CC BY-NC-SA 4.0: https://creativecommons.org/licenses/by-nc-sa/4.0/
Free to use in a product offered free of charge, with attribution, and to sell puzzles built with it.`;function c(t){let e=t.split(/\r?\n/).filter(o=>o.trim()),n=e.filter(o=>/^[^;]+;\d+$/.test(o.trim())).length;if(e.length<1e3)throw new Error(`Only ${e.length} lines: that doesn't look like a wordlist.`);if(n<e.length*.99)throw new Error(`Only ${n} of ${e.length} lines are WORD;SCORE.`);return e.length}function h(t,e){let n=new Set(e.split(/\r?\n/).filter(i=>i&&!i.startsWith("#"))),o=t.split(/\r?\n/).filter(Boolean),s=o.filter(i=>!n.has(i.split(";")[0]));return{text:`${s.join(`
`)}
`,dropped:o.length-s.length}}var S=u(x(I(import.meta.url)),"..","data","removed-words.txt"),f="https://www.spreadthewordlist.com/downloads/spreadthewordlist_caps.txt";async function T(){let{values:t}=R({options:{from:{type:"string"},update:{type:"boolean"},full:{type:"boolean"}}});if(D(r)&&!t.update&&!t.from){console.log(`A wordlist is already in place at ${r}. Add --update to download it again.`);return}y(x(r),{recursive:!0});let e=`${r}.partial`;if(t.from){let a=c(g(t.from,"utf8"));$(t.from,r),console.log(`Copied your list (${a} words) to ${r}.`),m(u(d,"ATTRIBUTION.md"),`# Wordlist

The user's own list, copied from ${t.from}.
`);return}console.log(`Downloading ${f} ...`);let n=await fetch(f);if(!n.ok)throw new Error(`The download failed (${n.status}).`);let o=await n.text();c(o);let s="the full list";if(!t.full){let a=h(o,g(S,"utf8"));o=a.text,s=`cleaned: ${a.dropped} junk, offensive or obscure words removed; --full keeps them`}let i=c(o);m(e,o),E(e,r),m(u(d,"ATTRIBUTION.md"),`# Wordlist

${p}

Downloaded ${new Date().toISOString().slice(0,10)} from ${f}; ${s}.
`),console.log(`Saved ${i} words to ${r} (${s}).

${p}`)}T().catch(t=>{console.error(`${t.message}
Get the list by hand from https://www.spreadthewordlist.com/ (uppercase .txt), or use any WORD;SCORE list, then run: node dist/setup.mjs --from FILE`),process.exit(1)});
