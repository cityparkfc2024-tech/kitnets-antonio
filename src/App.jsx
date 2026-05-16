import { useState } from "react";

// ── Constantes ───────────────────────────────────────────────────────────────
const MESES = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
const MESES_FULL = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
const HOJE = new Date(2026, 4, 15); // 15/05/2026

// ── Dados iniciais ZERADOS ───────────────────────────────────────────────────
const INITIAL_UNITS = [
  { id: 1, tipo: "kitnet",    nome: "Kitnet 01",        morador: "", inicio: "", saida: "", aluguel: 0, vigencia: 12, diaCobranca: 5,  status: "vago" },
  { id: 2, tipo: "kitnet",    nome: "Kitnet 02",        morador: "", inicio: "", saida: "", aluguel: 0, vigencia: 12, diaCobranca: 5,  status: "vago" },
  { id: 3, tipo: "kitnet",    nome: "Kitnet 03",        morador: "", inicio: "", saida: "", aluguel: 0, vigencia: 12, diaCobranca: 5,  status: "vago" },
  { id: 4, tipo: "kitnet",    nome: "Kitnet 04",        morador: "", inicio: "", saida: "", aluguel: 0, vigencia: 12, diaCobranca: 5,  status: "vago" },
  { id: 5, tipo: "kitnet",    nome: "Kitnet 05",        morador: "", inicio: "", saida: "", aluguel: 0, vigencia: 12, diaCobranca: 5,  status: "vago" },
  { id: 6, tipo: "kitnet",    nome: "Kitnet 06",        morador: "", inicio: "", saida: "", aluguel: 0, vigencia: 12, diaCobranca: 5,  status: "vago" },
  { id: 7, tipo: "comercial", nome: "Espaço Comercial", morador: "", inicio: "", saida: "", aluguel: 0, vigencia: 12, diaCobranca: 10, status: "vago" },
];

const INITIAL_LANCAMENTOS = [];

const INITIAL_ENERGIA = {
  kwValue: 0,
  ipTotal: 0,
  bandeiraTotal: 0,
  geralAnt: 0,
  geralAtual: 0,
  leituras: {},
};

// ── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (v) => Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const statusColor = (s) => s === "pago" ? "#22c55e" : s === "atrasado" ? "#ef4444" : "#f59e0b";
const statusLabel = (s) => s === "pago" ? "Pago" : s === "atrasado" ? "Atrasado" : "Pendente";

const calcStatusAluguel = (unit, ano, mesIdx, lancamentos) => {
  if (unit.status === "vago") return null;
  const prefix = `${ano}-${String(mesIdx + 1).padStart(2, "0")}`;
  const lançsMes = lancamentos.filter(l =>
    l.tipo === "receita" && l.unidade === unit.id && l.data.startsWith(prefix)
  );
  const totalPago = lançsMes.reduce((a, b) => a + b.valor, 0);
  const pendente  = Math.max(0, unit.aluguel - totalPago);
  const diaVenc   = unit.diaCobranca || 5;
  const dataVenc  = new Date(ano, mesIdx, diaVenc);
  const prazoPassou = HOJE > dataVenc;

  let status;
  if (totalPago >= unit.aluguel) status = "pago";
  else if (prazoPassou)          status = "atrasado";
  else                           status = "pendente";

  return { status, totalPago, pendente, pagamentos: lançsMes.map(l => ({ data: l.data, valor: l.valor, id: l.id })) };
};

// ── Componentes base ─────────────────────────────────────────────────────────
const Card = ({ children, style = {} }) => (
  <div style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:16, padding:20, ...style }}>
    {children}
  </div>
);

const Pill = ({ children, active, onClick }) => (
  <button onClick={onClick} style={{ padding:"7px 18px", borderRadius:30, border:active?"1px solid #f59e0b":"1px solid rgba(255,255,255,0.12)", background:active?"#f59e0b22":"transparent", color:active?"#f59e0b":"#aaa", fontWeight:600, fontSize:13, cursor:"pointer", whiteSpace:"nowrap" }}>
    {children}
  </button>
);

const SLabel = ({ children, color }) => (
  <div style={{ fontSize:10, color:color||"#888", marginBottom:4, textTransform:"uppercase", letterSpacing:0.5, fontWeight:600 }}>{children}</div>
);

