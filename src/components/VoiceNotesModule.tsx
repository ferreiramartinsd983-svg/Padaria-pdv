import React, { useEffect, useRef, useState } from 'react';
import { Mic, MicOff, Plus, Save, Trash2, Search, StickyNote, SquarePen } from 'lucide-react';
import { VoiceNote } from '../types/padaria';
import { storage } from '../services/storage';

type SpeechResult = { isFinal: boolean; 0: { transcript: string } };
type SpeechRecognitionEventLike = { resultIndex: number; results: ArrayLike<SpeechResult> };
type SpeechRecognitionLike = {
  lang: string; continuous: boolean; interimResults: boolean;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void; stop: () => void; abort: () => void;
};
type SpeechWindow = Window & { SpeechRecognition?: new () => SpeechRecognitionLike; webkitSpeechRecognition?: new () => SpeechRecognitionLike };

const makeNote = (): VoiceNote => ({ id: `note_${Date.now()}`, title: '', text: '', createdAt: Date.now(), updatedAt: Date.now() });

export const VoiceNotesModule: React.FC = () => {
  const [notes, setNotes] = useState<VoiceNote[]>(() => storage.getVoiceNotes());
  const [activeId, setActiveId] = useState<string | null>(null);
  const [draft, setDraft] = useState<VoiceNote | null>(null);
  const [query, setQuery] = useState('');
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState('');
  const [message, setMessage] = useState('');
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const draftRef = useRef<VoiceNote | null>(null);

  useEffect(() => { draftRef.current = draft; }, [draft]);
  useEffect(() => () => recognitionRef.current?.abort(), []);

  const persist = (updated: VoiceNote[]) => { setNotes(updated); storage.saveVoiceNotes(updated); };
  const newNote = () => { recognitionRef.current?.stop(); const note = makeNote(); setDraft(note); setActiveId(note.id); setMessage(''); };
  const openNote = (note: VoiceNote) => { recognitionRef.current?.stop(); setDraft({ ...note }); setActiveId(note.id); setMessage(''); };
  const saveNote = () => {
    if (!draft || (!draft.title.trim() && !draft.text.trim())) { setMessage('Escreva um título ou conteúdo antes de salvar.'); return; }
    const saved = { ...draft, title: draft.title.trim() || 'Anotação sem título', updatedAt: Date.now() };
    persist([saved, ...notes.filter(note => note.id !== saved.id)]);
    setDraft(saved); setActiveId(saved.id); setMessage('Anotação salva neste aparelho.');
  };
  const deleteNote = (id: string) => {
    recognitionRef.current?.stop();
    persist(notes.filter(note => note.id !== id));
    if (activeId === id) { setActiveId(null); setDraft(null); }
    setMessage('Anotação excluída.');
  };
  const toggleRecording = () => {
    if (listening) { recognitionRef.current?.stop(); return; }
    const SpeechRecognition = (window as SpeechWindow).SpeechRecognition || (window as SpeechWindow).webkitSpeechRecognition;
    if (!SpeechRecognition) { setMessage('O reconhecimento de voz não está disponível neste navegador. Você ainda pode digitar a anotação.'); return; }
    if (!draft) { const note = makeNote(); setDraft(note); setActiveId(note.id); draftRef.current = note; }
    setMessage(''); setInterim('');
    const recognition = new SpeechRecognition();
    recognition.lang = 'pt-BR'; recognition.continuous = true; recognition.interimResults = true;
    recognition.onresult = event => {
      let finalText = ''; let current = '';
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i];
        if (result.isFinal) finalText += result[0].transcript;
        else current += result[0].transcript;
      }
      setInterim(current);
      if (finalText.trim()) {
        const existing = draftRef.current;
        if (existing) { const updated = { ...existing, text: `${existing.text}${existing.text ? ' ' : ''}${finalText.trim()}` }; draftRef.current = updated; setDraft(updated); }
      }
    };
    recognition.onerror = event => { setMessage(event.error === 'not-allowed' ? 'Permita o uso do microfone para ditar a anotação.' : `Falha no reconhecimento de voz (${event.error}). Você pode continuar digitando.`); setListening(false); setInterim(''); };
    recognition.onend = () => { setListening(false); setInterim(''); recognitionRef.current = null; };
    recognitionRef.current = recognition;
    try { recognition.start(); setListening(true); }
    catch { setListening(false); setMessage('Não foi possível iniciar o microfone. Tente novamente.'); }
  };

  const visibleNotes = notes.filter(note => `${note.title} ${note.text}`.toLocaleLowerCase('pt-BR').includes(query.toLocaleLowerCase('pt-BR')));
  return <div className="space-y-5">
    <header className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="flex items-center gap-2 text-xl font-extrabold"><StickyNote className="h-6 w-6 text-amber-500"/>Anotações por voz</h2><p className="mt-1 text-sm text-neutral-500">Dite lembretes, pedidos e ideias. As anotações ficam salvas neste aparelho.</p></div><button onClick={newNote} className="flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-bold text-white"><Plus className="h-4 w-4"/>Nova anotação</button></header>
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1.3fr)_minmax(280px,0.7fr)]">
      <section className="rounded-2xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
        {draft ? <div className="space-y-3"><div className="flex items-center justify-between gap-3"><h3 className="font-bold">{notes.some(note => note.id === draft.id) ? 'Editar anotação' : 'Nova anotação'}</h3><button onClick={toggleRecording} className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-bold text-white ${listening ? 'bg-red-600' : 'bg-emerald-600'}`}>{listening ? <MicOff className="h-4 w-4"/> : <Mic className="h-4 w-4"/>}{listening ? 'Parar gravação' : 'Ditar'}</button></div><input value={draft.title} onChange={e=>setDraft({...draft,title:e.target.value})} placeholder="Título da anotação" className="w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-800"/><textarea rows={10} value={draft.text} onChange={e=>setDraft({...draft,text:e.target.value})} placeholder="Toque em Ditar ou escreva sua anotação..." className="w-full resize-y rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-800"/>{interim&&<p className="rounded-lg bg-amber-50 p-2 text-sm text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">Ouvindo: {interim}</p>}<div className="flex flex-wrap items-center justify-between gap-3"><p className="text-xs text-neutral-500">{listening ? 'Fale agora; o texto reconhecido aparece acima.' : 'Você também pode editar o texto manualmente.'}</p><button onClick={saveNote} className="flex items-center gap-2 rounded-lg bg-neutral-900 px-4 py-2 text-sm font-bold text-white dark:bg-neutral-100 dark:text-neutral-900"><Save className="h-4 w-4"/>Salvar</button></div></div> : <div className="flex min-h-64 flex-col items-center justify-center text-center"><SquarePen className="mb-3 h-10 w-10 text-neutral-300"/><h3 className="font-bold">Escolha ou crie uma anotação</h3><p className="mt-1 max-w-sm text-sm text-neutral-500">Use o microfone para transformar sua fala em texto ou digite normalmente.</p></div>}
        {message&&<p role="status" className="mt-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-800 dark:bg-amber-950/40 dark:text-amber-200">{message}</p>}
      </section>
      <aside className="rounded-2xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900"><label className="relative block"><Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400"/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Buscar anotações" className="w-full rounded-lg border border-neutral-200 bg-neutral-50 py-2 pl-9 pr-3 text-sm dark:border-neutral-700 dark:bg-neutral-800"/></label><div className="mt-3 space-y-2">{visibleNotes.map(note=><article key={note.id} className={`rounded-xl border p-3 ${activeId===note.id?'border-amber-400 bg-amber-50/50 dark:bg-amber-950/20':'border-neutral-200 dark:border-neutral-800'}`}><button onClick={()=>openNote(note)} className="w-full text-left"><strong className="block truncate text-sm">{note.title || 'Anotação sem título'}</strong><span className="mt-1 block line-clamp-2 text-xs text-neutral-500">{note.text}</span><time className="mt-2 block text-[10px] text-neutral-400">{new Date(note.updatedAt).toLocaleString('pt-BR')}</time></button><div className="mt-2 flex justify-end"><button aria-label={`Excluir ${note.title}`} onClick={()=>deleteNote(note.id)} className="rounded p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"><Trash2 className="h-4 w-4"/></button></div></article>)}{!visibleNotes.length&&<p className="px-2 py-8 text-center text-sm text-neutral-500">{query?'Nenhuma anotação encontrada.':'Suas anotações aparecerão aqui.'}</p>}</div></aside>
    </div>
    <p className="text-xs text-neutral-500">O reconhecimento depende do navegador e pode exigir conexão com a internet. O texto transcrito é salvo localmente; o navegador pode processar o áudio por um serviço externo.</p>
  </div>;
};
