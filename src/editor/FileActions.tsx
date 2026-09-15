import { useEffect, useRef, useState } from 'react'
import {
  browserOpenDialog,
  browserSaveDialog,
  downloadProject,
  openPickerOptions,
  parseProject,
  savePickerOptions,
  type OpenFile,
  type SaveHandle,
  writeProject,
} from '../file/projectFile'
import { MAX_BYTES } from '../model/project'
import type { ProjectDocument } from '../model/project'
import { useAppStore } from '../store'
import { ExportDialog } from './ExportDialog'

type HandleBinding = { handle: SaveHandle; generation: number; boundProjectName: string }

export function FileActions() {
  const s = useAppStore(),
    file = useRef<HTMLInputElement>(null),
    dialog = useRef<HTMLDialogElement>(null),
    nameDialog = useRef<HTMLDialogElement>(null),
    nameInput = useRef<HTMLInputElement>(null),
    menu = useRef<HTMLDetailsElement>(null),
    binding = useRef<HandleBinding | null>(null),
    busyRef = useRef(false)
  const openToken = useRef(0),
    saveToken = useRef(0),
    [busy, setBusy] = useState(false)
  const [confirm, setConfirm] = useState<'new' | 'open' | null>(null)
  const [namePrompt, setNamePrompt] = useState(false)
  const [projectName, setProjectName] = useState('')
  const [nameError, setNameError] = useState(false)
  const [exportOpen, setExportOpen] = useState(false)
  useEffect(() => {
    if (confirm) dialog.current?.showModal()
    else if (dialog.current?.open) dialog.current.close()
  }, [confirm])
  useEffect(() => {
    const current = nameDialog.current
    if (!current) return
    if (namePrompt) {
      current.showModal()
      nameInput.current?.focus({ preventScroll: true })
    } else if (current.open) current.close()
  }, [namePrompt])
  const replace = (document: ReturnType<typeof parseProject>, handle?: SaveHandle) => {
    const now = useAppStore.getState()
    now.replace(document)
    binding.current = null
    if (handle)
      binding.current = {
        handle,
        generation: useAppStore.getState().generation,
        boundProjectName: document.name,
      }
    now.setMessage('Project file opened.')
  }
  const acceptRead = (
    chosen: OpenFile,
    token: number,
    revision: number,
    generation: number,
    neckDraftRevision: number,
    handle?: SaveHandle,
  ) => {
    if (chosen.size > MAX_BYTES) {
      s.setMessage('Open failed: the file exceeds the 2 MiB technical limit.')
      return
    }
    chosen
      .text()
      .then(parseProject)
      .then((document) => {
        const now = useAppStore.getState()
        if (token !== openToken.current) return
        if (
          now.revision !== revision ||
          now.generation !== generation ||
          now.neckDraftRevision !== neckDraftRevision
        ) {
          now.setMessage(
            'The open operation was not used because the project was edited or changed while reading.',
          )
          return
        }
        replace(document, handle)
      })
      .catch((error) => {
        if (token === openToken.current) s.setMessage(`Open failed: ${(error as Error).message}`)
      })
  }
  const launchOpen = () => {
    const native = browserOpenDialog()
    if (!native) {
      file.current?.click()
      return
    }
    const state = useAppStore.getState(),
      token = ++openToken.current,
      revision = state.revision,
      generation = state.generation,
      neckDraftRevision = state.neckDraftRevision
    // Picker invocation remains in this click's activation chain.
    let pending: Promise<readonly import('../file/projectFile').OpenHandle[]>
    try {
      pending = native.showOpenFilePicker(openPickerOptions)
    } catch (error) {
      s.setMessage(`Open failed: ${(error as Error).message}`)
      return
    }
    pending
      .then(async (handles) => {
        const handle = handles[0]
        if (!handle) return
        const chosen = await handle.getFile()
        acceptRead(chosen, token, revision, generation, neckDraftRevision, handle)
      })
      .catch((error) => {
        if (token === openToken.current)
          s.setMessage(
            (error as DOMException).name === 'AbortError'
              ? 'Open cancelled.'
              : `Open failed: ${(error as Error).message}`,
          )
      })
  }
  const startNew = () => {
    binding.current = null
    s.newProject()
  }
  const request = (kind: 'new' | 'open') => {
    ++openToken.current
    const current = useAppStore.getState()
    if (current.dirty || current.neckDraft?.pending) {
      setConfirm(kind)
      return
    }
    if (kind === 'new') startNew()
    else launchOpen()
  }
  const accept = () => {
    const kind = confirm
    setConfirm(null)
    ++openToken.current
    if (kind === 'new') startNew()
    else if (kind === 'open') launchOpen()
  }
  const saveError = (error: unknown, token: number, generation: number, failed?: SaveHandle) => {
    const now = useAppStore.getState()
    if (token !== saveToken.current || now.generation !== generation) return
    if (failed && binding.current?.handle === failed && binding.current.generation === generation)
      binding.current = null
    now.setMessage(
      (error as DOMException).name === 'AbortError'
        ? 'Save cancelled.'
        : `Save failed: ${(error as Error).message}`,
    )
  }
  const write = (
    handle: SaveHandle,
    snapshot: ProjectDocument,
    generation: number,
    token: number,
    bind: boolean,
  ) => {
    void writeProject(handle, snapshot)
      .then(() => {
        const now = useAppStore.getState()
        if (token !== saveToken.current || now.generation !== generation) return
        if (bind) binding.current = { handle, generation, boundProjectName: snapshot.name }
        now.markSaved(snapshot, generation)
        now.setMessage('Project file saved.')
      })
      .catch((error) => saveError(error, token, generation, handle))
      .finally(() => {
        if (token === saveToken.current) {
          busyRef.current = false
          setBusy(false)
        }
      })
  }
  const saveDocument = () => {
    let current = useAppStore.getState()
    if (current.neckDraft?.pending || current.neckDraft?.error || current.drag) {
      current.setMessage('Accept or cancel the unfinished change before saving.')
      return
    }
    if (!current.document.name.trim()) {
      if (current.neckDraft) {
        current.cancelNeckDraft()
        current = useAppStore.getState()
      }
      setProjectName(current.document.name)
      setNameError(false)
      setNamePrompt(true)
      return
    }
    beginSave()
  }
  const beginSave = () => {
    if (busyRef.current) return
    const current = useAppStore.getState()
    if (current.neckDraft?.pending || current.neckDraft?.error || current.drag) {
      current.setMessage('Accept or cancel the unfinished change before saving.')
      return
    }
    if (!current.document.name.trim()) {
      setProjectName(current.document.name)
      setNameError(false)
      setNamePrompt(true)
      return
    }
    const snapshot = structuredClone(current.document),
      generation = current.generation,
      token = ++saveToken.current,
      known = binding.current
    busyRef.current = true
    setBusy(true)
    if (known?.generation === generation && known.boundProjectName === snapshot.name) {
      write(known.handle, snapshot, generation, token, false)
      return
    }
    const dialog = browserSaveDialog()
    if (!dialog) {
      try {
        downloadProject(snapshot, snapshot.name)
        const now = useAppStore.getState()
        if (token === saveToken.current && now.generation === generation) {
          now.markSaved(snapshot, generation)
          now.setMessage(
            'Download started: a new copy was created because this browser cannot overwrite the previous file.',
          )
        }
      } catch (error) {
        saveError(error, token, generation)
      } finally {
        busyRef.current = false
        setBusy(false)
      }
      return
    }
    // This call deliberately happens before any await after a Save activation.
    let pending: Promise<SaveHandle>
    try {
      pending = dialog.showSaveFilePicker(savePickerOptions(snapshot.name))
    } catch (error) {
      saveError(error, token, generation)
      busyRef.current = false
      setBusy(false)
      return
    }
    void pending
      .then((handle) => {
        const now = useAppStore.getState()
        if (token !== saveToken.current || now.generation !== generation) return
        write(handle, snapshot, generation, token, true)
      })
      .catch((error) => {
        saveError(error, token, generation)
        if (token === saveToken.current) {
          busyRef.current = false
          setBusy(false)
        }
      })
      .finally(() => {
        // A successful picker continues in write(), which owns the busy state.
        if (token === saveToken.current && useAppStore.getState().generation !== generation) {
          busyRef.current = false
          setBusy(false)
        }
      })
  }
  const submitName = () => {
    const value = projectName.trim()
    if (!value || value.length > 160) {
      setNameError(true)
      return
    }
    useAppStore.getState().rename(value)
    if (useAppStore.getState().document.name !== value) {
      setNameError(true)
      return
    }
    setNamePrompt(false)
    beginSave()
  }
  const open = (event: React.ChangeEvent<HTMLInputElement>) => {
    const chosen = event.target.files?.[0]
    event.target.value = ''
    if (!chosen) return
    const state = useAppStore.getState(),
      token = ++openToken.current
    acceptRead(chosen, token, state.revision, state.generation, state.neckDraftRevision)
  }
  return (
    <>
      <details className="file-menu" ref={menu}>
        <summary>File</summary>
        <div
          className="file-actions"
          onClick={(event) => {
            if ((event.target as Element).closest('button')) menu.current?.removeAttribute('open')
          }}
        >
          <button onClick={() => request('new')}>New</button>
          <button onClick={() => request('open')}>Open</button>
          <button className="accent" disabled={busy} onClick={saveDocument}>
            Save
          </button>
          <button
            onClick={() => {
              const current = useAppStore.getState()
              if (current.neckDraft?.pending || current.drag) {
                current.setMessage('Accept or cancel the unfinished change before exporting.')
                return
              }
              setExportOpen(true)
            }}
          >
            Export / print
          </button>
          <input
            ref={file}
            data-testid="project-file"
            hidden
            type="file"
            accept=".gtrfactory,application/json"
            onChange={open}
          />
        </div>
      </details>
      <dialog ref={dialog} onCancel={() => setConfirm(null)} aria-labelledby="replace-question">
        <p id="replace-question">Replace unsaved changes?</p>
        <p>You can cancel and save the current project first.</p>
        <div className="dialog-actions">
          <button onClick={() => setConfirm(null)} autoFocus>
            Cancel
          </button>
          <button onClick={accept}>Continue</button>
        </div>
      </dialog>
      <dialog
        className="save-name-dialog"
        ref={nameDialog}
        onCancel={() => setNamePrompt(false)}
        aria-labelledby="save-name-title"
      >
        <p id="save-name-title">Name your project</p>
        <label>
          Project name
          <input
            ref={nameInput}
            aria-label="Project name"
            maxLength={160}
            value={projectName}
            aria-describedby={nameError ? 'save-name-error' : undefined}
            onChange={(event) => {
              setProjectName(event.target.value)
              setNameError(false)
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter') submitName()
            }}
          />
        </label>
        {nameError && (
          <p id="save-name-error" className="save-name-error" role="alert">
            Enter a project name between 1 and 160 characters.
          </p>
        )}
        <div className="save-name-actions">
          <button onClick={() => setNamePrompt(false)}>Cancel</button>
          <button onClick={submitName}>Save</button>
        </div>
      </dialog>
      {exportOpen && <ExportDialog onClose={() => setExportOpen(false)} />}
    </>
  )
}
