// F12 + F13: capture photos and a note, then analyze.

import { useEffect, useId, useRef, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Page } from "../components/Page";
import { api } from "../api/client";
import { useCase } from "../case/CaseContext";
import { copy, errorMessage } from "../copy";
import { Dictate, appendDictation } from "../components/Dictate";

const MAX_PHOTOS = 3;
const MAX_BYTES = 8 * 1024 * 1024;
const MAX_NOTE = 1000;
const ACCEPT = "image/jpeg,image/png,image/webp";
const ACCEPTED = ACCEPT.split(",");

interface Picked { id: number; file: File; preview: string }

let nextId = 1;

export function NewView() {
  const { caseId, upsertEntry } = useCase();
  const navigate = useNavigate();
  const cameraInput = useRef<HTMLInputElement>(null);
  const libraryInput = useRef<HTMLInputElement>(null);
  const errorBox = useRef<HTMLDivElement>(null);
  const noteId = useId();

  const [photos, setPhotos] = useState<Picked[]>([]);
  const [note, setNote] = useState("");
  const [pickErrors, setPickErrors] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Free preview memory when photos leave the screen.
  const photosRef = useRef(photos);
  photosRef.current = photos;
  useEffect(() => () => photosRef.current.forEach((p) => URL.revokeObjectURL(p.preview)), []);

  function addFiles(list: FileList | null) {
    if (!list) return;
    const errors: string[] = [];
    const room = MAX_PHOTOS - photos.length;
    const accepted: Picked[] = [];
    for (const file of Array.from(list)) {
      if (!ACCEPTED.includes(file.type)) {
        errors.push(`${file.name} is not a JPEG, PNG, or WebP photo.`);
      } else if (file.size > MAX_BYTES) {
        errors.push(`${file.name} is too big. Each photo must be under 8 MB.`);
      } else if (accepted.length >= room) {
        errors.push(`You can add up to ${MAX_PHOTOS} photos. ${file.name} was not added.`);
      } else {
        accepted.push({ id: nextId++, file, preview: URL.createObjectURL(file) });
      }
    }
    setPhotos((prev) => [...prev, ...accepted]);
    setPickErrors(errors);
    setSubmitError(null);
  }

  function remove(id: number) {
    setPhotos((prev) => {
      const gone = prev.find((p) => p.id === id);
      if (gone) URL.revokeObjectURL(gone.preview);
      return prev.filter((p) => p.id !== id);
    });
  }

  async function submit(e?: FormEvent) {
    e?.preventDefault();
    if (!caseId || photos.length === 0 || busy) return;
    setBusy(true);
    setSubmitError(null);
    setPickErrors([]);
    try {
      const { entry } = await api.createEntry(caseId, photos.map((p) => p.file), note.trim());
      upsertEntry(entry);
      navigate(`/entry/${entry.entryId}`);
    } catch (err) {
      setSubmitError(errorMessage(err));
      setBusy(false);
      // Move focus to the error so keyboard and screen reader users find it.
      requestAnimationFrame(() => errorBox.current?.focus());
    }
  }

  const full = photos.length >= MAX_PHOTOS;
  const noteLeft = MAX_NOTE - note.length;

  return (
    <Page title="Add a problem">
      <p>Take up to {MAX_PHOTOS} photos of one problem. Get close and use good light.</p>

      <form onSubmit={submit} noValidate aria-busy={busy}>
        <fieldset disabled={busy}>
          <legend className="visually-hidden">Photos and note</legend>

          <div className="row capture-buttons">
            {/* One primary action: Take a photo until there is a photo, then Analyze. */}
            <button type="button" className={`btn${photos.length === 0 ? " btn--primary" : ""}`} onClick={() => cameraInput.current?.click()} disabled={full}>
              Take a photo
            </button>
            <button type="button" className="btn" onClick={() => libraryInput.current?.click()} disabled={full}>
              Choose from your photos
            </button>
          </div>
          {/* The real inputs. Hidden from everyone; the buttons above open them. */}
          <input
            ref={cameraInput} type="file" accept={ACCEPT} capture="environment" hidden
            onChange={(e) => { addFiles(e.target.files); e.target.value = ""; }}
          />
          <input
            ref={libraryInput} type="file" accept={ACCEPT} multiple hidden
            onChange={(e) => { addFiles(e.target.files); e.target.value = ""; }}
          />
          <p className="hint">
            {photos.length} of {MAX_PHOTOS} photos added. JPEG, PNG, or WebP, under 8 MB each.
          </p>

          <div aria-live="polite">
            {pickErrors.length > 0 && (
              <div className="notice notice--warn">
                <ul className="plain">{pickErrors.map((m) => <li key={m}>{m}</li>)}</ul>
              </div>
            )}
          </div>

          {photos.length > 0 && (
            <ul className="previews" aria-label="Photos to analyze">
              {photos.map((p, i) => (
                <li key={p.id} className="preview">
                  <img src={p.preview} alt={`Photo ${i + 1} of ${photos.length}`} />
                  <button type="button" className="btn" onClick={() => remove(p.id)}>
                    Remove photo {i + 1} of {photos.length}
                  </button>
                </li>
              ))}
            </ul>
          )}

          <div className="field">
            <label htmlFor={noteId}>Note (optional)</label>
            <span className="hint" id={`${noteId}-hint`}>Where is it, and when did it start?</span>
            <textarea
              id={noteId}
              value={note}
              maxLength={MAX_NOTE}
              onChange={(e) => setNote(e.target.value)}
              aria-describedby={`${noteId}-hint ${noteId}-count`}
              rows={4}
            />
            <span className="hint" id={`${noteId}-count`}>
              {noteLeft} of {MAX_NOTE} characters left.
            </span>
            <Dictate onText={(t) => setNote((n) => appendDictation(n, t, MAX_NOTE))} disabled={busy} />
          </div>

          <button type="submit" className="btn btn--primary btn--block" disabled={photos.length === 0}>
            Analyze
          </button>
          {photos.length === 0 && <p className="hint">Add at least one photo to analyze.</p>}
        </fieldset>
      </form>

      <div role="status" aria-live="polite" className="status-line">
        {busy && <p className="notice notice--info"><span className="spinner" aria-hidden="true" /> {copy.analyzing}</p>}
      </div>

      {submitError && (
        <div ref={errorBox} tabIndex={-1} role="alert" className="notice notice--hazard">
          <p>{submitError}</p>
          <button type="button" className="btn" onClick={() => submit()}>Try again</button>
        </div>
      )}
    </Page>
  );
}