const baseInput = { width:"100%", padding:"9px 11px", borderRadius:9, border:"1px solid rgba(255,255,255,0.12)", background:"rgba(255,255,255,0.06)", color:"#fff", fontSize:13, boxSizing:"border-box" };
const accentInput = { ...baseInput, border:"1px solid rgba(245,158,11,0.5)", background:"rgba(245,158,11,0.06)", color:"#f59e0b", fontWeight:700 };

// ── HOME ─────────────────────────────────────────────────────────────────────
const Home = ({ units, lancamentos }) => {
  const mesIdx = HOJE.getMonth(), ano = HOJE.getFullYear();
  const prefix = `${ano}-${String(mesIdx+1).padStart(2,"0")}`;
  const receitaMes = lancamentos.filter(l => l.data.startsWith(prefix) && l.tipo==="receita").reduce((a,b)=>a+b.valor,0);
  const despesaMes = lancamentos.filter(l => l.data.startsWith(prefix) && l.tipo==="despesa").reduce((a,b)=>a+b.valor,0);
  const atrasados  = units.filter(u => calcStatusAluguel(u, ano, mesIdx, lancamentos)?.status === "atrasado");

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:18 }}>
      <div>
        <div style={{ fontSize:11, color:"#f59e0b", letterSpacing:2, textTransform:"uppercase", fontWeight:700 }}>Resumo Geral</div>
        <div style={{ fontSize:22, fontWeight:800, marginTop:4 }}>Prédio — Nova Marabá</div>
        <div style={{ fontSize:12, color:"#888", marginTop:2 }}>Folha 29 · Q21 · L24 · Marabá–PA</div>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
        {[
          { label:"Unidades Ocupadas", value:units.filter(u=>u.status==="ocupado").length, icon:"🏠", color:"#22c55e" },
          { label:"Unidades Vagas",    value:units.filter(u=>u.status==="vago").length,    icon:"🔑", color:"#f59e0b" },
          { label:`Receita ${MESES[mesIdx]}`, value:fmt(receitaMes), icon:"💰", color:"#3b82f6" },
          { label:`Despesas ${MESES[mesIdx]}`,value:fmt(despesaMes), icon:"📋", color:"#ef4444" },
        ].map((item,i) => (
          <Card key={i} style={{ textAlign:"center", padding:14 }}>
            <div style={{ fontSize:24 }}>{item.icon}</div>
            <div style={{ fontSize:18, fontWeight:800, color:item.color, marginTop:4 }}>{item.value}</div>
            <div style={{ fontSize:11, color:"#888", marginTop:2 }}>{item.label}</div>
          </Card>
        ))}
      </div>
      <Card>
        <div style={{ fontSize:12, color:"#f59e0b", fontWeight:700, marginBottom:12, letterSpacing:1, textTransform:"uppercase" }}>Status das Unidades</div>
        {units.map(u => (
          <div key={u.id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 0", borderBottom:"1px solid rgba(255,255,255,0.05)" }}>
            <div>
              <div style={{ fontWeight:700, fontSize:13 }}>{u.nome}</div>
              <div style={{ fontSize:11, color:"#888" }}>{u.status==="ocupado" ? u.morador : "Vago"}</div>
            </div>
            <div style={{ textAlign:"right" }}>
              <div style={{ fontSize:13, fontWeight:700, color:"#f59e0b" }}>{u.aluguel > 0 ? fmt(u.aluguel)+"/mês" : "—"}</div>
              <div style={{ fontSize:11, color:u.status==="ocupado"?"#22c55e":"#f59e0b", fontWeight:600, marginTop:2 }}>{u.status==="ocupado"?"● Ocupado":"○ Vago"}</div>
            </div>
          </div>
        ))}
      </Card>
      {atrasados.length > 0 && (
        <Card style={{ borderColor:"#ef444444", background:"#ef444411" }}>
          <div style={{ fontSize:12, color:"#ef4444", fontWeight:700, marginBottom:8, letterSpacing:1, textTransform:"uppercase" }}>⚠ Aluguéis Atrasados</div>
          {atrasados.map(u => <div key={u.id} style={{ fontSize:13, padding:"4px 0", color:"#fca5a5" }}>• {u.nome} — {u.morador}</div>)}
        </Card>
      )}
    </div>
  );
};

