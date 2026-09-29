'use client';

import { useEffect, useMemo, useState } from 'react';
import { Check, Heart, Home, ImagePlus, Instagram, ListChecks, MessageCircle, MoreHorizontal, Send, Upload, WandSparkles } from 'lucide-react';
import BrandMark from '@/components/BrandMark';
import type { PostRecord } from '@/lib/types';

type Connection = { connected: boolean; connection?: { username: string; token_expires_at?: string | null } | null; setupRequired?: boolean };

export default function Dashboard() {
  const [connection, setConnection] = useState<Connection>({ connected: false });
  const [posts, setPosts] = useState<PostRecord[]>([]);
  const [caption, setCaption] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [altText, setAltText] = useState('');
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function refresh() {
    const [c, p] = await Promise.all([fetch('/api/instagram/status', { cache: 'no-store' }).then(r => r.json()), fetch('/api/posts', { cache: 'no-store' }).then(r => r.json())]);
    setConnection(c);
    setPosts(p.posts || []);
  }

  useEffect(() => { refresh(); const q = new URLSearchParams(window.location.search); if (q.get('connected')) setMessage('Instagram conectado com sucesso.'); if (q.get('ig_error')) setError('Não foi possível conectar o Instagram. Confira as configurações.'); }, []);

  const stats = useMemo(() => ({ drafts: posts.filter(p => p.status === 'draft' || p.status === 'failed').length, published: posts.filter(p => p.status === 'published').length, total: posts.length }), [posts]);

  async function upload(file?: File) {
    if (!file) return;
    setUploading(true); setError(''); setMessage('');
    try {
      const initRes = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: file.name, contentType: file.type || 'image/jpeg', size: file.size }),
      });
      const initData = await initRes.json();
      if (!initRes.ok) throw new Error(initData.error || 'Falha ao preparar upload.');

      const uploadRes = await fetch(initData.uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type || 'image/jpeg' },
        body: file,
      });
      if (!uploadRes.ok) throw new Error(`Falha ao enviar imagem (${uploadRes.status}).`);

      setMediaUrl(initData.url);
      setMessage('Imagem carregada com sucesso.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Falha no upload.');
    } finally {
      setUploading(false);
    }
  }

  async function saveDraft() {
    setBusy(true); setError(''); setMessage('');
    const res = await fetch('/api/posts', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ caption, media_url: mediaUrl, alt_text: altText }) });
    const data = await res.json(); setBusy(false);
    if (!res.ok) return setError(data.error || 'Falha ao salvar.');
    setMessage('Rascunho salvo para revisão.'); setCaption(''); setMediaUrl(''); setAltText(''); await refresh();
  }

  async function publish(id: string) {
    if (!confirm('Aprovar e publicar esse post agora no Instagram?')) return;
    setBusy(true); setError(''); setMessage('');
    const res = await fetch(`/api/posts/${id}/publish`, { method:'POST' }); const data = await res.json(); setBusy(false);
    if (!res.ok) { setError(data.error || 'Falha ao publicar.'); await refresh(); return; }
    setMessage('Post aprovado e enviado ao Buffer.'); await refresh();
  }

  return <main className="shell">
    <header className="topbar"><div className="brand"><BrandMark /><div><div className="brand-name">InstaPilot</div><div className="brand-sub">mini SaaS para aprovação e publicação</div></div></div><div className="pill"><span className="dot" /> revisão antes do envio</div></header>
    <div className="container">
      <section className="hero"><div><div className="eyebrow">Instagram workflow</div><h1>Crie. Revise. <br/>Publique com calma.</h1><div className="sub">Monte seus posts, confira o preview e publique pelo Buffer sem depender do app do Instagram em cada envio.</div></div></section>
      {message && <div className="flash"><Check size={15} style={{verticalAlign:'-3px',marginRight:8}} />{message}</div>}
      {error && <div className="flash" style={{borderColor:'rgba(255,103,103,.22)',background:'rgba(255,103,103,.07)',color:'#ffb3b3'}}>{error}</div>}
      <div className="grid">
        <section id="inicio">
          <div className="card">
            <div className="card-head"><div className="card-title">Conta conectada</div><Instagram size={17}/></div>
            <div className="card-body">
              <div className="connection"><div className="avatar">IG</div><div className="connection-meta"><div className="connection-name">{connection.connected ? `@${connection.connection?.username}` : 'Nenhum Instagram conectado'}</div><div className="connection-hint">{connection.connected ? 'Buffer conectado • pronta para publicar' : connection.setupRequired ? 'Configure Firebase + Buffer primeiro' : 'Conecte seu Instagram no Buffer'}</div></div><a className="btn btn-secondary" href="/api/instagram/connect">{connection.connected ? 'Atualizar' : 'Conectar'}</a></div>
              <div className="stat-row"><div className="stat"><div className="stat-n">{stats.drafts}</div><div className="stat-l">revisar</div></div><div className="stat"><div className="stat-n">{stats.published}</div><div className="stat-l">publicados</div></div><div className="stat"><div className="stat-n">{stats.total}</div><div className="stat-l">total</div></div></div>
            </div>
          </div>
          <div className="card" id="criar" style={{marginTop:18}}>
            <div className="card-head"><div className="card-title">Novo rascunho</div><WandSparkles size={17}/></div>
            <div className="card-body">
              <div className="field"><label className="label">Imagem</label><label className="btn btn-secondary" style={{width:'100%'}}><Upload size={15}/>{uploading ? 'Enviando...' : 'Enviar imagem'}<input hidden type="file" accept="image/*" disabled={uploading} onChange={e => upload(e.target.files?.[0])}/></label></div>
              <div className="field"><label className="label">ou URL pública da imagem</label><input className="input" value={mediaUrl} onChange={e=>setMediaUrl(e.target.value)} placeholder="https://.../post.jpg"/></div>
              <div className="field"><label className="label">Legenda</label><textarea className="textarea" value={caption} onChange={e=>setCaption(e.target.value)} placeholder="Escreva a legenda que será publicada..."/></div>
              <div className="field"><label className="label">Texto alternativo (opcional)</label><input className="input" value={altText} onChange={e=>setAltText(e.target.value)} placeholder="Descrição acessível da imagem"/></div>
              <button className="btn btn-primary" style={{width:'100%'}} disabled={busy || !caption.trim() || !mediaUrl.trim()} onClick={saveDraft}><ImagePlus size={16}/>Salvar para revisão</button>
              <div className="note">Posts de imagem única no MVP. Reels, carrossel e agendamento entram depois sem trocar a base.</div>
            </div>
          </div>
        </section>
        <section id="preview">
          <div className="card">
            <div className="card-head"><div className="card-title">Pré-visualização</div><span className="status">em revisão</span></div>
            <div className="card-body preview-wrap">
              <div className="phone"><div className="phone-inner"><div className="ig-head"><div className="ig-avatar"/><span>{connection.connected ? connection.connection?.username : 'seu_perfil'}</span><MoreHorizontal size={17} style={{marginLeft:'auto'}}/></div><div className="media">{mediaUrl ? <img src={mediaUrl} alt="Preview"/> : <div className="media-empty"><ImagePlus size={24} style={{margin:'0 auto 8px'}}/>Sua mídia aparece aqui</div>}</div><div className="ig-actions"><Heart/><MessageCircle/><Send/></div><div className="caption"><strong>{connection.connected ? connection.connection?.username : 'seu_perfil'}</strong> {caption || 'Sua legenda será exibida aqui antes da aprovação.'}</div></div></div>
              <div><div className="eyebrow">CHECKLIST</div><h2 style={{fontSize:26,letterSpacing:'-.04em',margin:'8px 0 14px'}}>Antes de publicar</h2><div className="note">1. Confira corte e qualidade da imagem.<br/><br/>2. Revise legenda, CTA e hashtags.<br/><br/>3. Verifique se a conta conectada é a correta.<br/><br/>4. Salve como rascunho. A publicação só acontece quando você clicar em <b>Aprovar e publicar</b> na fila.</div></div>
            </div>
          </div>
          <div className="card queue" id="fila">
            <div className="card-head"><div className="card-title">Fila de aprovação</div><span className="status">{posts.length} itens</span></div>
            <div className="card-body" style={{paddingTop:8}}>{posts.length === 0 ? <div className="note" style={{padding:'18px 0'}}>Ainda não há rascunhos. Crie o primeiro post ao lado.</div> : posts.map(post => <div className="post-row" key={post.id}><div className="thumb">{post.media_url ? <img src={post.media_url} alt=""/> : 'mídia'}</div><div><div className="post-caption">{post.caption}</div>{post.error_message && <div className="error">{post.error_message}</div>}</div><div style={{display:'flex',flexDirection:'column',gap:7,alignItems:'flex-end'}}><span className={`status ${post.status}`}>{post.status}</span>{post.status !== 'published' && <button className="btn btn-primary" style={{padding:'8px 10px',fontSize:12}} disabled={busy || !connection.connected} onClick={()=>publish(post.id)}><Send size={13}/>Aprovar e publicar</button>}</div></div>)}</div>
          </div>
        </section>
      </div>
    </div>
    <nav className="mobile-nav" aria-label="Navegação principal">
      <a href="#inicio"><Home size={19}/><span>Início</span></a>
      <a href="#criar"><ImagePlus size={19}/><span>Criar</span></a>
      <a href="#preview"><Instagram size={19}/><span>Preview</span></a>
      <a href="#fila"><ListChecks size={19}/><span>Fila</span></a>
    </nav>
  </main>;
}
