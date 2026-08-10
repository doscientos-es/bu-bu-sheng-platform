"use client";

import {
  ArrowUpRight,
  Bell,
  Cake,
  CheckCircle2,
  ChevronDown,
  FileText,
  LayoutDashboard,
  Mail,
  Menu,
  Plus,
  Search,
  Settings2,
  Sparkles,
  Store,
  Upload,
  Users,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";

type Section = "Resumen" | "Albaranes" | "Fidelización";

const stores = ["Todas las cafeterías", "Cafetería Centro", "Cafetería Norte", "Cafetería Retiro"];

const initialNotes = [
  { id: 1, supplier: "Coca-Cola Europacific Partners", store: "Cafetería Centro", date: "08 ago 2026", status: "Subida detectada", total: "113,97 €", tone: "warning", lines: 4 },
  { id: 2, supplier: "Proveedor de bollería", store: "Cafetería Norte", date: "07 ago 2026", status: "Validado", total: "248,30 €", tone: "success", lines: 12 },
  { id: 3, supplier: "Distribuciones Madrid", store: "Cafetería Retiro", date: "06 ago 2026", status: "Revisión necesaria", total: "96,40 €", tone: "neutral", lines: 8 },
  { id: 4, supplier: "Coca-Cola Europacific Partners", store: "Cafetería Norte", date: "05 ago 2026", status: "Validado", total: "102,14 €", tone: "success", lines: 5 },
];

const customers = [
  { name: "María González", email: "maria.gonzalez@email.com", birthday: "Hoy", promo: "Café + bollería", status: "Pendiente" },
  { name: "Javier Martín", email: "javier.martin@email.com", birthday: "12 ago", promo: "10% de descuento", status: "Preparado" },
  { name: "Lucía Sánchez", email: "lucia.sanchez@email.com", birthday: "18 ago", promo: "Café gratis", status: "Pendiente" },
];

function Metric({ label, value, detail, accent }: { label: string; value: string; detail: string; accent: "orange" | "green" | "purple" | "blue" }) {
  return <div className="metric-card"><div className={`metric-icon ${accent}`}><Sparkles size={17} /></div><div><p>{label}</p><strong>{value}</strong><small>{detail}</small></div></div>;
}

export default function Home() {
  const [section, setSection] = useState<Section>("Resumen");
  const [store, setStore] = useState(stores[0]);
  const [showUpload, setShowUpload] = useState(false);
  const [showCustomer, setShowCustomer] = useState(false);
  const [showEmail, setShowEmail] = useState(false);
  const [uploaded, setUploaded] = useState(false);
  const [notes, setNotes] = useState(initialNotes);
  const [query, setQuery] = useState("");

  const filteredNotes = useMemo(() => notes.filter((note) => !query || `${note.supplier} ${note.store}`.toLowerCase().includes(query.toLowerCase())), [notes, query]);

  const nav = (next: Section) => { setSection(next); setShowUpload(false); setShowCustomer(false); };

  const completeUpload = () => {
    setUploaded(true);
    setNotes((current) => [{ id: 99, supplier: "Coca-Cola Europacific Partners", store: "Cafetería Centro", date: "Hoy", status: "Subida detectada", total: "113,97 €", tone: "warning", lines: 4 }, ...current]);
  };

  return <main className="app-shell">
    <aside className="sidebar">
      <div className="brand"><div className="brand-mark">D</div><div><strong>Doscientos</strong><span>Cafeterías</span></div></div>
      <div className="workspace-label">ESPACIO DE TRABAJO</div>
      <nav>{(["Resumen", "Albaranes", "Fidelización"] as Section[]).map((item) => <button key={item} className={section === item ? "nav-item active" : "nav-item"} onClick={() => nav(item)}>{item === "Resumen" ? <LayoutDashboard size={18} /> : item === "Albaranes" ? <FileText size={18} /> : <Users size={18} />}{item}</button>)}</nav>
      <div className="sidebar-bottom"><button className="nav-item"><Settings2 size={18} />Configuración</button><div className="user-card"><div className="avatar">V</div><div><strong>Vicky LZ</strong><span>Administración</span></div><ChevronDown size={15} /></div></div>
    </aside>
    <section className="content">
      <header className="topbar"><button className="mobile-menu"><Menu size={20} /></button><div className="crumb"><span>Red de cafeterías</span><span>/</span><strong>{section}</strong></div><div className="top-actions"><div className="store-select"><Store size={16} /><select value={store} onChange={(e) => setStore(e.target.value)}>{stores.map((item) => <option key={item}>{item}</option>)}</select></div><button className="icon-button"><Bell size={18} /><i /></button></div></header>
      <div className="page-content">
        {section === "Resumen" && <><div className="hero-row"><div><p className="eyebrow">CONTROL CENTRAL</p><h1>Todo bajo control.</h1><p className="subtitle">Una visión clara de tus compras y tus clientes, en un solo lugar.</p></div><div className="date-pill">08 agosto 2026 <ChevronDown size={15} /></div></div><div className="metrics"><Metric label="Albaranes este mes" value="428" detail="+12% vs. mes anterior" accent="orange" /><Metric label="Subidas detectadas" value="17" detail="Requieren revisión" accent="purple" /><Metric label="Clientes fidelizados" value="1.284" detail="+86 este mes" accent="green" /><Metric label="Cumpleaños próximos" value="24" detail="En los próximos 7 días" accent="blue" /></div><div className="grid-two"><div className="panel"><div className="panel-heading"><div><h2>Últimos albaranes</h2><p>Revisa las compras de todas tus cafeterías.</p></div><button className="text-button" onClick={() => nav("Albaranes")}>Ver todos <ArrowUpRight size={15} /></button></div><div className="mini-table">{notes.slice(0, 3).map((note) => <div className="mini-row" key={note.id}><div className="supplier-icon"><FileText size={16} /></div><div className="row-main"><strong>{note.supplier}</strong><span>{note.store} · {note.date}</span></div><Status tone={note.tone} label={note.status} /><strong className="row-total">{note.total}</strong></div>)}</div></div><div className="panel highlight-panel"><div className="sparkle-orb"><Cake size={22} /></div><p className="eyebrow">FIDELIZACIÓN</p><h2>24 cumpleaños<br />esta semana</h2><p>Prepara una promoción y mantén el vínculo con tus clientes.</p><button className="primary-button" onClick={() => nav("Fidelización")}>Gestionar clientes <ArrowUpRight size={16} /></button></div></div><div className="next-step"><div className="next-icon"><CheckCircle2 size={19} /></div><div><strong>Siguiente paso recomendado</strong><p>Revisa las 17 variaciones de precio antes de cerrar la semana.</p></div><button onClick={() => nav("Albaranes")}>Ir a albaranes <ArrowUpRight size={15} /></button></div></>}

        {section === "Albaranes" && <><div className="section-heading"><div><p className="eyebrow">COMPRAS CENTRALIZADAS</p><h1>Albaranes</h1><p className="subtitle">Digitaliza, organiza y detecta cambios de precio.</p></div><button className="primary-button" onClick={() => setShowUpload(true)}><Upload size={17} />Subir albarán</button></div><div className="metrics compact"><Metric label="Pendientes de revisar" value="12" detail="En todas las tiendas" accent="orange" /><Metric label="Subidas detectadas" value="17" detail="Desde la última compra" accent="purple" /><Metric label="Documentos del mes" value="428" detail="100–150 por semana" accent="blue" /></div><div className="panel table-panel"><div className="toolbar"><div className="search"><Search size={17} /><input placeholder="Buscar proveedor o tienda" value={query} onChange={(e) => setQuery(e.target.value)} /></div><button className="filter-button"><Store size={15} />{store === stores[0] ? "Todas las tiendas" : store}<ChevronDown size={15} /></button></div><div className="table-wrap"><table><thead><tr><th>Proveedor</th><th>Tienda</th><th>Fecha</th><th>Estado</th><th className="align-right">Total</th></tr></thead><tbody>{filteredNotes.map((note) => <tr key={note.id}><td><div className="table-supplier"><div className="supplier-icon"><FileText size={15} /></div><strong>{note.supplier}</strong></div><small>{note.lines} líneas de producto</small></td><td>{note.store}</td><td>{note.date}</td><td><Status tone={note.tone} label={note.status} /></td><td className="align-right price">{note.total}</td></tr>)}</tbody></table></div></div>{showUpload && <Modal title="Subir nuevo albarán" onClose={() => setShowUpload(false)}><div className="upload-area"><Upload size={28} /><strong>Arrastra una foto o selecciónala</strong><span>JPG, PNG o PDF · hasta 10 MB</span><label className="secondary-button">Seleccionar archivo<input type="file" accept="image/*,.pdf" onChange={() => setUploaded(true)} hidden /></label></div>{uploaded && <div className="processing-card"><div className="processing-dot" /><div><strong>Documento analizado</strong><p>Hemos encontrado 4 líneas. Revisa los datos antes de validar.</p></div></div>}<div className="modal-actions"><button className="ghost-button" onClick={() => setShowUpload(false)}>Cancelar</button><button className="primary-button" disabled={!uploaded} onClick={completeUpload}>Revisar albarán <ArrowUpRight size={15} /></button></div></Modal>}</>}

        {section === "Fidelización" && <><div className="section-heading"><div><p className="eyebrow">RELACIÓN CON CLIENTES</p><h1>Fidelización</h1><p className="subtitle">Convierte cada visita en una relación más cercana.</p></div><button className="primary-button" onClick={() => setShowCustomer(true)}><Plus size={17} />Nuevo cliente</button></div><div className="metrics compact"><Metric label="Clientes registrados" value="1.284" detail="En las 10 cafeterías" accent="green" /><Metric label="Cumpleaños próximos" value="24" detail="En los próximos 7 días" accent="blue" /><Metric label="Promociones preparadas" value="86" detail="Este mes" accent="purple" /></div><div className="panel table-panel"><div className="toolbar"><div><h2>Próximos cumpleaños</h2><p>Prepara una promoción y envíala por email.</p></div><button className="filter-button"><Mail size={15} />Email <ChevronDown size={15} /></button></div><div className="table-wrap"><table><thead><tr><th>Cliente</th><th>Cumpleaños</th><th>Promoción</th><th>Estado</th><th /></tr></thead><tbody>{customers.map((customer) => <tr key={customer.email}><td><div className="customer-cell"><div className="avatar small">{customer.name.charAt(0)}</div><div><strong>{customer.name}</strong><small>{customer.email}</small></div></div></td><td><span className={customer.birthday === "Hoy" ? "today-badge" : ""}>{customer.birthday}</span></td><td>{customer.promo}</td><td><Status tone={customer.status === "Preparado" ? "success" : "neutral"} label={customer.status} /></td><td className="align-right"><button className="row-action" onClick={() => setShowEmail(true)}>Preparar email <ArrowUpRight size={14} /></button></td></tr>)}</tbody></table></div></div>{showCustomer && <Modal title="Nuevo cliente" onClose={() => setShowCustomer(false)}><div className="form-grid"><label>Nombre<input placeholder="Nombre y apellidos" /></label><label>Email<input type="email" placeholder="cliente@email.com" /></label><label>Fecha de cumpleaños<input type="date" /></label><label>Cafetería<select><option>Cafetería Centro</option><option>Cafetería Norte</option><option>Cafetería Retiro</option></select></label></div><label className="consent"><input type="checkbox" /> El cliente ha dado consentimiento para recibir comunicaciones.</label><div className="modal-actions"><button className="ghost-button" onClick={() => setShowCustomer(false)}>Cancelar</button><button className="primary-button" onClick={() => setShowCustomer(false)}>Guardar cliente</button></div></Modal>}{showEmail && <Modal title="Preparar email de cumpleaños" onClose={() => setShowEmail(false)}><div className="email-preview"><div className="email-top"><div className="brand-mark">D</div><span>Una sorpresa para ti</span></div><h3>¡Feliz cumpleaños, María!</h3><p>Queremos celebrarlo contigo. Pasa por tu cafetería y disfruta de un café y una pieza de bollería por nuestra cuenta.</p><div className="promo-code">CUMPLE-CAFE</div><small>Esta demo prepara el email, pero no lo envía.</small></div><div className="modal-actions"><button className="ghost-button" onClick={() => setShowEmail(false)}>Cerrar</button><button className="primary-button" onClick={() => setShowEmail(false)}><Mail size={15} />Marcar como preparado</button></div></Modal>}</>}
      </div>
    </section>
  </main>;
}

function Status({ tone, label }: { tone: string; label: string }) { return <span className={`status ${tone}`}><span />{label}</span>; }
function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) { return <div className="modal-backdrop" role="presentation"><div className="modal" role="dialog" aria-modal="true"><div className="modal-heading"><div><p className="eyebrow">DEMO</p><h2>{title}</h2></div><button className="icon-button" onClick={onClose} aria-label="Cerrar"><X size={18} /></button></div>{children}</div></div>; }