// ── FINANCEIRO ───────────────────────────────────────────────────────────────
const LancamentoForm = ({ initial, units, onSave, onCancel }) => {
  const blank = { data:"", tipo:"receita", desc:"", valor:"", unidade:"geral" };
  const [form, setForm] = useState(initial ? { ...initial, valor: String(initial.valor) } : blank);
  const f = (k,v) => setForm(p => ({ ...p, [k]:v }));
  const valid = form.data && form.desc && form.valor;
  return (
    <Card style={{ marginBottom:14, borderColor:"rgba(245,158,11,0.3)" }}>
      <div style={{ fontWeight:700, marginBottom:12, fontSize:14 }}>{initial?.id ? "✏ Editar Lançamento" : "+ Novo Lançamento"}</div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:10 }}>
        <div><SLabel>Data</SLabel><input type="date" value={form.data} onChange={e=>f("data",e.target.value)} style={baseInput}/></div>
        <div><SLabel>Tipo</SLabel>
          <select value={form.tipo} onChange={e=>f("tipo",e.target.value)} style={baseInput}>
            <option value="receita">Receita</option>
            <option value="despesa">Despesa</option>
          </select>
        </div>
      </div>
      <div style={{ marginBottom:10 }}><SLabel>Descrição</SLabel><input value={form.desc} onChange={e=>f("desc",e.target.value)} placeholder="Ex: Aluguel Kitnet 01" style={baseInput}/></div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:14 }}>
        <div><SLabel>Valor (R$)</SLabel><input type="number" value={form.valor} onChange={e=>f("valor",e.target.value)} placeholder="0,00" style={baseInput}/></div>
        <div><SLabel>Unidade</SLabel>
          <select value={form.unidade} onChange={e=>f("unidade", e.target.value==="geral"?"geral":+e.target.value)} style={baseInput}>
            <option value="geral">Geral (prédio)</option>
            {units.map(u=><option key={u.id} value={u.id}>{u.nome}</option>)}
          </select>
        </div>
      </div>
      <div style={{ display:"flex", gap:8 }}>
        <button onClick={onCancel} style={{ flex:1, padding:10, borderRadius:10, border:"1px solid rgba(255,255,255,0.12)", background:"transparent", color:"#aaa", fontWeight:700, cursor:"pointer" }}>Cancelar</button>
        <button onClick={()=>valid&&onSave({...form,valor:+form.valor})} disabled={!valid}
          style={{ flex:2, padding:10, borderRadius:10, border:"none", background:valid?"#f59e0b":"#444", color:valid?"#000":"#888", fontWeight:800, cursor:valid?"pointer":"not-allowed" }}>Salvar</button>
      </div>
    </Card>
  );
};

