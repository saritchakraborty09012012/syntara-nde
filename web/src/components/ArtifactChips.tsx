import { FileArchive, FileDown } from "lucide-react"

import { downloadArtifact, downloadArtifactsZip, type ArtifactFile } from "@/lib/artifacts"
import { formatBytes } from "@/lib/format"

/** Direct-download chips for files the model produced: one per file plus a
    zip of everything when there is more than one. Clicking a chip saves
    the file immediately — no modal, no second hop. */
export function ArtifactChips({ files }: { files: ArtifactFile[] }) {
  if (!files.length) return null
  return (
    <div className="artifact-chips" aria-label="Generated files">
      {files.map((file) => (
        <button
          key={file.name}
          type="button"
          className="artifact-chip"
          onClick={() => downloadArtifact(file)}
          title={`Download ${file.name}`}
        >
          <FileDown size={12} />
          <span>{file.name}</span>
          <small>{formatBytes(new Blob([file.content]).size)}</small>
        </button>
      ))}
      {files.length > 1 ? (
        <button
          type="button"
          className="artifact-chip zip"
          onClick={() => downloadArtifactsZip(files)}
          title="Download every file as one zip"
        >
          <FileArchive size={12} /> Download all (.zip)
        </button>
      ) : null}
    </div>
  )
}
