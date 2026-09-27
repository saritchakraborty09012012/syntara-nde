import { Fragment, useState } from "react"
import { ArrowLeft, Download, Link2, Package } from "lucide-react"
import { modelCatalog, type CatalogFile, type CatalogModel } from "@/lib/model-catalog"
import type { ModelMeta } from "@/lib/syntara-state"

export interface FamilyDownload {
  repo: string
  name: string
  url: string
}

interface ModelFamilyPageProps {
  family: ModelMeta | undefined
  familyId: string
  onBack: () => void
  onDownload: (file: FamilyDownload) => void
}

/* One family = one addressable page (#models/<family-id>). Every checkpoint
   from the catalog export renders as a table row; the Download button reads
   its URL from catalog data at click time, so the page never exposes direct
   download links. Sharded checkpoints expand into their required files —
   every file has its own button because every file is required. */
export function ModelFamilyPage({ family, familyId, onBack, onDownload }: ModelFamilyPageProps) {
  const models = modelCatalog[familyId] ?? []
  const [openRepo, setOpenRepo] = useState<string | null>(null)
  const totalFiles = models.reduce((count, model) => count + model.files.length, 0)

  const downloadFile = (model: CatalogModel, file: CatalogFile) => {
    onDownload({
      repo: model.repo,
      name: model.files.length === 1 ? model.repo : `${model.repo} · ${file.label}`,
      url: file.url,
    })
  }

  return (
    <section className="view scroll-view family-view">
      <div className="section-head">
        <div>
          <button className="ghost-btn family-back" onClick={onBack}>
            <ArrowLeft size={15} /> All model families
          </button>
          <span className="section-kicker">MODEL FAMILY</span>
          <h2>{family ? family.name : "Unknown family"}</h2>
          <p>
            {family
              ? `${family.provider} · ${family.architecture} · ${models.length} checkpoints · ${totalFiles} downloadable files`
              : "This family is not part of your catalog."}
          </p>
        </div>
        {family && (
          <div className="head-actions">
            <a className="ghost-btn" href={family.sourceUrl} target="_blank" rel="noreferrer">
              <Link2 size={15} /> Source
            </a>
          </div>
        )}
      </div>

      {!family || !models.length ? (
        <div className="empty-state-card">
          <Package size={22} />
          <strong>{family ? "No download entries yet" : "Family not found"}</strong>
          <p>
            {family
              ? "The catalog export did not include downloadable files for this family. Import a local model instead, or check back after the next catalog update."
              : "This route does not match a model family in your catalog. Go back and pick a family from the Model Hub."}
          </p>
          <button className="ghost-btn" onClick={onBack}>
            <ArrowLeft size={14} /> Back to Model Hub
          </button>
        </div>
      ) : (
        <div className="family-table-wrap">
          <table className="family-table">
            <thead>
              <tr>
                <th>Model name</th>
                <th>B rating</th>
                <th>Parameters</th>
                <th>Size on disk</th>
                <th>Download</th>
              </tr>
            </thead>
            <tbody>
              {models.map((model) => {
                const single = model.files.length === 1
                const expanded = openRepo === model.repo
                return (
                  <Fragment key={model.repo}>
                    <tr>
                      <td className="ft-model">
                        <span className="ft-repo">{model.repo}</span>
                        {!single && <span className="ft-shard-badge">{model.files.length} files</span>}
                      </td>
                      <td>{model.bRating}</td>
                      <td>{model.parameters}</td>
                      <td>{model.size}</td>
                      <td className="ft-actions">
                        <button
                          className="primary-btn small"
                          onClick={() => {
                            if (single) downloadFile(model, model.files[0])
                            else setOpenRepo(expanded ? null : model.repo)
                          }}
                        >
                          <Download size={13} />
                          {single ? "Download" : expanded ? "Hide files" : `Download ${model.files.length} files`}
                        </button>
                      </td>
                    </tr>
                    {!single && expanded && (
                      <tr className="ft-files-row">
                        <td colSpan={5}>
                          <div className="ft-files">
                            <p className="ft-files-note">
                              Sharded checkpoint — every listed file is required. Each button downloads one file to the
                              location you pick.
                            </p>
                            {model.files.map((file) => (
                              <div className="ft-file" key={file.url}>
                                <span className="ft-file-label">{file.label}</span>
                                <button className="ghost-btn small" onClick={() => downloadFile(model, file)}>
                                  <Download size={13} /> Download
                                </button>
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
