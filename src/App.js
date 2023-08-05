import "./style.css";
import { useEffect, useState } from "react";
import supabase from "./supabase";
import React from "react";

function App() {
  const [facts, setFacts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentCatory, setCurrentCatory] = useState("all");

  useEffect(
    function () {
      async function getFacts() {
        setIsLoading(true);

        let query = supabase.from("facts").select("*");

        if (currentCatory !== "all")
          query = query.eq("category", currentCatory);

        const { data: facts, error } = await query

          .order("votesInteresting", { ascending: false })
          .limit(100);

        if (!error) setFacts(facts);
        else alert("There was a problem getting data");
        setIsLoading(false);
      }
      getFacts();
    },
    [currentCatory]
  );

  return (
    <>
      <Header showForm={showForm} setShowForm={setShowForm} />

      {showForm ? (
        <NewFactForm setShowForm={setShowForm} setFacts={setFacts} />
      ) : null}
      <main className="main">
        <CategoryFilter setCurrentCatory={setCurrentCatory} />
        {isLoading ? (
          <Loader />
        ) : (
          <FactList setFacts={setFacts} facts={facts} />
        )}
      </main>
    </>
  );
}

const CATEGORIES = [
  { name: "technology", color: "#3b82f6" },
  { name: "science", color: "#16a34a" },
  { name: "finance", color: "#ef4444" },
  { name: "society", color: "#eab308" },
  { name: "entertainment", color: "#db2777" },
  { name: "health", color: "#14b8a6" },
  { name: "history", color: "#f97316" },
  { name: "news", color: "#8b5cf6" },
];

function CategoryFilter({ setCurrentCatory }) {
  return (
    <aside>
      <ul>
        <li className="category">
          <button
            className="btn btn-all-categories"
            onClick={() => setCurrentCatory("all")}
          >
            ALL
          </button>
        </li>
      </ul>
      <ul>
        {CATEGORIES.map((cat) => (
          <li key={cat.name} className="category">
            <button
              onClick={() => setCurrentCatory(cat.name)}
              className="btn btn-category"
              style={{ backgroundColor: cat.color }}
            >
              {cat.name}
            </button>
          </li>
        ))}
      </ul>
    </aside>
  );
}

function Loader() {
  return <p className="message">LOADING...</p>;
}

function Header({ showForm, setShowForm }) {
  const appTitle = "Knowledge Cookie";
  return (
    <header className="header">
      <div className="logo">
        <img
          className="image"
          src="fortune-cookie-with-paper.jpg"
          alt="Today I Learned Logo"
        />

        <h1>{appTitle}</h1>
      </div>
      <button
        className="btn btn-large btn-open"
        onClick={() => setShowForm((show) => !show)}
      >
        {showForm ? "Close" : "Share a fact"}
      </button>
    </header>
  );
}

function isValidHttpUrl(string) {
  let url;

  try {
    url = new URL(string);
  } catch (_) {
    return false;
  }

  return url.protocol === "http:" || url.protocol === "https:";
}

function NewFactForm({ setFacts, setShowForm }) {
  const [text, setText] = useState("");
  const [source, setSource] = useState("");
  const [category, setCategory] = useState("");
  const textLength = text.length;
  const [isUploading, setIsUploading] = useState(false);

  async function handleSubmit(e) {
    //1.prevent browser reload
    e.preventDefault();
    // console.log(text, source, category);
    //2.check if data is valid, if so, create a new fact
    if (text && category && text.length <= 200 && isValidHttpUrl(source)) {
      //3. create a new fact object
      // const newFact = {
      //   id: Math.round(Math.random() * 100000),
      //   text,
      //   source,
      //   category,
      //   votesInteresting: 0,
      //   votesMindblowing: 0,
      //   votesFalse: 0,
      //   createdIn: new Date().getFullYear(),
      // };

      //3. Upload fact to Supabase and receive the new fact
      setIsUploading(true);
      const { data: newFact, error } = await supabase
        .from("facts")
        .insert([{ text, source, category }])
        .select();

      setIsUploading(false);

      //4. add the new fact to the UI: add the fact to state
      if (!error) setFacts((facts) => [...facts, newFact[0]]);
      //5. Reset input fields
      setText("");
      setCategory("");
      setSource("");

      //6.close the form
      setShowForm(false);
    }
  }

  return (
    <form className="fact-form" onSubmit={handleSubmit}>
      <input
        onChange={(e) => setText(e.target.value)}
        value={text}
        type="text"
        placeholder="Share a fact with the world..."
        disabled={isUploading}
      />
      <span>{200 - textLength}</span>
      <input
        value={source}
        onChange={(e) => setSource(e.target.value)}
        type="text"
        placeholder="Trustworthy source..."
        disabled={isUploading}
      />
      <select
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        disabled={isUploading}
      >
        <option value="">Choose category...</option>
        {CATEGORIES.map((cat) => (
          <option key={cat.name} value={cat.name}>
            {cat.name.toUpperCase()}
          </option>
        ))}
      </select>
      <button className="btn btn-large" disabled={isUploading}>
        Post
      </button>
    </form>
  );
}

function FactList({ facts, setFacts }) {
  if (facts.length === 0) {
    return (
      <p className="message">
        No facts for this category yet! Create the first one.
      </p>
    );
  }
  return (
    <section>
      <ul className="facts-list">
        {facts.map((fact) => (
          <Fact key={fact.id} fact={fact} setFacts={setFacts} />
        ))}
      </ul>
      <p>There are {facts.length} facts in the database. Add your own!</p>
    </section>
  );
}

function Fact({ fact, setFacts }) {
  const [isUpdating, setIsUpdating] = useState(false);
  const isDisputed =
    fact.votesInteresting + fact.votesMindBlowing < fact.votesFalse;

  async function handleVote(columnName) {
    setIsUpdating(true);
    const { data: updatedFact, error } = await supabase
      .from("facts")
      .update({ [columnName]: fact[columnName] + 1 })
      .eq("id", fact.id)
      .select();

    setIsUpdating(false);

    if (!error)
      setFacts((facts) =>
        facts.map((f) => (f.id === fact.id ? updatedFact[0] : f))
      );
  }

  return (
    <li className="fact">
      <p>
        {isDisputed ? <span className="disputed">[❌DISPUTED]</span> : null}
        {fact.text}
        <a className="source" href={fact.source} target="_blank">
          (Source)
        </a>
      </p>
      <span
        className="tag"
        style={{
          backgroundColor: CATEGORIES.find((cat) => cat.name === fact.category)
            .color,
        }}
      >
        {fact.category}
      </span>
      <div className="vote-buttons">
        <button
          disabled={isUpdating}
          onClick={() => handleVote("votesInteresting")}
        >
          👍 {fact.votesInteresting}
        </button>
        <button
          disabled={isUpdating}
          onClick={() => handleVote("votesMindBlowing")}
        >
          😊 {fact.votesMindBlowing}
        </button>
        <button disabled={isUpdating} onClick={() => handleVote("votesFalse")}>
          ⛔️ {fact.votesFalse}
        </button>
      </div>
    </li>
  );
}

export default App;
