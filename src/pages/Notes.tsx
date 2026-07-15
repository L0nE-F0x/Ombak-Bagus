import { BALI_SPOTS, getSpotById } from "../data/spots";
import { useAppStore } from "../store/useAppStore";
import { formatDateTime } from "../services/time";

export function Notes() {
 const notes = useAppStore((s) => s.notes);
 const upsertNote = useAppStore((s) => s.upsertNote);
 const deleteNote = useAppStore((s) => s.deleteNote);
 const selectSpot = useAppStore((s) => s.selectSpot);
 const favorites = useAppStore((s) => s.favorites);

 const withNotes = [...notes]
 .filter((n) => n.text.trim())
 .sort(
 (a, b) =>
 new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
 );

 const spotsNeedingNotes = BALI_SPOTS.filter(
 (s) =>
 favorites.includes(s.id) &&
 !notes.some((n) => n.spotId === s.id && n.text.trim())
 );

 return (
 <div className="space-y-6">
 <header>
 <h1 className="page-title">
 Spot notes
 </h1>
 <p className="page-sub">
 Local knowledge that never leaves your machine
 </p>
 </header>

 {withNotes.length === 0 && (
 <p className="text-ocean-400 text-sm glass rounded-2xl p-6">
 No notes yet. Open a spot and jot down entry tips, hazards, or tide
 quirks.
 </p>
 )}

 <div className="grid md:grid-cols-2 gap-3">
 {withNotes.map((n) => {
 const spot = getSpotById(n.spotId);
 return (
 <article key={n.id} className="glass rounded-2xl p-4 flex flex-col">
 <div className="flex items-start justify-between gap-2">
 <button
 type="button"
 onClick={() => selectSpot(n.spotId)}
 className="font-semibold text-foam hover:text-ocean-300 text-left"
 >
 {spot?.name ?? n.spotId}
 </button>
 <button
 type="button"
 onClick={() => {
 if (window.confirm("Delete this note?")) deleteNote(n.id);
 }}
 className="btn btn-danger"
 >
 Delete
 </button>
 </div>
 <p className="text-sm text-ocean-300 mt-2 whitespace-pre-wrap flex-1">
 {n.text}
 </p>
 <p className="text-[10px] text-ocean-500 mt-3">
 {formatDateTime(n.updatedAt, "d MMM yyyy HH:mm")}
 </p>
 </article>
 );
 })}
 </div>

 {spotsNeedingNotes.length > 0 && (
 <section>
 <h2 className="text-sm font-medium text-ocean-400 mb-2">
 Favorites without notes
 </h2>
 <div className="flex flex-wrap gap-2">
 {spotsNeedingNotes.map((s) => (
 <button
 key={s.id}
 type="button"
 onClick={() => selectSpot(s.id)}
 className="px-3 py-1.5 rounded-full border border-ocean-700 text-sm text-ocean-300 hover:border-ocean-500 hover:text-foam transition-colors"
 >
 {s.name}
 </button>
 ))}
 </div>
 </section>
 )}

 <section className="glass rounded-2xl p-4">
 <h2 className="text-sm font-medium text-ocean-300 mb-3">
 Quick add note
 </h2>
 <QuickNote onSave={(spotId, text) => upsertNote(spotId, text)} />
 </section>
 </div>
 );
}

function QuickNote({
 onSave,
}: {
 onSave: (spotId: string, text: string) => void;
}) {
 return (
 <form
 className="space-y-3"
 onSubmit={(e) => {
 e.preventDefault();
 const fd = new FormData(e.currentTarget);
 const spotId = String(fd.get("spotId"));
 const text = String(fd.get("text")).trim();
 if (text) {
 onSave(spotId, text);
 e.currentTarget.reset();
 }
 }}
 >
 <select
 name="spotId"
 className="select"
 defaultValue="uluwatu"
 aria-label="Spot"
 >
 {BALI_SPOTS.map((s) => (
 <option key={s.id} value={s.id}>
 {s.name}
 </option>
 ))}
 </select>
 <textarea
 name="text"
 required
 className="textarea"
 placeholder="Write a note..."
 aria-label="Note text"
 />
 <button type="submit" className="btn btn-primary">
 Save note
 </button>
 </form>
 );
}