const FinanceiroSection = ({ lancamentos, setLancamentos, units }) => {
  const [mesFiltro, setMesFiltro]           = useState(HOJE.getMonth());
  const [showForm, setShowForm]             = useState(false);
  const [editingId, setEditingId]           = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const filtrados = lancamentos
    .filter(l => { const d=new Date(l.data+"T12:00:00"); return d.getFullYear()===HOJE.getFullYear()&&d.getMonth()===mesFiltro; })
    .sort((a,b)=>b.data.localeCompare(a.data));

  const receitas = filtrados.filter(l=>l.tipo==="receita").reduce((a,b)=>a+b.valor,0);
  const despesas = filtrados.filter(l=>l.tipo==="despesa").reduce((a,b)=>a+b.valor,0);
  const saldo    = receitas - despesas;

  const addLancamento  = (form) => { setLancamentos(p=>[{id:Date.now(),...form},...p]); setShowForm(false); };
  const saveLancamento = (form) => { setLancamentos(p=>p.map(l=>l.id===editingId?{...l,...form}:l)); setEditingId(null); };
  const delLancamento  = (id)   => { setLancamentos(p=>p.filter(l=>l.id!==id)); setConfirmDeleteId(null); };

  return (
    <div>
      <div style={{ fontSize:11, color:"#f59e0b", letterSpacing:2, textTransform:"uppercase", fontWeight:700, marginBottom:4 }}>Financeiro</div>
      <div style={{ fontSize:18, fontWeight:800, marginBottom:14 }}>Receitas & Despesas</div>

      <div style={{ display:"flex", gap:8, overflowX:"auto", paddingBottom:8, marginBottom:14 }}>
        {MESES.map((m,i)=><Pill key={i} active={mesFiltro===i} onClick={()=>setMesFiltro(i)}>{m}</Pill>)}
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8, marginBottom:16 }}>
        {[{label:"Receitas",value:receitas,color:"#22c55e"},{label:"Despesas",value:despesas,color:"#ef4444"},{label:"Saldo",value:saldo,color:saldo>=0?"#3b82f6":"#ef4444"}].map((item,i)=>(
          <Card key={i} style={{ textAlign:"center", padding:12 }}>
            <div style={{ fontSize:10, color:"#888" }}>{item.label}</div>
            <div style={{ fontSize:13, fontWeight:800, color:item.color, marginTop:3 }}>{fmt(item.value)}</div>
          </Card>
        ))}
      </div>

      {!showForm && !editingId && (
        <button onClick={()=>setShowForm(true)} style={{ width:"100%", padding:"11px", borderRadius:12, border:"1px dashed rgba(245,158,11,0.5)", background:"rgba(245,158,11,0.05)", color:"#f59e0b", fontWeight:700, fontSize:14, cursor:"pointer", marginBottom:14 }}>
          + Novo Lançamento
        </button>
      )}
      {showForm && <LancamentoForm units={units} onSave={addLancamento} onCancel={()=>setShowForm(false)}/>}

      {filtrados.length===0
        ? (
          <div style={{ textAlign:"center", color:"#666", padding:"40px 20px" }}>
            <div style={{ fontSize:32, marginBottom:10 }}>📋</div>
            <div style={{ fontSize:14, fontWeight:600, color:"#888" }}>Nenhum lançamento em {MESES_FULL[mesFiltro]}</div>
            <div style={{ fontSize:12, color:"#555", marginTop:4 }}>Use o botão acima para adicionar</div>
          </div>
        )
        : filtrados.map(l => {
            const unidNome = l.unidade==="geral" ? "Geral" : units.find(u=>u.id===l.unidade)?.nome||"";
            if (editingId===l.id) return <LancamentoForm key={l.id} initial={l} units={units} onSave={saveLancamento} onCancel={()=>setEditingId(null)}/>;
            return (
              <div key={l.id} style={{ borderBottom:"1px solid rgba(255,255,255,0.05)" }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"11px 0", gap:8 }}>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:13, fontWeight:600, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{l.desc}</div>
                    <div style={{ fontSize:11, color:"#888", marginTop:2 }}>{new Date(l.data+"T12:00:00").toLocaleDateString("pt-BR")} · {unidNome}</div>
                  </div>
                  <div style={{ display:"flex", alignItems:"center", gap:6, flexShrink:0 }}>
                    <div style={{ fontWeight:800, fontSize:13, color:l.tipo==="receita"?"#22c55e":"#ef4444", whiteSpace:"nowrap" }}>
                      {l.tipo==="receita"?"+":"-"}{fmt(l.valor)}
                    </div>
                    <button onClick={()=>{setEditingId(l.id);setShowForm(false);setConfirmDeleteId(null);}} title="Editar"
                      style={{ background:"rgba(59,130,246,0.15)", border:"1px solid rgba(59,130,246,0.4)", borderRadius:7, color:"#60a5fa", padding:"5px 8px", fontSize:12, cursor:"pointer", lineHeight:1 }}>✏</button>
                    <button onClick={()=>setConfirmDeleteId(confirmDeleteId===l.id?null:l.id)} title="Excluir"
                      style={{ background:"rgba(239,68,68,0.15)", border:"1px solid rgba(239,68,68,0.4)", borderRadius:7, color:"#f87171", padding:"5px 8px", fontSize:12, cursor:"pointer", lineHeight:1 }}>🗑</button>
                  </div>
                </div>
                {confirmDeleteId===l.id && (
                  <div style={{ background:"rgba(239,68,68,0.1)", border:"1px solid rgba(239,68,68,0.3)", borderRadius:10, padding:"10px 14px", marginBottom:8, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                    <span style={{ fontSize:12, color:"#fca5a5" }}>Excluir este lançamento?</span>
                    <div style={{ display:"flex", gap:8 }}>
                      <button onClick={()=>setConfirmDeleteId(null)} style={{ padding:"5px 12px", borderRadius:7, border:"1px solid rgba(255,255,255,0.15)", background:"transparent", color:"#aaa", fontSize:12, cursor:"pointer" }}>Não</button>
                      <button onClick={()=>delLancamento(l.id)} style={{ padding:"5px 12px", borderRadius:7, border:"none", background:"#ef4444", color:"#fff", fontWeight:700, fontSize:12, cursor:"pointer" }}>Sim, excluir</button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
      }
    </div>
  );
};

// ── KITNETS ──────────────────────────────────────────────────────────────────
const KitnetCard = ({ unit, lancamentos, onEdit }) => {
  const [expanded, setExpanded] = useState(false);
  const diaVenc = unit.diaCobranca || 5;
  const vencAtual = new Date(HOJE.getFullYear(), HOJE.getMonth(), diaVenc);
  const vencidoHoje = unit.status === "ocupado" && HOJE > vencAtual;

  const mesesHistorico = [];
  if (unit.status === "ocupado" && unit.inicio) {
    const inicioD = new Date(unit.inicio + "T12:00:00");
    for (let offset = 11; offset >= 0; offset--) {
      const d = new Date(HOJE.getFullYear(), HOJE.getMonth() - offset, 1);
      if (d >= new Date(inicioD.getFullYear(), inicioD.getMonth(), 1)) {
        mesesHistorico.push({ ano: d.getFullYear(), mesIdx: d.getMonth() });
      }
    }
  }

  return (
    <Card style={{ marginBottom:12 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", cursor:"pointer" }} onClick={()=>setExpanded(!expanded)}>
        <div>
          <div style={{ fontWeight:800, fontSize:15 }}>{unit.nome}</div>
          <div style={{ fontSize:12, color:"#aaa", marginTop:2 }}>
            {unit.status==="ocupado" ? unit.morador : <span style={{color:"#f59e0b"}}>Vago</span>}
          </div>
          {unit.status==="ocupado" && (
            <div style={{ fontSize:11, marginTop:3 }}>
              Vence dia{" "}
              <span style={{ color:vencidoHoje?"#ef4444":"#f59e0b", fontWeight:700, background:vencidoHoje?"rgba(239,68,68,0.12)":"rgba(245,158,11,0.1)", padding:"1px 6px", borderRadius:6 }}>
                {diaVenc}{vencidoHoje ? " ⚠ em atraso" : ""}
              </span>
            </div>
          )}
        </div>
        <div style={{ textAlign:"right" }}>
          <div style={{ fontWeight:700, color:"#f59e0b" }}>{unit.aluguel > 0 ? fmt(unit.aluguel) : "—"}</div>
          <div style={{ fontSize:11, color:"#888", marginTop:2 }}>{expanded?"▲ Fechar":"▼ Detalhes"}</div>
        </div>
      </div>

      {expanded && (
        <div style={{ marginTop:16 }}>
          {unit.status==="ocupado" && (
            <>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:16 }}>
                {[
                  { label:"Início Contrato",    value: unit.inicio ? new Date(unit.inicio+"T12:00:00").toLocaleDateString("pt-BR") : "—" },
                  { label:"Vigência",            value: `${unit.vigencia} meses` },
                  { label:"Dia de Cobrança",     value: `Todo dia ${diaVenc}`, alert: vencidoHoje },
                  { label:"Vencimento Contrato", value: unit.inicio ? (() => { const d=new Date(unit.inicio+"T12:00:00"); d.setMonth(d.getMonth()+unit.vigencia); return d.toLocaleDateString("pt-BR"); })() : "—" },
                  { label:"Data de Saída",       value: unit.saida ? new Date(unit.saida+"T12:00:00").toLocaleDateString("pt-BR") : "—" },
                ].map((item,i) => (
                  <div key={i} style={{ background:item.alert?"rgba(239,68,68,0.1)":"rgba(255,255,255,0.04)", border:item.alert?"1px solid rgba(239,68,68,0.3)":"none", borderRadius:8, padding:"8px 12px" }}>
                    <SLabel color={item.alert?"#f87171":undefined}>{item.label}</SLabel>
                    <div style={{ fontSize:13, fontWeight:700, color:item.alert?"#fca5a5":"#fff" }}>{item.value}</div>
                  </div>
                ))}
              </div>

              <div style={{ fontSize:11, color:"#f59e0b", fontWeight:700, letterSpacing:1, textTransform:"uppercase", marginBottom:10 }}>Histórico de Aluguel</div>
              {mesesHistorico.length === 0
                ? <div style={{ fontSize:12, color:"#666", marginBottom:12 }}>Sem histórico disponível.</div>
                : 
