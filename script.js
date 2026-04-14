let notes = JSON.parse(localStorage.getItem("notes")) || [];
let editIndex = null;
let lastAction = null;

const notesList = document.getElementById("notesList");
const editorOverlay = document.getElementById("editorOverlay");
const viewOverlay = document.getElementById("viewOverlay");
const titleInput = document.getElementById("title");
const noteInput = document.getElementById("noteInput");
const colorInput = document.getElementById("color");
const searchInput = document.getElementById("search");
const editorTitle = document.getElementById("editorTitle");
const viewNoteTitle = document.getElementById("viewNoteTitle");
const viewNoteMeta = document.getElementById("viewNoteMeta");
const viewNoteContent = document.getElementById("viewNoteContent");

function saveToStorage() {
  localStorage.setItem("notes", JSON.stringify(notes));
}

function escapeHtml(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function isDarkColor(hex) {
  const cleanHex = hex.replace("#", "");
  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness < 150;
}

function openEditor(index = null) {
  editIndex = index;

  if (index !== null) {
    const note = notes[index];
    editorTitle.textContent = "Edit Note";
    titleInput.value = note.title;
    noteInput.value = note.content;
    colorInput.value = note.color;
  } else {
    editorTitle.textContent = "Add Note";
    titleInput.value = "";
    noteInput.value = "";
    colorInput.value = "#F6E39A";
  }

  editorOverlay.classList.remove("hidden");
  titleInput.focus();
}

function closeEditor() {
  editorOverlay.classList.add("hidden");
  editIndex = null;
  titleInput.value = "";
  noteInput.value = "";
  colorInput.value = "#F6E39A";
}

function handleEditorOverlayClick(event) {
  if (event.target.id === "editorOverlay") {
    closeEditor();
  }
}

function saveNote() {
  const title = titleInput.value.trim();
  const content = noteInput.value.trim();
  const color = colorInput.value;

  if (!title && !content) return;

  const noteData = {
    title: title || "Untitled",
    content,
    color,
    pinned: editIndex !== null ? notes[editIndex].pinned : false,
    createdAt: editIndex !== null ? notes[editIndex].createdAt : new Date().toLocaleString()
  };

  if (editIndex !== null) {
    lastAction = {
      type: "edit",
      index: editIndex,
      previous: { ...notes[editIndex] }
    };
    notes[editIndex] = noteData;
  } else {
    notes.unshift(noteData);
    lastAction = {
      type: "add",
      index: 0
    };
  }

  saveToStorage();
  closeEditor();
  displayNotes();
}

function getFilteredNotes() {
  const search = searchInput.value.trim().toLowerCase();

  let indexedNotes = notes.map((note, index) => ({ note, index }));

  indexedNotes.sort((a, b) => {
    if (a.note.pinned !== b.note.pinned) {
      return b.note.pinned - a.note.pinned;
    }
    return 0;
  });

  if (!search) return indexedNotes;

  return indexedNotes.filter(({ note }) => {
    return (
      note.title.toLowerCase().includes(search) ||
      note.content.toLowerCase().includes(search)
    );
  });
}

function displayNotes() {
  const filteredNotes = getFilteredNotes();

  if (filteredNotes.length === 0) {
    notesList.innerHTML = `<div class="empty-state">No notes found.</div>`;
    return;
  }

  notesList.innerHTML = filteredNotes
    .map(({ note, index }) => {
      const darkCardClass = isDarkColor(note.color) ? "dark-card" : "";
      return `
        <article class="note-card ${darkCardClass}" style="background:${note.color}">
          <div>
            <h3>${escapeHtml(note.title)} ${note.pinned ? "📌" : ""}</h3>
            <p class="note-preview">${escapeHtml(note.content || "No content")}</p>
          </div>

          <div class="note-actions">
            <button class="note-action" onclick="viewNote(${index})">View</button>
            <button class="note-action" onclick="openEditor(${index})">Edit</button>
            <button class="note-action" onclick="deleteNote(${index})">Delete</button>
            <button class="note-action" onclick="togglePin(${index})">
              ${note.pinned ? "Unpin" : "Pin"}
            </button>
          </div>
        </article>
      `;
    })
    .join("");
}

function viewNote(index) {
  const note = notes[index];
  viewNoteTitle.textContent = note.title || "Untitled";
  viewNoteMeta.textContent = note.pinned ? "Pinned note" : "Normal note";
  viewNoteContent.textContent = note.content || "No content";
  viewOverlay.classList.remove("hidden");
}

function closeView() {
  viewOverlay.classList.add("hidden");
}

function handleViewOverlayClick(event) {
  if (event.target.id === "viewOverlay") {
    closeView();
  }
}

function deleteNote(index) {
  const deletedNote = notes[index];
  lastAction = {
    type: "delete",
    index,
    note: { ...deletedNote }
  };
  notes.splice(index, 1);
  saveToStorage();
  displayNotes();
  closeView();
}

function clearAllNotes() {
  if (notes.length === 0) return;

  const confirmed = window.confirm("Clear all notes?");
  if (!confirmed) return;

  lastAction = {
    type: "clearAll",
    notes: notes.map(note => ({ ...note }))
  };

  notes = [];
  saveToStorage();
  displayNotes();
  closeView();
}

function undoLastAction() {
  if (!lastAction) return;

  if (lastAction.type === "delete") {
    notes.splice(lastAction.index, 0, lastAction.note);
  } else if (lastAction.type === "clearAll") {
    notes = lastAction.notes.map(note => ({ ...note }));
  } else if (lastAction.type === "add") {
    notes.splice(lastAction.index, 1);
  } else if (lastAction.type === "edit") {
    notes[lastAction.index] = { ...lastAction.previous };
  }

  lastAction = null;
  saveToStorage();
  displayNotes();
  closeView();
}

function togglePin(index) {
  notes[index].pinned = !notes[index].pinned;
  saveToStorage();
  displayNotes();
  closeView();
}

displayNotes();