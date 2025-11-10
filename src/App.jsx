// src/App.jsx
import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://cfhyobgvtgiquaantyxs.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNmaHlvYmd2dGdpcXVhYW50eXhzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIzMzY0MjgsImV4cCI6MjA3NzkxMjQyOH0.ianuZolJDUqgKxfkkjQJZFv0WohibdzKLQ1hpdaPJTA"
);

export default function App() {
  const [slug, setSlug] = useState("");
  const [note, setNote] = useState("");
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");

  // 🧭 Define o "slug" da URL (ex: /teste)
  useEffect(() => {
    const path = window.location.pathname.replace("/", "") || "home";
    setSlug(path);
  }, []);

  // 🔍 Busca o conteúdo salvo no Supabase
  useEffect(() => {
    if (!slug) return;
    const fetchNote = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("notes")
        .select("*")
        .eq("slug", slug)
        .single();

      if (data) {
        setNote(data.content || "");
        setImages(data.images || []);
      } else if (error && error.code === "PGRST116") {
        await supabase.from("notes").insert({ slug, content: "", images: [] });
      }
      setLoading(false);
    };
    fetchNote();
  }, [slug]);

  // 💾 Salvar manualmente
  const handleSave = async () => {
    setStatus("Salvando...");
    const { error } = await supabase
      .from("notes")
      .update({ content: note })
      .eq("slug", slug);

    if (error) setStatus("❌ Erro ao salvar");
    else setStatus("✅ Salvo com sucesso!");
    setTimeout(() => setStatus(""), 2500);
  };

  // 📤 Upload de imagem
  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setStatus("Enviando imagem...");
    const filePath = `${slug}/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from("images").upload(filePath, file);

    if (error) {
      setStatus("❌ Erro ao enviar imagem");
      return;
    }

    const publicUrl = supabase.storage
      .from("images")
      .getPublicUrl(filePath).data.publicUrl;

    const newImages = [...images, publicUrl];
    setImages(newImages);

    await supabase.from("notes").update({ images: newImages }).eq("slug", slug);
    setStatus("✅ Imagem enviada!");
    setTimeout(() => setStatus(""), 2500);
  };

  if (loading) return <p className="p-4 text-gray-600">Carregando...</p>;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <h1 className="text-2xl font-bold mb-4 text-gray-800">
        🔗 Página: <span className="text-blue-600">{slug}</span>
      </h1>

      <textarea
        className="w-full h-60 p-3 border rounded-lg text-gray-800 focus:outline-blue-500"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Digite seu texto aqui..."
      />
<br/>
<br/>

      <button
        onClick={handleSave}
        className="mt-3 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow"
      >
        💾 Salvar
      </button>
      <br/>

      {status && <p className="mt-3 text-sm text-gray-700">{status}</p>}
      <br/>

      <div className="mt-6">
        <label className="block mb-2 font-semibold text-gray-700">
          📸 Enviar imagem:
        </label>
        <input type="file" accept="image/*" onChange={handleUpload} />
      </div>
<br/>
      <div className="mt-6 grid grid-cols-2 md:grid-cols-3 gap-4">
        {images.map((img, i) => (
          <img
            key={i}
            src={img}
            alt="upload"
            className="w-full h-48 object-cover rounded-lg border"
          />
        ))}
      </div>
    </div>
  );
}
