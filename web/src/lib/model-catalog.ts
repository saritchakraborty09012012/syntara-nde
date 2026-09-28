/* Model catalog — GENERATED from Syntara_Model_Catalog_With_Params_Size.txt
   and verified against the Hugging Face API (file lists, sizes, access flags)
   on 2026-09-28. Do not edit by hand; regenerate when the source changes.

   Download URLs are data-only on purpose: the UI renders Download buttons
   that read these URLs at click time, never <a href> links, so the links are
   not exposed as navigable destinations on the family page. Gated repos
   (license/login required) and missing repos carry flags instead of an
   anonymous download that would fail with 401/404. */

export interface CatalogFile {
  label: string
  url: string
}

export interface CatalogModel {
  repo: string
  bRating: string
  parameters: string
  size: string
  /** Repo requires a Hugging Face account/license acceptance (download would 401). */
  gated?: boolean
  /** Repo or weight files no longer exist on Hugging Face (download would 404). */
  missing?: boolean
  files: CatalogFile[]
}

export const modelCatalog: Record<string, CatalogModel[]> = {
  "gpt2-local": [
    {
      "repo": "openai-community/gpt2",
      "bRating": "150M",
      "parameters": "150M",
      "size": "523 MB",
      "files": [
        {
          "label": "model.safetensors",
          "url": "https://huggingface.co/openai-community/gpt2/resolve/main/model.safetensors?download=true"
        }
      ]
    }
  ],
  "gpt-oss-local": [
    {
      "repo": "openai/gpt-oss-20b",
      "bRating": "20B",
      "parameters": "20B",
      "size": "25.6 GB",
      "files": [
        {
          "label": "model-00000-of-00002.safetensors",
          "url": "https://huggingface.co/openai/gpt-oss-20b/resolve/main/model-00000-of-00002.safetensors?download=true"
        },
        {
          "label": "model-00001-of-00002.safetensors",
          "url": "https://huggingface.co/openai/gpt-oss-20b/resolve/main/model-00001-of-00002.safetensors?download=true"
        },
        {
          "label": "model-00002-of-00002.safetensors",
          "url": "https://huggingface.co/openai/gpt-oss-20b/resolve/main/model-00002-of-00002.safetensors?download=true"
        },
        {
          "label": "original/model.safetensors",
          "url": "https://huggingface.co/openai/gpt-oss-20b/resolve/main/original/model.safetensors?download=true"
        }
      ]
    },
    {
      "repo": "openai/gpt-oss-120b",
      "bRating": "120B",
      "parameters": "120B",
      "size": "121.5 GB",
      "files": [
        {
          "label": "model-00000-of-00014.safetensors",
          "url": "https://huggingface.co/openai/gpt-oss-120b/resolve/main/model-00000-of-00014.safetensors?download=true"
        },
        {
          "label": "model-00001-of-00014.safetensors",
          "url": "https://huggingface.co/openai/gpt-oss-120b/resolve/main/model-00001-of-00014.safetensors?download=true"
        },
        {
          "label": "model-00002-of-00014.safetensors",
          "url": "https://huggingface.co/openai/gpt-oss-120b/resolve/main/model-00002-of-00014.safetensors?download=true"
        },
        {
          "label": "model-00003-of-00014.safetensors",
          "url": "https://huggingface.co/openai/gpt-oss-120b/resolve/main/model-00003-of-00014.safetensors?download=true"
        },
        {
          "label": "model-00004-of-00014.safetensors",
          "url": "https://huggingface.co/openai/gpt-oss-120b/resolve/main/model-00004-of-00014.safetensors?download=true"
        },
        {
          "label": "model-00005-of-00014.safetensors",
          "url": "https://huggingface.co/openai/gpt-oss-120b/resolve/main/model-00005-of-00014.safetensors?download=true"
        },
        {
          "label": "model-00006-of-00014.safetensors",
          "url": "https://huggingface.co/openai/gpt-oss-120b/resolve/main/model-00006-of-00014.safetensors?download=true"
        },
        {
          "label": "model-00007-of-00014.safetensors",
          "url": "https://huggingface.co/openai/gpt-oss-120b/resolve/main/model-00007-of-00014.safetensors?download=true"
        },
        {
          "label": "model-00008-of-00014.safetensors",
          "url": "https://huggingface.co/openai/gpt-oss-120b/resolve/main/model-00008-of-00014.safetensors?download=true"
        },
        {
          "label": "model-00009-of-00014.safetensors",
          "url": "https://huggingface.co/openai/gpt-oss-120b/resolve/main/model-00009-of-00014.safetensors?download=true"
        },
        {
          "label": "model-00010-of-00014.safetensors",
          "url": "https://huggingface.co/openai/gpt-oss-120b/resolve/main/model-00010-of-00014.safetensors?download=true"
        },
        {
          "label": "model-00011-of-00014.safetensors",
          "url": "https://huggingface.co/openai/gpt-oss-120b/resolve/main/model-00011-of-00014.safetensors?download=true"
        },
        {
          "label": "model-00012-of-00014.safetensors",
          "url": "https://huggingface.co/openai/gpt-oss-120b/resolve/main/model-00012-of-00014.safetensors?download=true"
        },
        {
          "label": "model-00013-of-00014.safetensors",
          "url": "https://huggingface.co/openai/gpt-oss-120b/resolve/main/model-00013-of-00014.safetensors?download=true"
        },
        {
          "label": "model-00014-of-00014.safetensors",
          "url": "https://huggingface.co/openai/gpt-oss-120b/resolve/main/model-00014-of-00014.safetensors?download=true"
        },
        {
          "label": "original/model--00001-of-00007.safetensors",
          "url": "https://huggingface.co/openai/gpt-oss-120b/resolve/main/original/model--00001-of-00007.safetensors?download=true"
        },
        {
          "label": "original/model--00002-of-00007.safetensors",
          "url": "https://huggingface.co/openai/gpt-oss-120b/resolve/main/original/model--00002-of-00007.safetensors?download=true"
        },
        {
          "label": "original/model--00003-of-00007.safetensors",
          "url": "https://huggingface.co/openai/gpt-oss-120b/resolve/main/original/model--00003-of-00007.safetensors?download=true"
        },
        {
          "label": "original/model--00004-of-00007.safetensors",
          "url": "https://huggingface.co/openai/gpt-oss-120b/resolve/main/original/model--00004-of-00007.safetensors?download=true"
        },
        {
          "label": "original/model--00005-of-00007.safetensors",
          "url": "https://huggingface.co/openai/gpt-oss-120b/resolve/main/original/model--00005-of-00007.safetensors?download=true"
        },
        {
          "label": "original/model--00006-of-00007.safetensors",
          "url": "https://huggingface.co/openai/gpt-oss-120b/resolve/main/original/model--00006-of-00007.safetensors?download=true"
        },
        {
          "label": "original/model--00007-of-00007.safetensors",
          "url": "https://huggingface.co/openai/gpt-oss-120b/resolve/main/original/model--00007-of-00007.safetensors?download=true"
        }
      ]
    }
  ],
  "llama-local": [
    {
      "repo": "meta-llama/Llama-3.1-8B",
      "bRating": "8B",
      "parameters": "8B",
      "size": "15.0 GB",
      "files": [
        {
          "label": "model-00001-of-00004.safetensors",
          "url": "https://huggingface.co/meta-llama/Llama-3.1-8B/resolve/main/model-00001-of-00004.safetensors?download=true"
        },
        {
          "label": "model-00002-of-00004.safetensors",
          "url": "https://huggingface.co/meta-llama/Llama-3.1-8B/resolve/main/model-00002-of-00004.safetensors?download=true"
        },
        {
          "label": "model-00003-of-00004.safetensors",
          "url": "https://huggingface.co/meta-llama/Llama-3.1-8B/resolve/main/model-00003-of-00004.safetensors?download=true"
        },
        {
          "label": "model-00004-of-00004.safetensors",
          "url": "https://huggingface.co/meta-llama/Llama-3.1-8B/resolve/main/model-00004-of-00004.safetensors?download=true"
        }
      ],
      "gated": true
    },
    {
      "repo": "meta-llama/Llama-3.1-8B-Instruct",
      "bRating": "8B",
      "parameters": "8B",
      "size": "15.0 GB",
      "files": [
        {
          "label": "model-00001-of-00004.safetensors",
          "url": "https://huggingface.co/meta-llama/Llama-3.1-8B-Instruct/resolve/main/model-00001-of-00004.safetensors?download=true"
        },
        {
          "label": "model-00002-of-00004.safetensors",
          "url": "https://huggingface.co/meta-llama/Llama-3.1-8B-Instruct/resolve/main/model-00002-of-00004.safetensors?download=true"
        },
        {
          "label": "model-00003-of-00004.safetensors",
          "url": "https://huggingface.co/meta-llama/Llama-3.1-8B-Instruct/resolve/main/model-00003-of-00004.safetensors?download=true"
        },
        {
          "label": "model-00004-of-00004.safetensors",
          "url": "https://huggingface.co/meta-llama/Llama-3.1-8B-Instruct/resolve/main/model-00004-of-00004.safetensors?download=true"
        }
      ],
      "gated": true
    },
    {
      "repo": "meta-llama/Llama-3.1-70B",
      "bRating": "70B",
      "parameters": "70B",
      "size": "131.4 GB",
      "files": [
        {
          "label": "model-00001-of-00030.safetensors",
          "url": "https://huggingface.co/meta-llama/Llama-3.1-70B/resolve/main/model-00001-of-00030.safetensors?download=true"
        },
        {
          "label": "model-00002-of-00030.safetensors",
          "url": "https://huggingface.co/meta-llama/Llama-3.1-70B/resolve/main/model-00002-of-00030.safetensors?download=true"
        },
        {
          "label": "model-00003-of-00030.safetensors",
          "url": "https://huggingface.co/meta-llama/Llama-3.1-70B/resolve/main/model-00003-of-00030.safetensors?download=true"
        },
        {
          "label": "model-00004-of-00030.safetensors",
          "url": "https://huggingface.co/meta-llama/Llama-3.1-70B/resolve/main/model-00004-of-00030.safetensors?download=true"
        },
        {
          "label": "model-00005-of-00030.safetensors",
          "url": "https://huggingface.co/meta-llama/Llama-3.1-70B/resolve/main/model-00005-of-00030.safetensors?download=true"
        },
        {
          "label": "model-00006-of-00030.safetensors",
          "url": "https://huggingface.co/meta-llama/Llama-3.1-70B/resolve/main/model-00006-of-00030.safetensors?download=true"
        },
        {
          "label": "model-00007-of-00030.safetensors",
          "url": "https://huggingface.co/meta-llama/Llama-3.1-70B/resolve/main/model-00007-of-00030.safetensors?download=true"
        },
        {
          "label": "model-00008-of-00030.safetensors",
          "url": "https://huggingface.co/meta-llama/Llama-3.1-70B/resolve/main/model-00008-of-00030.safetensors?download=true"
        },
        {
          "label": "model-00009-of-00030.safetensors",
          "url": "https://huggingface.co/meta-llama/Llama-3.1-70B/resolve/main/model-00009-of-00030.safetensors?download=true"
        },
        {
          "label": "model-00010-of-00030.safetensors",
          "url": "https://huggingface.co/meta-llama/Llama-3.1-70B/resolve/main/model-00010-of-00030.safetensors?download=true"
        },
        {
          "label": "model-00011-of-00030.safetensors",
          "url": "https://huggingface.co/meta-llama/Llama-3.1-70B/resolve/main/model-00011-of-00030.safetensors?download=true"
        },
        {
          "label": "model-00012-of-00030.safetensors",
          "url": "https://huggingface.co/meta-llama/Llama-3.1-70B/resolve/main/model-00012-of-00030.safetensors?download=true"
        },
        {
          "label": "model-00013-of-00030.safetensors",
          "url": "https://huggingface.co/meta-llama/Llama-3.1-70B/resolve/main/model-00013-of-00030.safetensors?download=true"
        },
        {
          "label": "model-00014-of-00030.safetensors",
          "url": "https://huggingface.co/meta-llama/Llama-3.1-70B/resolve/main/model-00014-of-00030.safetensors?download=true"
        },
        {
          "label": "model-00015-of-00030.safetensors",
          "url": "https://huggingface.co/meta-llama/Llama-3.1-70B/resolve/main/model-00015-of-00030.safetensors?download=true"
        },
        {
          "label": "model-00016-of-00030.safetensors",
          "url": "https://huggingface.co/meta-llama/Llama-3.1-70B/resolve/main/model-00016-of-00030.safetensors?download=true"
        },
        {
          "label": "model-00017-of-00030.safetensors",
          "url": "https://huggingface.co/meta-llama/Llama-3.1-70B/resolve/main/model-00017-of-00030.safetensors?download=true"
        },
        {
          "label": "model-00018-of-00030.safetensors",
          "url": "https://huggingface.co/meta-llama/Llama-3.1-70B/resolve/main/model-00018-of-00030.safetensors?download=true"
        },
        {
          "label": "model-00019-of-00030.safetensors",
          "url": "https://huggingface.co/meta-llama/Llama-3.1-70B/resolve/main/model-00019-of-00030.safetensors?download=true"
        },
        {
          "label": "model-00020-of-00030.safetensors",
          "url": "https://huggingface.co/meta-llama/Llama-3.1-70B/resolve/main/model-00020-of-00030.safetensors?download=true"
        },
        {
          "label": "model-00021-of-00030.safetensors",
          "url": "https://huggingface.co/meta-llama/Llama-3.1-70B/resolve/main/model-00021-of-00030.safetensors?download=true"
        },
        {
          "label": "model-00022-of-00030.safetensors",
          "url": "https://huggingface.co/meta-llama/Llama-3.1-70B/resolve/main/model-00022-of-00030.safetensors?download=true"
        },
        {
          "label": "model-00023-of-00030.safetensors",
          "url": "https://huggingface.co/meta-llama/Llama-3.1-70B/resolve/main/model-00023-of-00030.safetensors?download=true"
        },
        {
          "label": "model-00024-of-00030.safetensors",
          "url": "https://huggingface.co/meta-llama/Llama-3.1-70B/resolve/main/model-00024-of-00030.safetensors?download=true"
        },
        {
          "label": "model-00025-of-00030.safetensors",
          "url": "https://huggingface.co/meta-llama/Llama-3.1-70B/resolve/main/model-00025-of-00030.safetensors?download=true"
        },
        {
          "label": "model-00026-of-00030.safetensors",
          "url": "https://huggingface.co/meta-llama/Llama-3.1-70B/resolve/main/model-00026-of-00030.safetensors?download=true"
        },
        {
          "label": "model-00027-of-00030.safetensors",
          "url": "https://huggingface.co/meta-llama/Llama-3.1-70B/resolve/main/model-00027-of-00030.safetensors?download=true"
        },
        {
          "label": "model-00028-of-00030.safetensors",
          "url": "https://huggingface.co/meta-llama/Llama-3.1-70B/resolve/main/model-00028-of-00030.safetensors?download=true"
        },
        {
          "label": "model-00029-of-00030.safetensors",
          "url": "https://huggingface.co/meta-llama/Llama-3.1-70B/resolve/main/model-00029-of-00030.safetensors?download=true"
        },
        {
          "label": "model-00030-of-00030.safetensors",
          "url": "https://huggingface.co/meta-llama/Llama-3.1-70B/resolve/main/model-00030-of-00030.safetensors?download=true"
        }
      ],
      "gated": true
    },
    {
      "repo": "meta-llama/Llama-3.1-70B-Instruct",
      "bRating": "70B",
      "parameters": "70B",
      "size": "131.4 GB",
      "files": [
        {
          "label": "model-00001-of-00030.safetensors",
          "url": "https://huggingface.co/meta-llama/Llama-3.1-70B-Instruct/resolve/main/model-00001-of-00030.safetensors?download=true"
        },
        {
          "label": "model-00002-of-00030.safetensors",
          "url": "https://huggingface.co/meta-llama/Llama-3.1-70B-Instruct/resolve/main/model-00002-of-00030.safetensors?download=true"
        },
        {
          "label": "model-00003-of-00030.safetensors",
          "url": "https://huggingface.co/meta-llama/Llama-3.1-70B-Instruct/resolve/main/model-00003-of-00030.safetensors?download=true"
        },
        {
          "label": "model-00004-of-00030.safetensors",
          "url": "https://huggingface.co/meta-llama/Llama-3.1-70B-Instruct/resolve/main/model-00004-of-00030.safetensors?download=true"
        },
        {
          "label": "model-00005-of-00030.safetensors",
          "url": "https://huggingface.co/meta-llama/Llama-3.1-70B-Instruct/resolve/main/model-00005-of-00030.safetensors?download=true"
        },
        {
          "label": "model-00006-of-00030.safetensors",
          "url": "https://huggingface.co/meta-llama/Llama-3.1-70B-Instruct/resolve/main/model-00006-of-00030.safetensors?download=true"
        },
        {
          "label": "model-00007-of-00030.safetensors",
          "url": "https://huggingface.co/meta-llama/Llama-3.1-70B-Instruct/resolve/main/model-00007-of-00030.safetensors?download=true"
        },
        {
          "label": "model-00008-of-00030.safetensors",
          "url": "https://huggingface.co/meta-llama/Llama-3.1-70B-Instruct/resolve/main/model-00008-of-00030.safetensors?download=true"
        },
        {
          "label": "model-00009-of-00030.safetensors",
          "url": "https://huggingface.co/meta-llama/Llama-3.1-70B-Instruct/resolve/main/model-00009-of-00030.safetensors?download=true"
        },
        {
          "label": "model-00010-of-00030.safetensors",
          "url": "https://huggingface.co/meta-llama/Llama-3.1-70B-Instruct/resolve/main/model-00010-of-00030.safetensors?download=true"
        },
        {
          "label": "model-00011-of-00030.safetensors",
          "url": "https://huggingface.co/meta-llama/Llama-3.1-70B-Instruct/resolve/main/model-00011-of-00030.safetensors?download=true"
        },
        {
          "label": "model-00012-of-00030.safetensors",
          "url": "https://huggingface.co/meta-llama/Llama-3.1-70B-Instruct/resolve/main/model-00012-of-00030.safetensors?download=true"
        },
        {
          "label": "model-00013-of-00030.safetensors",
          "url": "https://huggingface.co/meta-llama/Llama-3.1-70B-Instruct/resolve/main/model-00013-of-00030.safetensors?download=true"
        },
        {
          "label": "model-00014-of-00030.safetensors",
          "url": "https://huggingface.co/meta-llama/Llama-3.1-70B-Instruct/resolve/main/model-00014-of-00030.safetensors?download=true"
        },
        {
          "label": "model-00015-of-00030.safetensors",
          "url": "https://huggingface.co/meta-llama/Llama-3.1-70B-Instruct/resolve/main/model-00015-of-00030.safetensors?download=true"
        },
        {
          "label": "model-00016-of-00030.safetensors",
          "url": "https://huggingface.co/meta-llama/Llama-3.1-70B-Instruct/resolve/main/model-00016-of-00030.safetensors?download=true"
        },
        {
          "label": "model-00017-of-00030.safetensors",
          "url": "https://huggingface.co/meta-llama/Llama-3.1-70B-Instruct/resolve/main/model-00017-of-00030.safetensors?download=true"
        },
        {
          "label": "model-00018-of-00030.safetensors",
          "url": "https://huggingface.co/meta-llama/Llama-3.1-70B-Instruct/resolve/main/model-00018-of-00030.safetensors?download=true"
        },
        {
          "label": "model-00019-of-00030.safetensors",
          "url": "https://huggingface.co/meta-llama/Llama-3.1-70B-Instruct/resolve/main/model-00019-of-00030.safetensors?download=true"
        },
        {
          "label": "model-00020-of-00030.safetensors",
          "url": "https://huggingface.co/meta-llama/Llama-3.1-70B-Instruct/resolve/main/model-00020-of-00030.safetensors?download=true"
        },
        {
          "label": "model-00021-of-00030.safetensors",
          "url": "https://huggingface.co/meta-llama/Llama-3.1-70B-Instruct/resolve/main/model-00021-of-00030.safetensors?download=true"
        },
        {
          "label": "model-00022-of-00030.safetensors",
          "url": "https://huggingface.co/meta-llama/Llama-3.1-70B-Instruct/resolve/main/model-00022-of-00030.safetensors?download=true"
        },
        {
          "label": "model-00023-of-00030.safetensors",
          "url": "https://huggingface.co/meta-llama/Llama-3.1-70B-Instruct/resolve/main/model-00023-of-00030.safetensors?download=true"
        },
        {
          "label": "model-00024-of-00030.safetensors",
          "url": "https://huggingface.co/meta-llama/Llama-3.1-70B-Instruct/resolve/main/model-00024-of-00030.safetensors?download=true"
        },
        {
          "label": "model-00025-of-00030.safetensors",
          "url": "https://huggingface.co/meta-llama/Llama-3.1-70B-Instruct/resolve/main/model-00025-of-00030.safetensors?download=true"
        },
        {
          "label": "model-00026-of-00030.safetensors",
          "url": "https://huggingface.co/meta-llama/Llama-3.1-70B-Instruct/resolve/main/model-00026-of-00030.safetensors?download=true"
        },
        {
          "label": "model-00027-of-00030.safetensors",
          "url": "https://huggingface.co/meta-llama/Llama-3.1-70B-Instruct/resolve/main/model-00027-of-00030.safetensors?download=true"
        },
        {
          "label": "model-00028-of-00030.safetensors",
          "url": "https://huggingface.co/meta-llama/Llama-3.1-70B-Instruct/resolve/main/model-00028-of-00030.safetensors?download=true"
        },
        {
          "label": "model-00029-of-00030.safetensors",
          "url": "https://huggingface.co/meta-llama/Llama-3.1-70B-Instruct/resolve/main/model-00029-of-00030.safetensors?download=true"
        },
        {
          "label": "model-00030-of-00030.safetensors",
          "url": "https://huggingface.co/meta-llama/Llama-3.1-70B-Instruct/resolve/main/model-00030-of-00030.safetensors?download=true"
        }
      ],
      "gated": true
    },
    {
      "repo": "meta-llama/Llama-3.3-70B-Instruct",
      "bRating": "70B",
      "parameters": "70B",
      "size": "131.4 GB",
      "files": [
        {
          "label": "model-00001-of-00030.safetensors",
          "url": "https://huggingface.co/meta-llama/Llama-3.3-70B-Instruct/resolve/main/model-00001-of-00030.safetensors?download=true"
        },
        {
          "label": "model-00002-of-00030.safetensors",
          "url": "https://huggingface.co/meta-llama/Llama-3.3-70B-Instruct/resolve/main/model-00002-of-00030.safetensors?download=true"
        },
        {
          "label": "model-00003-of-00030.safetensors",
          "url": "https://huggingface.co/meta-llama/Llama-3.3-70B-Instruct/resolve/main/model-00003-of-00030.safetensors?download=true"
        },
        {
          "label": "model-00004-of-00030.safetensors",
          "url": "https://huggingface.co/meta-llama/Llama-3.3-70B-Instruct/resolve/main/model-00004-of-00030.safetensors?download=true"
        },
        {
          "label": "model-00005-of-00030.safetensors",
          "url": "https://huggingface.co/meta-llama/Llama-3.3-70B-Instruct/resolve/main/model-00005-of-00030.safetensors?download=true"
        },
        {
          "label": "model-00006-of-00030.safetensors",
          "url": "https://huggingface.co/meta-llama/Llama-3.3-70B-Instruct/resolve/main/model-00006-of-00030.safetensors?download=true"
        },
        {
          "label": "model-00007-of-00030.safetensors",
          "url": "https://huggingface.co/meta-llama/Llama-3.3-70B-Instruct/resolve/main/model-00007-of-00030.safetensors?download=true"
        },
        {
          "label": "model-00008-of-00030.safetensors",
          "url": "https://huggingface.co/meta-llama/Llama-3.3-70B-Instruct/resolve/main/model-00008-of-00030.safetensors?download=true"
        },
        {
          "label": "model-00009-of-00030.safetensors",
          "url": "https://huggingface.co/meta-llama/Llama-3.3-70B-Instruct/resolve/main/model-00009-of-00030.safetensors?download=true"
        },
        {
          "label": "model-00010-of-00030.safetensors",
          "url": "https://huggingface.co/meta-llama/Llama-3.3-70B-Instruct/resolve/main/model-00010-of-00030.safetensors?download=true"
        },
        {
          "label": "model-00011-of-00030.safetensors",
          "url": "https://huggingface.co/meta-llama/Llama-3.3-70B-Instruct/resolve/main/model-00011-of-00030.safetensors?download=true"
        },
        {
          "label": "model-00012-of-00030.safetensors",
          "url": "https://huggingface.co/meta-llama/Llama-3.3-70B-Instruct/resolve/main/model-00012-of-00030.safetensors?download=true"
        },
        {
          "label": "model-00013-of-00030.safetensors",
          "url": "https://huggingface.co/meta-llama/Llama-3.3-70B-Instruct/resolve/main/model-00013-of-00030.safetensors?download=true"
        },
        {
          "label": "model-00014-of-00030.safetensors",
          "url": "https://huggingface.co/meta-llama/Llama-3.3-70B-Instruct/resolve/main/model-00014-of-00030.safetensors?download=true"
        },
        {
          "label": "model-00015-of-00030.safetensors",
          "url": "https://huggingface.co/meta-llama/Llama-3.3-70B-Instruct/resolve/main/model-00015-of-00030.safetensors?download=true"
        },
        {
          "label": "model-00016-of-00030.safetensors",
          "url": "https://huggingface.co/meta-llama/Llama-3.3-70B-Instruct/resolve/main/model-00016-of-00030.safetensors?download=true"
        },
        {
          "label": "model-00017-of-00030.safetensors",
          "url": "https://huggingface.co/meta-llama/Llama-3.3-70B-Instruct/resolve/main/model-00017-of-00030.safetensors?download=true"
        },
        {
          "label": "model-00018-of-00030.safetensors",
          "url": "https://huggingface.co/meta-llama/Llama-3.3-70B-Instruct/resolve/main/model-00018-of-00030.safetensors?download=true"
        },
        {
          "label": "model-00019-of-00030.safetensors",
          "url": "https://huggingface.co/meta-llama/Llama-3.3-70B-Instruct/resolve/main/model-00019-of-00030.safetensors?download=true"
        },
        {
          "label": "model-00020-of-00030.safetensors",
          "url": "https://huggingface.co/meta-llama/Llama-3.3-70B-Instruct/resolve/main/model-00020-of-00030.safetensors?download=true"
        },
        {
          "label": "model-00021-of-00030.safetensors",
          "url": "https://huggingface.co/meta-llama/Llama-3.3-70B-Instruct/resolve/main/model-00021-of-00030.safetensors?download=true"
        },
        {
          "label": "model-00022-of-00030.safetensors",
          "url": "https://huggingface.co/meta-llama/Llama-3.3-70B-Instruct/resolve/main/model-00022-of-00030.safetensors?download=true"
        },
        {
          "label": "model-00023-of-00030.safetensors",
          "url": "https://huggingface.co/meta-llama/Llama-3.3-70B-Instruct/resolve/main/model-00023-of-00030.safetensors?download=true"
        },
        {
          "label": "model-00024-of-00030.safetensors",
          "url": "https://huggingface.co/meta-llama/Llama-3.3-70B-Instruct/resolve/main/model-00024-of-00030.safetensors?download=true"
        },
        {
          "label": "model-00025-of-00030.safetensors",
          "url": "https://huggingface.co/meta-llama/Llama-3.3-70B-Instruct/resolve/main/model-00025-of-00030.safetensors?download=true"
        },
        {
          "label": "model-00026-of-00030.safetensors",
          "url": "https://huggingface.co/meta-llama/Llama-3.3-70B-Instruct/resolve/main/model-00026-of-00030.safetensors?download=true"
        },
        {
          "label": "model-00027-of-00030.safetensors",
          "url": "https://huggingface.co/meta-llama/Llama-3.3-70B-Instruct/resolve/main/model-00027-of-00030.safetensors?download=true"
        },
        {
          "label": "model-00028-of-00030.safetensors",
          "url": "https://huggingface.co/meta-llama/Llama-3.3-70B-Instruct/resolve/main/model-00028-of-00030.safetensors?download=true"
        },
        {
          "label": "model-00029-of-00030.safetensors",
          "url": "https://huggingface.co/meta-llama/Llama-3.3-70B-Instruct/resolve/main/model-00029-of-00030.safetensors?download=true"
        },
        {
          "label": "model-00030-of-00030.safetensors",
          "url": "https://huggingface.co/meta-llama/Llama-3.3-70B-Instruct/resolve/main/model-00030-of-00030.safetensors?download=true"
        }
      ],
      "gated": true
    },
    {
      "repo": "meta-llama/Llama-3.2-1B",
      "bRating": "1B",
      "parameters": "1B",
      "size": "2.3 GB",
      "files": [
        {
          "label": "model.safetensors",
          "url": "https://huggingface.co/meta-llama/Llama-3.2-1B/resolve/main/model.safetensors?download=true"
        }
      ],
      "gated": true
    },
    {
      "repo": "meta-llama/Llama-3.2-3B",
      "bRating": "3B",
      "parameters": "3B",
      "size": "6.0 GB",
      "files": [
        {
          "label": "model-00001-of-00002.safetensors",
          "url": "https://huggingface.co/meta-llama/Llama-3.2-3B/resolve/main/model-00001-of-00002.safetensors?download=true"
        },
        {
          "label": "model-00002-of-00002.safetensors",
          "url": "https://huggingface.co/meta-llama/Llama-3.2-3B/resolve/main/model-00002-of-00002.safetensors?download=true"
        }
      ],
      "gated": true
    },
    {
      "repo": "meta-llama/Llama-3.2-1B-Instruct",
      "bRating": "1B",
      "parameters": "1B",
      "size": "2.3 GB",
      "files": [
        {
          "label": "model.safetensors",
          "url": "https://huggingface.co/meta-llama/Llama-3.2-1B-Instruct/resolve/main/model.safetensors?download=true"
        }
      ],
      "gated": true
    },
    {
      "repo": "meta-llama/Llama-3.2-3B-Instruct",
      "bRating": "3B",
      "parameters": "3B",
      "size": "6.0 GB",
      "files": [
        {
          "label": "model-00001-of-00002.safetensors",
          "url": "https://huggingface.co/meta-llama/Llama-3.2-3B-Instruct/resolve/main/model-00001-of-00002.safetensors?download=true"
        },
        {
          "label": "model-00002-of-00002.safetensors",
          "url": "https://huggingface.co/meta-llama/Llama-3.2-3B-Instruct/resolve/main/model-00002-of-00002.safetensors?download=true"
        }
      ],
      "gated": true
    }
  ],
  "mistral-local": [
    {
      "repo": "mistralai/Mistral-7B-v0.1",
      "bRating": "7B",
      "parameters": "7B",
      "size": "13.5 GB",
      "files": [
        {
          "label": "model-00001-of-00002.safetensors",
          "url": "https://huggingface.co/mistralai/Mistral-7B-v0.1/resolve/main/model-00001-of-00002.safetensors?download=true"
        },
        {
          "label": "model-00002-of-00002.safetensors",
          "url": "https://huggingface.co/mistralai/Mistral-7B-v0.1/resolve/main/model-00002-of-00002.safetensors?download=true"
        }
      ]
    },
    {
      "repo": "mistralai/Mistral-7B-Instruct-v0.2",
      "bRating": "7B",
      "parameters": "7B",
      "size": "13.5 GB",
      "files": [
        {
          "label": "model-00001-of-00003.safetensors",
          "url": "https://huggingface.co/mistralai/Mistral-7B-Instruct-v0.2/resolve/main/model-00001-of-00003.safetensors?download=true"
        },
        {
          "label": "model-00002-of-00003.safetensors",
          "url": "https://huggingface.co/mistralai/Mistral-7B-Instruct-v0.2/resolve/main/model-00002-of-00003.safetensors?download=true"
        },
        {
          "label": "model-00003-of-00003.safetensors",
          "url": "https://huggingface.co/mistralai/Mistral-7B-Instruct-v0.2/resolve/main/model-00003-of-00003.safetensors?download=true"
        }
      ]
    },
    {
      "repo": "mistralai/Mistral-7B-Instruct-v0.3",
      "bRating": "7B",
      "parameters": "7B",
      "size": "27.0 GB",
      "files": [
        {
          "label": "consolidated.safetensors",
          "url": "https://huggingface.co/mistralai/Mistral-7B-Instruct-v0.3/resolve/main/consolidated.safetensors?download=true"
        },
        {
          "label": "model-00001-of-00003.safetensors",
          "url": "https://huggingface.co/mistralai/Mistral-7B-Instruct-v0.3/resolve/main/model-00001-of-00003.safetensors?download=true"
        },
        {
          "label": "model-00002-of-00003.safetensors",
          "url": "https://huggingface.co/mistralai/Mistral-7B-Instruct-v0.3/resolve/main/model-00002-of-00003.safetensors?download=true"
        },
        {
          "label": "model-00003-of-00003.safetensors",
          "url": "https://huggingface.co/mistralai/Mistral-7B-Instruct-v0.3/resolve/main/model-00003-of-00003.safetensors?download=true"
        }
      ]
    },
    {
      "repo": "mistralai/Mixtral-8x7B-v0.1",
      "bRating": "Unknown",
      "parameters": "Unknown",
      "size": "87.0 GB",
      "files": [
        {
          "label": "model-00001-of-00019.safetensors",
          "url": "https://huggingface.co/mistralai/Mixtral-8x7B-v0.1/resolve/main/model-00001-of-00019.safetensors?download=true"
        },
        {
          "label": "model-00002-of-00019.safetensors",
          "url": "https://huggingface.co/mistralai/Mixtral-8x7B-v0.1/resolve/main/model-00002-of-00019.safetensors?download=true"
        },
        {
          "label": "model-00003-of-00019.safetensors",
          "url": "https://huggingface.co/mistralai/Mixtral-8x7B-v0.1/resolve/main/model-00003-of-00019.safetensors?download=true"
        },
        {
          "label": "model-00004-of-00019.safetensors",
          "url": "https://huggingface.co/mistralai/Mixtral-8x7B-v0.1/resolve/main/model-00004-of-00019.safetensors?download=true"
        },
        {
          "label": "model-00005-of-00019.safetensors",
          "url": "https://huggingface.co/mistralai/Mixtral-8x7B-v0.1/resolve/main/model-00005-of-00019.safetensors?download=true"
        },
        {
          "label": "model-00006-of-00019.safetensors",
          "url": "https://huggingface.co/mistralai/Mixtral-8x7B-v0.1/resolve/main/model-00006-of-00019.safetensors?download=true"
        },
        {
          "label": "model-00007-of-00019.safetensors",
          "url": "https://huggingface.co/mistralai/Mixtral-8x7B-v0.1/resolve/main/model-00007-of-00019.safetensors?download=true"
        },
        {
          "label": "model-00008-of-00019.safetensors",
          "url": "https://huggingface.co/mistralai/Mixtral-8x7B-v0.1/resolve/main/model-00008-of-00019.safetensors?download=true"
        },
        {
          "label": "model-00009-of-00019.safetensors",
          "url": "https://huggingface.co/mistralai/Mixtral-8x7B-v0.1/resolve/main/model-00009-of-00019.safetensors?download=true"
        },
        {
          "label": "model-00010-of-00019.safetensors",
          "url": "https://huggingface.co/mistralai/Mixtral-8x7B-v0.1/resolve/main/model-00010-of-00019.safetensors?download=true"
        },
        {
          "label": "model-00011-of-00019.safetensors",
          "url": "https://huggingface.co/mistralai/Mixtral-8x7B-v0.1/resolve/main/model-00011-of-00019.safetensors?download=true"
        },
        {
          "label": "model-00012-of-00019.safetensors",
          "url": "https://huggingface.co/mistralai/Mixtral-8x7B-v0.1/resolve/main/model-00012-of-00019.safetensors?download=true"
        },
        {
          "label": "model-00013-of-00019.safetensors",
          "url": "https://huggingface.co/mistralai/Mixtral-8x7B-v0.1/resolve/main/model-00013-of-00019.safetensors?download=true"
        },
        {
          "label": "model-00014-of-00019.safetensors",
          "url": "https://huggingface.co/mistralai/Mixtral-8x7B-v0.1/resolve/main/model-00014-of-00019.safetensors?download=true"
        },
        {
          "label": "model-00015-of-00019.safetensors",
          "url": "https://huggingface.co/mistralai/Mixtral-8x7B-v0.1/resolve/main/model-00015-of-00019.safetensors?download=true"
        },
        {
          "label": "model-00016-of-00019.safetensors",
          "url": "https://huggingface.co/mistralai/Mixtral-8x7B-v0.1/resolve/main/model-00016-of-00019.safetensors?download=true"
        },
        {
          "label": "model-00017-of-00019.safetensors",
          "url": "https://huggingface.co/mistralai/Mixtral-8x7B-v0.1/resolve/main/model-00017-of-00019.safetensors?download=true"
        },
        {
          "label": "model-00018-of-00019.safetensors",
          "url": "https://huggingface.co/mistralai/Mixtral-8x7B-v0.1/resolve/main/model-00018-of-00019.safetensors?download=true"
        },
        {
          "label": "model-00019-of-00019.safetensors",
          "url": "https://huggingface.co/mistralai/Mixtral-8x7B-v0.1/resolve/main/model-00019-of-00019.safetensors?download=true"
        }
      ]
    },
    {
      "repo": "mistralai/Mixtral-8x7B-Instruct-v0.1",
      "bRating": "Unknown",
      "parameters": "Unknown",
      "size": "87.0 GB",
      "files": [
        {
          "label": "model-00001-of-00019.safetensors",
          "url": "https://huggingface.co/mistralai/Mixtral-8x7B-Instruct-v0.1/resolve/main/model-00001-of-00019.safetensors?download=true"
        },
        {
          "label": "model-00002-of-00019.safetensors",
          "url": "https://huggingface.co/mistralai/Mixtral-8x7B-Instruct-v0.1/resolve/main/model-00002-of-00019.safetensors?download=true"
        },
        {
          "label": "model-00003-of-00019.safetensors",
          "url": "https://huggingface.co/mistralai/Mixtral-8x7B-Instruct-v0.1/resolve/main/model-00003-of-00019.safetensors?download=true"
        },
        {
          "label": "model-00004-of-00019.safetensors",
          "url": "https://huggingface.co/mistralai/Mixtral-8x7B-Instruct-v0.1/resolve/main/model-00004-of-00019.safetensors?download=true"
        },
        {
          "label": "model-00005-of-00019.safetensors",
          "url": "https://huggingface.co/mistralai/Mixtral-8x7B-Instruct-v0.1/resolve/main/model-00005-of-00019.safetensors?download=true"
        },
        {
          "label": "model-00006-of-00019.safetensors",
          "url": "https://huggingface.co/mistralai/Mixtral-8x7B-Instruct-v0.1/resolve/main/model-00006-of-00019.safetensors?download=true"
        },
        {
          "label": "model-00007-of-00019.safetensors",
          "url": "https://huggingface.co/mistralai/Mixtral-8x7B-Instruct-v0.1/resolve/main/model-00007-of-00019.safetensors?download=true"
        },
        {
          "label": "model-00008-of-00019.safetensors",
          "url": "https://huggingface.co/mistralai/Mixtral-8x7B-Instruct-v0.1/resolve/main/model-00008-of-00019.safetensors?download=true"
        },
        {
          "label": "model-00009-of-00019.safetensors",
          "url": "https://huggingface.co/mistralai/Mixtral-8x7B-Instruct-v0.1/resolve/main/model-00009-of-00019.safetensors?download=true"
        },
        {
          "label": "model-00010-of-00019.safetensors",
          "url": "https://huggingface.co/mistralai/Mixtral-8x7B-Instruct-v0.1/resolve/main/model-00010-of-00019.safetensors?download=true"
        },
        {
          "label": "model-00011-of-00019.safetensors",
          "url": "https://huggingface.co/mistralai/Mixtral-8x7B-Instruct-v0.1/resolve/main/model-00011-of-00019.safetensors?download=true"
        },
        {
          "label": "model-00012-of-00019.safetensors",
          "url": "https://huggingface.co/mistralai/Mixtral-8x7B-Instruct-v0.1/resolve/main/model-00012-of-00019.safetensors?download=true"
        },
        {
          "label": "model-00013-of-00019.safetensors",
          "url": "https://huggingface.co/mistralai/Mixtral-8x7B-Instruct-v0.1/resolve/main/model-00013-of-00019.safetensors?download=true"
        },
        {
          "label": "model-00014-of-00019.safetensors",
          "url": "https://huggingface.co/mistralai/Mixtral-8x7B-Instruct-v0.1/resolve/main/model-00014-of-00019.safetensors?download=true"
        },
        {
          "label": "model-00015-of-00019.safetensors",
          "url": "https://huggingface.co/mistralai/Mixtral-8x7B-Instruct-v0.1/resolve/main/model-00015-of-00019.safetensors?download=true"
        },
        {
          "label": "model-00016-of-00019.safetensors",
          "url": "https://huggingface.co/mistralai/Mixtral-8x7B-Instruct-v0.1/resolve/main/model-00016-of-00019.safetensors?download=true"
        },
        {
          "label": "model-00017-of-00019.safetensors",
          "url": "https://huggingface.co/mistralai/Mixtral-8x7B-Instruct-v0.1/resolve/main/model-00017-of-00019.safetensors?download=true"
        },
        {
          "label": "model-00018-of-00019.safetensors",
          "url": "https://huggingface.co/mistralai/Mixtral-8x7B-Instruct-v0.1/resolve/main/model-00018-of-00019.safetensors?download=true"
        },
        {
          "label": "model-00019-of-00019.safetensors",
          "url": "https://huggingface.co/mistralai/Mixtral-8x7B-Instruct-v0.1/resolve/main/model-00019-of-00019.safetensors?download=true"
        }
      ]
    },
    {
      "repo": "mistralai/Mixtral-8x22B-v0.1",
      "bRating": "Unknown",
      "parameters": "Unknown",
      "size": "261.9 GB",
      "files": [
        {
          "label": "model-00001-of-00059.safetensors",
          "url": "https://huggingface.co/mistralai/Mixtral-8x22B-v0.1/resolve/main/model-00001-of-00059.safetensors?download=true"
        },
        {
          "label": "model-00002-of-00059.safetensors",
          "url": "https://huggingface.co/mistralai/Mixtral-8x22B-v0.1/resolve/main/model-00002-of-00059.safetensors?download=true"
        },
        {
          "label": "model-00003-of-00059.safetensors",
          "url": "https://huggingface.co/mistralai/Mixtral-8x22B-v0.1/resolve/main/model-00003-of-00059.safetensors?download=true"
        },
        {
          "label": "model-00004-of-00059.safetensors",
          "url": "https://huggingface.co/mistralai/Mixtral-8x22B-v0.1/resolve/main/model-00004-of-00059.safetensors?download=true"
        },
        {
          "label": "model-00005-of-00059.safetensors",
          "url": "https://huggingface.co/mistralai/Mixtral-8x22B-v0.1/resolve/main/model-00005-of-00059.safetensors?download=true"
        },
        {
          "label": "model-00006-of-00059.safetensors",
          "url": "https://huggingface.co/mistralai/Mixtral-8x22B-v0.1/resolve/main/model-00006-of-00059.safetensors?download=true"
        },
        {
          "label": "model-00007-of-00059.safetensors",
          "url": "https://huggingface.co/mistralai/Mixtral-8x22B-v0.1/resolve/main/model-00007-of-00059.safetensors?download=true"
        },
        {
          "label": "model-00008-of-00059.safetensors",
          "url": "https://huggingface.co/mistralai/Mixtral-8x22B-v0.1/resolve/main/model-00008-of-00059.safetensors?download=true"
        },
        {
          "label": "model-00009-of-00059.safetensors",
          "url": "https://huggingface.co/mistralai/Mixtral-8x22B-v0.1/resolve/main/model-00009-of-00059.safetensors?download=true"
        },
        {
          "label": "model-00010-of-00059.safetensors",
          "url": "https://huggingface.co/mistralai/Mixtral-8x22B-v0.1/resolve/main/model-00010-of-00059.safetensors?download=true"
        },
        {
          "label": "model-00011-of-00059.safetensors",
          "url": "https://huggingface.co/mistralai/Mixtral-8x22B-v0.1/resolve/main/model-00011-of-00059.safetensors?download=true"
        },
        {
          "label": "model-00012-of-00059.safetensors",
          "url": "https://huggingface.co/mistralai/Mixtral-8x22B-v0.1/resolve/main/model-00012-of-00059.safetensors?download=true"
        },
        {
          "label": "model-00013-of-00059.safetensors",
          "url": "https://huggingface.co/mistralai/Mixtral-8x22B-v0.1/resolve/main/model-00013-of-00059.safetensors?download=true"
        },
        {
          "label": "model-00014-of-00059.safetensors",
          "url": "https://huggingface.co/mistralai/Mixtral-8x22B-v0.1/resolve/main/model-00014-of-00059.safetensors?download=true"
        },
        {
          "label": "model-00015-of-00059.safetensors",
          "url": "https://huggingface.co/mistralai/Mixtral-8x22B-v0.1/resolve/main/model-00015-of-00059.safetensors?download=true"
        },
        {
          "label": "model-00016-of-00059.safetensors",
          "url": "https://huggingface.co/mistralai/Mixtral-8x22B-v0.1/resolve/main/model-00016-of-00059.safetensors?download=true"
        },
        {
          "label": "model-00017-of-00059.safetensors",
          "url": "https://huggingface.co/mistralai/Mixtral-8x22B-v0.1/resolve/main/model-00017-of-00059.safetensors?download=true"
        },
        {
          "label": "model-00018-of-00059.safetensors",
          "url": "https://huggingface.co/mistralai/Mixtral-8x22B-v0.1/resolve/main/model-00018-of-00059.safetensors?download=true"
        },
        {
          "label": "model-00019-of-00059.safetensors",
          "url": "https://huggingface.co/mistralai/Mixtral-8x22B-v0.1/resolve/main/model-00019-of-00059.safetensors?download=true"
        },
        {
          "label": "model-00020-of-00059.safetensors",
          "url": "https://huggingface.co/mistralai/Mixtral-8x22B-v0.1/resolve/main/model-00020-of-00059.safetensors?download=true"
        },
        {
          "label": "model-00021-of-00059.safetensors",
          "url": "https://huggingface.co/mistralai/Mixtral-8x22B-v0.1/resolve/main/model-00021-of-00059.safetensors?download=true"
        },
        {
          "label": "model-00022-of-00059.safetensors",
          "url": "https://huggingface.co/mistralai/Mixtral-8x22B-v0.1/resolve/main/model-00022-of-00059.safetensors?download=true"
        },
        {
          "label": "model-00023-of-00059.safetensors",
          "url": "https://huggingface.co/mistralai/Mixtral-8x22B-v0.1/resolve/main/model-00023-of-00059.safetensors?download=true"
        },
        {
          "label": "model-00024-of-00059.safetensors",
          "url": "https://huggingface.co/mistralai/Mixtral-8x22B-v0.1/resolve/main/model-00024-of-00059.safetensors?download=true"
        },
        {
          "label": "model-00025-of-00059.safetensors",
          "url": "https://huggingface.co/mistralai/Mixtral-8x22B-v0.1/resolve/main/model-00025-of-00059.safetensors?download=true"
        },
        {
          "label": "model-00026-of-00059.safetensors",
          "url": "https://huggingface.co/mistralai/Mixtral-8x22B-v0.1/resolve/main/model-00026-of-00059.safetensors?download=true"
        },
        {
          "label": "model-00027-of-00059.safetensors",
          "url": "https://huggingface.co/mistralai/Mixtral-8x22B-v0.1/resolve/main/model-00027-of-00059.safetensors?download=true"
        },
        {
          "label": "model-00028-of-00059.safetensors",
          "url": "https://huggingface.co/mistralai/Mixtral-8x22B-v0.1/resolve/main/model-00028-of-00059.safetensors?download=true"
        },
        {
          "label": "model-00029-of-00059.safetensors",
          "url": "https://huggingface.co/mistralai/Mixtral-8x22B-v0.1/resolve/main/model-00029-of-00059.safetensors?download=true"
        },
        {
          "label": "model-00030-of-00059.safetensors",
          "url": "https://huggingface.co/mistralai/Mixtral-8x22B-v0.1/resolve/main/model-00030-of-00059.safetensors?download=true"
        },
        {
          "label": "model-00031-of-00059.safetensors",
          "url": "https://huggingface.co/mistralai/Mixtral-8x22B-v0.1/resolve/main/model-00031-of-00059.safetensors?download=true"
        },
        {
          "label": "model-00032-of-00059.safetensors",
          "url": "https://huggingface.co/mistralai/Mixtral-8x22B-v0.1/resolve/main/model-00032-of-00059.safetensors?download=true"
        },
        {
          "label": "model-00033-of-00059.safetensors",
          "url": "https://huggingface.co/mistralai/Mixtral-8x22B-v0.1/resolve/main/model-00033-of-00059.safetensors?download=true"
        },
        {
          "label": "model-00034-of-00059.safetensors",
          "url": "https://huggingface.co/mistralai/Mixtral-8x22B-v0.1/resolve/main/model-00034-of-00059.safetensors?download=true"
        },
        {
          "label": "model-00035-of-00059.safetensors",
          "url": "https://huggingface.co/mistralai/Mixtral-8x22B-v0.1/resolve/main/model-00035-of-00059.safetensors?download=true"
        },
        {
          "label": "model-00036-of-00059.safetensors",
          "url": "https://huggingface.co/mistralai/Mixtral-8x22B-v0.1/resolve/main/model-00036-of-00059.safetensors?download=true"
        },
        {
          "label": "model-00037-of-00059.safetensors",
          "url": "https://huggingface.co/mistralai/Mixtral-8x22B-v0.1/resolve/main/model-00037-of-00059.safetensors?download=true"
        },
        {
          "label": "model-00038-of-00059.safetensors",
          "url": "https://huggingface.co/mistralai/Mixtral-8x22B-v0.1/resolve/main/model-00038-of-00059.safetensors?download=true"
        },
        {
          "label": "model-00039-of-00059.safetensors",
          "url": "https://huggingface.co/mistralai/Mixtral-8x22B-v0.1/resolve/main/model-00039-of-00059.safetensors?download=true"
        },
        {
          "label": "model-00040-of-00059.safetensors",
          "url": "https://huggingface.co/mistralai/Mixtral-8x22B-v0.1/resolve/main/model-00040-of-00059.safetensors?download=true"
        },
        {
          "label": "model-00041-of-00059.safetensors",
          "url": "https://huggingface.co/mistralai/Mixtral-8x22B-v0.1/resolve/main/model-00041-of-00059.safetensors?download=true"
        },
        {
          "label": "model-00042-of-00059.safetensors",
          "url": "https://huggingface.co/mistralai/Mixtral-8x22B-v0.1/resolve/main/model-00042-of-00059.safetensors?download=true"
        },
        {
          "label": "model-00043-of-00059.safetensors",
          "url": "https://huggingface.co/mistralai/Mixtral-8x22B-v0.1/resolve/main/model-00043-of-00059.safetensors?download=true"
        },
        {
          "label": "model-00044-of-00059.safetensors",
          "url": "https://huggingface.co/mistralai/Mixtral-8x22B-v0.1/resolve/main/model-00044-of-00059.safetensors?download=true"
        },
        {
          "label": "model-00045-of-00059.safetensors",
          "url": "https://huggingface.co/mistralai/Mixtral-8x22B-v0.1/resolve/main/model-00045-of-00059.safetensors?download=true"
        },
        {
          "label": "model-00046-of-00059.safetensors",
          "url": "https://huggingface.co/mistralai/Mixtral-8x22B-v0.1/resolve/main/model-00046-of-00059.safetensors?download=true"
        },
        {
          "label": "model-00047-of-00059.safetensors",
          "url": "https://huggingface.co/mistralai/Mixtral-8x22B-v0.1/resolve/main/model-00047-of-00059.safetensors?download=true"
        },
        {
          "label": "model-00048-of-00059.safetensors",
          "url": "https://huggingface.co/mistralai/Mixtral-8x22B-v0.1/resolve/main/model-00048-of-00059.safetensors?download=true"
        },
        {
          "label": "model-00049-of-00059.safetensors",
          "url": "https://huggingface.co/mistralai/Mixtral-8x22B-v0.1/resolve/main/model-00049-of-00059.safetensors?download=true"
        },
        {
          "label": "model-00050-of-00059.safetensors",
          "url": "https://huggingface.co/mistralai/Mixtral-8x22B-v0.1/resolve/main/model-00050-of-00059.safetensors?download=true"
        },
        {
          "label": "model-00051-of-00059.safetensors",
          "url": "https://huggingface.co/mistralai/Mixtral-8x22B-v0.1/resolve/main/model-00051-of-00059.safetensors?download=true"
        },
        {
          "label": "model-00052-of-00059.safetensors",
          "url": "https://huggingface.co/mistralai/Mixtral-8x22B-v0.1/resolve/main/model-00052-of-00059.safetensors?download=true"
        },
        {
          "label": "model-00053-of-00059.safetensors",
          "url": "https://huggingface.co/mistralai/Mixtral-8x22B-v0.1/resolve/main/model-00053-of-00059.safetensors?download=true"
        },
        {
          "label": "model-00054-of-00059.safetensors",
          "url": "https://huggingface.co/mistralai/Mixtral-8x22B-v0.1/resolve/main/model-00054-of-00059.safetensors?download=true"
        },
        {
          "label": "model-00055-of-00059.safetensors",
          "url": "https://huggingface.co/mistralai/Mixtral-8x22B-v0.1/resolve/main/model-00055-of-00059.safetensors?download=true"
        },
        {
          "label": "model-00056-of-00059.safetensors",
          "url": "https://huggingface.co/mistralai/Mixtral-8x22B-v0.1/resolve/main/model-00056-of-00059.safetensors?download=true"
        },
        {
          "label": "model-00057-of-00059.safetensors",
          "url": "https://huggingface.co/mistralai/Mixtral-8x22B-v0.1/resolve/main/model-00057-of-00059.safetensors?download=true"
        },
        {
          "label": "model-00058-of-00059.safetensors",
          "url": "https://huggingface.co/mistralai/Mixtral-8x22B-v0.1/resolve/main/model-00058-of-00059.safetensors?download=true"
        },
        {
          "label": "model-00059-of-00059.safetensors",
          "url": "https://huggingface.co/mistralai/Mixtral-8x22B-v0.1/resolve/main/model-00059-of-00059.safetensors?download=true"
        }
      ]
    },
    {
      "repo": "mistralai/Mixtral-8x22B-Instruct-v0.1",
      "bRating": "Unknown",
      "parameters": "Unknown",
      "size": "261.9 GB",
      "files": [
        {
          "label": "model-00001-of-00059.safetensors",
          "url": "https://huggingface.co/mistralai/Mixtral-8x22B-Instruct-v0.1/resolve/main/model-00001-of-00059.safetensors?download=true"
        },
        {
          "label": "model-00002-of-00059.safetensors",
          "url": "https://huggingface.co/mistralai/Mixtral-8x22B-Instruct-v0.1/resolve/main/model-00002-of-00059.safetensors?download=true"
        },
        {
          "label": "model-00003-of-00059.safetensors",
          "url": "https://huggingface.co/mistralai/Mixtral-8x22B-Instruct-v0.1/resolve/main/model-00003-of-00059.safetensors?download=true"
        },
        {
          "label": "model-00004-of-00059.safetensors",
          "url": "https://huggingface.co/mistralai/Mixtral-8x22B-Instruct-v0.1/resolve/main/model-00004-of-00059.safetensors?download=true"
        },
        {
          "label": "model-00005-of-00059.safetensors",
          "url": "https://huggingface.co/mistralai/Mixtral-8x22B-Instruct-v0.1/resolve/main/model-00005-of-00059.safetensors?download=true"
        },
        {
          "label": "model-00006-of-00059.safetensors",
          "url": "https://huggingface.co/mistralai/Mixtral-8x22B-Instruct-v0.1/resolve/main/model-00006-of-00059.safetensors?download=true"
        },
        {
          "label": "model-00007-of-00059.safetensors",
          "url": "https://huggingface.co/mistralai/Mixtral-8x22B-Instruct-v0.1/resolve/main/model-00007-of-00059.safetensors?download=true"
        },
        {
          "label": "model-00008-of-00059.safetensors",
          "url": "https://huggingface.co/mistralai/Mixtral-8x22B-Instruct-v0.1/resolve/main/model-00008-of-00059.safetensors?download=true"
        },
        {
          "label": "model-00009-of-00059.safetensors",
          "url": "https://huggingface.co/mistralai/Mixtral-8x22B-Instruct-v0.1/resolve/main/model-00009-of-00059.safetensors?download=true"
        },
        {
          "label": "model-00010-of-00059.safetensors",
          "url": "https://huggingface.co/mistralai/Mixtral-8x22B-Instruct-v0.1/resolve/main/model-00010-of-00059.safetensors?download=true"
        },
        {
          "label": "model-00011-of-00059.safetensors",
          "url": "https://huggingface.co/mistralai/Mixtral-8x22B-Instruct-v0.1/resolve/main/model-00011-of-00059.safetensors?download=true"
        },
        {
          "label": "model-00012-of-00059.safetensors",
          "url": "https://huggingface.co/mistralai/Mixtral-8x22B-Instruct-v0.1/resolve/main/model-00012-of-00059.safetensors?download=true"
        },
        {
          "label": "model-00013-of-00059.safetensors",
          "url": "https://huggingface.co/mistralai/Mixtral-8x22B-Instruct-v0.1/resolve/main/model-00013-of-00059.safetensors?download=true"
        },
        {
          "label": "model-00014-of-00059.safetensors",
          "url": "https://huggingface.co/mistralai/Mixtral-8x22B-Instruct-v0.1/resolve/main/model-00014-of-00059.safetensors?download=true"
        },
        {
          "label": "model-00015-of-00059.safetensors",
          "url": "https://huggingface.co/mistralai/Mixtral-8x22B-Instruct-v0.1/resolve/main/model-00015-of-00059.safetensors?download=true"
        },
        {
          "label": "model-00016-of-00059.safetensors",
          "url": "https://huggingface.co/mistralai/Mixtral-8x22B-Instruct-v0.1/resolve/main/model-00016-of-00059.safetensors?download=true"
        },
        {
          "label": "model-00017-of-00059.safetensors",
          "url": "https://huggingface.co/mistralai/Mixtral-8x22B-Instruct-v0.1/resolve/main/model-00017-of-00059.safetensors?download=true"
        },
        {
          "label": "model-00018-of-00059.safetensors",
          "url": "https://huggingface.co/mistralai/Mixtral-8x22B-Instruct-v0.1/resolve/main/model-00018-of-00059.safetensors?download=true"
        },
        {
          "label": "model-00019-of-00059.safetensors",
          "url": "https://huggingface.co/mistralai/Mixtral-8x22B-Instruct-v0.1/resolve/main/model-00019-of-00059.safetensors?download=true"
        },
        {
          "label": "model-00020-of-00059.safetensors",
          "url": "https://huggingface.co/mistralai/Mixtral-8x22B-Instruct-v0.1/resolve/main/model-00020-of-00059.safetensors?download=true"
        },
        {
          "label": "model-00021-of-00059.safetensors",
          "url": "https://huggingface.co/mistralai/Mixtral-8x22B-Instruct-v0.1/resolve/main/model-00021-of-00059.safetensors?download=true"
        },
        {
          "label": "model-00022-of-00059.safetensors",
          "url": "https://huggingface.co/mistralai/Mixtral-8x22B-Instruct-v0.1/resolve/main/model-00022-of-00059.safetensors?download=true"
        },
        {
          "label": "model-00023-of-00059.safetensors",
          "url": "https://huggingface.co/mistralai/Mixtral-8x22B-Instruct-v0.1/resolve/main/model-00023-of-00059.safetensors?download=true"
        },
        {
          "label": "model-00024-of-00059.safetensors",
          "url": "https://huggingface.co/mistralai/Mixtral-8x22B-Instruct-v0.1/resolve/main/model-00024-of-00059.safetensors?download=true"
        },
        {
          "label": "model-00025-of-00059.safetensors",
          "url": "https://huggingface.co/mistralai/Mixtral-8x22B-Instruct-v0.1/resolve/main/model-00025-of-00059.safetensors?download=true"
        },
        {
          "label": "model-00026-of-00059.safetensors",
          "url": "https://huggingface.co/mistralai/Mixtral-8x22B-Instruct-v0.1/resolve/main/model-00026-of-00059.safetensors?download=true"
        },
        {
          "label": "model-00027-of-00059.safetensors",
          "url": "https://huggingface.co/mistralai/Mixtral-8x22B-Instruct-v0.1/resolve/main/model-00027-of-00059.safetensors?download=true"
        },
        {
          "label": "model-00028-of-00059.safetensors",
          "url": "https://huggingface.co/mistralai/Mixtral-8x22B-Instruct-v0.1/resolve/main/model-00028-of-00059.safetensors?download=true"
        },
        {
          "label": "model-00029-of-00059.safetensors",
          "url": "https://huggingface.co/mistralai/Mixtral-8x22B-Instruct-v0.1/resolve/main/model-00029-of-00059.safetensors?download=true"
        },
        {
          "label": "model-00030-of-00059.safetensors",
          "url": "https://huggingface.co/mistralai/Mixtral-8x22B-Instruct-v0.1/resolve/main/model-00030-of-00059.safetensors?download=true"
        },
        {
          "label": "model-00031-of-00059.safetensors",
          "url": "https://huggingface.co/mistralai/Mixtral-8x22B-Instruct-v0.1/resolve/main/model-00031-of-00059.safetensors?download=true"
        },
        {
          "label": "model-00032-of-00059.safetensors",
          "url": "https://huggingface.co/mistralai/Mixtral-8x22B-Instruct-v0.1/resolve/main/model-00032-of-00059.safetensors?download=true"
        },
        {
          "label": "model-00033-of-00059.safetensors",
          "url": "https://huggingface.co/mistralai/Mixtral-8x22B-Instruct-v0.1/resolve/main/model-00033-of-00059.safetensors?download=true"
        },
        {
          "label": "model-00034-of-00059.safetensors",
          "url": "https://huggingface.co/mistralai/Mixtral-8x22B-Instruct-v0.1/resolve/main/model-00034-of-00059.safetensors?download=true"
        },
        {
          "label": "model-00035-of-00059.safetensors",
          "url": "https://huggingface.co/mistralai/Mixtral-8x22B-Instruct-v0.1/resolve/main/model-00035-of-00059.safetensors?download=true"
        },
        {
          "label": "model-00036-of-00059.safetensors",
          "url": "https://huggingface.co/mistralai/Mixtral-8x22B-Instruct-v0.1/resolve/main/model-00036-of-00059.safetensors?download=true"
        },
        {
          "label": "model-00037-of-00059.safetensors",
          "url": "https://huggingface.co/mistralai/Mixtral-8x22B-Instruct-v0.1/resolve/main/model-00037-of-00059.safetensors?download=true"
        },
        {
          "label": "model-00038-of-00059.safetensors",
          "url": "https://huggingface.co/mistralai/Mixtral-8x22B-Instruct-v0.1/resolve/main/model-00038-of-00059.safetensors?download=true"
        },
        {
          "label": "model-00039-of-00059.safetensors",
          "url": "https://huggingface.co/mistralai/Mixtral-8x22B-Instruct-v0.1/resolve/main/model-00039-of-00059.safetensors?download=true"
        },
        {
          "label": "model-00040-of-00059.safetensors",
          "url": "https://huggingface.co/mistralai/Mixtral-8x22B-Instruct-v0.1/resolve/main/model-00040-of-00059.safetensors?download=true"
        },
        {
          "label": "model-00041-of-00059.safetensors",
          "url": "https://huggingface.co/mistralai/Mixtral-8x22B-Instruct-v0.1/resolve/main/model-00041-of-00059.safetensors?download=true"
        },
        {
          "label": "model-00042-of-00059.safetensors",
          "url": "https://huggingface.co/mistralai/Mixtral-8x22B-Instruct-v0.1/resolve/main/model-00042-of-00059.safetensors?download=true"
        },
        {
          "label": "model-00043-of-00059.safetensors",
          "url": "https://huggingface.co/mistralai/Mixtral-8x22B-Instruct-v0.1/resolve/main/model-00043-of-00059.safetensors?download=true"
        },
        {
          "label": "model-00044-of-00059.safetensors",
          "url": "https://huggingface.co/mistralai/Mixtral-8x22B-Instruct-v0.1/resolve/main/model-00044-of-00059.safetensors?download=true"
        },
        {
          "label": "model-00045-of-00059.safetensors",
          "url": "https://huggingface.co/mistralai/Mixtral-8x22B-Instruct-v0.1/resolve/main/model-00045-of-00059.safetensors?download=true"
        },
        {
          "label": "model-00046-of-00059.safetensors",
          "url": "https://huggingface.co/mistralai/Mixtral-8x22B-Instruct-v0.1/resolve/main/model-00046-of-00059.safetensors?download=true"
        },
        {
          "label": "model-00047-of-00059.safetensors",
          "url": "https://huggingface.co/mistralai/Mixtral-8x22B-Instruct-v0.1/resolve/main/model-00047-of-00059.safetensors?download=true"
        },
        {
          "label": "model-00048-of-00059.safetensors",
          "url": "https://huggingface.co/mistralai/Mixtral-8x22B-Instruct-v0.1/resolve/main/model-00048-of-00059.safetensors?download=true"
        },
        {
          "label": "model-00049-of-00059.safetensors",
          "url": "https://huggingface.co/mistralai/Mixtral-8x22B-Instruct-v0.1/resolve/main/model-00049-of-00059.safetensors?download=true"
        },
        {
          "label": "model-00050-of-00059.safetensors",
          "url": "https://huggingface.co/mistralai/Mixtral-8x22B-Instruct-v0.1/resolve/main/model-00050-of-00059.safetensors?download=true"
        },
        {
          "label": "model-00051-of-00059.safetensors",
          "url": "https://huggingface.co/mistralai/Mixtral-8x22B-Instruct-v0.1/resolve/main/model-00051-of-00059.safetensors?download=true"
        },
        {
          "label": "model-00052-of-00059.safetensors",
          "url": "https://huggingface.co/mistralai/Mixtral-8x22B-Instruct-v0.1/resolve/main/model-00052-of-00059.safetensors?download=true"
        },
        {
          "label": "model-00053-of-00059.safetensors",
          "url": "https://huggingface.co/mistralai/Mixtral-8x22B-Instruct-v0.1/resolve/main/model-00053-of-00059.safetensors?download=true"
        },
        {
          "label": "model-00054-of-00059.safetensors",
          "url": "https://huggingface.co/mistralai/Mixtral-8x22B-Instruct-v0.1/resolve/main/model-00054-of-00059.safetensors?download=true"
        },
        {
          "label": "model-00055-of-00059.safetensors",
          "url": "https://huggingface.co/mistralai/Mixtral-8x22B-Instruct-v0.1/resolve/main/model-00055-of-00059.safetensors?download=true"
        },
        {
          "label": "model-00056-of-00059.safetensors",
          "url": "https://huggingface.co/mistralai/Mixtral-8x22B-Instruct-v0.1/resolve/main/model-00056-of-00059.safetensors?download=true"
        },
        {
          "label": "model-00057-of-00059.safetensors",
          "url": "https://huggingface.co/mistralai/Mixtral-8x22B-Instruct-v0.1/resolve/main/model-00057-of-00059.safetensors?download=true"
        },
        {
          "label": "model-00058-of-00059.safetensors",
          "url": "https://huggingface.co/mistralai/Mixtral-8x22B-Instruct-v0.1/resolve/main/model-00058-of-00059.safetensors?download=true"
        },
        {
          "label": "model-00059-of-00059.safetensors",
          "url": "https://huggingface.co/mistralai/Mixtral-8x22B-Instruct-v0.1/resolve/main/model-00059-of-00059.safetensors?download=true"
        }
      ]
    }
  ],
  "gemma-local": [
    {
      "repo": "google/gemma-2-2b",
      "bRating": "2B",
      "parameters": "2B",
      "size": "9.7 GB",
      "files": [
        {
          "label": "model-00001-of-00003.safetensors",
          "url": "https://huggingface.co/google/gemma-2-2b/resolve/main/model-00001-of-00003.safetensors?download=true"
        },
        {
          "label": "model-00002-of-00003.safetensors",
          "url": "https://huggingface.co/google/gemma-2-2b/resolve/main/model-00002-of-00003.safetensors?download=true"
        },
        {
          "label": "model-00003-of-00003.safetensors",
          "url": "https://huggingface.co/google/gemma-2-2b/resolve/main/model-00003-of-00003.safetensors?download=true"
        }
      ],
      "gated": true
    },
    {
      "repo": "google/gemma-2-2b-it",
      "bRating": "2B",
      "parameters": "2B",
      "size": "4.9 GB",
      "files": [
        {
          "label": "model-00001-of-00002.safetensors",
          "url": "https://huggingface.co/google/gemma-2-2b-it/resolve/main/model-00001-of-00002.safetensors?download=true"
        },
        {
          "label": "model-00002-of-00002.safetensors",
          "url": "https://huggingface.co/google/gemma-2-2b-it/resolve/main/model-00002-of-00002.safetensors?download=true"
        }
      ],
      "gated": true
    },
    {
      "repo": "google/gemma-2-9b",
      "bRating": "9B",
      "parameters": "9B",
      "size": "34.4 GB",
      "files": [
        {
          "label": "model-00001-of-00008.safetensors",
          "url": "https://huggingface.co/google/gemma-2-9b/resolve/main/model-00001-of-00008.safetensors?download=true"
        },
        {
          "label": "model-00002-of-00008.safetensors",
          "url": "https://huggingface.co/google/gemma-2-9b/resolve/main/model-00002-of-00008.safetensors?download=true"
        },
        {
          "label": "model-00003-of-00008.safetensors",
          "url": "https://huggingface.co/google/gemma-2-9b/resolve/main/model-00003-of-00008.safetensors?download=true"
        },
        {
          "label": "model-00004-of-00008.safetensors",
          "url": "https://huggingface.co/google/gemma-2-9b/resolve/main/model-00004-of-00008.safetensors?download=true"
        },
        {
          "label": "model-00005-of-00008.safetensors",
          "url": "https://huggingface.co/google/gemma-2-9b/resolve/main/model-00005-of-00008.safetensors?download=true"
        },
        {
          "label": "model-00006-of-00008.safetensors",
          "url": "https://huggingface.co/google/gemma-2-9b/resolve/main/model-00006-of-00008.safetensors?download=true"
        },
        {
          "label": "model-00007-of-00008.safetensors",
          "url": "https://huggingface.co/google/gemma-2-9b/resolve/main/model-00007-of-00008.safetensors?download=true"
        },
        {
          "label": "model-00008-of-00008.safetensors",
          "url": "https://huggingface.co/google/gemma-2-9b/resolve/main/model-00008-of-00008.safetensors?download=true"
        }
      ],
      "gated": true
    },
    {
      "repo": "google/gemma-2-9b-it",
      "bRating": "9B",
      "parameters": "9B",
      "size": "17.2 GB",
      "files": [
        {
          "label": "model-00001-of-00004.safetensors",
          "url": "https://huggingface.co/google/gemma-2-9b-it/resolve/main/model-00001-of-00004.safetensors?download=true"
        },
        {
          "label": "model-00002-of-00004.safetensors",
          "url": "https://huggingface.co/google/gemma-2-9b-it/resolve/main/model-00002-of-00004.safetensors?download=true"
        },
        {
          "label": "model-00003-of-00004.safetensors",
          "url": "https://huggingface.co/google/gemma-2-9b-it/resolve/main/model-00003-of-00004.safetensors?download=true"
        },
        {
          "label": "model-00004-of-00004.safetensors",
          "url": "https://huggingface.co/google/gemma-2-9b-it/resolve/main/model-00004-of-00004.safetensors?download=true"
        }
      ],
      "gated": true
    },
    {
      "repo": "google/gemma-2-27b",
      "bRating": "27B",
      "parameters": "27B",
      "size": "101.4 GB",
      "files": [
        {
          "label": "model-00001-of-00024.safetensors",
          "url": "https://huggingface.co/google/gemma-2-27b/resolve/main/model-00001-of-00024.safetensors?download=true"
        },
        {
          "label": "model-00002-of-00024.safetensors",
          "url": "https://huggingface.co/google/gemma-2-27b/resolve/main/model-00002-of-00024.safetensors?download=true"
        },
        {
          "label": "model-00003-of-00024.safetensors",
          "url": "https://huggingface.co/google/gemma-2-27b/resolve/main/model-00003-of-00024.safetensors?download=true"
        },
        {
          "label": "model-00004-of-00024.safetensors",
          "url": "https://huggingface.co/google/gemma-2-27b/resolve/main/model-00004-of-00024.safetensors?download=true"
        },
        {
          "label": "model-00005-of-00024.safetensors",
          "url": "https://huggingface.co/google/gemma-2-27b/resolve/main/model-00005-of-00024.safetensors?download=true"
        },
        {
          "label": "model-00006-of-00024.safetensors",
          "url": "https://huggingface.co/google/gemma-2-27b/resolve/main/model-00006-of-00024.safetensors?download=true"
        },
        {
          "label": "model-00007-of-00024.safetensors",
          "url": "https://huggingface.co/google/gemma-2-27b/resolve/main/model-00007-of-00024.safetensors?download=true"
        },
        {
          "label": "model-00008-of-00024.safetensors",
          "url": "https://huggingface.co/google/gemma-2-27b/resolve/main/model-00008-of-00024.safetensors?download=true"
        },
        {
          "label": "model-00009-of-00024.safetensors",
          "url": "https://huggingface.co/google/gemma-2-27b/resolve/main/model-00009-of-00024.safetensors?download=true"
        },
        {
          "label": "model-00010-of-00024.safetensors",
          "url": "https://huggingface.co/google/gemma-2-27b/resolve/main/model-00010-of-00024.safetensors?download=true"
        },
        {
          "label": "model-00011-of-00024.safetensors",
          "url": "https://huggingface.co/google/gemma-2-27b/resolve/main/model-00011-of-00024.safetensors?download=true"
        },
        {
          "label": "model-00012-of-00024.safetensors",
          "url": "https://huggingface.co/google/gemma-2-27b/resolve/main/model-00012-of-00024.safetensors?download=true"
        },
        {
          "label": "model-00013-of-00024.safetensors",
          "url": "https://huggingface.co/google/gemma-2-27b/resolve/main/model-00013-of-00024.safetensors?download=true"
        },
        {
          "label": "model-00014-of-00024.safetensors",
          "url": "https://huggingface.co/google/gemma-2-27b/resolve/main/model-00014-of-00024.safetensors?download=true"
        },
        {
          "label": "model-00015-of-00024.safetensors",
          "url": "https://huggingface.co/google/gemma-2-27b/resolve/main/model-00015-of-00024.safetensors?download=true"
        },
        {
          "label": "model-00016-of-00024.safetensors",
          "url": "https://huggingface.co/google/gemma-2-27b/resolve/main/model-00016-of-00024.safetensors?download=true"
        },
        {
          "label": "model-00017-of-00024.safetensors",
          "url": "https://huggingface.co/google/gemma-2-27b/resolve/main/model-00017-of-00024.safetensors?download=true"
        },
        {
          "label": "model-00018-of-00024.safetensors",
          "url": "https://huggingface.co/google/gemma-2-27b/resolve/main/model-00018-of-00024.safetensors?download=true"
        },
        {
          "label": "model-00019-of-00024.safetensors",
          "url": "https://huggingface.co/google/gemma-2-27b/resolve/main/model-00019-of-00024.safetensors?download=true"
        },
        {
          "label": "model-00020-of-00024.safetensors",
          "url": "https://huggingface.co/google/gemma-2-27b/resolve/main/model-00020-of-00024.safetensors?download=true"
        },
        {
          "label": "model-00021-of-00024.safetensors",
          "url": "https://huggingface.co/google/gemma-2-27b/resolve/main/model-00021-of-00024.safetensors?download=true"
        },
        {
          "label": "model-00022-of-00024.safetensors",
          "url": "https://huggingface.co/google/gemma-2-27b/resolve/main/model-00022-of-00024.safetensors?download=true"
        },
        {
          "label": "model-00023-of-00024.safetensors",
          "url": "https://huggingface.co/google/gemma-2-27b/resolve/main/model-00023-of-00024.safetensors?download=true"
        },
        {
          "label": "model-00024-of-00024.safetensors",
          "url": "https://huggingface.co/google/gemma-2-27b/resolve/main/model-00024-of-00024.safetensors?download=true"
        }
      ],
      "gated": true
    },
    {
      "repo": "google/gemma-2-27b-it",
      "bRating": "27B",
      "parameters": "27B",
      "size": "50.7 GB",
      "files": [
        {
          "label": "model-00001-of-00012.safetensors",
          "url": "https://huggingface.co/google/gemma-2-27b-it/resolve/main/model-00001-of-00012.safetensors?download=true"
        },
        {
          "label": "model-00002-of-00012.safetensors",
          "url": "https://huggingface.co/google/gemma-2-27b-it/resolve/main/model-00002-of-00012.safetensors?download=true"
        },
        {
          "label": "model-00003-of-00012.safetensors",
          "url": "https://huggingface.co/google/gemma-2-27b-it/resolve/main/model-00003-of-00012.safetensors?download=true"
        },
        {
          "label": "model-00004-of-00012.safetensors",
          "url": "https://huggingface.co/google/gemma-2-27b-it/resolve/main/model-00004-of-00012.safetensors?download=true"
        },
        {
          "label": "model-00005-of-00012.safetensors",
          "url": "https://huggingface.co/google/gemma-2-27b-it/resolve/main/model-00005-of-00012.safetensors?download=true"
        },
        {
          "label": "model-00006-of-00012.safetensors",
          "url": "https://huggingface.co/google/gemma-2-27b-it/resolve/main/model-00006-of-00012.safetensors?download=true"
        },
        {
          "label": "model-00007-of-00012.safetensors",
          "url": "https://huggingface.co/google/gemma-2-27b-it/resolve/main/model-00007-of-00012.safetensors?download=true"
        },
        {
          "label": "model-00008-of-00012.safetensors",
          "url": "https://huggingface.co/google/gemma-2-27b-it/resolve/main/model-00008-of-00012.safetensors?download=true"
        },
        {
          "label": "model-00009-of-00012.safetensors",
          "url": "https://huggingface.co/google/gemma-2-27b-it/resolve/main/model-00009-of-00012.safetensors?download=true"
        },
        {
          "label": "model-00010-of-00012.safetensors",
          "url": "https://huggingface.co/google/gemma-2-27b-it/resolve/main/model-00010-of-00012.safetensors?download=true"
        },
        {
          "label": "model-00011-of-00012.safetensors",
          "url": "https://huggingface.co/google/gemma-2-27b-it/resolve/main/model-00011-of-00012.safetensors?download=true"
        },
        {
          "label": "model-00012-of-00012.safetensors",
          "url": "https://huggingface.co/google/gemma-2-27b-it/resolve/main/model-00012-of-00012.safetensors?download=true"
        }
      ],
      "gated": true
    },
    {
      "repo": "google/gemma-3-1b-it",
      "bRating": "1B",
      "parameters": "1B",
      "size": "1.9 GB",
      "files": [
        {
          "label": "model.safetensors",
          "url": "https://huggingface.co/google/gemma-3-1b-it/resolve/main/model.safetensors?download=true"
        }
      ],
      "gated": true
    },
    {
      "repo": "google/gemma-3-4b-it",
      "bRating": "4B",
      "parameters": "4B",
      "size": "8.0 GB",
      "files": [
        {
          "label": "model-00001-of-00002.safetensors",
          "url": "https://huggingface.co/google/gemma-3-4b-it/resolve/main/model-00001-of-00002.safetensors?download=true"
        },
        {
          "label": "model-00002-of-00002.safetensors",
          "url": "https://huggingface.co/google/gemma-3-4b-it/resolve/main/model-00002-of-00002.safetensors?download=true"
        }
      ],
      "gated": true
    },
    {
      "repo": "google/gemma-3-12b-it",
      "bRating": "12B",
      "parameters": "12B",
      "size": "22.7 GB",
      "files": [
        {
          "label": "model-00001-of-00005.safetensors",
          "url": "https://huggingface.co/google/gemma-3-12b-it/resolve/main/model-00001-of-00005.safetensors?download=true"
        },
        {
          "label": "model-00002-of-00005.safetensors",
          "url": "https://huggingface.co/google/gemma-3-12b-it/resolve/main/model-00002-of-00005.safetensors?download=true"
        },
        {
          "label": "model-00003-of-00005.safetensors",
          "url": "https://huggingface.co/google/gemma-3-12b-it/resolve/main/model-00003-of-00005.safetensors?download=true"
        },
        {
          "label": "model-00004-of-00005.safetensors",
          "url": "https://huggingface.co/google/gemma-3-12b-it/resolve/main/model-00004-of-00005.safetensors?download=true"
        },
        {
          "label": "model-00005-of-00005.safetensors",
          "url": "https://huggingface.co/google/gemma-3-12b-it/resolve/main/model-00005-of-00005.safetensors?download=true"
        }
      ],
      "gated": true
    },
    {
      "repo": "google/gemma-3-27b-it",
      "bRating": "27B",
      "parameters": "27B",
      "size": "51.1 GB",
      "files": [
        {
          "label": "model-00001-of-00012.safetensors",
          "url": "https://huggingface.co/google/gemma-3-27b-it/resolve/main/model-00001-of-00012.safetensors?download=true"
        },
        {
          "label": "model-00002-of-00012.safetensors",
          "url": "https://huggingface.co/google/gemma-3-27b-it/resolve/main/model-00002-of-00012.safetensors?download=true"
        },
        {
          "label": "model-00003-of-00012.safetensors",
          "url": "https://huggingface.co/google/gemma-3-27b-it/resolve/main/model-00003-of-00012.safetensors?download=true"
        },
        {
          "label": "model-00004-of-00012.safetensors",
          "url": "https://huggingface.co/google/gemma-3-27b-it/resolve/main/model-00004-of-00012.safetensors?download=true"
        },
        {
          "label": "model-00005-of-00012.safetensors",
          "url": "https://huggingface.co/google/gemma-3-27b-it/resolve/main/model-00005-of-00012.safetensors?download=true"
        },
        {
          "label": "model-00006-of-00012.safetensors",
          "url": "https://huggingface.co/google/gemma-3-27b-it/resolve/main/model-00006-of-00012.safetensors?download=true"
        },
        {
          "label": "model-00007-of-00012.safetensors",
          "url": "https://huggingface.co/google/gemma-3-27b-it/resolve/main/model-00007-of-00012.safetensors?download=true"
        },
        {
          "label": "model-00008-of-00012.safetensors",
          "url": "https://huggingface.co/google/gemma-3-27b-it/resolve/main/model-00008-of-00012.safetensors?download=true"
        },
        {
          "label": "model-00009-of-00012.safetensors",
          "url": "https://huggingface.co/google/gemma-3-27b-it/resolve/main/model-00009-of-00012.safetensors?download=true"
        },
        {
          "label": "model-00010-of-00012.safetensors",
          "url": "https://huggingface.co/google/gemma-3-27b-it/resolve/main/model-00010-of-00012.safetensors?download=true"
        },
        {
          "label": "model-00011-of-00012.safetensors",
          "url": "https://huggingface.co/google/gemma-3-27b-it/resolve/main/model-00011-of-00012.safetensors?download=true"
        },
        {
          "label": "model-00012-of-00012.safetensors",
          "url": "https://huggingface.co/google/gemma-3-27b-it/resolve/main/model-00012-of-00012.safetensors?download=true"
        }
      ],
      "gated": true
    }
  ],
  "phi-local": [
    {
      "repo": "microsoft/phi-2",
      "bRating": "2.7B",
      "parameters": "2.7B",
      "size": "5.2 GB",
      "files": [
        {
          "label": "model-00001-of-00002.safetensors",
          "url": "https://huggingface.co/microsoft/phi-2/resolve/main/model-00001-of-00002.safetensors?download=true"
        },
        {
          "label": "model-00002-of-00002.safetensors",
          "url": "https://huggingface.co/microsoft/phi-2/resolve/main/model-00002-of-00002.safetensors?download=true"
        }
      ]
    },
    {
      "repo": "microsoft/Phi-3-mini-4k-instruct",
      "bRating": "Unknown",
      "parameters": "Unknown",
      "size": "7.1 GB",
      "files": [
        {
          "label": "model-00001-of-00002.safetensors",
          "url": "https://huggingface.co/microsoft/Phi-3-mini-4k-instruct/resolve/main/model-00001-of-00002.safetensors?download=true"
        },
        {
          "label": "model-00002-of-00002.safetensors",
          "url": "https://huggingface.co/microsoft/Phi-3-mini-4k-instruct/resolve/main/model-00002-of-00002.safetensors?download=true"
        }
      ]
    },
    {
      "repo": "microsoft/Phi-3-medium-4k-instruct",
      "bRating": "Unknown",
      "parameters": "Unknown",
      "size": "26.0 GB",
      "files": [
        {
          "label": "model-00001-of-00006.safetensors",
          "url": "https://huggingface.co/microsoft/Phi-3-medium-4k-instruct/resolve/main/model-00001-of-00006.safetensors?download=true"
        },
        {
          "label": "model-00002-of-00006.safetensors",
          "url": "https://huggingface.co/microsoft/Phi-3-medium-4k-instruct/resolve/main/model-00002-of-00006.safetensors?download=true"
        },
        {
          "label": "model-00003-of-00006.safetensors",
          "url": "https://huggingface.co/microsoft/Phi-3-medium-4k-instruct/resolve/main/model-00003-of-00006.safetensors?download=true"
        },
        {
          "label": "model-00004-of-00006.safetensors",
          "url": "https://huggingface.co/microsoft/Phi-3-medium-4k-instruct/resolve/main/model-00004-of-00006.safetensors?download=true"
        },
        {
          "label": "model-00005-of-00006.safetensors",
          "url": "https://huggingface.co/microsoft/Phi-3-medium-4k-instruct/resolve/main/model-00005-of-00006.safetensors?download=true"
        },
        {
          "label": "model-00006-of-00006.safetensors",
          "url": "https://huggingface.co/microsoft/Phi-3-medium-4k-instruct/resolve/main/model-00006-of-00006.safetensors?download=true"
        }
      ]
    },
    {
      "repo": "microsoft/Phi-3.5-mini-instruct",
      "bRating": "Unknown",
      "parameters": "Unknown",
      "size": "7.1 GB",
      "files": [
        {
          "label": "model-00001-of-00002.safetensors",
          "url": "https://huggingface.co/microsoft/Phi-3.5-mini-instruct/resolve/main/model-00001-of-00002.safetensors?download=true"
        },
        {
          "label": "model-00002-of-00002.safetensors",
          "url": "https://huggingface.co/microsoft/Phi-3.5-mini-instruct/resolve/main/model-00002-of-00002.safetensors?download=true"
        }
      ]
    },
    {
      "repo": "microsoft/Phi-3.5-MoE-instruct",
      "bRating": "Unknown",
      "parameters": "Unknown",
      "size": "78.0 GB",
      "files": [
        {
          "label": "model-00001-of-00017.safetensors",
          "url": "https://huggingface.co/microsoft/Phi-3.5-MoE-instruct/resolve/main/model-00001-of-00017.safetensors?download=true"
        },
        {
          "label": "model-00002-of-00017.safetensors",
          "url": "https://huggingface.co/microsoft/Phi-3.5-MoE-instruct/resolve/main/model-00002-of-00017.safetensors?download=true"
        },
        {
          "label": "model-00003-of-00017.safetensors",
          "url": "https://huggingface.co/microsoft/Phi-3.5-MoE-instruct/resolve/main/model-00003-of-00017.safetensors?download=true"
        },
        {
          "label": "model-00004-of-00017.safetensors",
          "url": "https://huggingface.co/microsoft/Phi-3.5-MoE-instruct/resolve/main/model-00004-of-00017.safetensors?download=true"
        },
        {
          "label": "model-00005-of-00017.safetensors",
          "url": "https://huggingface.co/microsoft/Phi-3.5-MoE-instruct/resolve/main/model-00005-of-00017.safetensors?download=true"
        },
        {
          "label": "model-00006-of-00017.safetensors",
          "url": "https://huggingface.co/microsoft/Phi-3.5-MoE-instruct/resolve/main/model-00006-of-00017.safetensors?download=true"
        },
        {
          "label": "model-00007-of-00017.safetensors",
          "url": "https://huggingface.co/microsoft/Phi-3.5-MoE-instruct/resolve/main/model-00007-of-00017.safetensors?download=true"
        },
        {
          "label": "model-00008-of-00017.safetensors",
          "url": "https://huggingface.co/microsoft/Phi-3.5-MoE-instruct/resolve/main/model-00008-of-00017.safetensors?download=true"
        },
        {
          "label": "model-00009-of-00017.safetensors",
          "url": "https://huggingface.co/microsoft/Phi-3.5-MoE-instruct/resolve/main/model-00009-of-00017.safetensors?download=true"
        },
        {
          "label": "model-00010-of-00017.safetensors",
          "url": "https://huggingface.co/microsoft/Phi-3.5-MoE-instruct/resolve/main/model-00010-of-00017.safetensors?download=true"
        },
        {
          "label": "model-00011-of-00017.safetensors",
          "url": "https://huggingface.co/microsoft/Phi-3.5-MoE-instruct/resolve/main/model-00011-of-00017.safetensors?download=true"
        },
        {
          "label": "model-00012-of-00017.safetensors",
          "url": "https://huggingface.co/microsoft/Phi-3.5-MoE-instruct/resolve/main/model-00012-of-00017.safetensors?download=true"
        },
        {
          "label": "model-00013-of-00017.safetensors",
          "url": "https://huggingface.co/microsoft/Phi-3.5-MoE-instruct/resolve/main/model-00013-of-00017.safetensors?download=true"
        },
        {
          "label": "model-00014-of-00017.safetensors",
          "url": "https://huggingface.co/microsoft/Phi-3.5-MoE-instruct/resolve/main/model-00014-of-00017.safetensors?download=true"
        },
        {
          "label": "model-00015-of-00017.safetensors",
          "url": "https://huggingface.co/microsoft/Phi-3.5-MoE-instruct/resolve/main/model-00015-of-00017.safetensors?download=true"
        },
        {
          "label": "model-00016-of-00017.safetensors",
          "url": "https://huggingface.co/microsoft/Phi-3.5-MoE-instruct/resolve/main/model-00016-of-00017.safetensors?download=true"
        },
        {
          "label": "model-00017-of-00017.safetensors",
          "url": "https://huggingface.co/microsoft/Phi-3.5-MoE-instruct/resolve/main/model-00017-of-00017.safetensors?download=true"
        }
      ]
    },
    {
      "repo": "microsoft/phi-4",
      "bRating": "Unknown",
      "parameters": "Unknown",
      "size": "27.3 GB",
      "files": [
        {
          "label": "model-00001-of-00006.safetensors",
          "url": "https://huggingface.co/microsoft/phi-4/resolve/main/model-00001-of-00006.safetensors?download=true"
        },
        {
          "label": "model-00002-of-00006.safetensors",
          "url": "https://huggingface.co/microsoft/phi-4/resolve/main/model-00002-of-00006.safetensors?download=true"
        },
        {
          "label": "model-00003-of-00006.safetensors",
          "url": "https://huggingface.co/microsoft/phi-4/resolve/main/model-00003-of-00006.safetensors?download=true"
        },
        {
          "label": "model-00004-of-00006.safetensors",
          "url": "https://huggingface.co/microsoft/phi-4/resolve/main/model-00004-of-00006.safetensors?download=true"
        },
        {
          "label": "model-00005-of-00006.safetensors",
          "url": "https://huggingface.co/microsoft/phi-4/resolve/main/model-00005-of-00006.safetensors?download=true"
        },
        {
          "label": "model-00006-of-00006.safetensors",
          "url": "https://huggingface.co/microsoft/phi-4/resolve/main/model-00006-of-00006.safetensors?download=true"
        }
      ]
    },
    {
      "repo": "microsoft/Phi-4-mini-instruct",
      "bRating": "Unknown",
      "parameters": "Unknown",
      "size": "7.1 GB",
      "files": [
        {
          "label": "model-00001-of-00002.safetensors",
          "url": "https://huggingface.co/microsoft/Phi-4-mini-instruct/resolve/main/model-00001-of-00002.safetensors?download=true"
        },
        {
          "label": "model-00002-of-00002.safetensors",
          "url": "https://huggingface.co/microsoft/Phi-4-mini-instruct/resolve/main/model-00002-of-00002.safetensors?download=true"
        }
      ]
    }
  ],
  "falcon-local": [
    {
      "repo": "tiiuae/falcon-7b",
      "bRating": "7B",
      "parameters": "7B",
      "size": "13.4 GB",
      "files": [
        {
          "label": "model-00001-of-00002.safetensors",
          "url": "https://huggingface.co/tiiuae/falcon-7b/resolve/main/model-00001-of-00002.safetensors?download=true"
        },
        {
          "label": "model-00002-of-00002.safetensors",
          "url": "https://huggingface.co/tiiuae/falcon-7b/resolve/main/model-00002-of-00002.safetensors?download=true"
        }
      ]
    },
    {
      "repo": "tiiuae/falcon-40b",
      "bRating": "40B",
      "parameters": "40B",
      "size": "77.9 GB",
      "files": [
        {
          "label": "model-00001-of-00009.safetensors",
          "url": "https://huggingface.co/tiiuae/falcon-40b/resolve/main/model-00001-of-00009.safetensors?download=true"
        },
        {
          "label": "model-00002-of-00009.safetensors",
          "url": "https://huggingface.co/tiiuae/falcon-40b/resolve/main/model-00002-of-00009.safetensors?download=true"
        },
        {
          "label": "model-00003-of-00009.safetensors",
          "url": "https://huggingface.co/tiiuae/falcon-40b/resolve/main/model-00003-of-00009.safetensors?download=true"
        },
        {
          "label": "model-00004-of-00009.safetensors",
          "url": "https://huggingface.co/tiiuae/falcon-40b/resolve/main/model-00004-of-00009.safetensors?download=true"
        },
        {
          "label": "model-00005-of-00009.safetensors",
          "url": "https://huggingface.co/tiiuae/falcon-40b/resolve/main/model-00005-of-00009.safetensors?download=true"
        },
        {
          "label": "model-00006-of-00009.safetensors",
          "url": "https://huggingface.co/tiiuae/falcon-40b/resolve/main/model-00006-of-00009.safetensors?download=true"
        },
        {
          "label": "model-00007-of-00009.safetensors",
          "url": "https://huggingface.co/tiiuae/falcon-40b/resolve/main/model-00007-of-00009.safetensors?download=true"
        },
        {
          "label": "model-00008-of-00009.safetensors",
          "url": "https://huggingface.co/tiiuae/falcon-40b/resolve/main/model-00008-of-00009.safetensors?download=true"
        },
        {
          "label": "model-00009-of-00009.safetensors",
          "url": "https://huggingface.co/tiiuae/falcon-40b/resolve/main/model-00009-of-00009.safetensors?download=true"
        }
      ]
    },
    {
      "repo": "tiiuae/falcon-180B",
      "bRating": "180B",
      "parameters": "180B",
      "size": "334.4 GB",
      "files": [
        {
          "label": "model-00001-of-00081.safetensors",
          "url": "https://huggingface.co/tiiuae/falcon-180B/resolve/main/model-00001-of-00081.safetensors?download=true"
        },
        {
          "label": "model-00002-of-00081.safetensors",
          "url": "https://huggingface.co/tiiuae/falcon-180B/resolve/main/model-00002-of-00081.safetensors?download=true"
        },
        {
          "label": "model-00003-of-00081.safetensors",
          "url": "https://huggingface.co/tiiuae/falcon-180B/resolve/main/model-00003-of-00081.safetensors?download=true"
        },
        {
          "label": "model-00004-of-00081.safetensors",
          "url": "https://huggingface.co/tiiuae/falcon-180B/resolve/main/model-00004-of-00081.safetensors?download=true"
        },
        {
          "label": "model-00005-of-00081.safetensors",
          "url": "https://huggingface.co/tiiuae/falcon-180B/resolve/main/model-00005-of-00081.safetensors?download=true"
        },
        {
          "label": "model-00006-of-00081.safetensors",
          "url": "https://huggingface.co/tiiuae/falcon-180B/resolve/main/model-00006-of-00081.safetensors?download=true"
        },
        {
          "label": "model-00007-of-00081.safetensors",
          "url": "https://huggingface.co/tiiuae/falcon-180B/resolve/main/model-00007-of-00081.safetensors?download=true"
        },
        {
          "label": "model-00008-of-00081.safetensors",
          "url": "https://huggingface.co/tiiuae/falcon-180B/resolve/main/model-00008-of-00081.safetensors?download=true"
        },
        {
          "label": "model-00009-of-00081.safetensors",
          "url": "https://huggingface.co/tiiuae/falcon-180B/resolve/main/model-00009-of-00081.safetensors?download=true"
        },
        {
          "label": "model-00010-of-00081.safetensors",
          "url": "https://huggingface.co/tiiuae/falcon-180B/resolve/main/model-00010-of-00081.safetensors?download=true"
        },
        {
          "label": "model-00011-of-00081.safetensors",
          "url": "https://huggingface.co/tiiuae/falcon-180B/resolve/main/model-00011-of-00081.safetensors?download=true"
        },
        {
          "label": "model-00012-of-00081.safetensors",
          "url": "https://huggingface.co/tiiuae/falcon-180B/resolve/main/model-00012-of-00081.safetensors?download=true"
        },
        {
          "label": "model-00013-of-00081.safetensors",
          "url": "https://huggingface.co/tiiuae/falcon-180B/resolve/main/model-00013-of-00081.safetensors?download=true"
        },
        {
          "label": "model-00014-of-00081.safetensors",
          "url": "https://huggingface.co/tiiuae/falcon-180B/resolve/main/model-00014-of-00081.safetensors?download=true"
        },
        {
          "label": "model-00015-of-00081.safetensors",
          "url": "https://huggingface.co/tiiuae/falcon-180B/resolve/main/model-00015-of-00081.safetensors?download=true"
        },
        {
          "label": "model-00016-of-00081.safetensors",
          "url": "https://huggingface.co/tiiuae/falcon-180B/resolve/main/model-00016-of-00081.safetensors?download=true"
        },
        {
          "label": "model-00017-of-00081.safetensors",
          "url": "https://huggingface.co/tiiuae/falcon-180B/resolve/main/model-00017-of-00081.safetensors?download=true"
        },
        {
          "label": "model-00018-of-00081.safetensors",
          "url": "https://huggingface.co/tiiuae/falcon-180B/resolve/main/model-00018-of-00081.safetensors?download=true"
        },
        {
          "label": "model-00019-of-00081.safetensors",
          "url": "https://huggingface.co/tiiuae/falcon-180B/resolve/main/model-00019-of-00081.safetensors?download=true"
        },
        {
          "label": "model-00020-of-00081.safetensors",
          "url": "https://huggingface.co/tiiuae/falcon-180B/resolve/main/model-00020-of-00081.safetensors?download=true"
        },
        {
          "label": "model-00021-of-00081.safetensors",
          "url": "https://huggingface.co/tiiuae/falcon-180B/resolve/main/model-00021-of-00081.safetensors?download=true"
        },
        {
          "label": "model-00022-of-00081.safetensors",
          "url": "https://huggingface.co/tiiuae/falcon-180B/resolve/main/model-00022-of-00081.safetensors?download=true"
        },
        {
          "label": "model-00023-of-00081.safetensors",
          "url": "https://huggingface.co/tiiuae/falcon-180B/resolve/main/model-00023-of-00081.safetensors?download=true"
        },
        {
          "label": "model-00024-of-00081.safetensors",
          "url": "https://huggingface.co/tiiuae/falcon-180B/resolve/main/model-00024-of-00081.safetensors?download=true"
        },
        {
          "label": "model-00025-of-00081.safetensors",
          "url": "https://huggingface.co/tiiuae/falcon-180B/resolve/main/model-00025-of-00081.safetensors?download=true"
        },
        {
          "label": "model-00026-of-00081.safetensors",
          "url": "https://huggingface.co/tiiuae/falcon-180B/resolve/main/model-00026-of-00081.safetensors?download=true"
        },
        {
          "label": "model-00027-of-00081.safetensors",
          "url": "https://huggingface.co/tiiuae/falcon-180B/resolve/main/model-00027-of-00081.safetensors?download=true"
        },
        {
          "label": "model-00028-of-00081.safetensors",
          "url": "https://huggingface.co/tiiuae/falcon-180B/resolve/main/model-00028-of-00081.safetensors?download=true"
        },
        {
          "label": "model-00029-of-00081.safetensors",
          "url": "https://huggingface.co/tiiuae/falcon-180B/resolve/main/model-00029-of-00081.safetensors?download=true"
        },
        {
          "label": "model-00030-of-00081.safetensors",
          "url": "https://huggingface.co/tiiuae/falcon-180B/resolve/main/model-00030-of-00081.safetensors?download=true"
        },
        {
          "label": "model-00031-of-00081.safetensors",
          "url": "https://huggingface.co/tiiuae/falcon-180B/resolve/main/model-00031-of-00081.safetensors?download=true"
        },
        {
          "label": "model-00032-of-00081.safetensors",
          "url": "https://huggingface.co/tiiuae/falcon-180B/resolve/main/model-00032-of-00081.safetensors?download=true"
        },
        {
          "label": "model-00033-of-00081.safetensors",
          "url": "https://huggingface.co/tiiuae/falcon-180B/resolve/main/model-00033-of-00081.safetensors?download=true"
        },
        {
          "label": "model-00034-of-00081.safetensors",
          "url": "https://huggingface.co/tiiuae/falcon-180B/resolve/main/model-00034-of-00081.safetensors?download=true"
        },
        {
          "label": "model-00035-of-00081.safetensors",
          "url": "https://huggingface.co/tiiuae/falcon-180B/resolve/main/model-00035-of-00081.safetensors?download=true"
        },
        {
          "label": "model-00036-of-00081.safetensors",
          "url": "https://huggingface.co/tiiuae/falcon-180B/resolve/main/model-00036-of-00081.safetensors?download=true"
        },
        {
          "label": "model-00037-of-00081.safetensors",
          "url": "https://huggingface.co/tiiuae/falcon-180B/resolve/main/model-00037-of-00081.safetensors?download=true"
        },
        {
          "label": "model-00038-of-00081.safetensors",
          "url": "https://huggingface.co/tiiuae/falcon-180B/resolve/main/model-00038-of-00081.safetensors?download=true"
        },
        {
          "label": "model-00039-of-00081.safetensors",
          "url": "https://huggingface.co/tiiuae/falcon-180B/resolve/main/model-00039-of-00081.safetensors?download=true"
        },
        {
          "label": "model-00040-of-00081.safetensors",
          "url": "https://huggingface.co/tiiuae/falcon-180B/resolve/main/model-00040-of-00081.safetensors?download=true"
        },
        {
          "label": "model-00041-of-00081.safetensors",
          "url": "https://huggingface.co/tiiuae/falcon-180B/resolve/main/model-00041-of-00081.safetensors?download=true"
        },
        {
          "label": "model-00042-of-00081.safetensors",
          "url": "https://huggingface.co/tiiuae/falcon-180B/resolve/main/model-00042-of-00081.safetensors?download=true"
        },
        {
          "label": "model-00043-of-00081.safetensors",
          "url": "https://huggingface.co/tiiuae/falcon-180B/resolve/main/model-00043-of-00081.safetensors?download=true"
        },
        {
          "label": "model-00044-of-00081.safetensors",
          "url": "https://huggingface.co/tiiuae/falcon-180B/resolve/main/model-00044-of-00081.safetensors?download=true"
        },
        {
          "label": "model-00045-of-00081.safetensors",
          "url": "https://huggingface.co/tiiuae/falcon-180B/resolve/main/model-00045-of-00081.safetensors?download=true"
        },
        {
          "label": "model-00046-of-00081.safetensors",
          "url": "https://huggingface.co/tiiuae/falcon-180B/resolve/main/model-00046-of-00081.safetensors?download=true"
        },
        {
          "label": "model-00047-of-00081.safetensors",
          "url": "https://huggingface.co/tiiuae/falcon-180B/resolve/main/model-00047-of-00081.safetensors?download=true"
        },
        {
          "label": "model-00048-of-00081.safetensors",
          "url": "https://huggingface.co/tiiuae/falcon-180B/resolve/main/model-00048-of-00081.safetensors?download=true"
        },
        {
          "label": "model-00049-of-00081.safetensors",
          "url": "https://huggingface.co/tiiuae/falcon-180B/resolve/main/model-00049-of-00081.safetensors?download=true"
        },
        {
          "label": "model-00050-of-00081.safetensors",
          "url": "https://huggingface.co/tiiuae/falcon-180B/resolve/main/model-00050-of-00081.safetensors?download=true"
        },
        {
          "label": "model-00051-of-00081.safetensors",
          "url": "https://huggingface.co/tiiuae/falcon-180B/resolve/main/model-00051-of-00081.safetensors?download=true"
        },
        {
          "label": "model-00052-of-00081.safetensors",
          "url": "https://huggingface.co/tiiuae/falcon-180B/resolve/main/model-00052-of-00081.safetensors?download=true"
        },
        {
          "label": "model-00053-of-00081.safetensors",
          "url": "https://huggingface.co/tiiuae/falcon-180B/resolve/main/model-00053-of-00081.safetensors?download=true"
        },
        {
          "label": "model-00054-of-00081.safetensors",
          "url": "https://huggingface.co/tiiuae/falcon-180B/resolve/main/model-00054-of-00081.safetensors?download=true"
        },
        {
          "label": "model-00055-of-00081.safetensors",
          "url": "https://huggingface.co/tiiuae/falcon-180B/resolve/main/model-00055-of-00081.safetensors?download=true"
        },
        {
          "label": "model-00056-of-00081.safetensors",
          "url": "https://huggingface.co/tiiuae/falcon-180B/resolve/main/model-00056-of-00081.safetensors?download=true"
        },
        {
          "label": "model-00057-of-00081.safetensors",
          "url": "https://huggingface.co/tiiuae/falcon-180B/resolve/main/model-00057-of-00081.safetensors?download=true"
        },
        {
          "label": "model-00058-of-00081.safetensors",
          "url": "https://huggingface.co/tiiuae/falcon-180B/resolve/main/model-00058-of-00081.safetensors?download=true"
        },
        {
          "label": "model-00059-of-00081.safetensors",
          "url": "https://huggingface.co/tiiuae/falcon-180B/resolve/main/model-00059-of-00081.safetensors?download=true"
        },
        {
          "label": "model-00060-of-00081.safetensors",
          "url": "https://huggingface.co/tiiuae/falcon-180B/resolve/main/model-00060-of-00081.safetensors?download=true"
        },
        {
          "label": "model-00061-of-00081.safetensors",
          "url": "https://huggingface.co/tiiuae/falcon-180B/resolve/main/model-00061-of-00081.safetensors?download=true"
        },
        {
          "label": "model-00062-of-00081.safetensors",
          "url": "https://huggingface.co/tiiuae/falcon-180B/resolve/main/model-00062-of-00081.safetensors?download=true"
        },
        {
          "label": "model-00063-of-00081.safetensors",
          "url": "https://huggingface.co/tiiuae/falcon-180B/resolve/main/model-00063-of-00081.safetensors?download=true"
        },
        {
          "label": "model-00064-of-00081.safetensors",
          "url": "https://huggingface.co/tiiuae/falcon-180B/resolve/main/model-00064-of-00081.safetensors?download=true"
        },
        {
          "label": "model-00065-of-00081.safetensors",
          "url": "https://huggingface.co/tiiuae/falcon-180B/resolve/main/model-00065-of-00081.safetensors?download=true"
        },
        {
          "label": "model-00066-of-00081.safetensors",
          "url": "https://huggingface.co/tiiuae/falcon-180B/resolve/main/model-00066-of-00081.safetensors?download=true"
        },
        {
          "label": "model-00067-of-00081.safetensors",
          "url": "https://huggingface.co/tiiuae/falcon-180B/resolve/main/model-00067-of-00081.safetensors?download=true"
        },
        {
          "label": "model-00068-of-00081.safetensors",
          "url": "https://huggingface.co/tiiuae/falcon-180B/resolve/main/model-00068-of-00081.safetensors?download=true"
        },
        {
          "label": "model-00069-of-00081.safetensors",
          "url": "https://huggingface.co/tiiuae/falcon-180B/resolve/main/model-00069-of-00081.safetensors?download=true"
        },
        {
          "label": "model-00070-of-00081.safetensors",
          "url": "https://huggingface.co/tiiuae/falcon-180B/resolve/main/model-00070-of-00081.safetensors?download=true"
        },
        {
          "label": "model-00071-of-00081.safetensors",
          "url": "https://huggingface.co/tiiuae/falcon-180B/resolve/main/model-00071-of-00081.safetensors?download=true"
        },
        {
          "label": "model-00072-of-00081.safetensors",
          "url": "https://huggingface.co/tiiuae/falcon-180B/resolve/main/model-00072-of-00081.safetensors?download=true"
        },
        {
          "label": "model-00073-of-00081.safetensors",
          "url": "https://huggingface.co/tiiuae/falcon-180B/resolve/main/model-00073-of-00081.safetensors?download=true"
        },
        {
          "label": "model-00074-of-00081.safetensors",
          "url": "https://huggingface.co/tiiuae/falcon-180B/resolve/main/model-00074-of-00081.safetensors?download=true"
        },
        {
          "label": "model-00075-of-00081.safetensors",
          "url": "https://huggingface.co/tiiuae/falcon-180B/resolve/main/model-00075-of-00081.safetensors?download=true"
        },
        {
          "label": "model-00076-of-00081.safetensors",
          "url": "https://huggingface.co/tiiuae/falcon-180B/resolve/main/model-00076-of-00081.safetensors?download=true"
        },
        {
          "label": "model-00077-of-00081.safetensors",
          "url": "https://huggingface.co/tiiuae/falcon-180B/resolve/main/model-00077-of-00081.safetensors?download=true"
        },
        {
          "label": "model-00078-of-00081.safetensors",
          "url": "https://huggingface.co/tiiuae/falcon-180B/resolve/main/model-00078-of-00081.safetensors?download=true"
        },
        {
          "label": "model-00079-of-00081.safetensors",
          "url": "https://huggingface.co/tiiuae/falcon-180B/resolve/main/model-00079-of-00081.safetensors?download=true"
        },
        {
          "label": "model-00080-of-00081.safetensors",
          "url": "https://huggingface.co/tiiuae/falcon-180B/resolve/main/model-00080-of-00081.safetensors?download=true"
        },
        {
          "label": "model-00081-of-00081.safetensors",
          "url": "https://huggingface.co/tiiuae/falcon-180B/resolve/main/model-00081-of-00081.safetensors?download=true"
        }
      ],
      "gated": true
    }
  ],
  "bloom-local": [
    {
      "repo": "bigscience/bloom-560m",
      "bRating": "560M",
      "parameters": "560M",
      "size": "1.0 GB",
      "files": [
        {
          "label": "model.safetensors",
          "url": "https://huggingface.co/bigscience/bloom-560m/resolve/main/model.safetensors?download=true"
        }
      ]
    },
    {
      "repo": "bigscience/bloom-1b7",
      "bRating": "1.7B",
      "parameters": "1.7B",
      "size": "3.2 GB",
      "files": [
        {
          "label": "model.safetensors",
          "url": "https://huggingface.co/bigscience/bloom-1b7/resolve/main/model.safetensors?download=true"
        }
      ]
    },
    {
      "repo": "bigscience/bloom-3b",
      "bRating": "3B",
      "parameters": "3B",
      "size": "5.6 GB",
      "files": [
        {
          "label": "model.safetensors",
          "url": "https://huggingface.co/bigscience/bloom-3b/resolve/main/model.safetensors?download=true"
        }
      ]
    },
    {
      "repo": "bigscience/bloom-7b1",
      "bRating": "7.1B",
      "parameters": "7.1B",
      "size": "13.2 GB",
      "files": [
        {
          "label": "model-00001-of-00002.safetensors",
          "url": "https://huggingface.co/bigscience/bloom-7b1/resolve/main/model-00001-of-00002.safetensors?download=true"
        },
        {
          "label": "model-00002-of-00002.safetensors",
          "url": "https://huggingface.co/bigscience/bloom-7b1/resolve/main/model-00002-of-00002.safetensors?download=true"
        }
      ]
    }
  ],
  "starcoder-local": [
    {
      "repo": "bigcode/starcoder",
      "bRating": "15.5B",
      "parameters": "15.5B",
      "size": "58.9 GB",
      "files": [
        {
          "label": "model-00001-of-00007.safetensors",
          "url": "https://huggingface.co/bigcode/starcoder/resolve/main/model-00001-of-00007.safetensors?download=true"
        },
        {
          "label": "model-00002-of-00007.safetensors",
          "url": "https://huggingface.co/bigcode/starcoder/resolve/main/model-00002-of-00007.safetensors?download=true"
        },
        {
          "label": "model-00003-of-00007.safetensors",
          "url": "https://huggingface.co/bigcode/starcoder/resolve/main/model-00003-of-00007.safetensors?download=true"
        },
        {
          "label": "model-00004-of-00007.safetensors",
          "url": "https://huggingface.co/bigcode/starcoder/resolve/main/model-00004-of-00007.safetensors?download=true"
        },
        {
          "label": "model-00005-of-00007.safetensors",
          "url": "https://huggingface.co/bigcode/starcoder/resolve/main/model-00005-of-00007.safetensors?download=true"
        },
        {
          "label": "model-00006-of-00007.safetensors",
          "url": "https://huggingface.co/bigcode/starcoder/resolve/main/model-00006-of-00007.safetensors?download=true"
        },
        {
          "label": "model-00007-of-00007.safetensors",
          "url": "https://huggingface.co/bigcode/starcoder/resolve/main/model-00007-of-00007.safetensors?download=true"
        }
      ],
      "gated": true
    },
    {
      "repo": "bigcode/starcoder2-3b",
      "bRating": "3B",
      "parameters": "3B",
      "size": "11.3 GB",
      "files": [
        {
          "label": "model.safetensors",
          "url": "https://huggingface.co/bigcode/starcoder2-3b/resolve/main/model.safetensors?download=true"
        }
      ]
    },
    {
      "repo": "bigcode/starcoder2-7b",
      "bRating": "7B",
      "parameters": "7B",
      "size": "13.4 GB",
      "files": [
        {
          "label": "model-00001-of-00003.safetensors",
          "url": "https://huggingface.co/bigcode/starcoder2-7b/resolve/main/model-00001-of-00003.safetensors?download=true"
        },
        {
          "label": "model-00002-of-00003.safetensors",
          "url": "https://huggingface.co/bigcode/starcoder2-7b/resolve/main/model-00002-of-00003.safetensors?download=true"
        },
        {
          "label": "model-00003-of-00003.safetensors",
          "url": "https://huggingface.co/bigcode/starcoder2-7b/resolve/main/model-00003-of-00003.safetensors?download=true"
        }
      ]
    },
    {
      "repo": "bigcode/starcoder2-15b",
      "bRating": "15B",
      "parameters": "15B",
      "size": "59.4 GB",
      "files": [
        {
          "label": "model-00001-of-00014.safetensors",
          "url": "https://huggingface.co/bigcode/starcoder2-15b/resolve/main/model-00001-of-00014.safetensors?download=true"
        },
        {
          "label": "model-00002-of-00014.safetensors",
          "url": "https://huggingface.co/bigcode/starcoder2-15b/resolve/main/model-00002-of-00014.safetensors?download=true"
        },
        {
          "label": "model-00003-of-00014.safetensors",
          "url": "https://huggingface.co/bigcode/starcoder2-15b/resolve/main/model-00003-of-00014.safetensors?download=true"
        },
        {
          "label": "model-00004-of-00014.safetensors",
          "url": "https://huggingface.co/bigcode/starcoder2-15b/resolve/main/model-00004-of-00014.safetensors?download=true"
        },
        {
          "label": "model-00005-of-00014.safetensors",
          "url": "https://huggingface.co/bigcode/starcoder2-15b/resolve/main/model-00005-of-00014.safetensors?download=true"
        },
        {
          "label": "model-00006-of-00014.safetensors",
          "url": "https://huggingface.co/bigcode/starcoder2-15b/resolve/main/model-00006-of-00014.safetensors?download=true"
        },
        {
          "label": "model-00007-of-00014.safetensors",
          "url": "https://huggingface.co/bigcode/starcoder2-15b/resolve/main/model-00007-of-00014.safetensors?download=true"
        },
        {
          "label": "model-00008-of-00014.safetensors",
          "url": "https://huggingface.co/bigcode/starcoder2-15b/resolve/main/model-00008-of-00014.safetensors?download=true"
        },
        {
          "label": "model-00009-of-00014.safetensors",
          "url": "https://huggingface.co/bigcode/starcoder2-15b/resolve/main/model-00009-of-00014.safetensors?download=true"
        },
        {
          "label": "model-00010-of-00014.safetensors",
          "url": "https://huggingface.co/bigcode/starcoder2-15b/resolve/main/model-00010-of-00014.safetensors?download=true"
        },
        {
          "label": "model-00011-of-00014.safetensors",
          "url": "https://huggingface.co/bigcode/starcoder2-15b/resolve/main/model-00011-of-00014.safetensors?download=true"
        },
        {
          "label": "model-00012-of-00014.safetensors",
          "url": "https://huggingface.co/bigcode/starcoder2-15b/resolve/main/model-00012-of-00014.safetensors?download=true"
        },
        {
          "label": "model-00013-of-00014.safetensors",
          "url": "https://huggingface.co/bigcode/starcoder2-15b/resolve/main/model-00013-of-00014.safetensors?download=true"
        },
        {
          "label": "model-00014-of-00014.safetensors",
          "url": "https://huggingface.co/bigcode/starcoder2-15b/resolve/main/model-00014-of-00014.safetensors?download=true"
        }
      ]
    }
  ],
  "olmo-local": [
    {
      "repo": "allenai/OLMo-1B",
      "bRating": "1B",
      "parameters": "1B",
      "size": "4.4 GB",
      "files": [
        {
          "label": "model.safetensors",
          "url": "https://huggingface.co/allenai/OLMo-1B/resolve/main/model.safetensors?download=true"
        }
      ]
    },
    {
      "repo": "allenai/OLMo-7B",
      "bRating": "7B",
      "parameters": "7B",
      "size": "25.7 GB",
      "files": [
        {
          "label": "model.safetensors",
          "url": "https://huggingface.co/allenai/OLMo-7B/resolve/main/model.safetensors?download=true"
        }
      ]
    },
    {
      "repo": "allenai/OLMo-7B-Instruct",
      "bRating": "7B",
      "parameters": "7B",
      "size": "12.8 GB",
      "files": [
        {
          "label": "model-00001-of-00002.safetensors",
          "url": "https://huggingface.co/allenai/OLMo-7B-Instruct/resolve/main/model-00001-of-00002.safetensors?download=true"
        },
        {
          "label": "model-00002-of-00002.safetensors",
          "url": "https://huggingface.co/allenai/OLMo-7B-Instruct/resolve/main/model-00002-of-00002.safetensors?download=true"
        }
      ]
    },
    {
      "repo": "allenai/OLMoE-1B-7B-0125",
      "bRating": "7.1B",
      "parameters": "7.1B",
      "size": "25.8 GB",
      "files": [
        {
          "label": "model-00001-of-00006.safetensors",
          "url": "https://huggingface.co/allenai/OLMoE-1B-7B-0125/resolve/main/model-00001-of-00006.safetensors?download=true"
        },
        {
          "label": "model-00002-of-00006.safetensors",
          "url": "https://huggingface.co/allenai/OLMoE-1B-7B-0125/resolve/main/model-00002-of-00006.safetensors?download=true"
        },
        {
          "label": "model-00003-of-00006.safetensors",
          "url": "https://huggingface.co/allenai/OLMoE-1B-7B-0125/resolve/main/model-00003-of-00006.safetensors?download=true"
        },
        {
          "label": "model-00004-of-00006.safetensors",
          "url": "https://huggingface.co/allenai/OLMoE-1B-7B-0125/resolve/main/model-00004-of-00006.safetensors?download=true"
        },
        {
          "label": "model-00005-of-00006.safetensors",
          "url": "https://huggingface.co/allenai/OLMoE-1B-7B-0125/resolve/main/model-00005-of-00006.safetensors?download=true"
        },
        {
          "label": "model-00006-of-00006.safetensors",
          "url": "https://huggingface.co/allenai/OLMoE-1B-7B-0125/resolve/main/model-00006-of-00006.safetensors?download=true"
        }
      ]
    }
  ],
  "yi-local": [
    {
      "repo": "01-ai/Yi-6B",
      "bRating": "6B",
      "parameters": "6B",
      "size": "11.3 GB",
      "files": [
        {
          "label": "model-00001-of-00002.safetensors",
          "url": "https://huggingface.co/01-ai/Yi-6B/resolve/main/model-00001-of-00002.safetensors?download=true"
        },
        {
          "label": "model-00002-of-00002.safetensors",
          "url": "https://huggingface.co/01-ai/Yi-6B/resolve/main/model-00002-of-00002.safetensors?download=true"
        }
      ]
    },
    {
      "repo": "01-ai/Yi-34B",
      "bRating": "34B",
      "parameters": "34B",
      "size": "64.1 GB",
      "files": [
        {
          "label": "model-00001-of-00007.safetensors",
          "url": "https://huggingface.co/01-ai/Yi-34B/resolve/main/model-00001-of-00007.safetensors?download=true"
        },
        {
          "label": "model-00002-of-00007.safetensors",
          "url": "https://huggingface.co/01-ai/Yi-34B/resolve/main/model-00002-of-00007.safetensors?download=true"
        },
        {
          "label": "model-00003-of-00007.safetensors",
          "url": "https://huggingface.co/01-ai/Yi-34B/resolve/main/model-00003-of-00007.safetensors?download=true"
        },
        {
          "label": "model-00004-of-00007.safetensors",
          "url": "https://huggingface.co/01-ai/Yi-34B/resolve/main/model-00004-of-00007.safetensors?download=true"
        },
        {
          "label": "model-00005-of-00007.safetensors",
          "url": "https://huggingface.co/01-ai/Yi-34B/resolve/main/model-00005-of-00007.safetensors?download=true"
        },
        {
          "label": "model-00006-of-00007.safetensors",
          "url": "https://huggingface.co/01-ai/Yi-34B/resolve/main/model-00006-of-00007.safetensors?download=true"
        },
        {
          "label": "model-00007-of-00007.safetensors",
          "url": "https://huggingface.co/01-ai/Yi-34B/resolve/main/model-00007-of-00007.safetensors?download=true"
        }
      ]
    },
    {
      "repo": "01-ai/Yi-1.5-6B",
      "bRating": "6B",
      "parameters": "6B",
      "size": "11.3 GB",
      "files": [
        {
          "label": "model-00001-of-00003.safetensors",
          "url": "https://huggingface.co/01-ai/Yi-1.5-6B/resolve/main/model-00001-of-00003.safetensors?download=true"
        },
        {
          "label": "model-00002-of-00003.safetensors",
          "url": "https://huggingface.co/01-ai/Yi-1.5-6B/resolve/main/model-00002-of-00003.safetensors?download=true"
        },
        {
          "label": "model-00003-of-00003.safetensors",
          "url": "https://huggingface.co/01-ai/Yi-1.5-6B/resolve/main/model-00003-of-00003.safetensors?download=true"
        }
      ]
    },
    {
      "repo": "01-ai/Yi-1.5-9B",
      "bRating": "9B",
      "parameters": "9B",
      "size": "16.4 GB",
      "files": [
        {
          "label": "model-00001-of-00004.safetensors",
          "url": "https://huggingface.co/01-ai/Yi-1.5-9B/resolve/main/model-00001-of-00004.safetensors?download=true"
        },
        {
          "label": "model-00002-of-00004.safetensors",
          "url": "https://huggingface.co/01-ai/Yi-1.5-9B/resolve/main/model-00002-of-00004.safetensors?download=true"
        },
        {
          "label": "model-00003-of-00004.safetensors",
          "url": "https://huggingface.co/01-ai/Yi-1.5-9B/resolve/main/model-00003-of-00004.safetensors?download=true"
        },
        {
          "label": "model-00004-of-00004.safetensors",
          "url": "https://huggingface.co/01-ai/Yi-1.5-9B/resolve/main/model-00004-of-00004.safetensors?download=true"
        }
      ]
    },
    {
      "repo": "01-ai/Yi-1.5-34B",
      "bRating": "34B",
      "parameters": "34B",
      "size": "64.1 GB",
      "files": [
        {
          "label": "model-00001-of-00015.safetensors",
          "url": "https://huggingface.co/01-ai/Yi-1.5-34B/resolve/main/model-00001-of-00015.safetensors?download=true"
        },
        {
          "label": "model-00002-of-00015.safetensors",
          "url": "https://huggingface.co/01-ai/Yi-1.5-34B/resolve/main/model-00002-of-00015.safetensors?download=true"
        },
        {
          "label": "model-00003-of-00015.safetensors",
          "url": "https://huggingface.co/01-ai/Yi-1.5-34B/resolve/main/model-00003-of-00015.safetensors?download=true"
        },
        {
          "label": "model-00004-of-00015.safetensors",
          "url": "https://huggingface.co/01-ai/Yi-1.5-34B/resolve/main/model-00004-of-00015.safetensors?download=true"
        },
        {
          "label": "model-00005-of-00015.safetensors",
          "url": "https://huggingface.co/01-ai/Yi-1.5-34B/resolve/main/model-00005-of-00015.safetensors?download=true"
        },
        {
          "label": "model-00006-of-00015.safetensors",
          "url": "https://huggingface.co/01-ai/Yi-1.5-34B/resolve/main/model-00006-of-00015.safetensors?download=true"
        },
        {
          "label": "model-00007-of-00015.safetensors",
          "url": "https://huggingface.co/01-ai/Yi-1.5-34B/resolve/main/model-00007-of-00015.safetensors?download=true"
        },
        {
          "label": "model-00008-of-00015.safetensors",
          "url": "https://huggingface.co/01-ai/Yi-1.5-34B/resolve/main/model-00008-of-00015.safetensors?download=true"
        },
        {
          "label": "model-00009-of-00015.safetensors",
          "url": "https://huggingface.co/01-ai/Yi-1.5-34B/resolve/main/model-00009-of-00015.safetensors?download=true"
        },
        {
          "label": "model-00010-of-00015.safetensors",
          "url": "https://huggingface.co/01-ai/Yi-1.5-34B/resolve/main/model-00010-of-00015.safetensors?download=true"
        },
        {
          "label": "model-00011-of-00015.safetensors",
          "url": "https://huggingface.co/01-ai/Yi-1.5-34B/resolve/main/model-00011-of-00015.safetensors?download=true"
        },
        {
          "label": "model-00012-of-00015.safetensors",
          "url": "https://huggingface.co/01-ai/Yi-1.5-34B/resolve/main/model-00012-of-00015.safetensors?download=true"
        },
        {
          "label": "model-00013-of-00015.safetensors",
          "url": "https://huggingface.co/01-ai/Yi-1.5-34B/resolve/main/model-00013-of-00015.safetensors?download=true"
        },
        {
          "label": "model-00014-of-00015.safetensors",
          "url": "https://huggingface.co/01-ai/Yi-1.5-34B/resolve/main/model-00014-of-00015.safetensors?download=true"
        },
        {
          "label": "model-00015-of-00015.safetensors",
          "url": "https://huggingface.co/01-ai/Yi-1.5-34B/resolve/main/model-00015-of-00015.safetensors?download=true"
        }
      ]
    }
  ],
  "chatglm-local": [
    {
      "repo": "THUDM/chatglm3-6b",
      "bRating": "6B",
      "parameters": "6B",
      "size": "11.6 GB",
      "files": [
        {
          "label": "model-00001-of-00007.safetensors",
          "url": "https://huggingface.co/THUDM/chatglm3-6b/resolve/main/model-00001-of-00007.safetensors?download=true"
        },
        {
          "label": "model-00002-of-00007.safetensors",
          "url": "https://huggingface.co/THUDM/chatglm3-6b/resolve/main/model-00002-of-00007.safetensors?download=true"
        },
        {
          "label": "model-00003-of-00007.safetensors",
          "url": "https://huggingface.co/THUDM/chatglm3-6b/resolve/main/model-00003-of-00007.safetensors?download=true"
        },
        {
          "label": "model-00004-of-00007.safetensors",
          "url": "https://huggingface.co/THUDM/chatglm3-6b/resolve/main/model-00004-of-00007.safetensors?download=true"
        },
        {
          "label": "model-00005-of-00007.safetensors",
          "url": "https://huggingface.co/THUDM/chatglm3-6b/resolve/main/model-00005-of-00007.safetensors?download=true"
        },
        {
          "label": "model-00006-of-00007.safetensors",
          "url": "https://huggingface.co/THUDM/chatglm3-6b/resolve/main/model-00006-of-00007.safetensors?download=true"
        },
        {
          "label": "model-00007-of-00007.safetensors",
          "url": "https://huggingface.co/THUDM/chatglm3-6b/resolve/main/model-00007-of-00007.safetensors?download=true"
        }
      ]
    }
  ],
  "glm-local": [
    {
      "repo": "THUDM/glm-4-9b",
      "bRating": "9B",
      "parameters": "9B",
      "size": "17.5 GB",
      "files": [
        {
          "label": "model-00001-of-00010.safetensors",
          "url": "https://huggingface.co/THUDM/glm-4-9b/resolve/main/model-00001-of-00010.safetensors?download=true"
        },
        {
          "label": "model-00002-of-00010.safetensors",
          "url": "https://huggingface.co/THUDM/glm-4-9b/resolve/main/model-00002-of-00010.safetensors?download=true"
        },
        {
          "label": "model-00003-of-00010.safetensors",
          "url": "https://huggingface.co/THUDM/glm-4-9b/resolve/main/model-00003-of-00010.safetensors?download=true"
        },
        {
          "label": "model-00004-of-00010.safetensors",
          "url": "https://huggingface.co/THUDM/glm-4-9b/resolve/main/model-00004-of-00010.safetensors?download=true"
        },
        {
          "label": "model-00005-of-00010.safetensors",
          "url": "https://huggingface.co/THUDM/glm-4-9b/resolve/main/model-00005-of-00010.safetensors?download=true"
        },
        {
          "label": "model-00006-of-00010.safetensors",
          "url": "https://huggingface.co/THUDM/glm-4-9b/resolve/main/model-00006-of-00010.safetensors?download=true"
        },
        {
          "label": "model-00007-of-00010.safetensors",
          "url": "https://huggingface.co/THUDM/glm-4-9b/resolve/main/model-00007-of-00010.safetensors?download=true"
        },
        {
          "label": "model-00008-of-00010.safetensors",
          "url": "https://huggingface.co/THUDM/glm-4-9b/resolve/main/model-00008-of-00010.safetensors?download=true"
        },
        {
          "label": "model-00009-of-00010.safetensors",
          "url": "https://huggingface.co/THUDM/glm-4-9b/resolve/main/model-00009-of-00010.safetensors?download=true"
        },
        {
          "label": "model-00010-of-00010.safetensors",
          "url": "https://huggingface.co/THUDM/glm-4-9b/resolve/main/model-00010-of-00010.safetensors?download=true"
        }
      ]
    },
    {
      "repo": "THUDM/glm-4-9b-chat",
      "bRating": "9B",
      "parameters": "9B",
      "size": "17.5 GB",
      "files": [
        {
          "label": "model-00001-of-00010.safetensors",
          "url": "https://huggingface.co/THUDM/glm-4-9b-chat/resolve/main/model-00001-of-00010.safetensors?download=true"
        },
        {
          "label": "model-00002-of-00010.safetensors",
          "url": "https://huggingface.co/THUDM/glm-4-9b-chat/resolve/main/model-00002-of-00010.safetensors?download=true"
        },
        {
          "label": "model-00003-of-00010.safetensors",
          "url": "https://huggingface.co/THUDM/glm-4-9b-chat/resolve/main/model-00003-of-00010.safetensors?download=true"
        },
        {
          "label": "model-00004-of-00010.safetensors",
          "url": "https://huggingface.co/THUDM/glm-4-9b-chat/resolve/main/model-00004-of-00010.safetensors?download=true"
        },
        {
          "label": "model-00005-of-00010.safetensors",
          "url": "https://huggingface.co/THUDM/glm-4-9b-chat/resolve/main/model-00005-of-00010.safetensors?download=true"
        },
        {
          "label": "model-00006-of-00010.safetensors",
          "url": "https://huggingface.co/THUDM/glm-4-9b-chat/resolve/main/model-00006-of-00010.safetensors?download=true"
        },
        {
          "label": "model-00007-of-00010.safetensors",
          "url": "https://huggingface.co/THUDM/glm-4-9b-chat/resolve/main/model-00007-of-00010.safetensors?download=true"
        },
        {
          "label": "model-00008-of-00010.safetensors",
          "url": "https://huggingface.co/THUDM/glm-4-9b-chat/resolve/main/model-00008-of-00010.safetensors?download=true"
        },
        {
          "label": "model-00009-of-00010.safetensors",
          "url": "https://huggingface.co/THUDM/glm-4-9b-chat/resolve/main/model-00009-of-00010.safetensors?download=true"
        },
        {
          "label": "model-00010-of-00010.safetensors",
          "url": "https://huggingface.co/THUDM/glm-4-9b-chat/resolve/main/model-00010-of-00010.safetensors?download=true"
        }
      ]
    },
    {
      "repo": "zai-org/GLM-5.3",
      "bRating": "Unknown",
      "parameters": "Unknown",
      "size": "703.7 GB",
      "files": [
        {
          "label": "model-00001-of-00141.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5.3/resolve/main/model-00001-of-00141.safetensors?download=true"
        },
        {
          "label": "model-00002-of-00141.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5.3/resolve/main/model-00002-of-00141.safetensors?download=true"
        },
        {
          "label": "model-00003-of-00141.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5.3/resolve/main/model-00003-of-00141.safetensors?download=true"
        },
        {
          "label": "model-00004-of-00141.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5.3/resolve/main/model-00004-of-00141.safetensors?download=true"
        },
        {
          "label": "model-00005-of-00141.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5.3/resolve/main/model-00005-of-00141.safetensors?download=true"
        },
        {
          "label": "model-00006-of-00141.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5.3/resolve/main/model-00006-of-00141.safetensors?download=true"
        },
        {
          "label": "model-00007-of-00141.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5.3/resolve/main/model-00007-of-00141.safetensors?download=true"
        },
        {
          "label": "model-00008-of-00141.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5.3/resolve/main/model-00008-of-00141.safetensors?download=true"
        },
        {
          "label": "model-00009-of-00141.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5.3/resolve/main/model-00009-of-00141.safetensors?download=true"
        },
        {
          "label": "model-00010-of-00141.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5.3/resolve/main/model-00010-of-00141.safetensors?download=true"
        },
        {
          "label": "model-00011-of-00141.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5.3/resolve/main/model-00011-of-00141.safetensors?download=true"
        },
        {
          "label": "model-00012-of-00141.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5.3/resolve/main/model-00012-of-00141.safetensors?download=true"
        },
        {
          "label": "model-00013-of-00141.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5.3/resolve/main/model-00013-of-00141.safetensors?download=true"
        },
        {
          "label": "model-00014-of-00141.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5.3/resolve/main/model-00014-of-00141.safetensors?download=true"
        },
        {
          "label": "model-00015-of-00141.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5.3/resolve/main/model-00015-of-00141.safetensors?download=true"
        },
        {
          "label": "model-00016-of-00141.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5.3/resolve/main/model-00016-of-00141.safetensors?download=true"
        },
        {
          "label": "model-00017-of-00141.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5.3/resolve/main/model-00017-of-00141.safetensors?download=true"
        },
        {
          "label": "model-00018-of-00141.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5.3/resolve/main/model-00018-of-00141.safetensors?download=true"
        },
        {
          "label": "model-00019-of-00141.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5.3/resolve/main/model-00019-of-00141.safetensors?download=true"
        },
        {
          "label": "model-00020-of-00141.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5.3/resolve/main/model-00020-of-00141.safetensors?download=true"
        },
        {
          "label": "model-00021-of-00141.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5.3/resolve/main/model-00021-of-00141.safetensors?download=true"
        },
        {
          "label": "model-00022-of-00141.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5.3/resolve/main/model-00022-of-00141.safetensors?download=true"
        },
        {
          "label": "model-00023-of-00141.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5.3/resolve/main/model-00023-of-00141.safetensors?download=true"
        },
        {
          "label": "model-00024-of-00141.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5.3/resolve/main/model-00024-of-00141.safetensors?download=true"
        },
        {
          "label": "model-00025-of-00141.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5.3/resolve/main/model-00025-of-00141.safetensors?download=true"
        },
        {
          "label": "model-00026-of-00141.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5.3/resolve/main/model-00026-of-00141.safetensors?download=true"
        },
        {
          "label": "model-00027-of-00141.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5.3/resolve/main/model-00027-of-00141.safetensors?download=true"
        },
        {
          "label": "model-00028-of-00141.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5.3/resolve/main/model-00028-of-00141.safetensors?download=true"
        },
        {
          "label": "model-00029-of-00141.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5.3/resolve/main/model-00029-of-00141.safetensors?download=true"
        },
        {
          "label": "model-00030-of-00141.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5.3/resolve/main/model-00030-of-00141.safetensors?download=true"
        },
        {
          "label": "model-00031-of-00141.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5.3/resolve/main/model-00031-of-00141.safetensors?download=true"
        },
        {
          "label": "model-00032-of-00141.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5.3/resolve/main/model-00032-of-00141.safetensors?download=true"
        },
        {
          "label": "model-00033-of-00141.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5.3/resolve/main/model-00033-of-00141.safetensors?download=true"
        },
        {
          "label": "model-00034-of-00141.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5.3/resolve/main/model-00034-of-00141.safetensors?download=true"
        },
        {
          "label": "model-00035-of-00141.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5.3/resolve/main/model-00035-of-00141.safetensors?download=true"
        },
        {
          "label": "model-00036-of-00141.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5.3/resolve/main/model-00036-of-00141.safetensors?download=true"
        },
        {
          "label": "model-00037-of-00141.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5.3/resolve/main/model-00037-of-00141.safetensors?download=true"
        },
        {
          "label": "model-00038-of-00141.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5.3/resolve/main/model-00038-of-00141.safetensors?download=true"
        },
        {
          "label": "model-00039-of-00141.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5.3/resolve/main/model-00039-of-00141.safetensors?download=true"
        },
        {
          "label": "model-00040-of-00141.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5.3/resolve/main/model-00040-of-00141.safetensors?download=true"
        },
        {
          "label": "model-00041-of-00141.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5.3/resolve/main/model-00041-of-00141.safetensors?download=true"
        },
        {
          "label": "model-00042-of-00141.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5.3/resolve/main/model-00042-of-00141.safetensors?download=true"
        },
        {
          "label": "model-00043-of-00141.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5.3/resolve/main/model-00043-of-00141.safetensors?download=true"
        },
        {
          "label": "model-00044-of-00141.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5.3/resolve/main/model-00044-of-00141.safetensors?download=true"
        },
        {
          "label": "model-00045-of-00141.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5.3/resolve/main/model-00045-of-00141.safetensors?download=true"
        },
        {
          "label": "model-00046-of-00141.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5.3/resolve/main/model-00046-of-00141.safetensors?download=true"
        },
        {
          "label": "model-00047-of-00141.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5.3/resolve/main/model-00047-of-00141.safetensors?download=true"
        },
        {
          "label": "model-00048-of-00141.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5.3/resolve/main/model-00048-of-00141.safetensors?download=true"
        },
        {
          "label": "model-00049-of-00141.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5.3/resolve/main/model-00049-of-00141.safetensors?download=true"
        },
        {
          "label": "model-00050-of-00141.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5.3/resolve/main/model-00050-of-00141.safetensors?download=true"
        },
        {
          "label": "model-00051-of-00141.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5.3/resolve/main/model-00051-of-00141.safetensors?download=true"
        },
        {
          "label": "model-00052-of-00141.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5.3/resolve/main/model-00052-of-00141.safetensors?download=true"
        },
        {
          "label": "model-00053-of-00141.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5.3/resolve/main/model-00053-of-00141.safetensors?download=true"
        },
        {
          "label": "model-00054-of-00141.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5.3/resolve/main/model-00054-of-00141.safetensors?download=true"
        },
        {
          "label": "model-00055-of-00141.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5.3/resolve/main/model-00055-of-00141.safetensors?download=true"
        },
        {
          "label": "model-00056-of-00141.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5.3/resolve/main/model-00056-of-00141.safetensors?download=true"
        },
        {
          "label": "model-00057-of-00141.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5.3/resolve/main/model-00057-of-00141.safetensors?download=true"
        },
        {
          "label": "model-00058-of-00141.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5.3/resolve/main/model-00058-of-00141.safetensors?download=true"
        },
        {
          "label": "model-00059-of-00141.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5.3/resolve/main/model-00059-of-00141.safetensors?download=true"
        },
        {
          "label": "model-00060-of-00141.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5.3/resolve/main/model-00060-of-00141.safetensors?download=true"
        },
        {
          "label": "model-00061-of-00141.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5.3/resolve/main/model-00061-of-00141.safetensors?download=true"
        },
        {
          "label": "model-00062-of-00141.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5.3/resolve/main/model-00062-of-00141.safetensors?download=true"
        },
        {
          "label": "model-00063-of-00141.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5.3/resolve/main/model-00063-of-00141.safetensors?download=true"
        },
        {
          "label": "model-00064-of-00141.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5.3/resolve/main/model-00064-of-00141.safetensors?download=true"
        },
        {
          "label": "model-00065-of-00141.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5.3/resolve/main/model-00065-of-00141.safetensors?download=true"
        },
        {
          "label": "model-00066-of-00141.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5.3/resolve/main/model-00066-of-00141.safetensors?download=true"
        },
        {
          "label": "model-00067-of-00141.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5.3/resolve/main/model-00067-of-00141.safetensors?download=true"
        },
        {
          "label": "model-00068-of-00141.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5.3/resolve/main/model-00068-of-00141.safetensors?download=true"
        },
        {
          "label": "model-00069-of-00141.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5.3/resolve/main/model-00069-of-00141.safetensors?download=true"
        },
        {
          "label": "model-00070-of-00141.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5.3/resolve/main/model-00070-of-00141.safetensors?download=true"
        },
        {
          "label": "model-00071-of-00141.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5.3/resolve/main/model-00071-of-00141.safetensors?download=true"
        },
        {
          "label": "model-00072-of-00141.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5.3/resolve/main/model-00072-of-00141.safetensors?download=true"
        },
        {
          "label": "model-00073-of-00141.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5.3/resolve/main/model-00073-of-00141.safetensors?download=true"
        },
        {
          "label": "model-00074-of-00141.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5.3/resolve/main/model-00074-of-00141.safetensors?download=true"
        },
        {
          "label": "model-00075-of-00141.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5.3/resolve/main/model-00075-of-00141.safetensors?download=true"
        },
        {
          "label": "model-00076-of-00141.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5.3/resolve/main/model-00076-of-00141.safetensors?download=true"
        },
        {
          "label": "model-00077-of-00141.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5.3/resolve/main/model-00077-of-00141.safetensors?download=true"
        },
        {
          "label": "model-00078-of-00141.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5.3/resolve/main/model-00078-of-00141.safetensors?download=true"
        },
        {
          "label": "model-00079-of-00141.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5.3/resolve/main/model-00079-of-00141.safetensors?download=true"
        },
        {
          "label": "model-00080-of-00141.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5.3/resolve/main/model-00080-of-00141.safetensors?download=true"
        },
        {
          "label": "model-00081-of-00141.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5.3/resolve/main/model-00081-of-00141.safetensors?download=true"
        },
        {
          "label": "model-00082-of-00141.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5.3/resolve/main/model-00082-of-00141.safetensors?download=true"
        },
        {
          "label": "model-00083-of-00141.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5.3/resolve/main/model-00083-of-00141.safetensors?download=true"
        },
        {
          "label": "model-00084-of-00141.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5.3/resolve/main/model-00084-of-00141.safetensors?download=true"
        },
        {
          "label": "model-00085-of-00141.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5.3/resolve/main/model-00085-of-00141.safetensors?download=true"
        },
        {
          "label": "model-00086-of-00141.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5.3/resolve/main/model-00086-of-00141.safetensors?download=true"
        },
        {
          "label": "model-00087-of-00141.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5.3/resolve/main/model-00087-of-00141.safetensors?download=true"
        },
        {
          "label": "model-00088-of-00141.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5.3/resolve/main/model-00088-of-00141.safetensors?download=true"
        },
        {
          "label": "model-00089-of-00141.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5.3/resolve/main/model-00089-of-00141.safetensors?download=true"
        },
        {
          "label": "model-00090-of-00141.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5.3/resolve/main/model-00090-of-00141.safetensors?download=true"
        },
        {
          "label": "model-00091-of-00141.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5.3/resolve/main/model-00091-of-00141.safetensors?download=true"
        },
        {
          "label": "model-00092-of-00141.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5.3/resolve/main/model-00092-of-00141.safetensors?download=true"
        },
        {
          "label": "model-00093-of-00141.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5.3/resolve/main/model-00093-of-00141.safetensors?download=true"
        },
        {
          "label": "model-00094-of-00141.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5.3/resolve/main/model-00094-of-00141.safetensors?download=true"
        },
        {
          "label": "model-00095-of-00141.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5.3/resolve/main/model-00095-of-00141.safetensors?download=true"
        },
        {
          "label": "model-00096-of-00141.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5.3/resolve/main/model-00096-of-00141.safetensors?download=true"
        },
        {
          "label": "model-00097-of-00141.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5.3/resolve/main/model-00097-of-00141.safetensors?download=true"
        },
        {
          "label": "model-00098-of-00141.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5.3/resolve/main/model-00098-of-00141.safetensors?download=true"
        },
        {
          "label": "model-00099-of-00141.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5.3/resolve/main/model-00099-of-00141.safetensors?download=true"
        },
        {
          "label": "model-00100-of-00141.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5.3/resolve/main/model-00100-of-00141.safetensors?download=true"
        },
        {
          "label": "model-00101-of-00141.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5.3/resolve/main/model-00101-of-00141.safetensors?download=true"
        },
        {
          "label": "model-00102-of-00141.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5.3/resolve/main/model-00102-of-00141.safetensors?download=true"
        },
        {
          "label": "model-00103-of-00141.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5.3/resolve/main/model-00103-of-00141.safetensors?download=true"
        },
        {
          "label": "model-00104-of-00141.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5.3/resolve/main/model-00104-of-00141.safetensors?download=true"
        },
        {
          "label": "model-00105-of-00141.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5.3/resolve/main/model-00105-of-00141.safetensors?download=true"
        },
        {
          "label": "model-00106-of-00141.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5.3/resolve/main/model-00106-of-00141.safetensors?download=true"
        },
        {
          "label": "model-00107-of-00141.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5.3/resolve/main/model-00107-of-00141.safetensors?download=true"
        },
        {
          "label": "model-00108-of-00141.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5.3/resolve/main/model-00108-of-00141.safetensors?download=true"
        },
        {
          "label": "model-00109-of-00141.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5.3/resolve/main/model-00109-of-00141.safetensors?download=true"
        },
        {
          "label": "model-00110-of-00141.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5.3/resolve/main/model-00110-of-00141.safetensors?download=true"
        },
        {
          "label": "model-00111-of-00141.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5.3/resolve/main/model-00111-of-00141.safetensors?download=true"
        },
        {
          "label": "model-00112-of-00141.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5.3/resolve/main/model-00112-of-00141.safetensors?download=true"
        },
        {
          "label": "model-00113-of-00141.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5.3/resolve/main/model-00113-of-00141.safetensors?download=true"
        },
        {
          "label": "model-00114-of-00141.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5.3/resolve/main/model-00114-of-00141.safetensors?download=true"
        },
        {
          "label": "model-00115-of-00141.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5.3/resolve/main/model-00115-of-00141.safetensors?download=true"
        },
        {
          "label": "model-00116-of-00141.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5.3/resolve/main/model-00116-of-00141.safetensors?download=true"
        },
        {
          "label": "model-00117-of-00141.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5.3/resolve/main/model-00117-of-00141.safetensors?download=true"
        },
        {
          "label": "model-00118-of-00141.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5.3/resolve/main/model-00118-of-00141.safetensors?download=true"
        },
        {
          "label": "model-00119-of-00141.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5.3/resolve/main/model-00119-of-00141.safetensors?download=true"
        },
        {
          "label": "model-00120-of-00141.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5.3/resolve/main/model-00120-of-00141.safetensors?download=true"
        },
        {
          "label": "model-00121-of-00141.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5.3/resolve/main/model-00121-of-00141.safetensors?download=true"
        },
        {
          "label": "model-00122-of-00141.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5.3/resolve/main/model-00122-of-00141.safetensors?download=true"
        },
        {
          "label": "model-00123-of-00141.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5.3/resolve/main/model-00123-of-00141.safetensors?download=true"
        },
        {
          "label": "model-00124-of-00141.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5.3/resolve/main/model-00124-of-00141.safetensors?download=true"
        },
        {
          "label": "model-00125-of-00141.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5.3/resolve/main/model-00125-of-00141.safetensors?download=true"
        },
        {
          "label": "model-00126-of-00141.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5.3/resolve/main/model-00126-of-00141.safetensors?download=true"
        },
        {
          "label": "model-00127-of-00141.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5.3/resolve/main/model-00127-of-00141.safetensors?download=true"
        },
        {
          "label": "model-00128-of-00141.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5.3/resolve/main/model-00128-of-00141.safetensors?download=true"
        },
        {
          "label": "model-00129-of-00141.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5.3/resolve/main/model-00129-of-00141.safetensors?download=true"
        },
        {
          "label": "model-00130-of-00141.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5.3/resolve/main/model-00130-of-00141.safetensors?download=true"
        },
        {
          "label": "model-00131-of-00141.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5.3/resolve/main/model-00131-of-00141.safetensors?download=true"
        },
        {
          "label": "model-00132-of-00141.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5.3/resolve/main/model-00132-of-00141.safetensors?download=true"
        },
        {
          "label": "model-00133-of-00141.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5.3/resolve/main/model-00133-of-00141.safetensors?download=true"
        },
        {
          "label": "model-00134-of-00141.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5.3/resolve/main/model-00134-of-00141.safetensors?download=true"
        },
        {
          "label": "model-00135-of-00141.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5.3/resolve/main/model-00135-of-00141.safetensors?download=true"
        },
        {
          "label": "model-00136-of-00141.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5.3/resolve/main/model-00136-of-00141.safetensors?download=true"
        },
        {
          "label": "model-00137-of-00141.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5.3/resolve/main/model-00137-of-00141.safetensors?download=true"
        },
        {
          "label": "model-00138-of-00141.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5.3/resolve/main/model-00138-of-00141.safetensors?download=true"
        },
        {
          "label": "model-00139-of-00141.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5.3/resolve/main/model-00139-of-00141.safetensors?download=true"
        },
        {
          "label": "model-00140-of-00141.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5.3/resolve/main/model-00140-of-00141.safetensors?download=true"
        },
        {
          "label": "model-00141-of-00141.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5.3/resolve/main/model-00141-of-00141.safetensors?download=true"
        }
      ]
    },
    {
      "repo": "zai-org/GLM-5.3-Flash",
      "bRating": "Unknown",
      "parameters": "Unknown",
      "size": "305.8 GB",
      "files": [
        {
          "label": "model-00001-of-00062.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5.3-Flash/resolve/main/model-00001-of-00062.safetensors?download=true"
        },
        {
          "label": "model-00002-of-00062.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5.3-Flash/resolve/main/model-00002-of-00062.safetensors?download=true"
        },
        {
          "label": "model-00003-of-00062.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5.3-Flash/resolve/main/model-00003-of-00062.safetensors?download=true"
        },
        {
          "label": "model-00004-of-00062.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5.3-Flash/resolve/main/model-00004-of-00062.safetensors?download=true"
        },
        {
          "label": "model-00005-of-00062.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5.3-Flash/resolve/main/model-00005-of-00062.safetensors?download=true"
        },
        {
          "label": "model-00006-of-00062.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5.3-Flash/resolve/main/model-00006-of-00062.safetensors?download=true"
        },
        {
          "label": "model-00007-of-00062.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5.3-Flash/resolve/main/model-00007-of-00062.safetensors?download=true"
        },
        {
          "label": "model-00008-of-00062.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5.3-Flash/resolve/main/model-00008-of-00062.safetensors?download=true"
        },
        {
          "label": "model-00009-of-00062.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5.3-Flash/resolve/main/model-00009-of-00062.safetensors?download=true"
        },
        {
          "label": "model-00010-of-00062.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5.3-Flash/resolve/main/model-00010-of-00062.safetensors?download=true"
        },
        {
          "label": "model-00011-of-00062.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5.3-Flash/resolve/main/model-00011-of-00062.safetensors?download=true"
        },
        {
          "label": "model-00012-of-00062.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5.3-Flash/resolve/main/model-00012-of-00062.safetensors?download=true"
        },
        {
          "label": "model-00013-of-00062.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5.3-Flash/resolve/main/model-00013-of-00062.safetensors?download=true"
        },
        {
          "label": "model-00014-of-00062.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5.3-Flash/resolve/main/model-00014-of-00062.safetensors?download=true"
        },
        {
          "label": "model-00015-of-00062.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5.3-Flash/resolve/main/model-00015-of-00062.safetensors?download=true"
        },
        {
          "label": "model-00016-of-00062.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5.3-Flash/resolve/main/model-00016-of-00062.safetensors?download=true"
        },
        {
          "label": "model-00017-of-00062.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5.3-Flash/resolve/main/model-00017-of-00062.safetensors?download=true"
        },
        {
          "label": "model-00018-of-00062.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5.3-Flash/resolve/main/model-00018-of-00062.safetensors?download=true"
        },
        {
          "label": "model-00019-of-00062.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5.3-Flash/resolve/main/model-00019-of-00062.safetensors?download=true"
        },
        {
          "label": "model-00020-of-00062.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5.3-Flash/resolve/main/model-00020-of-00062.safetensors?download=true"
        },
        {
          "label": "model-00021-of-00062.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5.3-Flash/resolve/main/model-00021-of-00062.safetensors?download=true"
        },
        {
          "label": "model-00022-of-00062.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5.3-Flash/resolve/main/model-00022-of-00062.safetensors?download=true"
        },
        {
          "label": "model-00023-of-00062.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5.3-Flash/resolve/main/model-00023-of-00062.safetensors?download=true"
        },
        {
          "label": "model-00024-of-00062.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5.3-Flash/resolve/main/model-00024-of-00062.safetensors?download=true"
        },
        {
          "label": "model-00025-of-00062.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5.3-Flash/resolve/main/model-00025-of-00062.safetensors?download=true"
        },
        {
          "label": "model-00026-of-00062.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5.3-Flash/resolve/main/model-00026-of-00062.safetensors?download=true"
        },
        {
          "label": "model-00027-of-00062.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5.3-Flash/resolve/main/model-00027-of-00062.safetensors?download=true"
        },
        {
          "label": "model-00028-of-00062.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5.3-Flash/resolve/main/model-00028-of-00062.safetensors?download=true"
        },
        {
          "label": "model-00029-of-00062.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5.3-Flash/resolve/main/model-00029-of-00062.safetensors?download=true"
        },
        {
          "label": "model-00030-of-00062.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5.3-Flash/resolve/main/model-00030-of-00062.safetensors?download=true"
        },
        {
          "label": "model-00031-of-00062.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5.3-Flash/resolve/main/model-00031-of-00062.safetensors?download=true"
        },
        {
          "label": "model-00032-of-00062.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5.3-Flash/resolve/main/model-00032-of-00062.safetensors?download=true"
        },
        {
          "label": "model-00033-of-00062.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5.3-Flash/resolve/main/model-00033-of-00062.safetensors?download=true"
        },
        {
          "label": "model-00034-of-00062.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5.3-Flash/resolve/main/model-00034-of-00062.safetensors?download=true"
        },
        {
          "label": "model-00035-of-00062.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5.3-Flash/resolve/main/model-00035-of-00062.safetensors?download=true"
        },
        {
          "label": "model-00036-of-00062.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5.3-Flash/resolve/main/model-00036-of-00062.safetensors?download=true"
        },
        {
          "label": "model-00037-of-00062.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5.3-Flash/resolve/main/model-00037-of-00062.safetensors?download=true"
        },
        {
          "label": "model-00038-of-00062.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5.3-Flash/resolve/main/model-00038-of-00062.safetensors?download=true"
        },
        {
          "label": "model-00039-of-00062.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5.3-Flash/resolve/main/model-00039-of-00062.safetensors?download=true"
        },
        {
          "label": "model-00040-of-00062.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5.3-Flash/resolve/main/model-00040-of-00062.safetensors?download=true"
        },
        {
          "label": "model-00041-of-00062.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5.3-Flash/resolve/main/model-00041-of-00062.safetensors?download=true"
        },
        {
          "label": "model-00042-of-00062.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5.3-Flash/resolve/main/model-00042-of-00062.safetensors?download=true"
        },
        {
          "label": "model-00043-of-00062.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5.3-Flash/resolve/main/model-00043-of-00062.safetensors?download=true"
        },
        {
          "label": "model-00044-of-00062.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5.3-Flash/resolve/main/model-00044-of-00062.safetensors?download=true"
        },
        {
          "label": "model-00045-of-00062.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5.3-Flash/resolve/main/model-00045-of-00062.safetensors?download=true"
        },
        {
          "label": "model-00046-of-00062.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5.3-Flash/resolve/main/model-00046-of-00062.safetensors?download=true"
        },
        {
          "label": "model-00047-of-00062.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5.3-Flash/resolve/main/model-00047-of-00062.safetensors?download=true"
        },
        {
          "label": "model-00048-of-00062.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5.3-Flash/resolve/main/model-00048-of-00062.safetensors?download=true"
        },
        {
          "label": "model-00049-of-00062.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5.3-Flash/resolve/main/model-00049-of-00062.safetensors?download=true"
        },
        {
          "label": "model-00050-of-00062.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5.3-Flash/resolve/main/model-00050-of-00062.safetensors?download=true"
        },
        {
          "label": "model-00051-of-00062.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5.3-Flash/resolve/main/model-00051-of-00062.safetensors?download=true"
        },
        {
          "label": "model-00052-of-00062.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5.3-Flash/resolve/main/model-00052-of-00062.safetensors?download=true"
        },
        {
          "label": "model-00053-of-00062.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5.3-Flash/resolve/main/model-00053-of-00062.safetensors?download=true"
        },
        {
          "label": "model-00054-of-00062.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5.3-Flash/resolve/main/model-00054-of-00062.safetensors?download=true"
        },
        {
          "label": "model-00055-of-00062.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5.3-Flash/resolve/main/model-00055-of-00062.safetensors?download=true"
        },
        {
          "label": "model-00056-of-00062.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5.3-Flash/resolve/main/model-00056-of-00062.safetensors?download=true"
        },
        {
          "label": "model-00057-of-00062.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5.3-Flash/resolve/main/model-00057-of-00062.safetensors?download=true"
        },
        {
          "label": "model-00058-of-00062.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5.3-Flash/resolve/main/model-00058-of-00062.safetensors?download=true"
        },
        {
          "label": "model-00059-of-00062.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5.3-Flash/resolve/main/model-00059-of-00062.safetensors?download=true"
        },
        {
          "label": "model-00060-of-00062.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5.3-Flash/resolve/main/model-00060-of-00062.safetensors?download=true"
        },
        {
          "label": "model-00061-of-00062.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5.3-Flash/resolve/main/model-00061-of-00062.safetensors?download=true"
        },
        {
          "label": "model-00062-of-00062.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5.3-Flash/resolve/main/model-00062-of-00062.safetensors?download=true"
        }
      ]
    },
    {
      "repo": "zai-org/GLM-5",
      "bRating": "744B",
      "parameters": "744B",
      "size": "1.37 TB",
      "files": [
        {
          "label": "model-00001-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00001-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00002-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00002-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00003-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00003-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00004-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00004-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00005-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00005-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00006-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00006-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00007-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00007-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00008-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00008-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00009-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00009-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00010-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00010-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00011-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00011-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00012-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00012-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00013-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00013-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00014-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00014-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00015-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00015-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00016-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00016-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00017-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00017-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00018-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00018-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00019-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00019-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00020-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00020-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00021-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00021-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00022-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00022-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00023-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00023-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00024-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00024-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00025-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00025-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00026-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00026-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00027-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00027-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00028-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00028-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00029-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00029-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00030-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00030-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00031-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00031-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00032-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00032-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00033-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00033-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00034-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00034-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00035-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00035-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00036-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00036-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00037-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00037-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00038-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00038-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00039-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00039-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00040-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00040-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00041-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00041-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00042-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00042-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00043-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00043-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00044-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00044-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00045-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00045-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00046-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00046-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00047-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00047-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00048-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00048-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00049-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00049-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00050-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00050-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00051-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00051-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00052-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00052-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00053-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00053-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00054-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00054-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00055-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00055-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00056-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00056-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00057-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00057-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00058-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00058-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00059-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00059-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00060-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00060-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00061-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00061-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00062-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00062-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00063-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00063-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00064-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00064-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00065-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00065-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00066-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00066-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00067-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00067-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00068-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00068-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00069-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00069-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00070-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00070-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00071-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00071-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00072-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00072-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00073-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00073-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00074-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00074-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00075-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00075-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00076-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00076-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00077-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00077-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00078-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00078-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00079-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00079-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00080-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00080-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00081-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00081-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00082-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00082-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00083-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00083-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00084-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00084-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00085-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00085-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00086-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00086-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00087-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00087-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00088-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00088-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00089-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00089-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00090-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00090-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00091-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00091-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00092-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00092-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00093-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00093-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00094-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00094-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00095-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00095-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00096-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00096-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00097-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00097-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00098-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00098-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00099-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00099-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00100-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00100-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00101-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00101-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00102-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00102-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00103-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00103-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00104-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00104-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00105-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00105-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00106-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00106-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00107-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00107-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00108-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00108-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00109-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00109-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00110-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00110-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00111-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00111-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00112-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00112-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00113-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00113-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00114-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00114-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00115-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00115-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00116-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00116-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00117-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00117-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00118-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00118-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00119-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00119-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00120-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00120-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00121-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00121-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00122-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00122-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00123-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00123-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00124-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00124-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00125-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00125-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00126-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00126-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00127-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00127-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00128-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00128-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00129-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00129-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00130-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00130-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00131-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00131-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00132-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00132-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00133-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00133-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00134-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00134-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00135-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00135-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00136-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00136-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00137-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00137-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00138-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00138-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00139-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00139-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00140-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00140-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00141-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00141-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00142-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00142-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00143-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00143-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00144-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00144-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00145-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00145-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00146-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00146-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00147-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00147-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00148-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00148-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00149-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00149-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00150-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00150-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00151-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00151-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00152-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00152-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00153-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00153-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00154-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00154-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00155-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00155-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00156-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00156-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00157-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00157-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00158-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00158-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00159-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00159-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00160-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00160-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00161-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00161-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00162-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00162-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00163-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00163-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00164-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00164-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00165-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00165-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00166-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00166-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00167-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00167-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00168-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00168-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00169-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00169-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00170-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00170-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00171-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00171-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00172-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00172-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00173-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00173-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00174-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00174-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00175-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00175-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00176-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00176-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00177-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00177-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00178-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00178-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00179-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00179-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00180-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00180-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00181-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00181-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00182-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00182-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00183-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00183-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00184-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00184-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00185-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00185-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00186-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00186-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00187-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00187-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00188-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00188-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00189-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00189-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00190-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00190-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00191-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00191-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00192-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00192-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00193-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00193-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00194-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00194-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00195-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00195-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00196-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00196-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00197-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00197-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00198-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00198-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00199-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00199-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00200-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00200-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00201-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00201-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00202-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00202-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00203-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00203-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00204-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00204-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00205-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00205-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00206-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00206-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00207-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00207-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00208-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00208-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00209-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00209-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00210-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00210-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00211-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00211-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00212-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00212-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00213-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00213-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00214-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00214-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00215-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00215-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00216-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00216-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00217-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00217-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00218-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00218-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00219-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00219-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00220-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00220-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00221-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00221-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00222-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00222-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00223-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00223-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00224-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00224-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00225-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00225-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00226-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00226-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00227-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00227-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00228-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00228-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00229-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00229-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00230-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00230-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00231-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00231-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00232-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00232-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00233-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00233-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00234-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00234-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00235-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00235-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00236-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00236-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00237-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00237-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00238-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00238-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00239-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00239-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00240-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00240-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00241-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00241-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00242-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00242-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00243-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00243-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00244-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00244-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00245-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00245-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00246-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00246-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00247-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00247-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00248-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00248-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00249-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00249-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00250-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00250-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00251-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00251-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00252-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00252-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00253-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00253-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00254-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00254-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00255-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00255-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00256-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00256-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00257-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00257-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00258-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00258-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00259-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00259-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00260-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00260-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00261-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00261-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00262-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00262-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00263-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00263-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00264-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00264-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00265-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00265-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00266-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00266-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00267-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00267-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00268-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00268-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00269-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00269-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00270-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00270-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00271-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00271-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00272-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00272-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00273-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00273-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00274-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00274-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00275-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00275-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00276-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00276-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00277-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00277-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00278-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00278-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00279-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00279-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00280-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00280-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00281-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00281-of-00282.safetensors?download=true"
        },
        {
          "label": "model-00282-of-00282.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00282-of-00282.safetensors?download=true"
        }
      ]
    }
  ],
  "qwen-local": [
    {
      "repo": "Qwen/Qwen2-0.5B",
      "bRating": "500M",
      "parameters": "500M",
      "size": "942 MB",
      "files": [
        {
          "label": "model.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen2-0.5B/resolve/main/model.safetensors?download=true"
        }
      ]
    },
    {
      "repo": "Qwen/Qwen2-1.5B",
      "bRating": "1.5B",
      "parameters": "1.5B",
      "size": "2.9 GB",
      "files": [
        {
          "label": "model.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen2-1.5B/resolve/main/model.safetensors?download=true"
        }
      ]
    },
    {
      "repo": "Qwen/Qwen2-7B",
      "bRating": "7B",
      "parameters": "7B",
      "size": "14.2 GB",
      "files": [
        {
          "label": "model-00001-of-00004.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen2-7B/resolve/main/model-00001-of-00004.safetensors?download=true"
        },
        {
          "label": "model-00002-of-00004.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen2-7B/resolve/main/model-00002-of-00004.safetensors?download=true"
        },
        {
          "label": "model-00003-of-00004.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen2-7B/resolve/main/model-00003-of-00004.safetensors?download=true"
        },
        {
          "label": "model-00004-of-00004.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen2-7B/resolve/main/model-00004-of-00004.safetensors?download=true"
        }
      ]
    },
    {
      "repo": "Qwen/Qwen2-72B",
      "bRating": "72B",
      "parameters": "72B",
      "size": "135.4 GB",
      "files": [
        {
          "label": "model-00001-of-00037.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen2-72B/resolve/main/model-00001-of-00037.safetensors?download=true"
        },
        {
          "label": "model-00002-of-00037.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen2-72B/resolve/main/model-00002-of-00037.safetensors?download=true"
        },
        {
          "label": "model-00003-of-00037.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen2-72B/resolve/main/model-00003-of-00037.safetensors?download=true"
        },
        {
          "label": "model-00004-of-00037.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen2-72B/resolve/main/model-00004-of-00037.safetensors?download=true"
        },
        {
          "label": "model-00005-of-00037.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen2-72B/resolve/main/model-00005-of-00037.safetensors?download=true"
        },
        {
          "label": "model-00006-of-00037.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen2-72B/resolve/main/model-00006-of-00037.safetensors?download=true"
        },
        {
          "label": "model-00007-of-00037.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen2-72B/resolve/main/model-00007-of-00037.safetensors?download=true"
        },
        {
          "label": "model-00008-of-00037.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen2-72B/resolve/main/model-00008-of-00037.safetensors?download=true"
        },
        {
          "label": "model-00009-of-00037.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen2-72B/resolve/main/model-00009-of-00037.safetensors?download=true"
        },
        {
          "label": "model-00010-of-00037.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen2-72B/resolve/main/model-00010-of-00037.safetensors?download=true"
        },
        {
          "label": "model-00011-of-00037.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen2-72B/resolve/main/model-00011-of-00037.safetensors?download=true"
        },
        {
          "label": "model-00012-of-00037.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen2-72B/resolve/main/model-00012-of-00037.safetensors?download=true"
        },
        {
          "label": "model-00013-of-00037.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen2-72B/resolve/main/model-00013-of-00037.safetensors?download=true"
        },
        {
          "label": "model-00014-of-00037.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen2-72B/resolve/main/model-00014-of-00037.safetensors?download=true"
        },
        {
          "label": "model-00015-of-00037.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen2-72B/resolve/main/model-00015-of-00037.safetensors?download=true"
        },
        {
          "label": "model-00016-of-00037.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen2-72B/resolve/main/model-00016-of-00037.safetensors?download=true"
        },
        {
          "label": "model-00017-of-00037.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen2-72B/resolve/main/model-00017-of-00037.safetensors?download=true"
        },
        {
          "label": "model-00018-of-00037.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen2-72B/resolve/main/model-00018-of-00037.safetensors?download=true"
        },
        {
          "label": "model-00019-of-00037.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen2-72B/resolve/main/model-00019-of-00037.safetensors?download=true"
        },
        {
          "label": "model-00020-of-00037.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen2-72B/resolve/main/model-00020-of-00037.safetensors?download=true"
        },
        {
          "label": "model-00021-of-00037.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen2-72B/resolve/main/model-00021-of-00037.safetensors?download=true"
        },
        {
          "label": "model-00022-of-00037.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen2-72B/resolve/main/model-00022-of-00037.safetensors?download=true"
        },
        {
          "label": "model-00023-of-00037.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen2-72B/resolve/main/model-00023-of-00037.safetensors?download=true"
        },
        {
          "label": "model-00024-of-00037.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen2-72B/resolve/main/model-00024-of-00037.safetensors?download=true"
        },
        {
          "label": "model-00025-of-00037.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen2-72B/resolve/main/model-00025-of-00037.safetensors?download=true"
        },
        {
          "label": "model-00026-of-00037.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen2-72B/resolve/main/model-00026-of-00037.safetensors?download=true"
        },
        {
          "label": "model-00027-of-00037.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen2-72B/resolve/main/model-00027-of-00037.safetensors?download=true"
        },
        {
          "label": "model-00028-of-00037.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen2-72B/resolve/main/model-00028-of-00037.safetensors?download=true"
        },
        {
          "label": "model-00029-of-00037.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen2-72B/resolve/main/model-00029-of-00037.safetensors?download=true"
        },
        {
          "label": "model-00030-of-00037.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen2-72B/resolve/main/model-00030-of-00037.safetensors?download=true"
        },
        {
          "label": "model-00031-of-00037.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen2-72B/resolve/main/model-00031-of-00037.safetensors?download=true"
        },
        {
          "label": "model-00032-of-00037.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen2-72B/resolve/main/model-00032-of-00037.safetensors?download=true"
        },
        {
          "label": "model-00033-of-00037.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen2-72B/resolve/main/model-00033-of-00037.safetensors?download=true"
        },
        {
          "label": "model-00034-of-00037.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen2-72B/resolve/main/model-00034-of-00037.safetensors?download=true"
        },
        {
          "label": "model-00035-of-00037.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen2-72B/resolve/main/model-00035-of-00037.safetensors?download=true"
        },
        {
          "label": "model-00036-of-00037.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen2-72B/resolve/main/model-00036-of-00037.safetensors?download=true"
        },
        {
          "label": "model-00037-of-00037.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen2-72B/resolve/main/model-00037-of-00037.safetensors?download=true"
        }
      ]
    },
    {
      "repo": "Qwen/Qwen2.5-0.5B",
      "bRating": "500M",
      "parameters": "500M",
      "size": "942 MB",
      "files": [
        {
          "label": "model.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen2.5-0.5B/resolve/main/model.safetensors?download=true"
        }
      ]
    },
    {
      "repo": "Qwen/Qwen2.5-1.5B",
      "bRating": "1.5B",
      "parameters": "1.5B",
      "size": "2.9 GB",
      "files": [
        {
          "label": "model.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen2.5-1.5B/resolve/main/model.safetensors?download=true"
        }
      ]
    },
    {
      "repo": "Qwen/Qwen2.5-3B",
      "bRating": "3B",
      "parameters": "3B",
      "size": "5.7 GB",
      "files": [
        {
          "label": "model-00001-of-00002.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen2.5-3B/resolve/main/model-00001-of-00002.safetensors?download=true"
        },
        {
          "label": "model-00002-of-00002.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen2.5-3B/resolve/main/model-00002-of-00002.safetensors?download=true"
        }
      ]
    },
    {
      "repo": "Qwen/Qwen2.5-7B",
      "bRating": "7B",
      "parameters": "7B",
      "size": "14.2 GB",
      "files": [
        {
          "label": "model-00001-of-00004.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen2.5-7B/resolve/main/model-00001-of-00004.safetensors?download=true"
        },
        {
          "label": "model-00002-of-00004.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen2.5-7B/resolve/main/model-00002-of-00004.safetensors?download=true"
        },
        {
          "label": "model-00003-of-00004.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen2.5-7B/resolve/main/model-00003-of-00004.safetensors?download=true"
        },
        {
          "label": "model-00004-of-00004.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen2.5-7B/resolve/main/model-00004-of-00004.safetensors?download=true"
        }
      ]
    },
    {
      "repo": "Qwen/Qwen2.5-14B",
      "bRating": "14B",
      "parameters": "14B",
      "size": "27.5 GB",
      "files": [
        {
          "label": "model-00001-of-00008.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen2.5-14B/resolve/main/model-00001-of-00008.safetensors?download=true"
        },
        {
          "label": "model-00002-of-00008.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen2.5-14B/resolve/main/model-00002-of-00008.safetensors?download=true"
        },
        {
          "label": "model-00003-of-00008.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen2.5-14B/resolve/main/model-00003-of-00008.safetensors?download=true"
        },
        {
          "label": "model-00004-of-00008.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen2.5-14B/resolve/main/model-00004-of-00008.safetensors?download=true"
        },
        {
          "label": "model-00005-of-00008.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen2.5-14B/resolve/main/model-00005-of-00008.safetensors?download=true"
        },
        {
          "label": "model-00006-of-00008.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen2.5-14B/resolve/main/model-00006-of-00008.safetensors?download=true"
        },
        {
          "label": "model-00007-of-00008.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen2.5-14B/resolve/main/model-00007-of-00008.safetensors?download=true"
        },
        {
          "label": "model-00008-of-00008.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen2.5-14B/resolve/main/model-00008-of-00008.safetensors?download=true"
        }
      ]
    },
    {
      "repo": "Qwen/Qwen2.5-32B",
      "bRating": "32B",
      "parameters": "32B",
      "size": "61.0 GB",
      "files": [
        {
          "label": "model-00001-of-00017.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen2.5-32B/resolve/main/model-00001-of-00017.safetensors?download=true"
        },
        {
          "label": "model-00002-of-00017.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen2.5-32B/resolve/main/model-00002-of-00017.safetensors?download=true"
        },
        {
          "label": "model-00003-of-00017.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen2.5-32B/resolve/main/model-00003-of-00017.safetensors?download=true"
        },
        {
          "label": "model-00004-of-00017.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen2.5-32B/resolve/main/model-00004-of-00017.safetensors?download=true"
        },
        {
          "label": "model-00005-of-00017.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen2.5-32B/resolve/main/model-00005-of-00017.safetensors?download=true"
        },
        {
          "label": "model-00006-of-00017.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen2.5-32B/resolve/main/model-00006-of-00017.safetensors?download=true"
        },
        {
          "label": "model-00007-of-00017.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen2.5-32B/resolve/main/model-00007-of-00017.safetensors?download=true"
        },
        {
          "label": "model-00008-of-00017.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen2.5-32B/resolve/main/model-00008-of-00017.safetensors?download=true"
        },
        {
          "label": "model-00009-of-00017.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen2.5-32B/resolve/main/model-00009-of-00017.safetensors?download=true"
        },
        {
          "label": "model-00010-of-00017.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen2.5-32B/resolve/main/model-00010-of-00017.safetensors?download=true"
        },
        {
          "label": "model-00011-of-00017.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen2.5-32B/resolve/main/model-00011-of-00017.safetensors?download=true"
        },
        {
          "label": "model-00012-of-00017.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen2.5-32B/resolve/main/model-00012-of-00017.safetensors?download=true"
        },
        {
          "label": "model-00013-of-00017.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen2.5-32B/resolve/main/model-00013-of-00017.safetensors?download=true"
        },
        {
          "label": "model-00014-of-00017.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen2.5-32B/resolve/main/model-00014-of-00017.safetensors?download=true"
        },
        {
          "label": "model-00015-of-00017.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen2.5-32B/resolve/main/model-00015-of-00017.safetensors?download=true"
        },
        {
          "label": "model-00016-of-00017.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen2.5-32B/resolve/main/model-00016-of-00017.safetensors?download=true"
        },
        {
          "label": "model-00017-of-00017.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen2.5-32B/resolve/main/model-00017-of-00017.safetensors?download=true"
        }
      ]
    },
    {
      "repo": "Qwen/Qwen2.5-72B",
      "bRating": "72B",
      "parameters": "72B",
      "size": "135.4 GB",
      "files": [
        {
          "label": "model-00001-of-00037.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen2.5-72B/resolve/main/model-00001-of-00037.safetensors?download=true"
        },
        {
          "label": "model-00002-of-00037.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen2.5-72B/resolve/main/model-00002-of-00037.safetensors?download=true"
        },
        {
          "label": "model-00003-of-00037.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen2.5-72B/resolve/main/model-00003-of-00037.safetensors?download=true"
        },
        {
          "label": "model-00004-of-00037.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen2.5-72B/resolve/main/model-00004-of-00037.safetensors?download=true"
        },
        {
          "label": "model-00005-of-00037.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen2.5-72B/resolve/main/model-00005-of-00037.safetensors?download=true"
        },
        {
          "label": "model-00006-of-00037.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen2.5-72B/resolve/main/model-00006-of-00037.safetensors?download=true"
        },
        {
          "label": "model-00007-of-00037.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen2.5-72B/resolve/main/model-00007-of-00037.safetensors?download=true"
        },
        {
          "label": "model-00008-of-00037.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen2.5-72B/resolve/main/model-00008-of-00037.safetensors?download=true"
        },
        {
          "label": "model-00009-of-00037.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen2.5-72B/resolve/main/model-00009-of-00037.safetensors?download=true"
        },
        {
          "label": "model-00010-of-00037.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen2.5-72B/resolve/main/model-00010-of-00037.safetensors?download=true"
        },
        {
          "label": "model-00011-of-00037.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen2.5-72B/resolve/main/model-00011-of-00037.safetensors?download=true"
        },
        {
          "label": "model-00012-of-00037.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen2.5-72B/resolve/main/model-00012-of-00037.safetensors?download=true"
        },
        {
          "label": "model-00013-of-00037.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen2.5-72B/resolve/main/model-00013-of-00037.safetensors?download=true"
        },
        {
          "label": "model-00014-of-00037.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen2.5-72B/resolve/main/model-00014-of-00037.safetensors?download=true"
        },
        {
          "label": "model-00015-of-00037.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen2.5-72B/resolve/main/model-00015-of-00037.safetensors?download=true"
        },
        {
          "label": "model-00016-of-00037.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen2.5-72B/resolve/main/model-00016-of-00037.safetensors?download=true"
        },
        {
          "label": "model-00017-of-00037.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen2.5-72B/resolve/main/model-00017-of-00037.safetensors?download=true"
        },
        {
          "label": "model-00018-of-00037.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen2.5-72B/resolve/main/model-00018-of-00037.safetensors?download=true"
        },
        {
          "label": "model-00019-of-00037.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen2.5-72B/resolve/main/model-00019-of-00037.safetensors?download=true"
        },
        {
          "label": "model-00020-of-00037.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen2.5-72B/resolve/main/model-00020-of-00037.safetensors?download=true"
        },
        {
          "label": "model-00021-of-00037.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen2.5-72B/resolve/main/model-00021-of-00037.safetensors?download=true"
        },
        {
          "label": "model-00022-of-00037.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen2.5-72B/resolve/main/model-00022-of-00037.safetensors?download=true"
        },
        {
          "label": "model-00023-of-00037.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen2.5-72B/resolve/main/model-00023-of-00037.safetensors?download=true"
        },
        {
          "label": "model-00024-of-00037.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen2.5-72B/resolve/main/model-00024-of-00037.safetensors?download=true"
        },
        {
          "label": "model-00025-of-00037.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen2.5-72B/resolve/main/model-00025-of-00037.safetensors?download=true"
        },
        {
          "label": "model-00026-of-00037.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen2.5-72B/resolve/main/model-00026-of-00037.safetensors?download=true"
        },
        {
          "label": "model-00027-of-00037.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen2.5-72B/resolve/main/model-00027-of-00037.safetensors?download=true"
        },
        {
          "label": "model-00028-of-00037.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen2.5-72B/resolve/main/model-00028-of-00037.safetensors?download=true"
        },
        {
          "label": "model-00029-of-00037.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen2.5-72B/resolve/main/model-00029-of-00037.safetensors?download=true"
        },
        {
          "label": "model-00030-of-00037.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen2.5-72B/resolve/main/model-00030-of-00037.safetensors?download=true"
        },
        {
          "label": "model-00031-of-00037.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen2.5-72B/resolve/main/model-00031-of-00037.safetensors?download=true"
        },
        {
          "label": "model-00032-of-00037.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen2.5-72B/resolve/main/model-00032-of-00037.safetensors?download=true"
        },
        {
          "label": "model-00033-of-00037.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen2.5-72B/resolve/main/model-00033-of-00037.safetensors?download=true"
        },
        {
          "label": "model-00034-of-00037.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen2.5-72B/resolve/main/model-00034-of-00037.safetensors?download=true"
        },
        {
          "label": "model-00035-of-00037.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen2.5-72B/resolve/main/model-00035-of-00037.safetensors?download=true"
        },
        {
          "label": "model-00036-of-00037.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen2.5-72B/resolve/main/model-00036-of-00037.safetensors?download=true"
        },
        {
          "label": "model-00037-of-00037.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen2.5-72B/resolve/main/model-00037-of-00037.safetensors?download=true"
        }
      ]
    },
    {
      "repo": "Qwen/Qwen3-0.6B",
      "bRating": "600M",
      "parameters": "600M",
      "size": "1.4 GB",
      "files": [
        {
          "label": "model.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-0.6B/resolve/main/model.safetensors?download=true"
        }
      ]
    },
    {
      "repo": "Qwen/Qwen3-1.7B",
      "bRating": "1.7B",
      "parameters": "1.7B",
      "size": "3.8 GB",
      "files": [
        {
          "label": "model-00001-of-00002.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-1.7B/resolve/main/model-00001-of-00002.safetensors?download=true"
        },
        {
          "label": "model-00002-of-00002.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-1.7B/resolve/main/model-00002-of-00002.safetensors?download=true"
        }
      ]
    },
    {
      "repo": "Qwen/Qwen3-4B",
      "bRating": "4B",
      "parameters": "4B",
      "size": "7.5 GB",
      "files": [
        {
          "label": "model-00001-of-00003.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-4B/resolve/main/model-00001-of-00003.safetensors?download=true"
        },
        {
          "label": "model-00002-of-00003.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-4B/resolve/main/model-00002-of-00003.safetensors?download=true"
        },
        {
          "label": "model-00003-of-00003.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-4B/resolve/main/model-00003-of-00003.safetensors?download=true"
        }
      ]
    },
    {
      "repo": "Qwen/Qwen3-8B",
      "bRating": "8B",
      "parameters": "8B",
      "size": "15.3 GB",
      "files": [
        {
          "label": "model-00001-of-00005.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-8B/resolve/main/model-00001-of-00005.safetensors?download=true"
        },
        {
          "label": "model-00002-of-00005.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-8B/resolve/main/model-00002-of-00005.safetensors?download=true"
        },
        {
          "label": "model-00003-of-00005.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-8B/resolve/main/model-00003-of-00005.safetensors?download=true"
        },
        {
          "label": "model-00004-of-00005.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-8B/resolve/main/model-00004-of-00005.safetensors?download=true"
        },
        {
          "label": "model-00005-of-00005.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-8B/resolve/main/model-00005-of-00005.safetensors?download=true"
        }
      ]
    },
    {
      "repo": "Qwen/Qwen3-14B",
      "bRating": "14B",
      "parameters": "14B",
      "size": "27.5 GB",
      "files": [
        {
          "label": "model-00001-of-00008.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-14B/resolve/main/model-00001-of-00008.safetensors?download=true"
        },
        {
          "label": "model-00002-of-00008.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-14B/resolve/main/model-00002-of-00008.safetensors?download=true"
        },
        {
          "label": "model-00003-of-00008.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-14B/resolve/main/model-00003-of-00008.safetensors?download=true"
        },
        {
          "label": "model-00004-of-00008.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-14B/resolve/main/model-00004-of-00008.safetensors?download=true"
        },
        {
          "label": "model-00005-of-00008.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-14B/resolve/main/model-00005-of-00008.safetensors?download=true"
        },
        {
          "label": "model-00006-of-00008.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-14B/resolve/main/model-00006-of-00008.safetensors?download=true"
        },
        {
          "label": "model-00007-of-00008.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-14B/resolve/main/model-00007-of-00008.safetensors?download=true"
        },
        {
          "label": "model-00008-of-00008.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-14B/resolve/main/model-00008-of-00008.safetensors?download=true"
        }
      ]
    },
    {
      "repo": "Qwen/Qwen3-32B",
      "bRating": "32B",
      "parameters": "32B",
      "size": "61.0 GB",
      "files": [
        {
          "label": "model-00001-of-00017.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-32B/resolve/main/model-00001-of-00017.safetensors?download=true"
        },
        {
          "label": "model-00002-of-00017.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-32B/resolve/main/model-00002-of-00017.safetensors?download=true"
        },
        {
          "label": "model-00003-of-00017.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-32B/resolve/main/model-00003-of-00017.safetensors?download=true"
        },
        {
          "label": "model-00004-of-00017.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-32B/resolve/main/model-00004-of-00017.safetensors?download=true"
        },
        {
          "label": "model-00005-of-00017.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-32B/resolve/main/model-00005-of-00017.safetensors?download=true"
        },
        {
          "label": "model-00006-of-00017.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-32B/resolve/main/model-00006-of-00017.safetensors?download=true"
        },
        {
          "label": "model-00007-of-00017.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-32B/resolve/main/model-00007-of-00017.safetensors?download=true"
        },
        {
          "label": "model-00008-of-00017.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-32B/resolve/main/model-00008-of-00017.safetensors?download=true"
        },
        {
          "label": "model-00009-of-00017.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-32B/resolve/main/model-00009-of-00017.safetensors?download=true"
        },
        {
          "label": "model-00010-of-00017.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-32B/resolve/main/model-00010-of-00017.safetensors?download=true"
        },
        {
          "label": "model-00011-of-00017.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-32B/resolve/main/model-00011-of-00017.safetensors?download=true"
        },
        {
          "label": "model-00012-of-00017.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-32B/resolve/main/model-00012-of-00017.safetensors?download=true"
        },
        {
          "label": "model-00013-of-00017.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-32B/resolve/main/model-00013-of-00017.safetensors?download=true"
        },
        {
          "label": "model-00014-of-00017.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-32B/resolve/main/model-00014-of-00017.safetensors?download=true"
        },
        {
          "label": "model-00015-of-00017.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-32B/resolve/main/model-00015-of-00017.safetensors?download=true"
        },
        {
          "label": "model-00016-of-00017.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-32B/resolve/main/model-00016-of-00017.safetensors?download=true"
        },
        {
          "label": "model-00017-of-00017.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-32B/resolve/main/model-00017-of-00017.safetensors?download=true"
        }
      ]
    },
    {
      "repo": "Qwen/Qwen3-30B-A3B",
      "bRating": "30B",
      "parameters": "30B",
      "size": "56.9 GB",
      "files": [
        {
          "label": "model-00001-of-00016.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-30B-A3B/resolve/main/model-00001-of-00016.safetensors?download=true"
        },
        {
          "label": "model-00002-of-00016.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-30B-A3B/resolve/main/model-00002-of-00016.safetensors?download=true"
        },
        {
          "label": "model-00003-of-00016.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-30B-A3B/resolve/main/model-00003-of-00016.safetensors?download=true"
        },
        {
          "label": "model-00004-of-00016.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-30B-A3B/resolve/main/model-00004-of-00016.safetensors?download=true"
        },
        {
          "label": "model-00005-of-00016.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-30B-A3B/resolve/main/model-00005-of-00016.safetensors?download=true"
        },
        {
          "label": "model-00006-of-00016.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-30B-A3B/resolve/main/model-00006-of-00016.safetensors?download=true"
        },
        {
          "label": "model-00007-of-00016.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-30B-A3B/resolve/main/model-00007-of-00016.safetensors?download=true"
        },
        {
          "label": "model-00008-of-00016.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-30B-A3B/resolve/main/model-00008-of-00016.safetensors?download=true"
        },
        {
          "label": "model-00009-of-00016.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-30B-A3B/resolve/main/model-00009-of-00016.safetensors?download=true"
        },
        {
          "label": "model-00010-of-00016.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-30B-A3B/resolve/main/model-00010-of-00016.safetensors?download=true"
        },
        {
          "label": "model-00011-of-00016.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-30B-A3B/resolve/main/model-00011-of-00016.safetensors?download=true"
        },
        {
          "label": "model-00012-of-00016.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-30B-A3B/resolve/main/model-00012-of-00016.safetensors?download=true"
        },
        {
          "label": "model-00013-of-00016.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-30B-A3B/resolve/main/model-00013-of-00016.safetensors?download=true"
        },
        {
          "label": "model-00014-of-00016.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-30B-A3B/resolve/main/model-00014-of-00016.safetensors?download=true"
        },
        {
          "label": "model-00015-of-00016.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-30B-A3B/resolve/main/model-00015-of-00016.safetensors?download=true"
        },
        {
          "label": "model-00016-of-00016.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-30B-A3B/resolve/main/model-00016-of-00016.safetensors?download=true"
        }
      ]
    },
    {
      "repo": "Qwen/Qwen3-235B-A22B",
      "bRating": "235B",
      "parameters": "235B",
      "size": "437.9 GB",
      "files": [
        {
          "label": "model-00001-of-00118.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-235B-A22B/resolve/main/model-00001-of-00118.safetensors?download=true"
        },
        {
          "label": "model-00002-of-00118.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-235B-A22B/resolve/main/model-00002-of-00118.safetensors?download=true"
        },
        {
          "label": "model-00003-of-00118.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-235B-A22B/resolve/main/model-00003-of-00118.safetensors?download=true"
        },
        {
          "label": "model-00004-of-00118.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-235B-A22B/resolve/main/model-00004-of-00118.safetensors?download=true"
        },
        {
          "label": "model-00005-of-00118.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-235B-A22B/resolve/main/model-00005-of-00118.safetensors?download=true"
        },
        {
          "label": "model-00006-of-00118.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-235B-A22B/resolve/main/model-00006-of-00118.safetensors?download=true"
        },
        {
          "label": "model-00007-of-00118.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-235B-A22B/resolve/main/model-00007-of-00118.safetensors?download=true"
        },
        {
          "label": "model-00008-of-00118.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-235B-A22B/resolve/main/model-00008-of-00118.safetensors?download=true"
        },
        {
          "label": "model-00009-of-00118.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-235B-A22B/resolve/main/model-00009-of-00118.safetensors?download=true"
        },
        {
          "label": "model-00010-of-00118.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-235B-A22B/resolve/main/model-00010-of-00118.safetensors?download=true"
        },
        {
          "label": "model-00011-of-00118.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-235B-A22B/resolve/main/model-00011-of-00118.safetensors?download=true"
        },
        {
          "label": "model-00012-of-00118.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-235B-A22B/resolve/main/model-00012-of-00118.safetensors?download=true"
        },
        {
          "label": "model-00013-of-00118.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-235B-A22B/resolve/main/model-00013-of-00118.safetensors?download=true"
        },
        {
          "label": "model-00014-of-00118.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-235B-A22B/resolve/main/model-00014-of-00118.safetensors?download=true"
        },
        {
          "label": "model-00015-of-00118.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-235B-A22B/resolve/main/model-00015-of-00118.safetensors?download=true"
        },
        {
          "label": "model-00016-of-00118.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-235B-A22B/resolve/main/model-00016-of-00118.safetensors?download=true"
        },
        {
          "label": "model-00017-of-00118.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-235B-A22B/resolve/main/model-00017-of-00118.safetensors?download=true"
        },
        {
          "label": "model-00018-of-00118.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-235B-A22B/resolve/main/model-00018-of-00118.safetensors?download=true"
        },
        {
          "label": "model-00019-of-00118.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-235B-A22B/resolve/main/model-00019-of-00118.safetensors?download=true"
        },
        {
          "label": "model-00020-of-00118.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-235B-A22B/resolve/main/model-00020-of-00118.safetensors?download=true"
        },
        {
          "label": "model-00021-of-00118.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-235B-A22B/resolve/main/model-00021-of-00118.safetensors?download=true"
        },
        {
          "label": "model-00022-of-00118.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-235B-A22B/resolve/main/model-00022-of-00118.safetensors?download=true"
        },
        {
          "label": "model-00023-of-00118.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-235B-A22B/resolve/main/model-00023-of-00118.safetensors?download=true"
        },
        {
          "label": "model-00024-of-00118.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-235B-A22B/resolve/main/model-00024-of-00118.safetensors?download=true"
        },
        {
          "label": "model-00025-of-00118.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-235B-A22B/resolve/main/model-00025-of-00118.safetensors?download=true"
        },
        {
          "label": "model-00026-of-00118.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-235B-A22B/resolve/main/model-00026-of-00118.safetensors?download=true"
        },
        {
          "label": "model-00027-of-00118.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-235B-A22B/resolve/main/model-00027-of-00118.safetensors?download=true"
        },
        {
          "label": "model-00028-of-00118.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-235B-A22B/resolve/main/model-00028-of-00118.safetensors?download=true"
        },
        {
          "label": "model-00029-of-00118.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-235B-A22B/resolve/main/model-00029-of-00118.safetensors?download=true"
        },
        {
          "label": "model-00030-of-00118.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-235B-A22B/resolve/main/model-00030-of-00118.safetensors?download=true"
        },
        {
          "label": "model-00031-of-00118.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-235B-A22B/resolve/main/model-00031-of-00118.safetensors?download=true"
        },
        {
          "label": "model-00032-of-00118.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-235B-A22B/resolve/main/model-00032-of-00118.safetensors?download=true"
        },
        {
          "label": "model-00033-of-00118.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-235B-A22B/resolve/main/model-00033-of-00118.safetensors?download=true"
        },
        {
          "label": "model-00034-of-00118.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-235B-A22B/resolve/main/model-00034-of-00118.safetensors?download=true"
        },
        {
          "label": "model-00035-of-00118.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-235B-A22B/resolve/main/model-00035-of-00118.safetensors?download=true"
        },
        {
          "label": "model-00036-of-00118.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-235B-A22B/resolve/main/model-00036-of-00118.safetensors?download=true"
        },
        {
          "label": "model-00037-of-00118.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-235B-A22B/resolve/main/model-00037-of-00118.safetensors?download=true"
        },
        {
          "label": "model-00038-of-00118.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-235B-A22B/resolve/main/model-00038-of-00118.safetensors?download=true"
        },
        {
          "label": "model-00039-of-00118.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-235B-A22B/resolve/main/model-00039-of-00118.safetensors?download=true"
        },
        {
          "label": "model-00040-of-00118.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-235B-A22B/resolve/main/model-00040-of-00118.safetensors?download=true"
        },
        {
          "label": "model-00041-of-00118.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-235B-A22B/resolve/main/model-00041-of-00118.safetensors?download=true"
        },
        {
          "label": "model-00042-of-00118.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-235B-A22B/resolve/main/model-00042-of-00118.safetensors?download=true"
        },
        {
          "label": "model-00043-of-00118.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-235B-A22B/resolve/main/model-00043-of-00118.safetensors?download=true"
        },
        {
          "label": "model-00044-of-00118.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-235B-A22B/resolve/main/model-00044-of-00118.safetensors?download=true"
        },
        {
          "label": "model-00045-of-00118.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-235B-A22B/resolve/main/model-00045-of-00118.safetensors?download=true"
        },
        {
          "label": "model-00046-of-00118.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-235B-A22B/resolve/main/model-00046-of-00118.safetensors?download=true"
        },
        {
          "label": "model-00047-of-00118.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-235B-A22B/resolve/main/model-00047-of-00118.safetensors?download=true"
        },
        {
          "label": "model-00048-of-00118.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-235B-A22B/resolve/main/model-00048-of-00118.safetensors?download=true"
        },
        {
          "label": "model-00049-of-00118.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-235B-A22B/resolve/main/model-00049-of-00118.safetensors?download=true"
        },
        {
          "label": "model-00050-of-00118.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-235B-A22B/resolve/main/model-00050-of-00118.safetensors?download=true"
        },
        {
          "label": "model-00051-of-00118.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-235B-A22B/resolve/main/model-00051-of-00118.safetensors?download=true"
        },
        {
          "label": "model-00052-of-00118.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-235B-A22B/resolve/main/model-00052-of-00118.safetensors?download=true"
        },
        {
          "label": "model-00053-of-00118.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-235B-A22B/resolve/main/model-00053-of-00118.safetensors?download=true"
        },
        {
          "label": "model-00054-of-00118.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-235B-A22B/resolve/main/model-00054-of-00118.safetensors?download=true"
        },
        {
          "label": "model-00055-of-00118.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-235B-A22B/resolve/main/model-00055-of-00118.safetensors?download=true"
        },
        {
          "label": "model-00056-of-00118.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-235B-A22B/resolve/main/model-00056-of-00118.safetensors?download=true"
        },
        {
          "label": "model-00057-of-00118.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-235B-A22B/resolve/main/model-00057-of-00118.safetensors?download=true"
        },
        {
          "label": "model-00058-of-00118.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-235B-A22B/resolve/main/model-00058-of-00118.safetensors?download=true"
        },
        {
          "label": "model-00059-of-00118.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-235B-A22B/resolve/main/model-00059-of-00118.safetensors?download=true"
        },
        {
          "label": "model-00060-of-00118.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-235B-A22B/resolve/main/model-00060-of-00118.safetensors?download=true"
        },
        {
          "label": "model-00061-of-00118.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-235B-A22B/resolve/main/model-00061-of-00118.safetensors?download=true"
        },
        {
          "label": "model-00062-of-00118.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-235B-A22B/resolve/main/model-00062-of-00118.safetensors?download=true"
        },
        {
          "label": "model-00063-of-00118.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-235B-A22B/resolve/main/model-00063-of-00118.safetensors?download=true"
        },
        {
          "label": "model-00064-of-00118.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-235B-A22B/resolve/main/model-00064-of-00118.safetensors?download=true"
        },
        {
          "label": "model-00065-of-00118.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-235B-A22B/resolve/main/model-00065-of-00118.safetensors?download=true"
        },
        {
          "label": "model-00066-of-00118.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-235B-A22B/resolve/main/model-00066-of-00118.safetensors?download=true"
        },
        {
          "label": "model-00067-of-00118.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-235B-A22B/resolve/main/model-00067-of-00118.safetensors?download=true"
        },
        {
          "label": "model-00068-of-00118.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-235B-A22B/resolve/main/model-00068-of-00118.safetensors?download=true"
        },
        {
          "label": "model-00069-of-00118.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-235B-A22B/resolve/main/model-00069-of-00118.safetensors?download=true"
        },
        {
          "label": "model-00070-of-00118.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-235B-A22B/resolve/main/model-00070-of-00118.safetensors?download=true"
        },
        {
          "label": "model-00071-of-00118.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-235B-A22B/resolve/main/model-00071-of-00118.safetensors?download=true"
        },
        {
          "label": "model-00072-of-00118.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-235B-A22B/resolve/main/model-00072-of-00118.safetensors?download=true"
        },
        {
          "label": "model-00073-of-00118.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-235B-A22B/resolve/main/model-00073-of-00118.safetensors?download=true"
        },
        {
          "label": "model-00074-of-00118.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-235B-A22B/resolve/main/model-00074-of-00118.safetensors?download=true"
        },
        {
          "label": "model-00075-of-00118.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-235B-A22B/resolve/main/model-00075-of-00118.safetensors?download=true"
        },
        {
          "label": "model-00076-of-00118.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-235B-A22B/resolve/main/model-00076-of-00118.safetensors?download=true"
        },
        {
          "label": "model-00077-of-00118.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-235B-A22B/resolve/main/model-00077-of-00118.safetensors?download=true"
        },
        {
          "label": "model-00078-of-00118.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-235B-A22B/resolve/main/model-00078-of-00118.safetensors?download=true"
        },
        {
          "label": "model-00079-of-00118.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-235B-A22B/resolve/main/model-00079-of-00118.safetensors?download=true"
        },
        {
          "label": "model-00080-of-00118.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-235B-A22B/resolve/main/model-00080-of-00118.safetensors?download=true"
        },
        {
          "label": "model-00081-of-00118.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-235B-A22B/resolve/main/model-00081-of-00118.safetensors?download=true"
        },
        {
          "label": "model-00082-of-00118.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-235B-A22B/resolve/main/model-00082-of-00118.safetensors?download=true"
        },
        {
          "label": "model-00083-of-00118.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-235B-A22B/resolve/main/model-00083-of-00118.safetensors?download=true"
        },
        {
          "label": "model-00084-of-00118.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-235B-A22B/resolve/main/model-00084-of-00118.safetensors?download=true"
        },
        {
          "label": "model-00085-of-00118.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-235B-A22B/resolve/main/model-00085-of-00118.safetensors?download=true"
        },
        {
          "label": "model-00086-of-00118.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-235B-A22B/resolve/main/model-00086-of-00118.safetensors?download=true"
        },
        {
          "label": "model-00087-of-00118.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-235B-A22B/resolve/main/model-00087-of-00118.safetensors?download=true"
        },
        {
          "label": "model-00088-of-00118.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-235B-A22B/resolve/main/model-00088-of-00118.safetensors?download=true"
        },
        {
          "label": "model-00089-of-00118.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-235B-A22B/resolve/main/model-00089-of-00118.safetensors?download=true"
        },
        {
          "label": "model-00090-of-00118.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-235B-A22B/resolve/main/model-00090-of-00118.safetensors?download=true"
        },
        {
          "label": "model-00091-of-00118.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-235B-A22B/resolve/main/model-00091-of-00118.safetensors?download=true"
        },
        {
          "label": "model-00092-of-00118.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-235B-A22B/resolve/main/model-00092-of-00118.safetensors?download=true"
        },
        {
          "label": "model-00093-of-00118.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-235B-A22B/resolve/main/model-00093-of-00118.safetensors?download=true"
        },
        {
          "label": "model-00094-of-00118.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-235B-A22B/resolve/main/model-00094-of-00118.safetensors?download=true"
        },
        {
          "label": "model-00095-of-00118.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-235B-A22B/resolve/main/model-00095-of-00118.safetensors?download=true"
        },
        {
          "label": "model-00096-of-00118.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-235B-A22B/resolve/main/model-00096-of-00118.safetensors?download=true"
        },
        {
          "label": "model-00097-of-00118.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-235B-A22B/resolve/main/model-00097-of-00118.safetensors?download=true"
        },
        {
          "label": "model-00098-of-00118.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-235B-A22B/resolve/main/model-00098-of-00118.safetensors?download=true"
        },
        {
          "label": "model-00099-of-00118.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-235B-A22B/resolve/main/model-00099-of-00118.safetensors?download=true"
        },
        {
          "label": "model-00100-of-00118.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-235B-A22B/resolve/main/model-00100-of-00118.safetensors?download=true"
        },
        {
          "label": "model-00101-of-00118.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-235B-A22B/resolve/main/model-00101-of-00118.safetensors?download=true"
        },
        {
          "label": "model-00102-of-00118.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-235B-A22B/resolve/main/model-00102-of-00118.safetensors?download=true"
        },
        {
          "label": "model-00103-of-00118.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-235B-A22B/resolve/main/model-00103-of-00118.safetensors?download=true"
        },
        {
          "label": "model-00104-of-00118.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-235B-A22B/resolve/main/model-00104-of-00118.safetensors?download=true"
        },
        {
          "label": "model-00105-of-00118.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-235B-A22B/resolve/main/model-00105-of-00118.safetensors?download=true"
        },
        {
          "label": "model-00106-of-00118.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-235B-A22B/resolve/main/model-00106-of-00118.safetensors?download=true"
        },
        {
          "label": "model-00107-of-00118.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-235B-A22B/resolve/main/model-00107-of-00118.safetensors?download=true"
        },
        {
          "label": "model-00108-of-00118.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-235B-A22B/resolve/main/model-00108-of-00118.safetensors?download=true"
        },
        {
          "label": "model-00109-of-00118.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-235B-A22B/resolve/main/model-00109-of-00118.safetensors?download=true"
        },
        {
          "label": "model-00110-of-00118.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-235B-A22B/resolve/main/model-00110-of-00118.safetensors?download=true"
        },
        {
          "label": "model-00111-of-00118.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-235B-A22B/resolve/main/model-00111-of-00118.safetensors?download=true"
        },
        {
          "label": "model-00112-of-00118.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-235B-A22B/resolve/main/model-00112-of-00118.safetensors?download=true"
        },
        {
          "label": "model-00113-of-00118.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-235B-A22B/resolve/main/model-00113-of-00118.safetensors?download=true"
        },
        {
          "label": "model-00114-of-00118.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-235B-A22B/resolve/main/model-00114-of-00118.safetensors?download=true"
        },
        {
          "label": "model-00115-of-00118.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-235B-A22B/resolve/main/model-00115-of-00118.safetensors?download=true"
        },
        {
          "label": "model-00116-of-00118.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-235B-A22B/resolve/main/model-00116-of-00118.safetensors?download=true"
        },
        {
          "label": "model-00117-of-00118.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-235B-A22B/resolve/main/model-00117-of-00118.safetensors?download=true"
        },
        {
          "label": "model-00118-of-00118.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-235B-A22B/resolve/main/model-00118-of-00118.safetensors?download=true"
        }
      ]
    },
    {
      "repo": "Qwen/Qwen3-Coder-30B-A3B-Instruct",
      "bRating": "30B",
      "parameters": "30B",
      "size": "56.9 GB",
      "files": [
        {
          "label": "model-00001-of-00016.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-Coder-30B-A3B-Instruct/resolve/main/model-00001-of-00016.safetensors?download=true"
        },
        {
          "label": "model-00002-of-00016.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-Coder-30B-A3B-Instruct/resolve/main/model-00002-of-00016.safetensors?download=true"
        },
        {
          "label": "model-00003-of-00016.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-Coder-30B-A3B-Instruct/resolve/main/model-00003-of-00016.safetensors?download=true"
        },
        {
          "label": "model-00004-of-00016.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-Coder-30B-A3B-Instruct/resolve/main/model-00004-of-00016.safetensors?download=true"
        },
        {
          "label": "model-00005-of-00016.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-Coder-30B-A3B-Instruct/resolve/main/model-00005-of-00016.safetensors?download=true"
        },
        {
          "label": "model-00006-of-00016.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-Coder-30B-A3B-Instruct/resolve/main/model-00006-of-00016.safetensors?download=true"
        },
        {
          "label": "model-00007-of-00016.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-Coder-30B-A3B-Instruct/resolve/main/model-00007-of-00016.safetensors?download=true"
        },
        {
          "label": "model-00008-of-00016.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-Coder-30B-A3B-Instruct/resolve/main/model-00008-of-00016.safetensors?download=true"
        },
        {
          "label": "model-00009-of-00016.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-Coder-30B-A3B-Instruct/resolve/main/model-00009-of-00016.safetensors?download=true"
        },
        {
          "label": "model-00010-of-00016.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-Coder-30B-A3B-Instruct/resolve/main/model-00010-of-00016.safetensors?download=true"
        },
        {
          "label": "model-00011-of-00016.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-Coder-30B-A3B-Instruct/resolve/main/model-00011-of-00016.safetensors?download=true"
        },
        {
          "label": "model-00012-of-00016.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-Coder-30B-A3B-Instruct/resolve/main/model-00012-of-00016.safetensors?download=true"
        },
        {
          "label": "model-00013-of-00016.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-Coder-30B-A3B-Instruct/resolve/main/model-00013-of-00016.safetensors?download=true"
        },
        {
          "label": "model-00014-of-00016.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-Coder-30B-A3B-Instruct/resolve/main/model-00014-of-00016.safetensors?download=true"
        },
        {
          "label": "model-00015-of-00016.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-Coder-30B-A3B-Instruct/resolve/main/model-00015-of-00016.safetensors?download=true"
        },
        {
          "label": "model-00016-of-00016.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-Coder-30B-A3B-Instruct/resolve/main/model-00016-of-00016.safetensors?download=true"
        }
      ]
    },
    {
      "repo": "Qwen/Qwen3-Coder-480B-A35B-Instruct",
      "bRating": "480B",
      "parameters": "480B",
      "size": "894.4 GB",
      "files": [
        {
          "label": "model-00001-of-00241.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-Coder-480B-A35B-Instruct/resolve/main/model-00001-of-00241.safetensors?download=true"
        },
        {
          "label": "model-00002-of-00241.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-Coder-480B-A35B-Instruct/resolve/main/model-00002-of-00241.safetensors?download=true"
        },
        {
          "label": "model-00003-of-00241.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-Coder-480B-A35B-Instruct/resolve/main/model-00003-of-00241.safetensors?download=true"
        },
        {
          "label": "model-00004-of-00241.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-Coder-480B-A35B-Instruct/resolve/main/model-00004-of-00241.safetensors?download=true"
        },
        {
          "label": "model-00005-of-00241.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-Coder-480B-A35B-Instruct/resolve/main/model-00005-of-00241.safetensors?download=true"
        },
        {
          "label": "model-00006-of-00241.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-Coder-480B-A35B-Instruct/resolve/main/model-00006-of-00241.safetensors?download=true"
        },
        {
          "label": "model-00007-of-00241.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-Coder-480B-A35B-Instruct/resolve/main/model-00007-of-00241.safetensors?download=true"
        },
        {
          "label": "model-00008-of-00241.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-Coder-480B-A35B-Instruct/resolve/main/model-00008-of-00241.safetensors?download=true"
        },
        {
          "label": "model-00009-of-00241.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-Coder-480B-A35B-Instruct/resolve/main/model-00009-of-00241.safetensors?download=true"
        },
        {
          "label": "model-00010-of-00241.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-Coder-480B-A35B-Instruct/resolve/main/model-00010-of-00241.safetensors?download=true"
        },
        {
          "label": "model-00011-of-00241.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-Coder-480B-A35B-Instruct/resolve/main/model-00011-of-00241.safetensors?download=true"
        },
        {
          "label": "model-00012-of-00241.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-Coder-480B-A35B-Instruct/resolve/main/model-00012-of-00241.safetensors?download=true"
        },
        {
          "label": "model-00013-of-00241.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-Coder-480B-A35B-Instruct/resolve/main/model-00013-of-00241.safetensors?download=true"
        },
        {
          "label": "model-00014-of-00241.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-Coder-480B-A35B-Instruct/resolve/main/model-00014-of-00241.safetensors?download=true"
        },
        {
          "label": "model-00015-of-00241.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-Coder-480B-A35B-Instruct/resolve/main/model-00015-of-00241.safetensors?download=true"
        },
        {
          "label": "model-00016-of-00241.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-Coder-480B-A35B-Instruct/resolve/main/model-00016-of-00241.safetensors?download=true"
        },
        {
          "label": "model-00017-of-00241.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-Coder-480B-A35B-Instruct/resolve/main/model-00017-of-00241.safetensors?download=true"
        },
        {
          "label": "model-00018-of-00241.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-Coder-480B-A35B-Instruct/resolve/main/model-00018-of-00241.safetensors?download=true"
        },
        {
          "label": "model-00019-of-00241.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-Coder-480B-A35B-Instruct/resolve/main/model-00019-of-00241.safetensors?download=true"
        },
        {
          "label": "model-00020-of-00241.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-Coder-480B-A35B-Instruct/resolve/main/model-00020-of-00241.safetensors?download=true"
        },
        {
          "label": "model-00021-of-00241.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-Coder-480B-A35B-Instruct/resolve/main/model-00021-of-00241.safetensors?download=true"
        },
        {
          "label": "model-00022-of-00241.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-Coder-480B-A35B-Instruct/resolve/main/model-00022-of-00241.safetensors?download=true"
        },
        {
          "label": "model-00023-of-00241.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-Coder-480B-A35B-Instruct/resolve/main/model-00023-of-00241.safetensors?download=true"
        },
        {
          "label": "model-00024-of-00241.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-Coder-480B-A35B-Instruct/resolve/main/model-00024-of-00241.safetensors?download=true"
        },
        {
          "label": "model-00025-of-00241.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-Coder-480B-A35B-Instruct/resolve/main/model-00025-of-00241.safetensors?download=true"
        },
        {
          "label": "model-00026-of-00241.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-Coder-480B-A35B-Instruct/resolve/main/model-00026-of-00241.safetensors?download=true"
        },
        {
          "label": "model-00027-of-00241.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-Coder-480B-A35B-Instruct/resolve/main/model-00027-of-00241.safetensors?download=true"
        },
        {
          "label": "model-00028-of-00241.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-Coder-480B-A35B-Instruct/resolve/main/model-00028-of-00241.safetensors?download=true"
        },
        {
          "label": "model-00029-of-00241.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-Coder-480B-A35B-Instruct/resolve/main/model-00029-of-00241.safetensors?download=true"
        },
        {
          "label": "model-00030-of-00241.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-Coder-480B-A35B-Instruct/resolve/main/model-00030-of-00241.safetensors?download=true"
        },
        {
          "label": "model-00031-of-00241.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-Coder-480B-A35B-Instruct/resolve/main/model-00031-of-00241.safetensors?download=true"
        },
        {
          "label": "model-00032-of-00241.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-Coder-480B-A35B-Instruct/resolve/main/model-00032-of-00241.safetensors?download=true"
        },
        {
          "label": "model-00033-of-00241.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-Coder-480B-A35B-Instruct/resolve/main/model-00033-of-00241.safetensors?download=true"
        },
        {
          "label": "model-00034-of-00241.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-Coder-480B-A35B-Instruct/resolve/main/model-00034-of-00241.safetensors?download=true"
        },
        {
          "label": "model-00035-of-00241.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-Coder-480B-A35B-Instruct/resolve/main/model-00035-of-00241.safetensors?download=true"
        },
        {
          "label": "model-00036-of-00241.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-Coder-480B-A35B-Instruct/resolve/main/model-00036-of-00241.safetensors?download=true"
        },
        {
          "label": "model-00037-of-00241.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-Coder-480B-A35B-Instruct/resolve/main/model-00037-of-00241.safetensors?download=true"
        },
        {
          "label": "model-00038-of-00241.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-Coder-480B-A35B-Instruct/resolve/main/model-00038-of-00241.safetensors?download=true"
        },
        {
          "label": "model-00039-of-00241.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-Coder-480B-A35B-Instruct/resolve/main/model-00039-of-00241.safetensors?download=true"
        },
        {
          "label": "model-00040-of-00241.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-Coder-480B-A35B-Instruct/resolve/main/model-00040-of-00241.safetensors?download=true"
        },
        {
          "label": "model-00041-of-00241.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-Coder-480B-A35B-Instruct/resolve/main/model-00041-of-00241.safetensors?download=true"
        },
        {
          "label": "model-00042-of-00241.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-Coder-480B-A35B-Instruct/resolve/main/model-00042-of-00241.safetensors?download=true"
        },
        {
          "label": "model-00043-of-00241.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-Coder-480B-A35B-Instruct/resolve/main/model-00043-of-00241.safetensors?download=true"
        },
        {
          "label": "model-00044-of-00241.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-Coder-480B-A35B-Instruct/resolve/main/model-00044-of-00241.safetensors?download=true"
        },
        {
          "label": "model-00045-of-00241.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-Coder-480B-A35B-Instruct/resolve/main/model-00045-of-00241.safetensors?download=true"
        },
        {
          "label": "model-00046-of-00241.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-Coder-480B-A35B-Instruct/resolve/main/model-00046-of-00241.safetensors?download=true"
        },
        {
          "label": "model-00047-of-00241.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-Coder-480B-A35B-Instruct/resolve/main/model-00047-of-00241.safetensors?download=true"
        },
        {
          "label": "model-00048-of-00241.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-Coder-480B-A35B-Instruct/resolve/main/model-00048-of-00241.safetensors?download=true"
        },
        {
          "label": "model-00049-of-00241.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-Coder-480B-A35B-Instruct/resolve/main/model-00049-of-00241.safetensors?download=true"
        },
        {
          "label": "model-00050-of-00241.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-Coder-480B-A35B-Instruct/resolve/main/model-00050-of-00241.safetensors?download=true"
        },
        {
          "label": "model-00051-of-00241.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-Coder-480B-A35B-Instruct/resolve/main/model-00051-of-00241.safetensors?download=true"
        },
        {
          "label": "model-00052-of-00241.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-Coder-480B-A35B-Instruct/resolve/main/model-00052-of-00241.safetensors?download=true"
        },
        {
          "label": "model-00053-of-00241.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-Coder-480B-A35B-Instruct/resolve/main/model-00053-of-00241.safetensors?download=true"
        },
        {
          "label": "model-00054-of-00241.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-Coder-480B-A35B-Instruct/resolve/main/model-00054-of-00241.safetensors?download=true"
        },
        {
          "label": "model-00055-of-00241.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-Coder-480B-A35B-Instruct/resolve/main/model-00055-of-00241.safetensors?download=true"
        },
        {
          "label": "model-00056-of-00241.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-Coder-480B-A35B-Instruct/resolve/main/model-00056-of-00241.safetensors?download=true"
        },
        {
          "label": "model-00057-of-00241.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-Coder-480B-A35B-Instruct/resolve/main/model-00057-of-00241.safetensors?download=true"
        },
        {
          "label": "model-00058-of-00241.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-Coder-480B-A35B-Instruct/resolve/main/model-00058-of-00241.safetensors?download=true"
        },
        {
          "label": "model-00059-of-00241.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-Coder-480B-A35B-Instruct/resolve/main/model-00059-of-00241.safetensors?download=true"
        },
        {
          "label": "model-00060-of-00241.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-Coder-480B-A35B-Instruct/resolve/main/model-00060-of-00241.safetensors?download=true"
        },
        {
          "label": "model-00061-of-00241.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-Coder-480B-A35B-Instruct/resolve/main/model-00061-of-00241.safetensors?download=true"
        },
        {
          "label": "model-00062-of-00241.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-Coder-480B-A35B-Instruct/resolve/main/model-00062-of-00241.safetensors?download=true"
        },
        {
          "label": "model-00063-of-00241.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-Coder-480B-A35B-Instruct/resolve/main/model-00063-of-00241.safetensors?download=true"
        },
        {
          "label": "model-00064-of-00241.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-Coder-480B-A35B-Instruct/resolve/main/model-00064-of-00241.safetensors?download=true"
        },
        {
          "label": "model-00065-of-00241.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-Coder-480B-A35B-Instruct/resolve/main/model-00065-of-00241.safetensors?download=true"
        },
        {
          "label": "model-00066-of-00241.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-Coder-480B-A35B-Instruct/resolve/main/model-00066-of-00241.safetensors?download=true"
        },
        {
          "label": "model-00067-of-00241.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-Coder-480B-A35B-Instruct/resolve/main/model-00067-of-00241.safetensors?download=true"
        },
        {
          "label": "model-00068-of-00241.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-Coder-480B-A35B-Instruct/resolve/main/model-00068-of-00241.safetensors?download=true"
        },
        {
          "label": "model-00069-of-00241.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-Coder-480B-A35B-Instruct/resolve/main/model-00069-of-00241.safetensors?download=true"
        },
        {
          "label": "model-00070-of-00241.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-Coder-480B-A35B-Instruct/resolve/main/model-00070-of-00241.safetensors?download=true"
        },
        {
          "label": "model-00071-of-00241.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-Coder-480B-A35B-Instruct/resolve/main/model-00071-of-00241.safetensors?download=true"
        },
        {
          "label": "model-00072-of-00241.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-Coder-480B-A35B-Instruct/resolve/main/model-00072-of-00241.safetensors?download=true"
        },
        {
          "label": "model-00073-of-00241.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-Coder-480B-A35B-Instruct/resolve/main/model-00073-of-00241.safetensors?download=true"
        },
        {
          "label": "model-00074-of-00241.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-Coder-480B-A35B-Instruct/resolve/main/model-00074-of-00241.safetensors?download=true"
        },
        {
          "label": "model-00075-of-00241.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-Coder-480B-A35B-Instruct/resolve/main/model-00075-of-00241.safetensors?download=true"
        },
        {
          "label": "model-00076-of-00241.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-Coder-480B-A35B-Instruct/resolve/main/model-00076-of-00241.safetensors?download=true"
        },
        {
          "label": "model-00077-of-00241.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-Coder-480B-A35B-Instruct/resolve/main/model-00077-of-00241.safetensors?download=true"
        },
        {
          "label": "model-00078-of-00241.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-Coder-480B-A35B-Instruct/resolve/main/model-00078-of-00241.safetensors?download=true"
        },
        {
          "label": "model-00079-of-00241.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-Coder-480B-A35B-Instruct/resolve/main/model-00079-of-00241.safetensors?download=true"
        },
        {
          "label": "model-00080-of-00241.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-Coder-480B-A35B-Instruct/resolve/main/model-00080-of-00241.safetensors?download=true"
        },
        {
          "label": "model-00081-of-00241.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-Coder-480B-A35B-Instruct/resolve/main/model-00081-of-00241.safetensors?download=true"
        },
        {
          "label": "model-00082-of-00241.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-Coder-480B-A35B-Instruct/resolve/main/model-00082-of-00241.safetensors?download=true"
        },
        {
          "label": "model-00083-of-00241.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-Coder-480B-A35B-Instruct/resolve/main/model-00083-of-00241.safetensors?download=true"
        },
        {
          "label": "model-00084-of-00241.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-Coder-480B-A35B-Instruct/resolve/main/model-00084-of-00241.safetensors?download=true"
        },
        {
          "label": "model-00085-of-00241.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-Coder-480B-A35B-Instruct/resolve/main/model-00085-of-00241.safetensors?download=true"
        },
        {
          "label": "model-00086-of-00241.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-Coder-480B-A35B-Instruct/resolve/main/model-00086-of-00241.safetensors?download=true"
        },
        {
          "label": "model-00087-of-00241.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-Coder-480B-A35B-Instruct/resolve/main/model-00087-of-00241.safetensors?download=true"
        },
        {
          "label": "model-00088-of-00241.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-Coder-480B-A35B-Instruct/resolve/main/model-00088-of-00241.safetensors?download=true"
        },
        {
          "label": "model-00089-of-00241.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-Coder-480B-A35B-Instruct/resolve/main/model-00089-of-00241.safetensors?download=true"
        },
        {
          "label": "model-00090-of-00241.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-Coder-480B-A35B-Instruct/resolve/main/model-00090-of-00241.safetensors?download=true"
        },
        {
          "label": "model-00091-of-00241.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-Coder-480B-A35B-Instruct/resolve/main/model-00091-of-00241.safetensors?download=true"
        },
        {
          "label": "model-00092-of-00241.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-Coder-480B-A35B-Instruct/resolve/main/model-00092-of-00241.safetensors?download=true"
        },
        {
          "label": "model-00093-of-00241.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-Coder-480B-A35B-Instruct/resolve/main/model-00093-of-00241.safetensors?download=true"
        },
        {
          "label": "model-00094-of-00241.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-Coder-480B-A35B-Instruct/resolve/main/model-00094-of-00241.safetensors?download=true"
        },
        {
          "label": "model-00095-of-00241.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-Coder-480B-A35B-Instruct/resolve/main/model-00095-of-00241.safetensors?download=true"
        },
        {
          "label": "model-00096-of-00241.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-Coder-480B-A35B-Instruct/resolve/main/model-00096-of-00241.safetensors?download=true"
        },
        {
          "label": "model-00097-of-00241.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-Coder-480B-A35B-Instruct/resolve/main/model-00097-of-00241.safetensors?download=true"
        },
        {
          "label": "model-00098-of-00241.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-Coder-480B-A35B-Instruct/resolve/main/model-00098-of-00241.safetensors?download=true"
        },
        {
          "label": "model-00099-of-00241.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-Coder-480B-A35B-Instruct/resolve/main/model-00099-of-00241.safetensors?download=true"
        },
        {
          "label": "model-00100-of-00241.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-Coder-480B-A35B-Instruct/resolve/main/model-00100-of-00241.safetensors?download=true"
        },
        {
          "label": "model-00101-of-00241.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-Coder-480B-A35B-Instruct/resolve/main/model-00101-of-00241.safetensors?download=true"
        },
        {
          "label": "model-00102-of-00241.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-Coder-480B-A35B-Instruct/resolve/main/model-00102-of-00241.safetensors?download=true"
        },
        {
          "label": "model-00103-of-00241.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-Coder-480B-A35B-Instruct/resolve/main/model-00103-of-00241.safetensors?download=true"
        },
        {
          "label": "model-00104-of-00241.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-Coder-480B-A35B-Instruct/resolve/main/model-00104-of-00241.safetensors?download=true"
        },
        {
          "label": "model-00105-of-00241.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-Coder-480B-A35B-Instruct/resolve/main/model-00105-of-00241.safetensors?download=true"
        },
        {
          "label": "model-00106-of-00241.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-Coder-480B-A35B-Instruct/resolve/main/model-00106-of-00241.safetensors?download=true"
        },
        {
          "label": "model-00107-of-00241.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-Coder-480B-A35B-Instruct/resolve/main/model-00107-of-00241.safetensors?download=true"
        },
        {
          "label": "model-00108-of-00241.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-Coder-480B-A35B-Instruct/resolve/main/model-00108-of-00241.safetensors?download=true"
        },
        {
          "label": "model-00109-of-00241.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-Coder-480B-A35B-Instruct/resolve/main/model-00109-of-00241.safetensors?download=true"
        },
        {
          "label": "model-00110-of-00241.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-Coder-480B-A35B-Instruct/resolve/main/model-00110-of-00241.safetensors?download=true"
        },
        {
          "label": "model-00111-of-00241.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-Coder-480B-A35B-Instruct/resolve/main/model-00111-of-00241.safetensors?download=true"
        },
        {
          "label": "model-00112-of-00241.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-Coder-480B-A35B-Instruct/resolve/main/model-00112-of-00241.safetensors?download=true"
        },
        {
          "label": "model-00113-of-00241.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-Coder-480B-A35B-Instruct/resolve/main/model-00113-of-00241.safetensors?download=true"
        },
        {
          "label": "model-00114-of-00241.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-Coder-480B-A35B-Instruct/resolve/main/model-00114-of-00241.safetensors?download=true"
        },
        {
          "label": "model-00115-of-00241.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-Coder-480B-A35B-Instruct/resolve/main/model-00115-of-00241.safetensors?download=true"
        },
        {
          "label": "model-00116-of-00241.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-Coder-480B-A35B-Instruct/resolve/main/model-00116-of-00241.safetensors?download=true"
        },
        {
          "label": "model-00117-of-00241.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-Coder-480B-A35B-Instruct/resolve/main/model-00117-of-00241.safetensors?download=true"
        },
        {
          "label": "model-00118-of-00241.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-Coder-480B-A35B-Instruct/resolve/main/model-00118-of-00241.safetensors?download=true"
        },
        {
          "label": "model-00119-of-00241.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-Coder-480B-A35B-Instruct/resolve/main/model-00119-of-00241.safetensors?download=true"
        },
        {
          "label": "model-00120-of-00241.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-Coder-480B-A35B-Instruct/resolve/main/model-00120-of-00241.safetensors?download=true"
        },
        {
          "label": "model-00121-of-00241.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-Coder-480B-A35B-Instruct/resolve/main/model-00121-of-00241.safetensors?download=true"
        },
        {
          "label": "model-00122-of-00241.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-Coder-480B-A35B-Instruct/resolve/main/model-00122-of-00241.safetensors?download=true"
        },
        {
          "label": "model-00123-of-00241.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-Coder-480B-A35B-Instruct/resolve/main/model-00123-of-00241.safetensors?download=true"
        },
        {
          "label": "model-00124-of-00241.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-Coder-480B-A35B-Instruct/resolve/main/model-00124-of-00241.safetensors?download=true"
        },
        {
          "label": "model-00125-of-00241.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-Coder-480B-A35B-Instruct/resolve/main/model-00125-of-00241.safetensors?download=true"
        },
        {
          "label": "model-00126-of-00241.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-Coder-480B-A35B-Instruct/resolve/main/model-00126-of-00241.safetensors?download=true"
        },
        {
          "label": "model-00127-of-00241.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-Coder-480B-A35B-Instruct/resolve/main/model-00127-of-00241.safetensors?download=true"
        },
        {
          "label": "model-00128-of-00241.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-Coder-480B-A35B-Instruct/resolve/main/model-00128-of-00241.safetensors?download=true"
        },
        {
          "label": "model-00129-of-00241.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-Coder-480B-A35B-Instruct/resolve/main/model-00129-of-00241.safetensors?download=true"
        },
        {
          "label": "model-00130-of-00241.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-Coder-480B-A35B-Instruct/resolve/main/model-00130-of-00241.safetensors?download=true"
        },
        {
          "label": "model-00131-of-00241.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-Coder-480B-A35B-Instruct/resolve/main/model-00131-of-00241.safetensors?download=true"
        },
        {
          "label": "model-00132-of-00241.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-Coder-480B-A35B-Instruct/resolve/main/model-00132-of-00241.safetensors?download=true"
        },
        {
          "label": "model-00133-of-00241.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-Coder-480B-A35B-Instruct/resolve/main/model-00133-of-00241.safetensors?download=true"
        },
        {
          "label": "model-00134-of-00241.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-Coder-480B-A35B-Instruct/resolve/main/model-00134-of-00241.safetensors?download=true"
        },
        {
          "label": "model-00135-of-00241.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-Coder-480B-A35B-Instruct/resolve/main/model-00135-of-00241.safetensors?download=true"
        },
        {
          "label": "model-00136-of-00241.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-Coder-480B-A35B-Instruct/resolve/main/model-00136-of-00241.safetensors?download=true"
        },
        {
          "label": "model-00137-of-00241.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-Coder-480B-A35B-Instruct/resolve/main/model-00137-of-00241.safetensors?download=true"
        },
        {
          "label": "model-00138-of-00241.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-Coder-480B-A35B-Instruct/resolve/main/model-00138-of-00241.safetensors?download=true"
        },
        {
          "label": "model-00139-of-00241.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-Coder-480B-A35B-Instruct/resolve/main/model-00139-of-00241.safetensors?download=true"
        },
        {
          "label": "model-00140-of-00241.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-Coder-480B-A35B-Instruct/resolve/main/model-00140-of-00241.safetensors?download=true"
        },
        {
          "label": "model-00141-of-00241.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-Coder-480B-A35B-Instruct/resolve/main/model-00141-of-00241.safetensors?download=true"
        },
        {
          "label": "model-00142-of-00241.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-Coder-480B-A35B-Instruct/resolve/main/model-00142-of-00241.safetensors?download=true"
        },
        {
          "label": "model-00143-of-00241.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-Coder-480B-A35B-Instruct/resolve/main/model-00143-of-00241.safetensors?download=true"
        },
        {
          "label": "model-00144-of-00241.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-Coder-480B-A35B-Instruct/resolve/main/model-00144-of-00241.safetensors?download=true"
        },
        {
          "label": "model-00145-of-00241.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-Coder-480B-A35B-Instruct/resolve/main/model-00145-of-00241.safetensors?download=true"
        },
        {
          "label": "model-00146-of-00241.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-Coder-480B-A35B-Instruct/resolve/main/model-00146-of-00241.safetensors?download=true"
        },
        {
          "label": "model-00147-of-00241.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-Coder-480B-A35B-Instruct/resolve/main/model-00147-of-00241.safetensors?download=true"
        },
        {
          "label": "model-00148-of-00241.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-Coder-480B-A35B-Instruct/resolve/main/model-00148-of-00241.safetensors?download=true"
        },
        {
          "label": "model-00149-of-00241.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-Coder-480B-A35B-Instruct/resolve/main/model-00149-of-00241.safetensors?download=true"
        },
        {
          "label": "model-00150-of-00241.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-Coder-480B-A35B-Instruct/resolve/main/model-00150-of-00241.safetensors?download=true"
        },
        {
          "label": "model-00151-of-00241.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-Coder-480B-A35B-Instruct/resolve/main/model-00151-of-00241.safetensors?download=true"
        },
        {
          "label": "model-00152-of-00241.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-Coder-480B-A35B-Instruct/resolve/main/model-00152-of-00241.safetensors?download=true"
        },
        {
          "label": "model-00153-of-00241.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-Coder-480B-A35B-Instruct/resolve/main/model-00153-of-00241.safetensors?download=true"
        },
        {
          "label": "model-00154-of-00241.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-Coder-480B-A35B-Instruct/resolve/main/model-00154-of-00241.safetensors?download=true"
        },
        {
          "label": "model-00155-of-00241.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-Coder-480B-A35B-Instruct/resolve/main/model-00155-of-00241.safetensors?download=true"
        },
        {
          "label": "model-00156-of-00241.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-Coder-480B-A35B-Instruct/resolve/main/model-00156-of-00241.safetensors?download=true"
        },
        {
          "label": "model-00157-of-00241.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-Coder-480B-A35B-Instruct/resolve/main/model-00157-of-00241.safetensors?download=true"
        },
        {
          "label": "model-00158-of-00241.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-Coder-480B-A35B-Instruct/resolve/main/model-00158-of-00241.safetensors?download=true"
        },
        {
          "label": "model-00159-of-00241.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-Coder-480B-A35B-Instruct/resolve/main/model-00159-of-00241.safetensors?download=true"
        },
        {
          "label": "model-00160-of-00241.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-Coder-480B-A35B-Instruct/resolve/main/model-00160-of-00241.safetensors?download=true"
        },
        {
          "label": "model-00161-of-00241.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-Coder-480B-A35B-Instruct/resolve/main/model-00161-of-00241.safetensors?download=true"
        },
        {
          "label": "model-00162-of-00241.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-Coder-480B-A35B-Instruct/resolve/main/model-00162-of-00241.safetensors?download=true"
        },
        {
          "label": "model-00163-of-00241.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-Coder-480B-A35B-Instruct/resolve/main/model-00163-of-00241.safetensors?download=true"
        },
        {
          "label": "model-00164-of-00241.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-Coder-480B-A35B-Instruct/resolve/main/model-00164-of-00241.safetensors?download=true"
        },
        {
          "label": "model-00165-of-00241.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-Coder-480B-A35B-Instruct/resolve/main/model-00165-of-00241.safetensors?download=true"
        },
        {
          "label": "model-00166-of-00241.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-Coder-480B-A35B-Instruct/resolve/main/model-00166-of-00241.safetensors?download=true"
        },
        {
          "label": "model-00167-of-00241.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-Coder-480B-A35B-Instruct/resolve/main/model-00167-of-00241.safetensors?download=true"
        },
        {
          "label": "model-00168-of-00241.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-Coder-480B-A35B-Instruct/resolve/main/model-00168-of-00241.safetensors?download=true"
        },
        {
          "label": "model-00169-of-00241.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-Coder-480B-A35B-Instruct/resolve/main/model-00169-of-00241.safetensors?download=true"
        },
        {
          "label": "model-00170-of-00241.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-Coder-480B-A35B-Instruct/resolve/main/model-00170-of-00241.safetensors?download=true"
        },
        {
          "label": "model-00171-of-00241.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-Coder-480B-A35B-Instruct/resolve/main/model-00171-of-00241.safetensors?download=true"
        },
        {
          "label": "model-00172-of-00241.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-Coder-480B-A35B-Instruct/resolve/main/model-00172-of-00241.safetensors?download=true"
        },
        {
          "label": "model-00173-of-00241.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-Coder-480B-A35B-Instruct/resolve/main/model-00173-of-00241.safetensors?download=true"
        },
        {
          "label": "model-00174-of-00241.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-Coder-480B-A35B-Instruct/resolve/main/model-00174-of-00241.safetensors?download=true"
        },
        {
          "label": "model-00175-of-00241.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-Coder-480B-A35B-Instruct/resolve/main/model-00175-of-00241.safetensors?download=true"
        },
        {
          "label": "model-00176-of-00241.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-Coder-480B-A35B-Instruct/resolve/main/model-00176-of-00241.safetensors?download=true"
        },
        {
          "label": "model-00177-of-00241.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-Coder-480B-A35B-Instruct/resolve/main/model-00177-of-00241.safetensors?download=true"
        },
        {
          "label": "model-00178-of-00241.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-Coder-480B-A35B-Instruct/resolve/main/model-00178-of-00241.safetensors?download=true"
        },
        {
          "label": "model-00179-of-00241.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-Coder-480B-A35B-Instruct/resolve/main/model-00179-of-00241.safetensors?download=true"
        },
        {
          "label": "model-00180-of-00241.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-Coder-480B-A35B-Instruct/resolve/main/model-00180-of-00241.safetensors?download=true"
        },
        {
          "label": "model-00181-of-00241.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-Coder-480B-A35B-Instruct/resolve/main/model-00181-of-00241.safetensors?download=true"
        },
        {
          "label": "model-00182-of-00241.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-Coder-480B-A35B-Instruct/resolve/main/model-00182-of-00241.safetensors?download=true"
        },
        {
          "label": "model-00183-of-00241.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-Coder-480B-A35B-Instruct/resolve/main/model-00183-of-00241.safetensors?download=true"
        },
        {
          "label": "model-00184-of-00241.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-Coder-480B-A35B-Instruct/resolve/main/model-00184-of-00241.safetensors?download=true"
        },
        {
          "label": "model-00185-of-00241.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-Coder-480B-A35B-Instruct/resolve/main/model-00185-of-00241.safetensors?download=true"
        },
        {
          "label": "model-00186-of-00241.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-Coder-480B-A35B-Instruct/resolve/main/model-00186-of-00241.safetensors?download=true"
        },
        {
          "label": "model-00187-of-00241.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-Coder-480B-A35B-Instruct/resolve/main/model-00187-of-00241.safetensors?download=true"
        },
        {
          "label": "model-00188-of-00241.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-Coder-480B-A35B-Instruct/resolve/main/model-00188-of-00241.safetensors?download=true"
        },
        {
          "label": "model-00189-of-00241.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-Coder-480B-A35B-Instruct/resolve/main/model-00189-of-00241.safetensors?download=true"
        },
        {
          "label": "model-00190-of-00241.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-Coder-480B-A35B-Instruct/resolve/main/model-00190-of-00241.safetensors?download=true"
        },
        {
          "label": "model-00191-of-00241.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-Coder-480B-A35B-Instruct/resolve/main/model-00191-of-00241.safetensors?download=true"
        },
        {
          "label": "model-00192-of-00241.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-Coder-480B-A35B-Instruct/resolve/main/model-00192-of-00241.safetensors?download=true"
        },
        {
          "label": "model-00193-of-00241.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-Coder-480B-A35B-Instruct/resolve/main/model-00193-of-00241.safetensors?download=true"
        },
        {
          "label": "model-00194-of-00241.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-Coder-480B-A35B-Instruct/resolve/main/model-00194-of-00241.safetensors?download=true"
        },
        {
          "label": "model-00195-of-00241.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-Coder-480B-A35B-Instruct/resolve/main/model-00195-of-00241.safetensors?download=true"
        },
        {
          "label": "model-00196-of-00241.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-Coder-480B-A35B-Instruct/resolve/main/model-00196-of-00241.safetensors?download=true"
        },
        {
          "label": "model-00197-of-00241.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-Coder-480B-A35B-Instruct/resolve/main/model-00197-of-00241.safetensors?download=true"
        },
        {
          "label": "model-00198-of-00241.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-Coder-480B-A35B-Instruct/resolve/main/model-00198-of-00241.safetensors?download=true"
        },
        {
          "label": "model-00199-of-00241.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-Coder-480B-A35B-Instruct/resolve/main/model-00199-of-00241.safetensors?download=true"
        },
        {
          "label": "model-00200-of-00241.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-Coder-480B-A35B-Instruct/resolve/main/model-00200-of-00241.safetensors?download=true"
        },
        {
          "label": "model-00201-of-00241.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-Coder-480B-A35B-Instruct/resolve/main/model-00201-of-00241.safetensors?download=true"
        },
        {
          "label": "model-00202-of-00241.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-Coder-480B-A35B-Instruct/resolve/main/model-00202-of-00241.safetensors?download=true"
        },
        {
          "label": "model-00203-of-00241.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-Coder-480B-A35B-Instruct/resolve/main/model-00203-of-00241.safetensors?download=true"
        },
        {
          "label": "model-00204-of-00241.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-Coder-480B-A35B-Instruct/resolve/main/model-00204-of-00241.safetensors?download=true"
        },
        {
          "label": "model-00205-of-00241.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-Coder-480B-A35B-Instruct/resolve/main/model-00205-of-00241.safetensors?download=true"
        },
        {
          "label": "model-00206-of-00241.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-Coder-480B-A35B-Instruct/resolve/main/model-00206-of-00241.safetensors?download=true"
        },
        {
          "label": "model-00207-of-00241.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-Coder-480B-A35B-Instruct/resolve/main/model-00207-of-00241.safetensors?download=true"
        },
        {
          "label": "model-00208-of-00241.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-Coder-480B-A35B-Instruct/resolve/main/model-00208-of-00241.safetensors?download=true"
        },
        {
          "label": "model-00209-of-00241.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-Coder-480B-A35B-Instruct/resolve/main/model-00209-of-00241.safetensors?download=true"
        },
        {
          "label": "model-00210-of-00241.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-Coder-480B-A35B-Instruct/resolve/main/model-00210-of-00241.safetensors?download=true"
        },
        {
          "label": "model-00211-of-00241.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-Coder-480B-A35B-Instruct/resolve/main/model-00211-of-00241.safetensors?download=true"
        },
        {
          "label": "model-00212-of-00241.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-Coder-480B-A35B-Instruct/resolve/main/model-00212-of-00241.safetensors?download=true"
        },
        {
          "label": "model-00213-of-00241.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-Coder-480B-A35B-Instruct/resolve/main/model-00213-of-00241.safetensors?download=true"
        },
        {
          "label": "model-00214-of-00241.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-Coder-480B-A35B-Instruct/resolve/main/model-00214-of-00241.safetensors?download=true"
        },
        {
          "label": "model-00215-of-00241.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-Coder-480B-A35B-Instruct/resolve/main/model-00215-of-00241.safetensors?download=true"
        },
        {
          "label": "model-00216-of-00241.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-Coder-480B-A35B-Instruct/resolve/main/model-00216-of-00241.safetensors?download=true"
        },
        {
          "label": "model-00217-of-00241.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-Coder-480B-A35B-Instruct/resolve/main/model-00217-of-00241.safetensors?download=true"
        },
        {
          "label": "model-00218-of-00241.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-Coder-480B-A35B-Instruct/resolve/main/model-00218-of-00241.safetensors?download=true"
        },
        {
          "label": "model-00219-of-00241.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-Coder-480B-A35B-Instruct/resolve/main/model-00219-of-00241.safetensors?download=true"
        },
        {
          "label": "model-00220-of-00241.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-Coder-480B-A35B-Instruct/resolve/main/model-00220-of-00241.safetensors?download=true"
        },
        {
          "label": "model-00221-of-00241.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-Coder-480B-A35B-Instruct/resolve/main/model-00221-of-00241.safetensors?download=true"
        },
        {
          "label": "model-00222-of-00241.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-Coder-480B-A35B-Instruct/resolve/main/model-00222-of-00241.safetensors?download=true"
        },
        {
          "label": "model-00223-of-00241.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-Coder-480B-A35B-Instruct/resolve/main/model-00223-of-00241.safetensors?download=true"
        },
        {
          "label": "model-00224-of-00241.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-Coder-480B-A35B-Instruct/resolve/main/model-00224-of-00241.safetensors?download=true"
        },
        {
          "label": "model-00225-of-00241.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-Coder-480B-A35B-Instruct/resolve/main/model-00225-of-00241.safetensors?download=true"
        },
        {
          "label": "model-00226-of-00241.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-Coder-480B-A35B-Instruct/resolve/main/model-00226-of-00241.safetensors?download=true"
        },
        {
          "label": "model-00227-of-00241.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-Coder-480B-A35B-Instruct/resolve/main/model-00227-of-00241.safetensors?download=true"
        },
        {
          "label": "model-00228-of-00241.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-Coder-480B-A35B-Instruct/resolve/main/model-00228-of-00241.safetensors?download=true"
        },
        {
          "label": "model-00229-of-00241.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-Coder-480B-A35B-Instruct/resolve/main/model-00229-of-00241.safetensors?download=true"
        },
        {
          "label": "model-00230-of-00241.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-Coder-480B-A35B-Instruct/resolve/main/model-00230-of-00241.safetensors?download=true"
        },
        {
          "label": "model-00231-of-00241.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-Coder-480B-A35B-Instruct/resolve/main/model-00231-of-00241.safetensors?download=true"
        },
        {
          "label": "model-00232-of-00241.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-Coder-480B-A35B-Instruct/resolve/main/model-00232-of-00241.safetensors?download=true"
        },
        {
          "label": "model-00233-of-00241.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-Coder-480B-A35B-Instruct/resolve/main/model-00233-of-00241.safetensors?download=true"
        },
        {
          "label": "model-00234-of-00241.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-Coder-480B-A35B-Instruct/resolve/main/model-00234-of-00241.safetensors?download=true"
        },
        {
          "label": "model-00235-of-00241.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-Coder-480B-A35B-Instruct/resolve/main/model-00235-of-00241.safetensors?download=true"
        },
        {
          "label": "model-00236-of-00241.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-Coder-480B-A35B-Instruct/resolve/main/model-00236-of-00241.safetensors?download=true"
        },
        {
          "label": "model-00237-of-00241.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-Coder-480B-A35B-Instruct/resolve/main/model-00237-of-00241.safetensors?download=true"
        },
        {
          "label": "model-00238-of-00241.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-Coder-480B-A35B-Instruct/resolve/main/model-00238-of-00241.safetensors?download=true"
        },
        {
          "label": "model-00239-of-00241.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-Coder-480B-A35B-Instruct/resolve/main/model-00239-of-00241.safetensors?download=true"
        },
        {
          "label": "model-00240-of-00241.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-Coder-480B-A35B-Instruct/resolve/main/model-00240-of-00241.safetensors?download=true"
        },
        {
          "label": "model-00241-of-00241.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-Coder-480B-A35B-Instruct/resolve/main/model-00241-of-00241.safetensors?download=true"
        }
      ]
    },
    {
      "repo": "nvidia/Qwen3.8-27B-NVFP4",
      "bRating": "27B",
      "parameters": "27B",
      "size": "20.4 GB",
      "files": [
        {
          "label": "model-00001-of-00003.safetensors",
          "url": "https://huggingface.co/nvidia/Qwen3.8-27B-NVFP4/resolve/main/model-00001-of-00003.safetensors?download=true"
        },
        {
          "label": "model-00002-of-00003.safetensors",
          "url": "https://huggingface.co/nvidia/Qwen3.8-27B-NVFP4/resolve/main/model-00002-of-00003.safetensors?download=true"
        },
        {
          "label": "model-00003-of-00003.safetensors",
          "url": "https://huggingface.co/nvidia/Qwen3.8-27B-NVFP4/resolve/main/model-00003-of-00003.safetensors?download=true"
        }
      ]
    },
    {
      "repo": "Qwen/Qwen3.8-27B",
      "bRating": "27B",
      "parameters": "27B",
      "size": "51.7 GB",
      "files": [
        {
          "label": "model-00001-of-00018.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3.8-27B/resolve/main/model-00001-of-00018.safetensors?download=true"
        },
        {
          "label": "model-00002-of-00018.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3.8-27B/resolve/main/model-00002-of-00018.safetensors?download=true"
        },
        {
          "label": "model-00003-of-00018.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3.8-27B/resolve/main/model-00003-of-00018.safetensors?download=true"
        },
        {
          "label": "model-00004-of-00018.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3.8-27B/resolve/main/model-00004-of-00018.safetensors?download=true"
        },
        {
          "label": "model-00005-of-00018.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3.8-27B/resolve/main/model-00005-of-00018.safetensors?download=true"
        },
        {
          "label": "model-00006-of-00018.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3.8-27B/resolve/main/model-00006-of-00018.safetensors?download=true"
        },
        {
          "label": "model-00007-of-00018.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3.8-27B/resolve/main/model-00007-of-00018.safetensors?download=true"
        },
        {
          "label": "model-00008-of-00018.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3.8-27B/resolve/main/model-00008-of-00018.safetensors?download=true"
        },
        {
          "label": "model-00009-of-00018.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3.8-27B/resolve/main/model-00009-of-00018.safetensors?download=true"
        },
        {
          "label": "model-00010-of-00018.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3.8-27B/resolve/main/model-00010-of-00018.safetensors?download=true"
        },
        {
          "label": "model-00011-of-00018.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3.8-27B/resolve/main/model-00011-of-00018.safetensors?download=true"
        },
        {
          "label": "model-00012-of-00018.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3.8-27B/resolve/main/model-00012-of-00018.safetensors?download=true"
        },
        {
          "label": "model-00013-of-00018.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3.8-27B/resolve/main/model-00013-of-00018.safetensors?download=true"
        },
        {
          "label": "model-00014-of-00018.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3.8-27B/resolve/main/model-00014-of-00018.safetensors?download=true"
        },
        {
          "label": "model-00015-of-00018.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3.8-27B/resolve/main/model-00015-of-00018.safetensors?download=true"
        },
        {
          "label": "model-00016-of-00018.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3.8-27B/resolve/main/model-00016-of-00018.safetensors?download=true"
        },
        {
          "label": "model-00017-of-00018.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3.8-27B/resolve/main/model-00017-of-00018.safetensors?download=true"
        },
        {
          "label": "model-00018-of-00018.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3.8-27B/resolve/main/model-00018-of-00018.safetensors?download=true"
        }
      ]
    },
    {
      "repo": "Qwen/Qwen3.8-Flash-Next",
      "bRating": "Unknown",
      "parameters": "Unknown",
      "size": "335.3 GB",
      "files": [
        {
          "label": "model-00001-of-00131.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3.8-Flash-Next/resolve/main/model-00001-of-00131.safetensors?download=true"
        },
        {
          "label": "model-00002-of-00131.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3.8-Flash-Next/resolve/main/model-00002-of-00131.safetensors?download=true"
        },
        {
          "label": "model-00003-of-00131.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3.8-Flash-Next/resolve/main/model-00003-of-00131.safetensors?download=true"
        },
        {
          "label": "model-00004-of-00131.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3.8-Flash-Next/resolve/main/model-00004-of-00131.safetensors?download=true"
        },
        {
          "label": "model-00005-of-00131.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3.8-Flash-Next/resolve/main/model-00005-of-00131.safetensors?download=true"
        },
        {
          "label": "model-00006-of-00131.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3.8-Flash-Next/resolve/main/model-00006-of-00131.safetensors?download=true"
        },
        {
          "label": "model-00007-of-00131.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3.8-Flash-Next/resolve/main/model-00007-of-00131.safetensors?download=true"
        },
        {
          "label": "model-00008-of-00131.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3.8-Flash-Next/resolve/main/model-00008-of-00131.safetensors?download=true"
        },
        {
          "label": "model-00009-of-00131.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3.8-Flash-Next/resolve/main/model-00009-of-00131.safetensors?download=true"
        },
        {
          "label": "model-00010-of-00131.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3.8-Flash-Next/resolve/main/model-00010-of-00131.safetensors?download=true"
        },
        {
          "label": "model-00011-of-00131.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3.8-Flash-Next/resolve/main/model-00011-of-00131.safetensors?download=true"
        },
        {
          "label": "model-00012-of-00131.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3.8-Flash-Next/resolve/main/model-00012-of-00131.safetensors?download=true"
        },
        {
          "label": "model-00013-of-00131.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3.8-Flash-Next/resolve/main/model-00013-of-00131.safetensors?download=true"
        },
        {
          "label": "model-00014-of-00131.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3.8-Flash-Next/resolve/main/model-00014-of-00131.safetensors?download=true"
        },
        {
          "label": "model-00015-of-00131.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3.8-Flash-Next/resolve/main/model-00015-of-00131.safetensors?download=true"
        },
        {
          "label": "model-00016-of-00131.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3.8-Flash-Next/resolve/main/model-00016-of-00131.safetensors?download=true"
        },
        {
          "label": "model-00017-of-00131.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3.8-Flash-Next/resolve/main/model-00017-of-00131.safetensors?download=true"
        },
        {
          "label": "model-00018-of-00131.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3.8-Flash-Next/resolve/main/model-00018-of-00131.safetensors?download=true"
        },
        {
          "label": "model-00019-of-00131.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3.8-Flash-Next/resolve/main/model-00019-of-00131.safetensors?download=true"
        },
        {
          "label": "model-00020-of-00131.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3.8-Flash-Next/resolve/main/model-00020-of-00131.safetensors?download=true"
        },
        {
          "label": "model-00021-of-00131.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3.8-Flash-Next/resolve/main/model-00021-of-00131.safetensors?download=true"
        },
        {
          "label": "model-00022-of-00131.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3.8-Flash-Next/resolve/main/model-00022-of-00131.safetensors?download=true"
        },
        {
          "label": "model-00023-of-00131.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3.8-Flash-Next/resolve/main/model-00023-of-00131.safetensors?download=true"
        },
        {
          "label": "model-00024-of-00131.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3.8-Flash-Next/resolve/main/model-00024-of-00131.safetensors?download=true"
        },
        {
          "label": "model-00025-of-00131.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3.8-Flash-Next/resolve/main/model-00025-of-00131.safetensors?download=true"
        },
        {
          "label": "model-00026-of-00131.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3.8-Flash-Next/resolve/main/model-00026-of-00131.safetensors?download=true"
        },
        {
          "label": "model-00027-of-00131.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3.8-Flash-Next/resolve/main/model-00027-of-00131.safetensors?download=true"
        },
        {
          "label": "model-00028-of-00131.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3.8-Flash-Next/resolve/main/model-00028-of-00131.safetensors?download=true"
        },
        {
          "label": "model-00029-of-00131.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3.8-Flash-Next/resolve/main/model-00029-of-00131.safetensors?download=true"
        },
        {
          "label": "model-00030-of-00131.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3.8-Flash-Next/resolve/main/model-00030-of-00131.safetensors?download=true"
        },
        {
          "label": "model-00031-of-00131.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3.8-Flash-Next/resolve/main/model-00031-of-00131.safetensors?download=true"
        },
        {
          "label": "model-00032-of-00131.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3.8-Flash-Next/resolve/main/model-00032-of-00131.safetensors?download=true"
        },
        {
          "label": "model-00033-of-00131.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3.8-Flash-Next/resolve/main/model-00033-of-00131.safetensors?download=true"
        },
        {
          "label": "model-00034-of-00131.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3.8-Flash-Next/resolve/main/model-00034-of-00131.safetensors?download=true"
        },
        {
          "label": "model-00035-of-00131.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3.8-Flash-Next/resolve/main/model-00035-of-00131.safetensors?download=true"
        },
        {
          "label": "model-00036-of-00131.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3.8-Flash-Next/resolve/main/model-00036-of-00131.safetensors?download=true"
        },
        {
          "label": "model-00037-of-00131.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3.8-Flash-Next/resolve/main/model-00037-of-00131.safetensors?download=true"
        },
        {
          "label": "model-00038-of-00131.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3.8-Flash-Next/resolve/main/model-00038-of-00131.safetensors?download=true"
        },
        {
          "label": "model-00039-of-00131.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3.8-Flash-Next/resolve/main/model-00039-of-00131.safetensors?download=true"
        },
        {
          "label": "model-00040-of-00131.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3.8-Flash-Next/resolve/main/model-00040-of-00131.safetensors?download=true"
        },
        {
          "label": "model-00041-of-00131.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3.8-Flash-Next/resolve/main/model-00041-of-00131.safetensors?download=true"
        },
        {
          "label": "model-00042-of-00131.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3.8-Flash-Next/resolve/main/model-00042-of-00131.safetensors?download=true"
        },
        {
          "label": "model-00043-of-00131.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3.8-Flash-Next/resolve/main/model-00043-of-00131.safetensors?download=true"
        },
        {
          "label": "model-00044-of-00131.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3.8-Flash-Next/resolve/main/model-00044-of-00131.safetensors?download=true"
        },
        {
          "label": "model-00045-of-00131.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3.8-Flash-Next/resolve/main/model-00045-of-00131.safetensors?download=true"
        },
        {
          "label": "model-00046-of-00131.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3.8-Flash-Next/resolve/main/model-00046-of-00131.safetensors?download=true"
        },
        {
          "label": "model-00047-of-00131.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3.8-Flash-Next/resolve/main/model-00047-of-00131.safetensors?download=true"
        },
        {
          "label": "model-00048-of-00131.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3.8-Flash-Next/resolve/main/model-00048-of-00131.safetensors?download=true"
        },
        {
          "label": "model-00049-of-00131.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3.8-Flash-Next/resolve/main/model-00049-of-00131.safetensors?download=true"
        },
        {
          "label": "model-00050-of-00131.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3.8-Flash-Next/resolve/main/model-00050-of-00131.safetensors?download=true"
        },
        {
          "label": "model-00051-of-00131.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3.8-Flash-Next/resolve/main/model-00051-of-00131.safetensors?download=true"
        },
        {
          "label": "model-00052-of-00131.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3.8-Flash-Next/resolve/main/model-00052-of-00131.safetensors?download=true"
        },
        {
          "label": "model-00053-of-00131.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3.8-Flash-Next/resolve/main/model-00053-of-00131.safetensors?download=true"
        },
        {
          "label": "model-00054-of-00131.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3.8-Flash-Next/resolve/main/model-00054-of-00131.safetensors?download=true"
        },
        {
          "label": "model-00055-of-00131.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3.8-Flash-Next/resolve/main/model-00055-of-00131.safetensors?download=true"
        },
        {
          "label": "model-00056-of-00131.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3.8-Flash-Next/resolve/main/model-00056-of-00131.safetensors?download=true"
        },
        {
          "label": "model-00057-of-00131.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3.8-Flash-Next/resolve/main/model-00057-of-00131.safetensors?download=true"
        },
        {
          "label": "model-00058-of-00131.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3.8-Flash-Next/resolve/main/model-00058-of-00131.safetensors?download=true"
        },
        {
          "label": "model-00059-of-00131.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3.8-Flash-Next/resolve/main/model-00059-of-00131.safetensors?download=true"
        },
        {
          "label": "model-00060-of-00131.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3.8-Flash-Next/resolve/main/model-00060-of-00131.safetensors?download=true"
        },
        {
          "label": "model-00061-of-00131.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3.8-Flash-Next/resolve/main/model-00061-of-00131.safetensors?download=true"
        },
        {
          "label": "model-00062-of-00131.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3.8-Flash-Next/resolve/main/model-00062-of-00131.safetensors?download=true"
        },
        {
          "label": "model-00063-of-00131.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3.8-Flash-Next/resolve/main/model-00063-of-00131.safetensors?download=true"
        },
        {
          "label": "model-00064-of-00131.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3.8-Flash-Next/resolve/main/model-00064-of-00131.safetensors?download=true"
        },
        {
          "label": "model-00065-of-00131.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3.8-Flash-Next/resolve/main/model-00065-of-00131.safetensors?download=true"
        },
        {
          "label": "model-00066-of-00131.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3.8-Flash-Next/resolve/main/model-00066-of-00131.safetensors?download=true"
        },
        {
          "label": "model-00067-of-00131.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3.8-Flash-Next/resolve/main/model-00067-of-00131.safetensors?download=true"
        },
        {
          "label": "model-00068-of-00131.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3.8-Flash-Next/resolve/main/model-00068-of-00131.safetensors?download=true"
        },
        {
          "label": "model-00069-of-00131.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3.8-Flash-Next/resolve/main/model-00069-of-00131.safetensors?download=true"
        },
        {
          "label": "model-00070-of-00131.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3.8-Flash-Next/resolve/main/model-00070-of-00131.safetensors?download=true"
        },
        {
          "label": "model-00071-of-00131.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3.8-Flash-Next/resolve/main/model-00071-of-00131.safetensors?download=true"
        },
        {
          "label": "model-00072-of-00131.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3.8-Flash-Next/resolve/main/model-00072-of-00131.safetensors?download=true"
        },
        {
          "label": "model-00073-of-00131.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3.8-Flash-Next/resolve/main/model-00073-of-00131.safetensors?download=true"
        },
        {
          "label": "model-00074-of-00131.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3.8-Flash-Next/resolve/main/model-00074-of-00131.safetensors?download=true"
        },
        {
          "label": "model-00075-of-00131.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3.8-Flash-Next/resolve/main/model-00075-of-00131.safetensors?download=true"
        },
        {
          "label": "model-00076-of-00131.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3.8-Flash-Next/resolve/main/model-00076-of-00131.safetensors?download=true"
        },
        {
          "label": "model-00077-of-00131.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3.8-Flash-Next/resolve/main/model-00077-of-00131.safetensors?download=true"
        },
        {
          "label": "model-00078-of-00131.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3.8-Flash-Next/resolve/main/model-00078-of-00131.safetensors?download=true"
        },
        {
          "label": "model-00079-of-00131.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3.8-Flash-Next/resolve/main/model-00079-of-00131.safetensors?download=true"
        },
        {
          "label": "model-00080-of-00131.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3.8-Flash-Next/resolve/main/model-00080-of-00131.safetensors?download=true"
        },
        {
          "label": "model-00081-of-00131.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3.8-Flash-Next/resolve/main/model-00081-of-00131.safetensors?download=true"
        },
        {
          "label": "model-00082-of-00131.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3.8-Flash-Next/resolve/main/model-00082-of-00131.safetensors?download=true"
        },
        {
          "label": "model-00083-of-00131.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3.8-Flash-Next/resolve/main/model-00083-of-00131.safetensors?download=true"
        },
        {
          "label": "model-00084-of-00131.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3.8-Flash-Next/resolve/main/model-00084-of-00131.safetensors?download=true"
        },
        {
          "label": "model-00085-of-00131.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3.8-Flash-Next/resolve/main/model-00085-of-00131.safetensors?download=true"
        },
        {
          "label": "model-00086-of-00131.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3.8-Flash-Next/resolve/main/model-00086-of-00131.safetensors?download=true"
        },
        {
          "label": "model-00087-of-00131.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3.8-Flash-Next/resolve/main/model-00087-of-00131.safetensors?download=true"
        },
        {
          "label": "model-00088-of-00131.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3.8-Flash-Next/resolve/main/model-00088-of-00131.safetensors?download=true"
        },
        {
          "label": "model-00089-of-00131.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3.8-Flash-Next/resolve/main/model-00089-of-00131.safetensors?download=true"
        },
        {
          "label": "model-00090-of-00131.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3.8-Flash-Next/resolve/main/model-00090-of-00131.safetensors?download=true"
        },
        {
          "label": "model-00091-of-00131.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3.8-Flash-Next/resolve/main/model-00091-of-00131.safetensors?download=true"
        },
        {
          "label": "model-00092-of-00131.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3.8-Flash-Next/resolve/main/model-00092-of-00131.safetensors?download=true"
        },
        {
          "label": "model-00093-of-00131.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3.8-Flash-Next/resolve/main/model-00093-of-00131.safetensors?download=true"
        },
        {
          "label": "model-00094-of-00131.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3.8-Flash-Next/resolve/main/model-00094-of-00131.safetensors?download=true"
        },
        {
          "label": "model-00095-of-00131.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3.8-Flash-Next/resolve/main/model-00095-of-00131.safetensors?download=true"
        },
        {
          "label": "model-00096-of-00131.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3.8-Flash-Next/resolve/main/model-00096-of-00131.safetensors?download=true"
        },
        {
          "label": "model-00097-of-00131.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3.8-Flash-Next/resolve/main/model-00097-of-00131.safetensors?download=true"
        },
        {
          "label": "model-00098-of-00131.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3.8-Flash-Next/resolve/main/model-00098-of-00131.safetensors?download=true"
        },
        {
          "label": "model-00099-of-00131.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3.8-Flash-Next/resolve/main/model-00099-of-00131.safetensors?download=true"
        },
        {
          "label": "model-00100-of-00131.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3.8-Flash-Next/resolve/main/model-00100-of-00131.safetensors?download=true"
        },
        {
          "label": "model-00101-of-00131.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3.8-Flash-Next/resolve/main/model-00101-of-00131.safetensors?download=true"
        },
        {
          "label": "model-00102-of-00131.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3.8-Flash-Next/resolve/main/model-00102-of-00131.safetensors?download=true"
        },
        {
          "label": "model-00103-of-00131.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3.8-Flash-Next/resolve/main/model-00103-of-00131.safetensors?download=true"
        },
        {
          "label": "model-00104-of-00131.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3.8-Flash-Next/resolve/main/model-00104-of-00131.safetensors?download=true"
        },
        {
          "label": "model-00105-of-00131.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3.8-Flash-Next/resolve/main/model-00105-of-00131.safetensors?download=true"
        },
        {
          "label": "model-00106-of-00131.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3.8-Flash-Next/resolve/main/model-00106-of-00131.safetensors?download=true"
        },
        {
          "label": "model-00107-of-00131.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3.8-Flash-Next/resolve/main/model-00107-of-00131.safetensors?download=true"
        },
        {
          "label": "model-00108-of-00131.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3.8-Flash-Next/resolve/main/model-00108-of-00131.safetensors?download=true"
        },
        {
          "label": "model-00109-of-00131.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3.8-Flash-Next/resolve/main/model-00109-of-00131.safetensors?download=true"
        },
        {
          "label": "model-00110-of-00131.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3.8-Flash-Next/resolve/main/model-00110-of-00131.safetensors?download=true"
        },
        {
          "label": "model-00111-of-00131.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3.8-Flash-Next/resolve/main/model-00111-of-00131.safetensors?download=true"
        },
        {
          "label": "model-00112-of-00131.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3.8-Flash-Next/resolve/main/model-00112-of-00131.safetensors?download=true"
        },
        {
          "label": "model-00113-of-00131.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3.8-Flash-Next/resolve/main/model-00113-of-00131.safetensors?download=true"
        },
        {
          "label": "model-00114-of-00131.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3.8-Flash-Next/resolve/main/model-00114-of-00131.safetensors?download=true"
        },
        {
          "label": "model-00115-of-00131.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3.8-Flash-Next/resolve/main/model-00115-of-00131.safetensors?download=true"
        },
        {
          "label": "model-00116-of-00131.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3.8-Flash-Next/resolve/main/model-00116-of-00131.safetensors?download=true"
        },
        {
          "label": "model-00117-of-00131.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3.8-Flash-Next/resolve/main/model-00117-of-00131.safetensors?download=true"
        },
        {
          "label": "model-00118-of-00131.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3.8-Flash-Next/resolve/main/model-00118-of-00131.safetensors?download=true"
        },
        {
          "label": "model-00119-of-00131.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3.8-Flash-Next/resolve/main/model-00119-of-00131.safetensors?download=true"
        },
        {
          "label": "model-00120-of-00131.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3.8-Flash-Next/resolve/main/model-00120-of-00131.safetensors?download=true"
        },
        {
          "label": "model-00121-of-00131.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3.8-Flash-Next/resolve/main/model-00121-of-00131.safetensors?download=true"
        },
        {
          "label": "model-00122-of-00131.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3.8-Flash-Next/resolve/main/model-00122-of-00131.safetensors?download=true"
        },
        {
          "label": "model-00123-of-00131.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3.8-Flash-Next/resolve/main/model-00123-of-00131.safetensors?download=true"
        },
        {
          "label": "model-00124-of-00131.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3.8-Flash-Next/resolve/main/model-00124-of-00131.safetensors?download=true"
        },
        {
          "label": "model-00125-of-00131.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3.8-Flash-Next/resolve/main/model-00125-of-00131.safetensors?download=true"
        },
        {
          "label": "model-00126-of-00131.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3.8-Flash-Next/resolve/main/model-00126-of-00131.safetensors?download=true"
        },
        {
          "label": "model-00127-of-00131.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3.8-Flash-Next/resolve/main/model-00127-of-00131.safetensors?download=true"
        },
        {
          "label": "model-00128-of-00131.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3.8-Flash-Next/resolve/main/model-00128-of-00131.safetensors?download=true"
        },
        {
          "label": "model-00129-of-00131.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3.8-Flash-Next/resolve/main/model-00129-of-00131.safetensors?download=true"
        },
        {
          "label": "model-00130-of-00131.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3.8-Flash-Next/resolve/main/model-00130-of-00131.safetensors?download=true"
        },
        {
          "label": "model-00131-of-00131.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3.8-Flash-Next/resolve/main/model-00131-of-00131.safetensors?download=true"
        }
      ]
    },
    {
      "repo": "Qwen/Qwen-Drive-1.0-4B",
      "bRating": "4B",
      "parameters": "4B",
      "size": "12.8 GB",
      "files": [
        {
          "label": "model.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen-Drive-1.0-4B/resolve/main/model.safetensors?download=true"
        },
        {
          "label": "perception/model.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen-Drive-1.0-4B/resolve/main/perception/model.safetensors?download=true"
        },
        {
          "label": "planner-rl/model.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen-Drive-1.0-4B/resolve/main/planner-rl/model.safetensors?download=true"
        },
        {
          "label": "planner-sft/model.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen-Drive-1.0-4B/resolve/main/planner-sft/model.safetensors?download=true"
        }
      ]
    },
    {
      "repo": "Qwen/Qwen3.6-35B-A3B",
      "bRating": "35B",
      "parameters": "35B",
      "size": "67.0 GB",
      "files": [
        {
          "label": "model-00001-of-00026.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3.6-35B-A3B/resolve/main/model-00001-of-00026.safetensors?download=true"
        },
        {
          "label": "model-00002-of-00026.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3.6-35B-A3B/resolve/main/model-00002-of-00026.safetensors?download=true"
        },
        {
          "label": "model-00003-of-00026.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3.6-35B-A3B/resolve/main/model-00003-of-00026.safetensors?download=true"
        },
        {
          "label": "model-00004-of-00026.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3.6-35B-A3B/resolve/main/model-00004-of-00026.safetensors?download=true"
        },
        {
          "label": "model-00005-of-00026.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3.6-35B-A3B/resolve/main/model-00005-of-00026.safetensors?download=true"
        },
        {
          "label": "model-00006-of-00026.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3.6-35B-A3B/resolve/main/model-00006-of-00026.safetensors?download=true"
        },
        {
          "label": "model-00007-of-00026.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3.6-35B-A3B/resolve/main/model-00007-of-00026.safetensors?download=true"
        },
        {
          "label": "model-00008-of-00026.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3.6-35B-A3B/resolve/main/model-00008-of-00026.safetensors?download=true"
        },
        {
          "label": "model-00009-of-00026.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3.6-35B-A3B/resolve/main/model-00009-of-00026.safetensors?download=true"
        },
        {
          "label": "model-00010-of-00026.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3.6-35B-A3B/resolve/main/model-00010-of-00026.safetensors?download=true"
        },
        {
          "label": "model-00011-of-00026.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3.6-35B-A3B/resolve/main/model-00011-of-00026.safetensors?download=true"
        },
        {
          "label": "model-00012-of-00026.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3.6-35B-A3B/resolve/main/model-00012-of-00026.safetensors?download=true"
        },
        {
          "label": "model-00013-of-00026.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3.6-35B-A3B/resolve/main/model-00013-of-00026.safetensors?download=true"
        },
        {
          "label": "model-00014-of-00026.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3.6-35B-A3B/resolve/main/model-00014-of-00026.safetensors?download=true"
        },
        {
          "label": "model-00015-of-00026.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3.6-35B-A3B/resolve/main/model-00015-of-00026.safetensors?download=true"
        },
        {
          "label": "model-00016-of-00026.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3.6-35B-A3B/resolve/main/model-00016-of-00026.safetensors?download=true"
        },
        {
          "label": "model-00017-of-00026.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3.6-35B-A3B/resolve/main/model-00017-of-00026.safetensors?download=true"
        },
        {
          "label": "model-00018-of-00026.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3.6-35B-A3B/resolve/main/model-00018-of-00026.safetensors?download=true"
        },
        {
          "label": "model-00019-of-00026.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3.6-35B-A3B/resolve/main/model-00019-of-00026.safetensors?download=true"
        },
        {
          "label": "model-00020-of-00026.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3.6-35B-A3B/resolve/main/model-00020-of-00026.safetensors?download=true"
        },
        {
          "label": "model-00021-of-00026.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3.6-35B-A3B/resolve/main/model-00021-of-00026.safetensors?download=true"
        },
        {
          "label": "model-00022-of-00026.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3.6-35B-A3B/resolve/main/model-00022-of-00026.safetensors?download=true"
        },
        {
          "label": "model-00023-of-00026.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3.6-35B-A3B/resolve/main/model-00023-of-00026.safetensors?download=true"
        },
        {
          "label": "model-00024-of-00026.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3.6-35B-A3B/resolve/main/model-00024-of-00026.safetensors?download=true"
        },
        {
          "label": "model-00025-of-00026.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3.6-35B-A3B/resolve/main/model-00025-of-00026.safetensors?download=true"
        },
        {
          "label": "model-00026-of-00026.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3.6-35B-A3B/resolve/main/model-00026-of-00026.safetensors?download=true"
        }
      ]
    },
    {
      "repo": "Qwen/Qwen-Image-2.1",
      "bRating": "Unknown",
      "parameters": "Unknown",
      "size": "30.8 GB",
      "files": [
        {
          "label": "text_encoder/model-00001-of-00004.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen-Image-2.1/resolve/main/text_encoder/model-00001-of-00004.safetensors?download=true"
        },
        {
          "label": "text_encoder/model-00002-of-00004.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen-Image-2.1/resolve/main/text_encoder/model-00002-of-00004.safetensors?download=true"
        },
        {
          "label": "text_encoder/model-00003-of-00004.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen-Image-2.1/resolve/main/text_encoder/model-00003-of-00004.safetensors?download=true"
        },
        {
          "label": "text_encoder/model-00004-of-00004.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen-Image-2.1/resolve/main/text_encoder/model-00004-of-00004.safetensors?download=true"
        },
        {
          "label": "transformer/diffusion_pytorch_model-00001-of-00002.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen-Image-2.1/resolve/main/transformer/diffusion_pytorch_model-00001-of-00002.safetensors?download=true"
        },
        {
          "label": "transformer/diffusion_pytorch_model-00002-of-00002.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen-Image-2.1/resolve/main/transformer/diffusion_pytorch_model-00002-of-00002.safetensors?download=true"
        },
        {
          "label": "vae/diffusion_pytorch_model.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen-Image-2.1/resolve/main/vae/diffusion_pytorch_model.safetensors?download=true"
        }
      ]
    }
  ],
  "deepseek-local": [
    {
      "repo": "deepseek-ai/DeepSeek-R1-Distill-Qwen-7B",
      "bRating": "7B",
      "parameters": "7B",
      "size": "14.2 GB",
      "files": [
        {
          "label": "model-00001-of-000002.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-R1-Distill-Qwen-7B/resolve/main/model-00001-of-000002.safetensors?download=true"
        },
        {
          "label": "model-00002-of-000002.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-R1-Distill-Qwen-7B/resolve/main/model-00002-of-000002.safetensors?download=true"
        }
      ]
    },
    {
      "repo": "deepseek-ai/DeepSeek-R1-Distill-Qwen-14B",
      "bRating": "14B",
      "parameters": "14B",
      "size": "27.5 GB",
      "files": [
        {
          "label": "model-00001-of-000004.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-R1-Distill-Qwen-14B/resolve/main/model-00001-of-000004.safetensors?download=true"
        },
        {
          "label": "model-00002-of-000004.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-R1-Distill-Qwen-14B/resolve/main/model-00002-of-000004.safetensors?download=true"
        },
        {
          "label": "model-00003-of-000004.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-R1-Distill-Qwen-14B/resolve/main/model-00003-of-000004.safetensors?download=true"
        },
        {
          "label": "model-00004-of-000004.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-R1-Distill-Qwen-14B/resolve/main/model-00004-of-000004.safetensors?download=true"
        }
      ]
    },
    {
      "repo": "deepseek-ai/DeepSeek-R1-Distill-Qwen-32B",
      "bRating": "32B",
      "parameters": "32B",
      "size": "61.0 GB",
      "files": [
        {
          "label": "model-00001-of-000008.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-R1-Distill-Qwen-32B/resolve/main/model-00001-of-000008.safetensors?download=true"
        },
        {
          "label": "model-00002-of-000008.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-R1-Distill-Qwen-32B/resolve/main/model-00002-of-000008.safetensors?download=true"
        },
        {
          "label": "model-00003-of-000008.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-R1-Distill-Qwen-32B/resolve/main/model-00003-of-000008.safetensors?download=true"
        },
        {
          "label": "model-00004-of-000008.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-R1-Distill-Qwen-32B/resolve/main/model-00004-of-000008.safetensors?download=true"
        },
        {
          "label": "model-00005-of-000008.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-R1-Distill-Qwen-32B/resolve/main/model-00005-of-000008.safetensors?download=true"
        },
        {
          "label": "model-00006-of-000008.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-R1-Distill-Qwen-32B/resolve/main/model-00006-of-000008.safetensors?download=true"
        },
        {
          "label": "model-00007-of-000008.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-R1-Distill-Qwen-32B/resolve/main/model-00007-of-000008.safetensors?download=true"
        },
        {
          "label": "model-00008-of-000008.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-R1-Distill-Qwen-32B/resolve/main/model-00008-of-000008.safetensors?download=true"
        }
      ]
    },
    {
      "repo": "deepseek-ai/DeepSeek-R1-Distill-Llama-8B",
      "bRating": "8B",
      "parameters": "8B",
      "size": "15.0 GB",
      "files": [
        {
          "label": "model-00001-of-000002.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-R1-Distill-Llama-8B/resolve/main/model-00001-of-000002.safetensors?download=true"
        },
        {
          "label": "model-00002-of-000002.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-R1-Distill-Llama-8B/resolve/main/model-00002-of-000002.safetensors?download=true"
        }
      ]
    },
    {
      "repo": "deepseek-ai/DeepSeek-R1-Distill-Llama-70B",
      "bRating": "70B",
      "parameters": "70B",
      "size": "131.4 GB",
      "files": [
        {
          "label": "model-00001-of-000017.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-R1-Distill-Llama-70B/resolve/main/model-00001-of-000017.safetensors?download=true"
        },
        {
          "label": "model-00002-of-000017.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-R1-Distill-Llama-70B/resolve/main/model-00002-of-000017.safetensors?download=true"
        },
        {
          "label": "model-00003-of-000017.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-R1-Distill-Llama-70B/resolve/main/model-00003-of-000017.safetensors?download=true"
        },
        {
          "label": "model-00004-of-000017.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-R1-Distill-Llama-70B/resolve/main/model-00004-of-000017.safetensors?download=true"
        },
        {
          "label": "model-00005-of-000017.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-R1-Distill-Llama-70B/resolve/main/model-00005-of-000017.safetensors?download=true"
        },
        {
          "label": "model-00006-of-000017.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-R1-Distill-Llama-70B/resolve/main/model-00006-of-000017.safetensors?download=true"
        },
        {
          "label": "model-00007-of-000017.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-R1-Distill-Llama-70B/resolve/main/model-00007-of-000017.safetensors?download=true"
        },
        {
          "label": "model-00008-of-000017.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-R1-Distill-Llama-70B/resolve/main/model-00008-of-000017.safetensors?download=true"
        },
        {
          "label": "model-00009-of-000017.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-R1-Distill-Llama-70B/resolve/main/model-00009-of-000017.safetensors?download=true"
        },
        {
          "label": "model-00010-of-000017.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-R1-Distill-Llama-70B/resolve/main/model-00010-of-000017.safetensors?download=true"
        },
        {
          "label": "model-00011-of-000017.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-R1-Distill-Llama-70B/resolve/main/model-00011-of-000017.safetensors?download=true"
        },
        {
          "label": "model-00012-of-000017.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-R1-Distill-Llama-70B/resolve/main/model-00012-of-000017.safetensors?download=true"
        },
        {
          "label": "model-00013-of-000017.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-R1-Distill-Llama-70B/resolve/main/model-00013-of-000017.safetensors?download=true"
        },
        {
          "label": "model-00014-of-000017.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-R1-Distill-Llama-70B/resolve/main/model-00014-of-000017.safetensors?download=true"
        },
        {
          "label": "model-00015-of-000017.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-R1-Distill-Llama-70B/resolve/main/model-00015-of-000017.safetensors?download=true"
        },
        {
          "label": "model-00016-of-000017.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-R1-Distill-Llama-70B/resolve/main/model-00016-of-000017.safetensors?download=true"
        },
        {
          "label": "model-00017-of-000017.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-R1-Distill-Llama-70B/resolve/main/model-00017-of-000017.safetensors?download=true"
        }
      ]
    },
    {
      "repo": "deepseek-ai/DeepSeek-V3",
      "bRating": "671B",
      "parameters": "671B",
      "size": "641.3 GB",
      "files": [
        {
          "label": "model-00001-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3/resolve/main/model-00001-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00002-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3/resolve/main/model-00002-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00003-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3/resolve/main/model-00003-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00004-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3/resolve/main/model-00004-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00005-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3/resolve/main/model-00005-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00006-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3/resolve/main/model-00006-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00007-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3/resolve/main/model-00007-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00008-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3/resolve/main/model-00008-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00009-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3/resolve/main/model-00009-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00010-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3/resolve/main/model-00010-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00011-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3/resolve/main/model-00011-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00012-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3/resolve/main/model-00012-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00013-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3/resolve/main/model-00013-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00014-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3/resolve/main/model-00014-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00015-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3/resolve/main/model-00015-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00016-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3/resolve/main/model-00016-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00017-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3/resolve/main/model-00017-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00018-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3/resolve/main/model-00018-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00019-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3/resolve/main/model-00019-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00020-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3/resolve/main/model-00020-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00021-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3/resolve/main/model-00021-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00022-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3/resolve/main/model-00022-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00023-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3/resolve/main/model-00023-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00024-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3/resolve/main/model-00024-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00025-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3/resolve/main/model-00025-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00026-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3/resolve/main/model-00026-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00027-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3/resolve/main/model-00027-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00028-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3/resolve/main/model-00028-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00029-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3/resolve/main/model-00029-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00030-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3/resolve/main/model-00030-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00031-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3/resolve/main/model-00031-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00032-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3/resolve/main/model-00032-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00033-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3/resolve/main/model-00033-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00034-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3/resolve/main/model-00034-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00035-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3/resolve/main/model-00035-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00036-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3/resolve/main/model-00036-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00037-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3/resolve/main/model-00037-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00038-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3/resolve/main/model-00038-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00039-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3/resolve/main/model-00039-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00040-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3/resolve/main/model-00040-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00041-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3/resolve/main/model-00041-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00042-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3/resolve/main/model-00042-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00043-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3/resolve/main/model-00043-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00044-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3/resolve/main/model-00044-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00045-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3/resolve/main/model-00045-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00046-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3/resolve/main/model-00046-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00047-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3/resolve/main/model-00047-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00048-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3/resolve/main/model-00048-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00049-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3/resolve/main/model-00049-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00050-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3/resolve/main/model-00050-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00051-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3/resolve/main/model-00051-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00052-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3/resolve/main/model-00052-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00053-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3/resolve/main/model-00053-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00054-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3/resolve/main/model-00054-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00055-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3/resolve/main/model-00055-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00056-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3/resolve/main/model-00056-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00057-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3/resolve/main/model-00057-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00058-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3/resolve/main/model-00058-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00059-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3/resolve/main/model-00059-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00060-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3/resolve/main/model-00060-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00061-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3/resolve/main/model-00061-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00062-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3/resolve/main/model-00062-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00063-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3/resolve/main/model-00063-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00064-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3/resolve/main/model-00064-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00065-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3/resolve/main/model-00065-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00066-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3/resolve/main/model-00066-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00067-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3/resolve/main/model-00067-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00068-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3/resolve/main/model-00068-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00069-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3/resolve/main/model-00069-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00070-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3/resolve/main/model-00070-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00071-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3/resolve/main/model-00071-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00072-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3/resolve/main/model-00072-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00073-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3/resolve/main/model-00073-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00074-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3/resolve/main/model-00074-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00075-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3/resolve/main/model-00075-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00076-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3/resolve/main/model-00076-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00077-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3/resolve/main/model-00077-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00078-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3/resolve/main/model-00078-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00079-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3/resolve/main/model-00079-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00080-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3/resolve/main/model-00080-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00081-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3/resolve/main/model-00081-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00082-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3/resolve/main/model-00082-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00083-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3/resolve/main/model-00083-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00084-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3/resolve/main/model-00084-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00085-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3/resolve/main/model-00085-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00086-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3/resolve/main/model-00086-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00087-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3/resolve/main/model-00087-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00088-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3/resolve/main/model-00088-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00089-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3/resolve/main/model-00089-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00090-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3/resolve/main/model-00090-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00091-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3/resolve/main/model-00091-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00092-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3/resolve/main/model-00092-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00093-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3/resolve/main/model-00093-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00094-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3/resolve/main/model-00094-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00095-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3/resolve/main/model-00095-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00096-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3/resolve/main/model-00096-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00097-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3/resolve/main/model-00097-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00098-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3/resolve/main/model-00098-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00099-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3/resolve/main/model-00099-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00100-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3/resolve/main/model-00100-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00101-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3/resolve/main/model-00101-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00102-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3/resolve/main/model-00102-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00103-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3/resolve/main/model-00103-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00104-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3/resolve/main/model-00104-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00105-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3/resolve/main/model-00105-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00106-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3/resolve/main/model-00106-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00107-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3/resolve/main/model-00107-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00108-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3/resolve/main/model-00108-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00109-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3/resolve/main/model-00109-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00110-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3/resolve/main/model-00110-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00111-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3/resolve/main/model-00111-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00112-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3/resolve/main/model-00112-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00113-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3/resolve/main/model-00113-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00114-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3/resolve/main/model-00114-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00115-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3/resolve/main/model-00115-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00116-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3/resolve/main/model-00116-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00117-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3/resolve/main/model-00117-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00118-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3/resolve/main/model-00118-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00119-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3/resolve/main/model-00119-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00120-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3/resolve/main/model-00120-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00121-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3/resolve/main/model-00121-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00122-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3/resolve/main/model-00122-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00123-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3/resolve/main/model-00123-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00124-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3/resolve/main/model-00124-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00125-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3/resolve/main/model-00125-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00126-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3/resolve/main/model-00126-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00127-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3/resolve/main/model-00127-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00128-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3/resolve/main/model-00128-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00129-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3/resolve/main/model-00129-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00130-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3/resolve/main/model-00130-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00131-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3/resolve/main/model-00131-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00132-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3/resolve/main/model-00132-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00133-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3/resolve/main/model-00133-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00134-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3/resolve/main/model-00134-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00135-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3/resolve/main/model-00135-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00136-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3/resolve/main/model-00136-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00137-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3/resolve/main/model-00137-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00138-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3/resolve/main/model-00138-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00139-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3/resolve/main/model-00139-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00140-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3/resolve/main/model-00140-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00141-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3/resolve/main/model-00141-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00142-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3/resolve/main/model-00142-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00143-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3/resolve/main/model-00143-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00144-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3/resolve/main/model-00144-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00145-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3/resolve/main/model-00145-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00146-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3/resolve/main/model-00146-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00147-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3/resolve/main/model-00147-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00148-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3/resolve/main/model-00148-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00149-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3/resolve/main/model-00149-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00150-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3/resolve/main/model-00150-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00151-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3/resolve/main/model-00151-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00152-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3/resolve/main/model-00152-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00153-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3/resolve/main/model-00153-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00154-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3/resolve/main/model-00154-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00155-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3/resolve/main/model-00155-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00156-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3/resolve/main/model-00156-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00157-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3/resolve/main/model-00157-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00158-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3/resolve/main/model-00158-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00159-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3/resolve/main/model-00159-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00160-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3/resolve/main/model-00160-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00161-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3/resolve/main/model-00161-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00162-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3/resolve/main/model-00162-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00163-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3/resolve/main/model-00163-of-000163.safetensors?download=true"
        }
      ]
    },
    {
      "repo": "deepseek-ai/DeepSeek-V3-0324",
      "bRating": "671B",
      "parameters": "671B",
      "size": "641.3 GB",
      "files": [
        {
          "label": "model-00001-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3-0324/resolve/main/model-00001-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00002-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3-0324/resolve/main/model-00002-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00003-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3-0324/resolve/main/model-00003-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00004-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3-0324/resolve/main/model-00004-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00005-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3-0324/resolve/main/model-00005-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00006-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3-0324/resolve/main/model-00006-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00007-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3-0324/resolve/main/model-00007-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00008-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3-0324/resolve/main/model-00008-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00009-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3-0324/resolve/main/model-00009-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00010-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3-0324/resolve/main/model-00010-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00011-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3-0324/resolve/main/model-00011-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00012-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3-0324/resolve/main/model-00012-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00013-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3-0324/resolve/main/model-00013-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00014-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3-0324/resolve/main/model-00014-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00015-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3-0324/resolve/main/model-00015-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00016-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3-0324/resolve/main/model-00016-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00017-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3-0324/resolve/main/model-00017-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00018-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3-0324/resolve/main/model-00018-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00019-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3-0324/resolve/main/model-00019-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00020-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3-0324/resolve/main/model-00020-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00021-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3-0324/resolve/main/model-00021-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00022-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3-0324/resolve/main/model-00022-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00023-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3-0324/resolve/main/model-00023-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00024-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3-0324/resolve/main/model-00024-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00025-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3-0324/resolve/main/model-00025-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00026-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3-0324/resolve/main/model-00026-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00027-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3-0324/resolve/main/model-00027-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00028-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3-0324/resolve/main/model-00028-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00029-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3-0324/resolve/main/model-00029-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00030-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3-0324/resolve/main/model-00030-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00031-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3-0324/resolve/main/model-00031-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00032-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3-0324/resolve/main/model-00032-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00033-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3-0324/resolve/main/model-00033-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00034-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3-0324/resolve/main/model-00034-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00035-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3-0324/resolve/main/model-00035-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00036-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3-0324/resolve/main/model-00036-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00037-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3-0324/resolve/main/model-00037-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00038-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3-0324/resolve/main/model-00038-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00039-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3-0324/resolve/main/model-00039-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00040-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3-0324/resolve/main/model-00040-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00041-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3-0324/resolve/main/model-00041-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00042-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3-0324/resolve/main/model-00042-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00043-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3-0324/resolve/main/model-00043-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00044-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3-0324/resolve/main/model-00044-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00045-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3-0324/resolve/main/model-00045-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00046-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3-0324/resolve/main/model-00046-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00047-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3-0324/resolve/main/model-00047-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00048-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3-0324/resolve/main/model-00048-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00049-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3-0324/resolve/main/model-00049-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00050-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3-0324/resolve/main/model-00050-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00051-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3-0324/resolve/main/model-00051-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00052-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3-0324/resolve/main/model-00052-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00053-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3-0324/resolve/main/model-00053-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00054-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3-0324/resolve/main/model-00054-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00055-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3-0324/resolve/main/model-00055-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00056-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3-0324/resolve/main/model-00056-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00057-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3-0324/resolve/main/model-00057-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00058-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3-0324/resolve/main/model-00058-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00059-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3-0324/resolve/main/model-00059-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00060-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3-0324/resolve/main/model-00060-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00061-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3-0324/resolve/main/model-00061-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00062-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3-0324/resolve/main/model-00062-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00063-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3-0324/resolve/main/model-00063-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00064-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3-0324/resolve/main/model-00064-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00065-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3-0324/resolve/main/model-00065-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00066-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3-0324/resolve/main/model-00066-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00067-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3-0324/resolve/main/model-00067-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00068-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3-0324/resolve/main/model-00068-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00069-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3-0324/resolve/main/model-00069-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00070-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3-0324/resolve/main/model-00070-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00071-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3-0324/resolve/main/model-00071-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00072-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3-0324/resolve/main/model-00072-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00073-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3-0324/resolve/main/model-00073-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00074-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3-0324/resolve/main/model-00074-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00075-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3-0324/resolve/main/model-00075-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00076-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3-0324/resolve/main/model-00076-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00077-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3-0324/resolve/main/model-00077-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00078-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3-0324/resolve/main/model-00078-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00079-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3-0324/resolve/main/model-00079-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00080-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3-0324/resolve/main/model-00080-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00081-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3-0324/resolve/main/model-00081-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00082-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3-0324/resolve/main/model-00082-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00083-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3-0324/resolve/main/model-00083-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00084-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3-0324/resolve/main/model-00084-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00085-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3-0324/resolve/main/model-00085-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00086-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3-0324/resolve/main/model-00086-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00087-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3-0324/resolve/main/model-00087-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00088-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3-0324/resolve/main/model-00088-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00089-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3-0324/resolve/main/model-00089-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00090-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3-0324/resolve/main/model-00090-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00091-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3-0324/resolve/main/model-00091-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00092-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3-0324/resolve/main/model-00092-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00093-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3-0324/resolve/main/model-00093-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00094-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3-0324/resolve/main/model-00094-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00095-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3-0324/resolve/main/model-00095-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00096-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3-0324/resolve/main/model-00096-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00097-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3-0324/resolve/main/model-00097-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00098-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3-0324/resolve/main/model-00098-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00099-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3-0324/resolve/main/model-00099-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00100-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3-0324/resolve/main/model-00100-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00101-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3-0324/resolve/main/model-00101-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00102-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3-0324/resolve/main/model-00102-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00103-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3-0324/resolve/main/model-00103-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00104-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3-0324/resolve/main/model-00104-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00105-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3-0324/resolve/main/model-00105-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00106-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3-0324/resolve/main/model-00106-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00107-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3-0324/resolve/main/model-00107-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00108-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3-0324/resolve/main/model-00108-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00109-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3-0324/resolve/main/model-00109-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00110-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3-0324/resolve/main/model-00110-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00111-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3-0324/resolve/main/model-00111-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00112-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3-0324/resolve/main/model-00112-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00113-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3-0324/resolve/main/model-00113-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00114-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3-0324/resolve/main/model-00114-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00115-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3-0324/resolve/main/model-00115-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00116-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3-0324/resolve/main/model-00116-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00117-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3-0324/resolve/main/model-00117-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00118-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3-0324/resolve/main/model-00118-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00119-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3-0324/resolve/main/model-00119-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00120-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3-0324/resolve/main/model-00120-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00121-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3-0324/resolve/main/model-00121-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00122-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3-0324/resolve/main/model-00122-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00123-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3-0324/resolve/main/model-00123-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00124-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3-0324/resolve/main/model-00124-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00125-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3-0324/resolve/main/model-00125-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00126-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3-0324/resolve/main/model-00126-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00127-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3-0324/resolve/main/model-00127-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00128-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3-0324/resolve/main/model-00128-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00129-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3-0324/resolve/main/model-00129-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00130-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3-0324/resolve/main/model-00130-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00131-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3-0324/resolve/main/model-00131-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00132-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3-0324/resolve/main/model-00132-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00133-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3-0324/resolve/main/model-00133-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00134-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3-0324/resolve/main/model-00134-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00135-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3-0324/resolve/main/model-00135-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00136-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3-0324/resolve/main/model-00136-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00137-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3-0324/resolve/main/model-00137-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00138-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3-0324/resolve/main/model-00138-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00139-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3-0324/resolve/main/model-00139-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00140-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3-0324/resolve/main/model-00140-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00141-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3-0324/resolve/main/model-00141-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00142-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3-0324/resolve/main/model-00142-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00143-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3-0324/resolve/main/model-00143-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00144-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3-0324/resolve/main/model-00144-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00145-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3-0324/resolve/main/model-00145-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00146-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3-0324/resolve/main/model-00146-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00147-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3-0324/resolve/main/model-00147-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00148-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3-0324/resolve/main/model-00148-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00149-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3-0324/resolve/main/model-00149-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00150-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3-0324/resolve/main/model-00150-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00151-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3-0324/resolve/main/model-00151-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00152-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3-0324/resolve/main/model-00152-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00153-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3-0324/resolve/main/model-00153-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00154-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3-0324/resolve/main/model-00154-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00155-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3-0324/resolve/main/model-00155-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00156-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3-0324/resolve/main/model-00156-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00157-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3-0324/resolve/main/model-00157-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00158-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3-0324/resolve/main/model-00158-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00159-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3-0324/resolve/main/model-00159-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00160-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3-0324/resolve/main/model-00160-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00161-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3-0324/resolve/main/model-00161-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00162-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3-0324/resolve/main/model-00162-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00163-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3-0324/resolve/main/model-00163-of-000163.safetensors?download=true"
        }
      ]
    },
    {
      "repo": "deepseek-ai/DeepSeek-R1",
      "bRating": "671B",
      "parameters": "671B",
      "size": "641.3 GB",
      "files": [
        {
          "label": "model-00001-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-R1/resolve/main/model-00001-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00002-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-R1/resolve/main/model-00002-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00003-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-R1/resolve/main/model-00003-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00004-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-R1/resolve/main/model-00004-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00005-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-R1/resolve/main/model-00005-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00006-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-R1/resolve/main/model-00006-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00007-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-R1/resolve/main/model-00007-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00008-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-R1/resolve/main/model-00008-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00009-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-R1/resolve/main/model-00009-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00010-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-R1/resolve/main/model-00010-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00011-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-R1/resolve/main/model-00011-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00012-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-R1/resolve/main/model-00012-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00013-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-R1/resolve/main/model-00013-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00014-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-R1/resolve/main/model-00014-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00015-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-R1/resolve/main/model-00015-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00016-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-R1/resolve/main/model-00016-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00017-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-R1/resolve/main/model-00017-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00018-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-R1/resolve/main/model-00018-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00019-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-R1/resolve/main/model-00019-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00020-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-R1/resolve/main/model-00020-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00021-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-R1/resolve/main/model-00021-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00022-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-R1/resolve/main/model-00022-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00023-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-R1/resolve/main/model-00023-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00024-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-R1/resolve/main/model-00024-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00025-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-R1/resolve/main/model-00025-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00026-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-R1/resolve/main/model-00026-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00027-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-R1/resolve/main/model-00027-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00028-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-R1/resolve/main/model-00028-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00029-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-R1/resolve/main/model-00029-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00030-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-R1/resolve/main/model-00030-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00031-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-R1/resolve/main/model-00031-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00032-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-R1/resolve/main/model-00032-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00033-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-R1/resolve/main/model-00033-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00034-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-R1/resolve/main/model-00034-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00035-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-R1/resolve/main/model-00035-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00036-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-R1/resolve/main/model-00036-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00037-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-R1/resolve/main/model-00037-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00038-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-R1/resolve/main/model-00038-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00039-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-R1/resolve/main/model-00039-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00040-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-R1/resolve/main/model-00040-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00041-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-R1/resolve/main/model-00041-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00042-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-R1/resolve/main/model-00042-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00043-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-R1/resolve/main/model-00043-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00044-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-R1/resolve/main/model-00044-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00045-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-R1/resolve/main/model-00045-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00046-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-R1/resolve/main/model-00046-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00047-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-R1/resolve/main/model-00047-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00048-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-R1/resolve/main/model-00048-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00049-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-R1/resolve/main/model-00049-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00050-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-R1/resolve/main/model-00050-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00051-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-R1/resolve/main/model-00051-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00052-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-R1/resolve/main/model-00052-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00053-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-R1/resolve/main/model-00053-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00054-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-R1/resolve/main/model-00054-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00055-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-R1/resolve/main/model-00055-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00056-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-R1/resolve/main/model-00056-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00057-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-R1/resolve/main/model-00057-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00058-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-R1/resolve/main/model-00058-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00059-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-R1/resolve/main/model-00059-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00060-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-R1/resolve/main/model-00060-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00061-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-R1/resolve/main/model-00061-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00062-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-R1/resolve/main/model-00062-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00063-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-R1/resolve/main/model-00063-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00064-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-R1/resolve/main/model-00064-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00065-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-R1/resolve/main/model-00065-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00066-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-R1/resolve/main/model-00066-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00067-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-R1/resolve/main/model-00067-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00068-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-R1/resolve/main/model-00068-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00069-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-R1/resolve/main/model-00069-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00070-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-R1/resolve/main/model-00070-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00071-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-R1/resolve/main/model-00071-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00072-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-R1/resolve/main/model-00072-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00073-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-R1/resolve/main/model-00073-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00074-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-R1/resolve/main/model-00074-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00075-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-R1/resolve/main/model-00075-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00076-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-R1/resolve/main/model-00076-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00077-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-R1/resolve/main/model-00077-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00078-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-R1/resolve/main/model-00078-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00079-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-R1/resolve/main/model-00079-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00080-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-R1/resolve/main/model-00080-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00081-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-R1/resolve/main/model-00081-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00082-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-R1/resolve/main/model-00082-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00083-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-R1/resolve/main/model-00083-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00084-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-R1/resolve/main/model-00084-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00085-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-R1/resolve/main/model-00085-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00086-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-R1/resolve/main/model-00086-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00087-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-R1/resolve/main/model-00087-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00088-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-R1/resolve/main/model-00088-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00089-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-R1/resolve/main/model-00089-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00090-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-R1/resolve/main/model-00090-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00091-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-R1/resolve/main/model-00091-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00092-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-R1/resolve/main/model-00092-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00093-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-R1/resolve/main/model-00093-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00094-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-R1/resolve/main/model-00094-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00095-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-R1/resolve/main/model-00095-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00096-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-R1/resolve/main/model-00096-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00097-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-R1/resolve/main/model-00097-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00098-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-R1/resolve/main/model-00098-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00099-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-R1/resolve/main/model-00099-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00100-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-R1/resolve/main/model-00100-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00101-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-R1/resolve/main/model-00101-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00102-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-R1/resolve/main/model-00102-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00103-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-R1/resolve/main/model-00103-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00104-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-R1/resolve/main/model-00104-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00105-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-R1/resolve/main/model-00105-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00106-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-R1/resolve/main/model-00106-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00107-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-R1/resolve/main/model-00107-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00108-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-R1/resolve/main/model-00108-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00109-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-R1/resolve/main/model-00109-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00110-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-R1/resolve/main/model-00110-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00111-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-R1/resolve/main/model-00111-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00112-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-R1/resolve/main/model-00112-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00113-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-R1/resolve/main/model-00113-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00114-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-R1/resolve/main/model-00114-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00115-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-R1/resolve/main/model-00115-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00116-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-R1/resolve/main/model-00116-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00117-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-R1/resolve/main/model-00117-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00118-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-R1/resolve/main/model-00118-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00119-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-R1/resolve/main/model-00119-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00120-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-R1/resolve/main/model-00120-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00121-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-R1/resolve/main/model-00121-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00122-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-R1/resolve/main/model-00122-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00123-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-R1/resolve/main/model-00123-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00124-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-R1/resolve/main/model-00124-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00125-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-R1/resolve/main/model-00125-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00126-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-R1/resolve/main/model-00126-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00127-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-R1/resolve/main/model-00127-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00128-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-R1/resolve/main/model-00128-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00129-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-R1/resolve/main/model-00129-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00130-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-R1/resolve/main/model-00130-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00131-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-R1/resolve/main/model-00131-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00132-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-R1/resolve/main/model-00132-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00133-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-R1/resolve/main/model-00133-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00134-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-R1/resolve/main/model-00134-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00135-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-R1/resolve/main/model-00135-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00136-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-R1/resolve/main/model-00136-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00137-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-R1/resolve/main/model-00137-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00138-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-R1/resolve/main/model-00138-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00139-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-R1/resolve/main/model-00139-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00140-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-R1/resolve/main/model-00140-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00141-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-R1/resolve/main/model-00141-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00142-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-R1/resolve/main/model-00142-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00143-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-R1/resolve/main/model-00143-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00144-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-R1/resolve/main/model-00144-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00145-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-R1/resolve/main/model-00145-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00146-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-R1/resolve/main/model-00146-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00147-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-R1/resolve/main/model-00147-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00148-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-R1/resolve/main/model-00148-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00149-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-R1/resolve/main/model-00149-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00150-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-R1/resolve/main/model-00150-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00151-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-R1/resolve/main/model-00151-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00152-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-R1/resolve/main/model-00152-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00153-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-R1/resolve/main/model-00153-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00154-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-R1/resolve/main/model-00154-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00155-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-R1/resolve/main/model-00155-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00156-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-R1/resolve/main/model-00156-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00157-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-R1/resolve/main/model-00157-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00158-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-R1/resolve/main/model-00158-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00159-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-R1/resolve/main/model-00159-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00160-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-R1/resolve/main/model-00160-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00161-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-R1/resolve/main/model-00161-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00162-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-R1/resolve/main/model-00162-of-000163.safetensors?download=true"
        },
        {
          "label": "model-00163-of-000163.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-R1/resolve/main/model-00163-of-000163.safetensors?download=true"
        }
      ]
    },
    {
      "repo": "deepseek-ai/DeepSeek-V4.1-Flash",
      "bRating": "763B",
      "parameters": "763B",
      "size": "475.3 GB",
      "files": [
        {
          "label": "model-00001-of-00048.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V4.1-Flash/resolve/main/model-00001-of-00048.safetensors?download=true"
        },
        {
          "label": "model-00002-of-00048.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V4.1-Flash/resolve/main/model-00002-of-00048.safetensors?download=true"
        },
        {
          "label": "model-00003-of-00048.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V4.1-Flash/resolve/main/model-00003-of-00048.safetensors?download=true"
        },
        {
          "label": "model-00004-of-00048.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V4.1-Flash/resolve/main/model-00004-of-00048.safetensors?download=true"
        },
        {
          "label": "model-00005-of-00048.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V4.1-Flash/resolve/main/model-00005-of-00048.safetensors?download=true"
        },
        {
          "label": "model-00006-of-00048.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V4.1-Flash/resolve/main/model-00006-of-00048.safetensors?download=true"
        },
        {
          "label": "model-00007-of-00048.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V4.1-Flash/resolve/main/model-00007-of-00048.safetensors?download=true"
        },
        {
          "label": "model-00008-of-00048.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V4.1-Flash/resolve/main/model-00008-of-00048.safetensors?download=true"
        },
        {
          "label": "model-00009-of-00048.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V4.1-Flash/resolve/main/model-00009-of-00048.safetensors?download=true"
        },
        {
          "label": "model-00010-of-00048.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V4.1-Flash/resolve/main/model-00010-of-00048.safetensors?download=true"
        },
        {
          "label": "model-00011-of-00048.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V4.1-Flash/resolve/main/model-00011-of-00048.safetensors?download=true"
        },
        {
          "label": "model-00012-of-00048.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V4.1-Flash/resolve/main/model-00012-of-00048.safetensors?download=true"
        },
        {
          "label": "model-00013-of-00048.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V4.1-Flash/resolve/main/model-00013-of-00048.safetensors?download=true"
        },
        {
          "label": "model-00014-of-00048.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V4.1-Flash/resolve/main/model-00014-of-00048.safetensors?download=true"
        },
        {
          "label": "model-00015-of-00048.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V4.1-Flash/resolve/main/model-00015-of-00048.safetensors?download=true"
        },
        {
          "label": "model-00016-of-00048.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V4.1-Flash/resolve/main/model-00016-of-00048.safetensors?download=true"
        },
        {
          "label": "model-00017-of-00048.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V4.1-Flash/resolve/main/model-00017-of-00048.safetensors?download=true"
        },
        {
          "label": "model-00018-of-00048.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V4.1-Flash/resolve/main/model-00018-of-00048.safetensors?download=true"
        },
        {
          "label": "model-00019-of-00048.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V4.1-Flash/resolve/main/model-00019-of-00048.safetensors?download=true"
        },
        {
          "label": "model-00020-of-00048.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V4.1-Flash/resolve/main/model-00020-of-00048.safetensors?download=true"
        },
        {
          "label": "model-00021-of-00048.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V4.1-Flash/resolve/main/model-00021-of-00048.safetensors?download=true"
        },
        {
          "label": "model-00022-of-00048.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V4.1-Flash/resolve/main/model-00022-of-00048.safetensors?download=true"
        },
        {
          "label": "model-00023-of-00048.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V4.1-Flash/resolve/main/model-00023-of-00048.safetensors?download=true"
        },
        {
          "label": "model-00024-of-00048.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V4.1-Flash/resolve/main/model-00024-of-00048.safetensors?download=true"
        },
        {
          "label": "model-00025-of-00048.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V4.1-Flash/resolve/main/model-00025-of-00048.safetensors?download=true"
        },
        {
          "label": "model-00026-of-00048.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V4.1-Flash/resolve/main/model-00026-of-00048.safetensors?download=true"
        },
        {
          "label": "model-00027-of-00048.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V4.1-Flash/resolve/main/model-00027-of-00048.safetensors?download=true"
        },
        {
          "label": "model-00028-of-00048.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V4.1-Flash/resolve/main/model-00028-of-00048.safetensors?download=true"
        },
        {
          "label": "model-00029-of-00048.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V4.1-Flash/resolve/main/model-00029-of-00048.safetensors?download=true"
        },
        {
          "label": "model-00030-of-00048.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V4.1-Flash/resolve/main/model-00030-of-00048.safetensors?download=true"
        },
        {
          "label": "model-00031-of-00048.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V4.1-Flash/resolve/main/model-00031-of-00048.safetensors?download=true"
        },
        {
          "label": "model-00032-of-00048.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V4.1-Flash/resolve/main/model-00032-of-00048.safetensors?download=true"
        },
        {
          "label": "model-00033-of-00048.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V4.1-Flash/resolve/main/model-00033-of-00048.safetensors?download=true"
        },
        {
          "label": "model-00034-of-00048.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V4.1-Flash/resolve/main/model-00034-of-00048.safetensors?download=true"
        },
        {
          "label": "model-00035-of-00048.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V4.1-Flash/resolve/main/model-00035-of-00048.safetensors?download=true"
        },
        {
          "label": "model-00036-of-00048.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V4.1-Flash/resolve/main/model-00036-of-00048.safetensors?download=true"
        },
        {
          "label": "model-00037-of-00048.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V4.1-Flash/resolve/main/model-00037-of-00048.safetensors?download=true"
        },
        {
          "label": "model-00038-of-00048.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V4.1-Flash/resolve/main/model-00038-of-00048.safetensors?download=true"
        },
        {
          "label": "model-00039-of-00048.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V4.1-Flash/resolve/main/model-00039-of-00048.safetensors?download=true"
        },
        {
          "label": "model-00040-of-00048.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V4.1-Flash/resolve/main/model-00040-of-00048.safetensors?download=true"
        },
        {
          "label": "model-00041-of-00048.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V4.1-Flash/resolve/main/model-00041-of-00048.safetensors?download=true"
        },
        {
          "label": "model-00042-of-00048.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V4.1-Flash/resolve/main/model-00042-of-00048.safetensors?download=true"
        },
        {
          "label": "model-00043-of-00048.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V4.1-Flash/resolve/main/model-00043-of-00048.safetensors?download=true"
        },
        {
          "label": "model-00044-of-00048.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V4.1-Flash/resolve/main/model-00044-of-00048.safetensors?download=true"
        },
        {
          "label": "model-00045-of-00048.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V4.1-Flash/resolve/main/model-00045-of-00048.safetensors?download=true"
        },
        {
          "label": "model-00046-of-00048.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V4.1-Flash/resolve/main/model-00046-of-00048.safetensors?download=true"
        },
        {
          "label": "model-00047-of-00048.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V4.1-Flash/resolve/main/model-00047-of-00048.safetensors?download=true"
        },
        {
          "label": "model-00048-of-00048.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V4.1-Flash/resolve/main/model-00048-of-00048.safetensors?download=true"
        }
      ]
    },
    {
      "repo": "deepseek-ai/DeepSeek-V4-Flash-Vision-Exp",
      "bRating": "Unknown",
      "parameters": "Unknown",
      "size": "156.3 GB",
      "files": [
        {
          "label": "model-00001-of-00048.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V4-Flash-Vision-Exp/resolve/main/model-00001-of-00048.safetensors?download=true"
        },
        {
          "label": "model-00002-of-00048.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V4-Flash-Vision-Exp/resolve/main/model-00002-of-00048.safetensors?download=true"
        },
        {
          "label": "model-00003-of-00048.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V4-Flash-Vision-Exp/resolve/main/model-00003-of-00048.safetensors?download=true"
        },
        {
          "label": "model-00004-of-00048.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V4-Flash-Vision-Exp/resolve/main/model-00004-of-00048.safetensors?download=true"
        },
        {
          "label": "model-00005-of-00048.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V4-Flash-Vision-Exp/resolve/main/model-00005-of-00048.safetensors?download=true"
        },
        {
          "label": "model-00006-of-00048.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V4-Flash-Vision-Exp/resolve/main/model-00006-of-00048.safetensors?download=true"
        },
        {
          "label": "model-00007-of-00048.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V4-Flash-Vision-Exp/resolve/main/model-00007-of-00048.safetensors?download=true"
        },
        {
          "label": "model-00008-of-00048.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V4-Flash-Vision-Exp/resolve/main/model-00008-of-00048.safetensors?download=true"
        },
        {
          "label": "model-00009-of-00048.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V4-Flash-Vision-Exp/resolve/main/model-00009-of-00048.safetensors?download=true"
        },
        {
          "label": "model-00010-of-00048.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V4-Flash-Vision-Exp/resolve/main/model-00010-of-00048.safetensors?download=true"
        },
        {
          "label": "model-00011-of-00048.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V4-Flash-Vision-Exp/resolve/main/model-00011-of-00048.safetensors?download=true"
        },
        {
          "label": "model-00012-of-00048.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V4-Flash-Vision-Exp/resolve/main/model-00012-of-00048.safetensors?download=true"
        },
        {
          "label": "model-00013-of-00048.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V4-Flash-Vision-Exp/resolve/main/model-00013-of-00048.safetensors?download=true"
        },
        {
          "label": "model-00014-of-00048.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V4-Flash-Vision-Exp/resolve/main/model-00014-of-00048.safetensors?download=true"
        },
        {
          "label": "model-00015-of-00048.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V4-Flash-Vision-Exp/resolve/main/model-00015-of-00048.safetensors?download=true"
        },
        {
          "label": "model-00016-of-00048.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V4-Flash-Vision-Exp/resolve/main/model-00016-of-00048.safetensors?download=true"
        },
        {
          "label": "model-00017-of-00048.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V4-Flash-Vision-Exp/resolve/main/model-00017-of-00048.safetensors?download=true"
        },
        {
          "label": "model-00018-of-00048.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V4-Flash-Vision-Exp/resolve/main/model-00018-of-00048.safetensors?download=true"
        },
        {
          "label": "model-00019-of-00048.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V4-Flash-Vision-Exp/resolve/main/model-00019-of-00048.safetensors?download=true"
        },
        {
          "label": "model-00020-of-00048.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V4-Flash-Vision-Exp/resolve/main/model-00020-of-00048.safetensors?download=true"
        },
        {
          "label": "model-00021-of-00048.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V4-Flash-Vision-Exp/resolve/main/model-00021-of-00048.safetensors?download=true"
        },
        {
          "label": "model-00022-of-00048.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V4-Flash-Vision-Exp/resolve/main/model-00022-of-00048.safetensors?download=true"
        },
        {
          "label": "model-00023-of-00048.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V4-Flash-Vision-Exp/resolve/main/model-00023-of-00048.safetensors?download=true"
        },
        {
          "label": "model-00024-of-00048.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V4-Flash-Vision-Exp/resolve/main/model-00024-of-00048.safetensors?download=true"
        },
        {
          "label": "model-00025-of-00048.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V4-Flash-Vision-Exp/resolve/main/model-00025-of-00048.safetensors?download=true"
        },
        {
          "label": "model-00026-of-00048.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V4-Flash-Vision-Exp/resolve/main/model-00026-of-00048.safetensors?download=true"
        },
        {
          "label": "model-00027-of-00048.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V4-Flash-Vision-Exp/resolve/main/model-00027-of-00048.safetensors?download=true"
        },
        {
          "label": "model-00028-of-00048.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V4-Flash-Vision-Exp/resolve/main/model-00028-of-00048.safetensors?download=true"
        },
        {
          "label": "model-00029-of-00048.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V4-Flash-Vision-Exp/resolve/main/model-00029-of-00048.safetensors?download=true"
        },
        {
          "label": "model-00030-of-00048.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V4-Flash-Vision-Exp/resolve/main/model-00030-of-00048.safetensors?download=true"
        },
        {
          "label": "model-00031-of-00048.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V4-Flash-Vision-Exp/resolve/main/model-00031-of-00048.safetensors?download=true"
        },
        {
          "label": "model-00032-of-00048.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V4-Flash-Vision-Exp/resolve/main/model-00032-of-00048.safetensors?download=true"
        },
        {
          "label": "model-00033-of-00048.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V4-Flash-Vision-Exp/resolve/main/model-00033-of-00048.safetensors?download=true"
        },
        {
          "label": "model-00034-of-00048.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V4-Flash-Vision-Exp/resolve/main/model-00034-of-00048.safetensors?download=true"
        },
        {
          "label": "model-00035-of-00048.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V4-Flash-Vision-Exp/resolve/main/model-00035-of-00048.safetensors?download=true"
        },
        {
          "label": "model-00036-of-00048.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V4-Flash-Vision-Exp/resolve/main/model-00036-of-00048.safetensors?download=true"
        },
        {
          "label": "model-00037-of-00048.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V4-Flash-Vision-Exp/resolve/main/model-00037-of-00048.safetensors?download=true"
        },
        {
          "label": "model-00038-of-00048.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V4-Flash-Vision-Exp/resolve/main/model-00038-of-00048.safetensors?download=true"
        },
        {
          "label": "model-00039-of-00048.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V4-Flash-Vision-Exp/resolve/main/model-00039-of-00048.safetensors?download=true"
        },
        {
          "label": "model-00040-of-00048.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V4-Flash-Vision-Exp/resolve/main/model-00040-of-00048.safetensors?download=true"
        },
        {
          "label": "model-00041-of-00048.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V4-Flash-Vision-Exp/resolve/main/model-00041-of-00048.safetensors?download=true"
        },
        {
          "label": "model-00042-of-00048.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V4-Flash-Vision-Exp/resolve/main/model-00042-of-00048.safetensors?download=true"
        },
        {
          "label": "model-00043-of-00048.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V4-Flash-Vision-Exp/resolve/main/model-00043-of-00048.safetensors?download=true"
        },
        {
          "label": "model-00044-of-00048.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V4-Flash-Vision-Exp/resolve/main/model-00044-of-00048.safetensors?download=true"
        },
        {
          "label": "model-00045-of-00048.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V4-Flash-Vision-Exp/resolve/main/model-00045-of-00048.safetensors?download=true"
        },
        {
          "label": "model-00046-of-00048.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V4-Flash-Vision-Exp/resolve/main/model-00046-of-00048.safetensors?download=true"
        },
        {
          "label": "model-00047-of-00048.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V4-Flash-Vision-Exp/resolve/main/model-00047-of-00048.safetensors?download=true"
        },
        {
          "label": "model-00048-of-00048.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V4-Flash-Vision-Exp/resolve/main/model-00048-of-00048.safetensors?download=true"
        }
      ]
    }
  ],
  "grok-local": [
    {
      "repo": "hpcai-tech/grok-1",
      "bRating": "314B",
      "parameters": "314B",
      "size": "589.5 GB",
      "files": [
        {
          "label": "pytorch_model-00000.bin",
          "url": "https://huggingface.co/hpcai-tech/grok-1/resolve/main/pytorch_model-00000.bin?download=true"
        },
        {
          "label": "pytorch_model-00001.bin",
          "url": "https://huggingface.co/hpcai-tech/grok-1/resolve/main/pytorch_model-00001.bin?download=true"
        },
        {
          "label": "pytorch_model-00002.bin",
          "url": "https://huggingface.co/hpcai-tech/grok-1/resolve/main/pytorch_model-00002.bin?download=true"
        },
        {
          "label": "pytorch_model-00003.bin",
          "url": "https://huggingface.co/hpcai-tech/grok-1/resolve/main/pytorch_model-00003.bin?download=true"
        },
        {
          "label": "pytorch_model-00004.bin",
          "url": "https://huggingface.co/hpcai-tech/grok-1/resolve/main/pytorch_model-00004.bin?download=true"
        },
        {
          "label": "pytorch_model-00005.bin",
          "url": "https://huggingface.co/hpcai-tech/grok-1/resolve/main/pytorch_model-00005.bin?download=true"
        },
        {
          "label": "pytorch_model-00006.bin",
          "url": "https://huggingface.co/hpcai-tech/grok-1/resolve/main/pytorch_model-00006.bin?download=true"
        },
        {
          "label": "pytorch_model-00007.bin",
          "url": "https://huggingface.co/hpcai-tech/grok-1/resolve/main/pytorch_model-00007.bin?download=true"
        },
        {
          "label": "pytorch_model-00008.bin",
          "url": "https://huggingface.co/hpcai-tech/grok-1/resolve/main/pytorch_model-00008.bin?download=true"
        },
        {
          "label": "pytorch_model-00009.bin",
          "url": "https://huggingface.co/hpcai-tech/grok-1/resolve/main/pytorch_model-00009.bin?download=true"
        },
        {
          "label": "pytorch_model-00010.bin",
          "url": "https://huggingface.co/hpcai-tech/grok-1/resolve/main/pytorch_model-00010.bin?download=true"
        },
        {
          "label": "pytorch_model-00011.bin",
          "url": "https://huggingface.co/hpcai-tech/grok-1/resolve/main/pytorch_model-00011.bin?download=true"
        },
        {
          "label": "pytorch_model-00012.bin",
          "url": "https://huggingface.co/hpcai-tech/grok-1/resolve/main/pytorch_model-00012.bin?download=true"
        },
        {
          "label": "pytorch_model-00013.bin",
          "url": "https://huggingface.co/hpcai-tech/grok-1/resolve/main/pytorch_model-00013.bin?download=true"
        },
        {
          "label": "pytorch_model-00014.bin",
          "url": "https://huggingface.co/hpcai-tech/grok-1/resolve/main/pytorch_model-00014.bin?download=true"
        },
        {
          "label": "pytorch_model-00015.bin",
          "url": "https://huggingface.co/hpcai-tech/grok-1/resolve/main/pytorch_model-00015.bin?download=true"
        },
        {
          "label": "pytorch_model-00016.bin",
          "url": "https://huggingface.co/hpcai-tech/grok-1/resolve/main/pytorch_model-00016.bin?download=true"
        },
        {
          "label": "pytorch_model-00017.bin",
          "url": "https://huggingface.co/hpcai-tech/grok-1/resolve/main/pytorch_model-00017.bin?download=true"
        },
        {
          "label": "pytorch_model-00018.bin",
          "url": "https://huggingface.co/hpcai-tech/grok-1/resolve/main/pytorch_model-00018.bin?download=true"
        },
        {
          "label": "pytorch_model-00019.bin",
          "url": "https://huggingface.co/hpcai-tech/grok-1/resolve/main/pytorch_model-00019.bin?download=true"
        },
        {
          "label": "pytorch_model-00020.bin",
          "url": "https://huggingface.co/hpcai-tech/grok-1/resolve/main/pytorch_model-00020.bin?download=true"
        },
        {
          "label": "pytorch_model-00021.bin",
          "url": "https://huggingface.co/hpcai-tech/grok-1/resolve/main/pytorch_model-00021.bin?download=true"
        },
        {
          "label": "pytorch_model-00022.bin",
          "url": "https://huggingface.co/hpcai-tech/grok-1/resolve/main/pytorch_model-00022.bin?download=true"
        },
        {
          "label": "pytorch_model-00023.bin",
          "url": "https://huggingface.co/hpcai-tech/grok-1/resolve/main/pytorch_model-00023.bin?download=true"
        },
        {
          "label": "pytorch_model-00024.bin",
          "url": "https://huggingface.co/hpcai-tech/grok-1/resolve/main/pytorch_model-00024.bin?download=true"
        },
        {
          "label": "pytorch_model-00025.bin",
          "url": "https://huggingface.co/hpcai-tech/grok-1/resolve/main/pytorch_model-00025.bin?download=true"
        },
        {
          "label": "pytorch_model-00026.bin",
          "url": "https://huggingface.co/hpcai-tech/grok-1/resolve/main/pytorch_model-00026.bin?download=true"
        },
        {
          "label": "pytorch_model-00027.bin",
          "url": "https://huggingface.co/hpcai-tech/grok-1/resolve/main/pytorch_model-00027.bin?download=true"
        },
        {
          "label": "pytorch_model-00028.bin",
          "url": "https://huggingface.co/hpcai-tech/grok-1/resolve/main/pytorch_model-00028.bin?download=true"
        },
        {
          "label": "pytorch_model-00029.bin",
          "url": "https://huggingface.co/hpcai-tech/grok-1/resolve/main/pytorch_model-00029.bin?download=true"
        },
        {
          "label": "pytorch_model-00030.bin",
          "url": "https://huggingface.co/hpcai-tech/grok-1/resolve/main/pytorch_model-00030.bin?download=true"
        },
        {
          "label": "pytorch_model-00031.bin",
          "url": "https://huggingface.co/hpcai-tech/grok-1/resolve/main/pytorch_model-00031.bin?download=true"
        },
        {
          "label": "pytorch_model-00032.bin",
          "url": "https://huggingface.co/hpcai-tech/grok-1/resolve/main/pytorch_model-00032.bin?download=true"
        },
        {
          "label": "pytorch_model-00033.bin",
          "url": "https://huggingface.co/hpcai-tech/grok-1/resolve/main/pytorch_model-00033.bin?download=true"
        },
        {
          "label": "pytorch_model-00034.bin",
          "url": "https://huggingface.co/hpcai-tech/grok-1/resolve/main/pytorch_model-00034.bin?download=true"
        },
        {
          "label": "pytorch_model-00035.bin",
          "url": "https://huggingface.co/hpcai-tech/grok-1/resolve/main/pytorch_model-00035.bin?download=true"
        },
        {
          "label": "pytorch_model-00036.bin",
          "url": "https://huggingface.co/hpcai-tech/grok-1/resolve/main/pytorch_model-00036.bin?download=true"
        },
        {
          "label": "pytorch_model-00037.bin",
          "url": "https://huggingface.co/hpcai-tech/grok-1/resolve/main/pytorch_model-00037.bin?download=true"
        },
        {
          "label": "pytorch_model-00038.bin",
          "url": "https://huggingface.co/hpcai-tech/grok-1/resolve/main/pytorch_model-00038.bin?download=true"
        },
        {
          "label": "pytorch_model-00039.bin",
          "url": "https://huggingface.co/hpcai-tech/grok-1/resolve/main/pytorch_model-00039.bin?download=true"
        },
        {
          "label": "pytorch_model-00040.bin",
          "url": "https://huggingface.co/hpcai-tech/grok-1/resolve/main/pytorch_model-00040.bin?download=true"
        },
        {
          "label": "pytorch_model-00041.bin",
          "url": "https://huggingface.co/hpcai-tech/grok-1/resolve/main/pytorch_model-00041.bin?download=true"
        },
        {
          "label": "pytorch_model-00042.bin",
          "url": "https://huggingface.co/hpcai-tech/grok-1/resolve/main/pytorch_model-00042.bin?download=true"
        },
        {
          "label": "pytorch_model-00043.bin",
          "url": "https://huggingface.co/hpcai-tech/grok-1/resolve/main/pytorch_model-00043.bin?download=true"
        },
        {
          "label": "pytorch_model-00044.bin",
          "url": "https://huggingface.co/hpcai-tech/grok-1/resolve/main/pytorch_model-00044.bin?download=true"
        },
        {
          "label": "pytorch_model-00045.bin",
          "url": "https://huggingface.co/hpcai-tech/grok-1/resolve/main/pytorch_model-00045.bin?download=true"
        },
        {
          "label": "pytorch_model-00046.bin",
          "url": "https://huggingface.co/hpcai-tech/grok-1/resolve/main/pytorch_model-00046.bin?download=true"
        },
        {
          "label": "pytorch_model-00047.bin",
          "url": "https://huggingface.co/hpcai-tech/grok-1/resolve/main/pytorch_model-00047.bin?download=true"
        },
        {
          "label": "pytorch_model-00048.bin",
          "url": "https://huggingface.co/hpcai-tech/grok-1/resolve/main/pytorch_model-00048.bin?download=true"
        },
        {
          "label": "pytorch_model-00049.bin",
          "url": "https://huggingface.co/hpcai-tech/grok-1/resolve/main/pytorch_model-00049.bin?download=true"
        },
        {
          "label": "pytorch_model-00050.bin",
          "url": "https://huggingface.co/hpcai-tech/grok-1/resolve/main/pytorch_model-00050.bin?download=true"
        },
        {
          "label": "pytorch_model-00051.bin",
          "url": "https://huggingface.co/hpcai-tech/grok-1/resolve/main/pytorch_model-00051.bin?download=true"
        },
        {
          "label": "pytorch_model-00052.bin",
          "url": "https://huggingface.co/hpcai-tech/grok-1/resolve/main/pytorch_model-00052.bin?download=true"
        },
        {
          "label": "pytorch_model-00053.bin",
          "url": "https://huggingface.co/hpcai-tech/grok-1/resolve/main/pytorch_model-00053.bin?download=true"
        },
        {
          "label": "pytorch_model-00054.bin",
          "url": "https://huggingface.co/hpcai-tech/grok-1/resolve/main/pytorch_model-00054.bin?download=true"
        },
        {
          "label": "pytorch_model-00055.bin",
          "url": "https://huggingface.co/hpcai-tech/grok-1/resolve/main/pytorch_model-00055.bin?download=true"
        },
        {
          "label": "pytorch_model-00056.bin",
          "url": "https://huggingface.co/hpcai-tech/grok-1/resolve/main/pytorch_model-00056.bin?download=true"
        },
        {
          "label": "pytorch_model-00057.bin",
          "url": "https://huggingface.co/hpcai-tech/grok-1/resolve/main/pytorch_model-00057.bin?download=true"
        },
        {
          "label": "pytorch_model-00058.bin",
          "url": "https://huggingface.co/hpcai-tech/grok-1/resolve/main/pytorch_model-00058.bin?download=true"
        },
        {
          "label": "pytorch_model-00059.bin",
          "url": "https://huggingface.co/hpcai-tech/grok-1/resolve/main/pytorch_model-00059.bin?download=true"
        },
        {
          "label": "pytorch_model-00060.bin",
          "url": "https://huggingface.co/hpcai-tech/grok-1/resolve/main/pytorch_model-00060.bin?download=true"
        },
        {
          "label": "pytorch_model-00061.bin",
          "url": "https://huggingface.co/hpcai-tech/grok-1/resolve/main/pytorch_model-00061.bin?download=true"
        },
        {
          "label": "pytorch_model-00062.bin",
          "url": "https://huggingface.co/hpcai-tech/grok-1/resolve/main/pytorch_model-00062.bin?download=true"
        },
        {
          "label": "pytorch_model-00063.bin",
          "url": "https://huggingface.co/hpcai-tech/grok-1/resolve/main/pytorch_model-00063.bin?download=true"
        },
        {
          "label": "pytorch_model-00064.bin",
          "url": "https://huggingface.co/hpcai-tech/grok-1/resolve/main/pytorch_model-00064.bin?download=true"
        }
      ]
    }
  ],
  "granite-local": [
    {
      "repo": "ibm-granite/granite-3.0-2b-instruct",
      "bRating": "2B",
      "parameters": "2B",
      "size": "4.9 GB",
      "files": [
        {
          "label": "model-00001-of-00002.safetensors",
          "url": "https://huggingface.co/ibm-granite/granite-3.0-2b-instruct/resolve/main/model-00001-of-00002.safetensors?download=true"
        },
        {
          "label": "model-00002-of-00002.safetensors",
          "url": "https://huggingface.co/ibm-granite/granite-3.0-2b-instruct/resolve/main/model-00002-of-00002.safetensors?download=true"
        }
      ]
    },
    {
      "repo": "ibm-granite/granite-3.0-8b-instruct",
      "bRating": "8B",
      "parameters": "8B",
      "size": "15.2 GB",
      "files": [
        {
          "label": "model-00001-of-00004.safetensors",
          "url": "https://huggingface.co/ibm-granite/granite-3.0-8b-instruct/resolve/main/model-00001-of-00004.safetensors?download=true"
        },
        {
          "label": "model-00002-of-00004.safetensors",
          "url": "https://huggingface.co/ibm-granite/granite-3.0-8b-instruct/resolve/main/model-00002-of-00004.safetensors?download=true"
        },
        {
          "label": "model-00003-of-00004.safetensors",
          "url": "https://huggingface.co/ibm-granite/granite-3.0-8b-instruct/resolve/main/model-00003-of-00004.safetensors?download=true"
        },
        {
          "label": "model-00004-of-00004.safetensors",
          "url": "https://huggingface.co/ibm-granite/granite-3.0-8b-instruct/resolve/main/model-00004-of-00004.safetensors?download=true"
        }
      ]
    },
    {
      "repo": "ibm-granite/granite-3.1-2b-instruct",
      "bRating": "2B",
      "parameters": "2B",
      "size": "4.7 GB",
      "files": [
        {
          "label": "model-00001-of-00002.safetensors",
          "url": "https://huggingface.co/ibm-granite/granite-3.1-2b-instruct/resolve/main/model-00001-of-00002.safetensors?download=true"
        },
        {
          "label": "model-00002-of-00002.safetensors",
          "url": "https://huggingface.co/ibm-granite/granite-3.1-2b-instruct/resolve/main/model-00002-of-00002.safetensors?download=true"
        }
      ]
    },
    {
      "repo": "ibm-granite/granite-3.1-8b-instruct",
      "bRating": "8B",
      "parameters": "8B",
      "size": "15.2 GB",
      "files": [
        {
          "label": "model-00001-of-00004.safetensors",
          "url": "https://huggingface.co/ibm-granite/granite-3.1-8b-instruct/resolve/main/model-00001-of-00004.safetensors?download=true"
        },
        {
          "label": "model-00002-of-00004.safetensors",
          "url": "https://huggingface.co/ibm-granite/granite-3.1-8b-instruct/resolve/main/model-00002-of-00004.safetensors?download=true"
        },
        {
          "label": "model-00003-of-00004.safetensors",
          "url": "https://huggingface.co/ibm-granite/granite-3.1-8b-instruct/resolve/main/model-00003-of-00004.safetensors?download=true"
        },
        {
          "label": "model-00004-of-00004.safetensors",
          "url": "https://huggingface.co/ibm-granite/granite-3.1-8b-instruct/resolve/main/model-00004-of-00004.safetensors?download=true"
        }
      ]
    }
  ],
  "aya-local": [
    {
      "repo": "CohereForAI/aya-23-8B",
      "bRating": "8B",
      "parameters": "8B",
      "size": "15.0 GB",
      "files": [
        {
          "label": "model-00001-of-00004.safetensors",
          "url": "https://huggingface.co/CohereForAI/aya-23-8B/resolve/main/model-00001-of-00004.safetensors?download=true"
        },
        {
          "label": "model-00002-of-00004.safetensors",
          "url": "https://huggingface.co/CohereForAI/aya-23-8B/resolve/main/model-00002-of-00004.safetensors?download=true"
        },
        {
          "label": "model-00003-of-00004.safetensors",
          "url": "https://huggingface.co/CohereForAI/aya-23-8B/resolve/main/model-00003-of-00004.safetensors?download=true"
        },
        {
          "label": "model-00004-of-00004.safetensors",
          "url": "https://huggingface.co/CohereForAI/aya-23-8B/resolve/main/model-00004-of-00004.safetensors?download=true"
        }
      ],
      "gated": true
    },
    {
      "repo": "CohereForAI/aya-23-35B",
      "bRating": "35B",
      "parameters": "35B",
      "size": "65.2 GB",
      "files": [
        {
          "label": "model-00001-of-00015.safetensors",
          "url": "https://huggingface.co/CohereForAI/aya-23-35B/resolve/main/model-00001-of-00015.safetensors?download=true"
        },
        {
          "label": "model-00002-of-00015.safetensors",
          "url": "https://huggingface.co/CohereForAI/aya-23-35B/resolve/main/model-00002-of-00015.safetensors?download=true"
        },
        {
          "label": "model-00003-of-00015.safetensors",
          "url": "https://huggingface.co/CohereForAI/aya-23-35B/resolve/main/model-00003-of-00015.safetensors?download=true"
        },
        {
          "label": "model-00004-of-00015.safetensors",
          "url": "https://huggingface.co/CohereForAI/aya-23-35B/resolve/main/model-00004-of-00015.safetensors?download=true"
        },
        {
          "label": "model-00005-of-00015.safetensors",
          "url": "https://huggingface.co/CohereForAI/aya-23-35B/resolve/main/model-00005-of-00015.safetensors?download=true"
        },
        {
          "label": "model-00006-of-00015.safetensors",
          "url": "https://huggingface.co/CohereForAI/aya-23-35B/resolve/main/model-00006-of-00015.safetensors?download=true"
        },
        {
          "label": "model-00007-of-00015.safetensors",
          "url": "https://huggingface.co/CohereForAI/aya-23-35B/resolve/main/model-00007-of-00015.safetensors?download=true"
        },
        {
          "label": "model-00008-of-00015.safetensors",
          "url": "https://huggingface.co/CohereForAI/aya-23-35B/resolve/main/model-00008-of-00015.safetensors?download=true"
        },
        {
          "label": "model-00009-of-00015.safetensors",
          "url": "https://huggingface.co/CohereForAI/aya-23-35B/resolve/main/model-00009-of-00015.safetensors?download=true"
        },
        {
          "label": "model-00010-of-00015.safetensors",
          "url": "https://huggingface.co/CohereForAI/aya-23-35B/resolve/main/model-00010-of-00015.safetensors?download=true"
        },
        {
          "label": "model-00011-of-00015.safetensors",
          "url": "https://huggingface.co/CohereForAI/aya-23-35B/resolve/main/model-00011-of-00015.safetensors?download=true"
        },
        {
          "label": "model-00012-of-00015.safetensors",
          "url": "https://huggingface.co/CohereForAI/aya-23-35B/resolve/main/model-00012-of-00015.safetensors?download=true"
        },
        {
          "label": "model-00013-of-00015.safetensors",
          "url": "https://huggingface.co/CohereForAI/aya-23-35B/resolve/main/model-00013-of-00015.safetensors?download=true"
        },
        {
          "label": "model-00014-of-00015.safetensors",
          "url": "https://huggingface.co/CohereForAI/aya-23-35B/resolve/main/model-00014-of-00015.safetensors?download=true"
        },
        {
          "label": "model-00015-of-00015.safetensors",
          "url": "https://huggingface.co/CohereForAI/aya-23-35B/resolve/main/model-00015-of-00015.safetensors?download=true"
        }
      ],
      "gated": true
    },
    {
      "repo": "convaiinnovations/laya",
      "bRating": "Unknown",
      "parameters": "Unknown",
      "size": "2.2 GB",
      "files": [
        {
          "label": "model.safetensors",
          "url": "https://huggingface.co/convaiinnovations/laya/resolve/main/model.safetensors?download=true"
        },
        {
          "label": "multilingual/model.safetensors",
          "url": "https://huggingface.co/convaiinnovations/laya/resolve/main/multilingual/model.safetensors?download=true"
        },
        {
          "label": "typed-decisions/model.safetensors",
          "url": "https://huggingface.co/convaiinnovations/laya/resolve/main/typed-decisions/model.safetensors?download=true"
        }
      ]
    }
  ],
  "other-open-weight-local": [
    {
      "repo": "mosaicml/mpt-7b",
      "bRating": "7B",
      "parameters": "7B",
      "size": "≈14.0 GB (BF16 estimate)",
      "files": [
        {
          "label": "model.safetensors",
          "url": "https://huggingface.co/mosaicml/mpt-7b/resolve/main/model.safetensors?download=true"
        }
      ],
      "gated": true
    },
    {
      "repo": "stabilityai/stablelm-2-1_6b",
      "bRating": "1.6B",
      "parameters": "1.6B",
      "size": "3.1 GB",
      "files": [
        {
          "label": "model.safetensors",
          "url": "https://huggingface.co/stabilityai/stablelm-2-1_6b/resolve/main/model.safetensors?download=true"
        }
      ]
    },
    {
      "repo": "stabilityai/stablelm-2-12b",
      "bRating": "12B",
      "parameters": "12B",
      "size": "22.6 GB",
      "files": [
        {
          "label": "model-00001-of-00005.safetensors",
          "url": "https://huggingface.co/stabilityai/stablelm-2-12b/resolve/main/model-00001-of-00005.safetensors?download=true"
        },
        {
          "label": "model-00002-of-00005.safetensors",
          "url": "https://huggingface.co/stabilityai/stablelm-2-12b/resolve/main/model-00002-of-00005.safetensors?download=true"
        },
        {
          "label": "model-00003-of-00005.safetensors",
          "url": "https://huggingface.co/stabilityai/stablelm-2-12b/resolve/main/model-00003-of-00005.safetensors?download=true"
        },
        {
          "label": "model-00004-of-00005.safetensors",
          "url": "https://huggingface.co/stabilityai/stablelm-2-12b/resolve/main/model-00004-of-00005.safetensors?download=true"
        },
        {
          "label": "model-00005-of-00005.safetensors",
          "url": "https://huggingface.co/stabilityai/stablelm-2-12b/resolve/main/model-00005-of-00005.safetensors?download=true"
        }
      ]
    },
    {
      "repo": "m-a-p/YuE2-3B",
      "bRating": "3B",
      "parameters": "3B",
      "size": "6.8 GB",
      "files": [
        {
          "label": "model.safetensors",
          "url": "https://huggingface.co/m-a-p/YuE2-3B/resolve/main/model.safetensors?download=true"
        }
      ]
    },
    {
      "repo": "microsoft/VibeVoice-ASR-Streaming-7B",
      "bRating": "7B",
      "parameters": "7B",
      "size": "16.2 GB",
      "files": [
        {
          "label": "model-00001-of-00008.safetensors",
          "url": "https://huggingface.co/microsoft/VibeVoice-ASR-Streaming-7B/resolve/main/model-00001-of-00008.safetensors?download=true"
        },
        {
          "label": "model-00002-of-00008.safetensors",
          "url": "https://huggingface.co/microsoft/VibeVoice-ASR-Streaming-7B/resolve/main/model-00002-of-00008.safetensors?download=true"
        },
        {
          "label": "model-00003-of-00008.safetensors",
          "url": "https://huggingface.co/microsoft/VibeVoice-ASR-Streaming-7B/resolve/main/model-00003-of-00008.safetensors?download=true"
        },
        {
          "label": "model-00004-of-00008.safetensors",
          "url": "https://huggingface.co/microsoft/VibeVoice-ASR-Streaming-7B/resolve/main/model-00004-of-00008.safetensors?download=true"
        },
        {
          "label": "model-00005-of-00008.safetensors",
          "url": "https://huggingface.co/microsoft/VibeVoice-ASR-Streaming-7B/resolve/main/model-00005-of-00008.safetensors?download=true"
        },
        {
          "label": "model-00006-of-00008.safetensors",
          "url": "https://huggingface.co/microsoft/VibeVoice-ASR-Streaming-7B/resolve/main/model-00006-of-00008.safetensors?download=true"
        },
        {
          "label": "model-00007-of-00008.safetensors",
          "url": "https://huggingface.co/microsoft/VibeVoice-ASR-Streaming-7B/resolve/main/model-00007-of-00008.safetensors?download=true"
        },
        {
          "label": "model-00008-of-00008.safetensors",
          "url": "https://huggingface.co/microsoft/VibeVoice-ASR-Streaming-7B/resolve/main/model-00008-of-00008.safetensors?download=true"
        }
      ]
    }
  ],
  "pythia-local": [
    {
      "repo": "EleutherAI/pythia-160m",
      "bRating": "160M",
      "parameters": "160M",
      "size": "358 MB",
      "files": [
        {
          "label": "model.safetensors",
          "url": "https://huggingface.co/EleutherAI/pythia-160m/resolve/main/model.safetensors?download=true"
        }
      ]
    },
    {
      "repo": "EleutherAI/pythia-410m",
      "bRating": "410M",
      "parameters": "410M",
      "size": "869 MB",
      "files": [
        {
          "label": "model.safetensors",
          "url": "https://huggingface.co/EleutherAI/pythia-410m/resolve/main/model.safetensors?download=true"
        }
      ]
    },
    {
      "repo": "EleutherAI/pythia-1b",
      "bRating": "1B",
      "parameters": "1B",
      "size": "1.9 GB",
      "files": [
        {
          "label": "model.safetensors",
          "url": "https://huggingface.co/EleutherAI/pythia-1b/resolve/main/model.safetensors?download=true"
        }
      ]
    },
    {
      "repo": "EleutherAI/pythia-2.8b",
      "bRating": "2.8B",
      "parameters": "2.8B",
      "size": "5.3 GB",
      "files": [
        {
          "label": "model.safetensors",
          "url": "https://huggingface.co/EleutherAI/pythia-2.8b/resolve/main/model.safetensors?download=true"
        }
      ]
    },
    {
      "repo": "EleutherAI/pythia-6.9b",
      "bRating": "6.9B",
      "parameters": "6.9B",
      "size": "12.9 GB",
      "files": [
        {
          "label": "model-00001-of-00002.safetensors",
          "url": "https://huggingface.co/EleutherAI/pythia-6.9b/resolve/main/model-00001-of-00002.safetensors?download=true"
        },
        {
          "label": "model-00002-of-00002.safetensors",
          "url": "https://huggingface.co/EleutherAI/pythia-6.9b/resolve/main/model-00002-of-00002.safetensors?download=true"
        }
      ]
    },
    {
      "repo": "EleutherAI/pythia-12b",
      "bRating": "12B",
      "parameters": "12B",
      "size": "22.2 GB",
      "files": [
        {
          "label": "model-00001-of-00003.safetensors",
          "url": "https://huggingface.co/EleutherAI/pythia-12b/resolve/main/model-00001-of-00003.safetensors?download=true"
        },
        {
          "label": "model-00002-of-00003.safetensors",
          "url": "https://huggingface.co/EleutherAI/pythia-12b/resolve/main/model-00002-of-00003.safetensors?download=true"
        },
        {
          "label": "model-00003-of-00003.safetensors",
          "url": "https://huggingface.co/EleutherAI/pythia-12b/resolve/main/model-00003-of-00003.safetensors?download=true"
        }
      ]
    }
  ],
  "openbmb-local": [
    {
      "repo": "openbmb/MiniCPM5-2B",
      "bRating": "2B",
      "parameters": "2B",
      "size": "4.7 GB",
      "files": [
        {
          "label": "model-00000-of-00001.safetensors",
          "url": "https://huggingface.co/openbmb/MiniCPM5-2B/resolve/main/model-00000-of-00001.safetensors?download=true"
        }
      ]
    }
  ],
  "ltx-local": [
    {
      "repo": "Lightricks/LTX-2.5",
      "bRating": "Unknown",
      "parameters": "Unknown",
      "size": "187.1 GB",
      "files": [
        {
          "label": "diffusion_models/ltx-2.5-22b-dev-transformer-bf16.safetensors",
          "url": "https://huggingface.co/Lightricks/LTX-2.5/resolve/main/diffusion_models/ltx-2.5-22b-dev-transformer-bf16.safetensors?download=true"
        },
        {
          "label": "diffusion_models/ltx-2.5-22b-dev-transformer-comfy-int8-convrot.safetensors",
          "url": "https://huggingface.co/Lightricks/LTX-2.5/resolve/main/diffusion_models/ltx-2.5-22b-dev-transformer-comfy-int8-convrot.safetensors?download=true"
        },
        {
          "label": "diffusion_models/ltx-2.5-22b-distilled-transformer-bf16.safetensors",
          "url": "https://huggingface.co/Lightricks/LTX-2.5/resolve/main/diffusion_models/ltx-2.5-22b-distilled-transformer-bf16.safetensors?download=true"
        },
        {
          "label": "diffusion_models/ltx-2.5-22b-distilled-transformer-comfy-int8-convrot.safetensors",
          "url": "https://huggingface.co/Lightricks/LTX-2.5/resolve/main/diffusion_models/ltx-2.5-22b-distilled-transformer-comfy-int8-convrot.safetensors?download=true"
        },
        {
          "label": "diffusion_models/ltx-2.5-22b-distilled-transformer-nvfp4.safetensors",
          "url": "https://huggingface.co/Lightricks/LTX-2.5/resolve/main/diffusion_models/ltx-2.5-22b-distilled-transformer-nvfp4.safetensors?download=true"
        },
        {
          "label": "latent_upscale_models/ltx-2.5-latent-spatial-upscaler-x2-bf16-1.0.safetensors",
          "url": "https://huggingface.co/Lightricks/LTX-2.5/resolve/main/latent_upscale_models/ltx-2.5-latent-spatial-upscaler-x2-bf16-1.0.safetensors?download=true"
        },
        {
          "label": "latent_upscale_models/ltx-2.5-latent-temporal-upscaler-x2-bf16-1.0.safetensors",
          "url": "https://huggingface.co/Lightricks/LTX-2.5/resolve/main/latent_upscale_models/ltx-2.5-latent-temporal-upscaler-x2-bf16-1.0.safetensors?download=true"
        },
        {
          "label": "loras/ltx-2.5-22b-distilled-lora-450-bf16.safetensors",
          "url": "https://huggingface.co/Lightricks/LTX-2.5/resolve/main/loras/ltx-2.5-22b-distilled-lora-450-bf16.safetensors?download=true"
        },
        {
          "label": "model_patches/ltx-2.5-duration-head-bf16.safetensors",
          "url": "https://huggingface.co/Lightricks/LTX-2.5/resolve/main/model_patches/ltx-2.5-duration-head-bf16.safetensors?download=true"
        },
        {
          "label": "text_encoders/gemma4-12b-with-proj-ltx-2.5-bf16.safetensors",
          "url": "https://huggingface.co/Lightricks/LTX-2.5/resolve/main/text_encoders/gemma4-12b-with-proj-ltx-2.5-bf16.safetensors?download=true"
        },
        {
          "label": "text_encoders/gemma4-12b-with-proj-ltx-2.5-comfy-int8-convrot.safetensors",
          "url": "https://huggingface.co/Lightricks/LTX-2.5/resolve/main/text_encoders/gemma4-12b-with-proj-ltx-2.5-comfy-int8-convrot.safetensors?download=true"
        },
        {
          "label": "vae/ltx-2.5-audio-vae-bf16.safetensors",
          "url": "https://huggingface.co/Lightricks/LTX-2.5/resolve/main/vae/ltx-2.5-audio-vae-bf16.safetensors?download=true"
        },
        {
          "label": "vae/ltx-2.5-video-vae-bf16.safetensors",
          "url": "https://huggingface.co/Lightricks/LTX-2.5/resolve/main/vae/ltx-2.5-video-vae-bf16.safetensors?download=true"
        },
        {
          "label": "vae/ltx-2.5-video-vae-conv-bf16.safetensors",
          "url": "https://huggingface.co/Lightricks/LTX-2.5/resolve/main/vae/ltx-2.5-video-vae-conv-bf16.safetensors?download=true"
        }
      ],
      "gated": true
    }
  ],
  "colibri-local": [
    {
      "repo": "nbeerbower/Inkling-Gutenberg-DPO-colibri-int4",
      "bRating": "Unknown",
      "parameters": "Unknown",
      "size": "478.7 GB",
      "files": [
        {
          "label": "out-00001.safetensors",
          "url": "https://huggingface.co/nbeerbower/Inkling-Gutenberg-DPO-colibri-int4/resolve/main/out-00001.safetensors?download=true"
        },
        {
          "label": "out-00002.safetensors",
          "url": "https://huggingface.co/nbeerbower/Inkling-Gutenberg-DPO-colibri-int4/resolve/main/out-00002.safetensors?download=true"
        },
        {
          "label": "out-00003.safetensors",
          "url": "https://huggingface.co/nbeerbower/Inkling-Gutenberg-DPO-colibri-int4/resolve/main/out-00003.safetensors?download=true"
        },
        {
          "label": "out-00004.safetensors",
          "url": "https://huggingface.co/nbeerbower/Inkling-Gutenberg-DPO-colibri-int4/resolve/main/out-00004.safetensors?download=true"
        },
        {
          "label": "out-00005.safetensors",
          "url": "https://huggingface.co/nbeerbower/Inkling-Gutenberg-DPO-colibri-int4/resolve/main/out-00005.safetensors?download=true"
        },
        {
          "label": "out-00006.safetensors",
          "url": "https://huggingface.co/nbeerbower/Inkling-Gutenberg-DPO-colibri-int4/resolve/main/out-00006.safetensors?download=true"
        },
        {
          "label": "out-00007.safetensors",
          "url": "https://huggingface.co/nbeerbower/Inkling-Gutenberg-DPO-colibri-int4/resolve/main/out-00007.safetensors?download=true"
        },
        {
          "label": "out-00008.safetensors",
          "url": "https://huggingface.co/nbeerbower/Inkling-Gutenberg-DPO-colibri-int4/resolve/main/out-00008.safetensors?download=true"
        },
        {
          "label": "out-00009.safetensors",
          "url": "https://huggingface.co/nbeerbower/Inkling-Gutenberg-DPO-colibri-int4/resolve/main/out-00009.safetensors?download=true"
        },
        {
          "label": "out-00010.safetensors",
          "url": "https://huggingface.co/nbeerbower/Inkling-Gutenberg-DPO-colibri-int4/resolve/main/out-00010.safetensors?download=true"
        },
        {
          "label": "out-00011.safetensors",
          "url": "https://huggingface.co/nbeerbower/Inkling-Gutenberg-DPO-colibri-int4/resolve/main/out-00011.safetensors?download=true"
        },
        {
          "label": "out-00012.safetensors",
          "url": "https://huggingface.co/nbeerbower/Inkling-Gutenberg-DPO-colibri-int4/resolve/main/out-00012.safetensors?download=true"
        },
        {
          "label": "out-00013.safetensors",
          "url": "https://huggingface.co/nbeerbower/Inkling-Gutenberg-DPO-colibri-int4/resolve/main/out-00013.safetensors?download=true"
        },
        {
          "label": "out-00014.safetensors",
          "url": "https://huggingface.co/nbeerbower/Inkling-Gutenberg-DPO-colibri-int4/resolve/main/out-00014.safetensors?download=true"
        },
        {
          "label": "out-00015.safetensors",
          "url": "https://huggingface.co/nbeerbower/Inkling-Gutenberg-DPO-colibri-int4/resolve/main/out-00015.safetensors?download=true"
        },
        {
          "label": "out-00016.safetensors",
          "url": "https://huggingface.co/nbeerbower/Inkling-Gutenberg-DPO-colibri-int4/resolve/main/out-00016.safetensors?download=true"
        },
        {
          "label": "out-00017.safetensors",
          "url": "https://huggingface.co/nbeerbower/Inkling-Gutenberg-DPO-colibri-int4/resolve/main/out-00017.safetensors?download=true"
        },
        {
          "label": "out-00018.safetensors",
          "url": "https://huggingface.co/nbeerbower/Inkling-Gutenberg-DPO-colibri-int4/resolve/main/out-00018.safetensors?download=true"
        },
        {
          "label": "out-00019.safetensors",
          "url": "https://huggingface.co/nbeerbower/Inkling-Gutenberg-DPO-colibri-int4/resolve/main/out-00019.safetensors?download=true"
        },
        {
          "label": "out-00020.safetensors",
          "url": "https://huggingface.co/nbeerbower/Inkling-Gutenberg-DPO-colibri-int4/resolve/main/out-00020.safetensors?download=true"
        },
        {
          "label": "out-00021.safetensors",
          "url": "https://huggingface.co/nbeerbower/Inkling-Gutenberg-DPO-colibri-int4/resolve/main/out-00021.safetensors?download=true"
        },
        {
          "label": "out-00022.safetensors",
          "url": "https://huggingface.co/nbeerbower/Inkling-Gutenberg-DPO-colibri-int4/resolve/main/out-00022.safetensors?download=true"
        },
        {
          "label": "out-00023.safetensors",
          "url": "https://huggingface.co/nbeerbower/Inkling-Gutenberg-DPO-colibri-int4/resolve/main/out-00023.safetensors?download=true"
        },
        {
          "label": "out-00024.safetensors",
          "url": "https://huggingface.co/nbeerbower/Inkling-Gutenberg-DPO-colibri-int4/resolve/main/out-00024.safetensors?download=true"
        },
        {
          "label": "out-00025.safetensors",
          "url": "https://huggingface.co/nbeerbower/Inkling-Gutenberg-DPO-colibri-int4/resolve/main/out-00025.safetensors?download=true"
        },
        {
          "label": "out-00026.safetensors",
          "url": "https://huggingface.co/nbeerbower/Inkling-Gutenberg-DPO-colibri-int4/resolve/main/out-00026.safetensors?download=true"
        },
        {
          "label": "out-00027.safetensors",
          "url": "https://huggingface.co/nbeerbower/Inkling-Gutenberg-DPO-colibri-int4/resolve/main/out-00027.safetensors?download=true"
        },
        {
          "label": "out-00028.safetensors",
          "url": "https://huggingface.co/nbeerbower/Inkling-Gutenberg-DPO-colibri-int4/resolve/main/out-00028.safetensors?download=true"
        },
        {
          "label": "out-00029.safetensors",
          "url": "https://huggingface.co/nbeerbower/Inkling-Gutenberg-DPO-colibri-int4/resolve/main/out-00029.safetensors?download=true"
        },
        {
          "label": "out-00030.safetensors",
          "url": "https://huggingface.co/nbeerbower/Inkling-Gutenberg-DPO-colibri-int4/resolve/main/out-00030.safetensors?download=true"
        },
        {
          "label": "out-00031.safetensors",
          "url": "https://huggingface.co/nbeerbower/Inkling-Gutenberg-DPO-colibri-int4/resolve/main/out-00031.safetensors?download=true"
        },
        {
          "label": "out-00032.safetensors",
          "url": "https://huggingface.co/nbeerbower/Inkling-Gutenberg-DPO-colibri-int4/resolve/main/out-00032.safetensors?download=true"
        },
        {
          "label": "out-00033.safetensors",
          "url": "https://huggingface.co/nbeerbower/Inkling-Gutenberg-DPO-colibri-int4/resolve/main/out-00033.safetensors?download=true"
        },
        {
          "label": "out-00034.safetensors",
          "url": "https://huggingface.co/nbeerbower/Inkling-Gutenberg-DPO-colibri-int4/resolve/main/out-00034.safetensors?download=true"
        },
        {
          "label": "out-00035.safetensors",
          "url": "https://huggingface.co/nbeerbower/Inkling-Gutenberg-DPO-colibri-int4/resolve/main/out-00035.safetensors?download=true"
        },
        {
          "label": "out-00036.safetensors",
          "url": "https://huggingface.co/nbeerbower/Inkling-Gutenberg-DPO-colibri-int4/resolve/main/out-00036.safetensors?download=true"
        },
        {
          "label": "out-00037.safetensors",
          "url": "https://huggingface.co/nbeerbower/Inkling-Gutenberg-DPO-colibri-int4/resolve/main/out-00037.safetensors?download=true"
        },
        {
          "label": "out-00038.safetensors",
          "url": "https://huggingface.co/nbeerbower/Inkling-Gutenberg-DPO-colibri-int4/resolve/main/out-00038.safetensors?download=true"
        },
        {
          "label": "out-00039.safetensors",
          "url": "https://huggingface.co/nbeerbower/Inkling-Gutenberg-DPO-colibri-int4/resolve/main/out-00039.safetensors?download=true"
        },
        {
          "label": "out-00040.safetensors",
          "url": "https://huggingface.co/nbeerbower/Inkling-Gutenberg-DPO-colibri-int4/resolve/main/out-00040.safetensors?download=true"
        },
        {
          "label": "out-00041.safetensors",
          "url": "https://huggingface.co/nbeerbower/Inkling-Gutenberg-DPO-colibri-int4/resolve/main/out-00041.safetensors?download=true"
        },
        {
          "label": "out-00042.safetensors",
          "url": "https://huggingface.co/nbeerbower/Inkling-Gutenberg-DPO-colibri-int4/resolve/main/out-00042.safetensors?download=true"
        },
        {
          "label": "out-00043.safetensors",
          "url": "https://huggingface.co/nbeerbower/Inkling-Gutenberg-DPO-colibri-int4/resolve/main/out-00043.safetensors?download=true"
        },
        {
          "label": "out-00044.safetensors",
          "url": "https://huggingface.co/nbeerbower/Inkling-Gutenberg-DPO-colibri-int4/resolve/main/out-00044.safetensors?download=true"
        },
        {
          "label": "out-00045.safetensors",
          "url": "https://huggingface.co/nbeerbower/Inkling-Gutenberg-DPO-colibri-int4/resolve/main/out-00045.safetensors?download=true"
        },
        {
          "label": "out-00046.safetensors",
          "url": "https://huggingface.co/nbeerbower/Inkling-Gutenberg-DPO-colibri-int4/resolve/main/out-00046.safetensors?download=true"
        },
        {
          "label": "out-00047.safetensors",
          "url": "https://huggingface.co/nbeerbower/Inkling-Gutenberg-DPO-colibri-int4/resolve/main/out-00047.safetensors?download=true"
        },
        {
          "label": "out-00048.safetensors",
          "url": "https://huggingface.co/nbeerbower/Inkling-Gutenberg-DPO-colibri-int4/resolve/main/out-00048.safetensors?download=true"
        },
        {
          "label": "out-00049.safetensors",
          "url": "https://huggingface.co/nbeerbower/Inkling-Gutenberg-DPO-colibri-int4/resolve/main/out-00049.safetensors?download=true"
        },
        {
          "label": "out-00050.safetensors",
          "url": "https://huggingface.co/nbeerbower/Inkling-Gutenberg-DPO-colibri-int4/resolve/main/out-00050.safetensors?download=true"
        },
        {
          "label": "out-00051.safetensors",
          "url": "https://huggingface.co/nbeerbower/Inkling-Gutenberg-DPO-colibri-int4/resolve/main/out-00051.safetensors?download=true"
        },
        {
          "label": "out-00052.safetensors",
          "url": "https://huggingface.co/nbeerbower/Inkling-Gutenberg-DPO-colibri-int4/resolve/main/out-00052.safetensors?download=true"
        },
        {
          "label": "out-00053.safetensors",
          "url": "https://huggingface.co/nbeerbower/Inkling-Gutenberg-DPO-colibri-int4/resolve/main/out-00053.safetensors?download=true"
        },
        {
          "label": "out-00054.safetensors",
          "url": "https://huggingface.co/nbeerbower/Inkling-Gutenberg-DPO-colibri-int4/resolve/main/out-00054.safetensors?download=true"
        },
        {
          "label": "out-00055.safetensors",
          "url": "https://huggingface.co/nbeerbower/Inkling-Gutenberg-DPO-colibri-int4/resolve/main/out-00055.safetensors?download=true"
        },
        {
          "label": "out-00056.safetensors",
          "url": "https://huggingface.co/nbeerbower/Inkling-Gutenberg-DPO-colibri-int4/resolve/main/out-00056.safetensors?download=true"
        },
        {
          "label": "out-00057.safetensors",
          "url": "https://huggingface.co/nbeerbower/Inkling-Gutenberg-DPO-colibri-int4/resolve/main/out-00057.safetensors?download=true"
        },
        {
          "label": "out-00058.safetensors",
          "url": "https://huggingface.co/nbeerbower/Inkling-Gutenberg-DPO-colibri-int4/resolve/main/out-00058.safetensors?download=true"
        },
        {
          "label": "out-00059.safetensors",
          "url": "https://huggingface.co/nbeerbower/Inkling-Gutenberg-DPO-colibri-int4/resolve/main/out-00059.safetensors?download=true"
        },
        {
          "label": "out-00060.safetensors",
          "url": "https://huggingface.co/nbeerbower/Inkling-Gutenberg-DPO-colibri-int4/resolve/main/out-00060.safetensors?download=true"
        },
        {
          "label": "out-00061.safetensors",
          "url": "https://huggingface.co/nbeerbower/Inkling-Gutenberg-DPO-colibri-int4/resolve/main/out-00061.safetensors?download=true"
        },
        {
          "label": "out-00062.safetensors",
          "url": "https://huggingface.co/nbeerbower/Inkling-Gutenberg-DPO-colibri-int4/resolve/main/out-00062.safetensors?download=true"
        },
        {
          "label": "out-00063.safetensors",
          "url": "https://huggingface.co/nbeerbower/Inkling-Gutenberg-DPO-colibri-int4/resolve/main/out-00063.safetensors?download=true"
        },
        {
          "label": "out-00064.safetensors",
          "url": "https://huggingface.co/nbeerbower/Inkling-Gutenberg-DPO-colibri-int4/resolve/main/out-00064.safetensors?download=true"
        },
        {
          "label": "out-00065.safetensors",
          "url": "https://huggingface.co/nbeerbower/Inkling-Gutenberg-DPO-colibri-int4/resolve/main/out-00065.safetensors?download=true"
        },
        {
          "label": "out-00066.safetensors",
          "url": "https://huggingface.co/nbeerbower/Inkling-Gutenberg-DPO-colibri-int4/resolve/main/out-00066.safetensors?download=true"
        },
        {
          "label": "out-00067.safetensors",
          "url": "https://huggingface.co/nbeerbower/Inkling-Gutenberg-DPO-colibri-int4/resolve/main/out-00067.safetensors?download=true"
        },
        {
          "label": "out-00068.safetensors",
          "url": "https://huggingface.co/nbeerbower/Inkling-Gutenberg-DPO-colibri-int4/resolve/main/out-00068.safetensors?download=true"
        },
        {
          "label": "out-00069.safetensors",
          "url": "https://huggingface.co/nbeerbower/Inkling-Gutenberg-DPO-colibri-int4/resolve/main/out-00069.safetensors?download=true"
        },
        {
          "label": "out-00070.safetensors",
          "url": "https://huggingface.co/nbeerbower/Inkling-Gutenberg-DPO-colibri-int4/resolve/main/out-00070.safetensors?download=true"
        },
        {
          "label": "out-00071.safetensors",
          "url": "https://huggingface.co/nbeerbower/Inkling-Gutenberg-DPO-colibri-int4/resolve/main/out-00071.safetensors?download=true"
        },
        {
          "label": "out-00072.safetensors",
          "url": "https://huggingface.co/nbeerbower/Inkling-Gutenberg-DPO-colibri-int4/resolve/main/out-00072.safetensors?download=true"
        },
        {
          "label": "out-00073.safetensors",
          "url": "https://huggingface.co/nbeerbower/Inkling-Gutenberg-DPO-colibri-int4/resolve/main/out-00073.safetensors?download=true"
        },
        {
          "label": "out-00074.safetensors",
          "url": "https://huggingface.co/nbeerbower/Inkling-Gutenberg-DPO-colibri-int4/resolve/main/out-00074.safetensors?download=true"
        },
        {
          "label": "out-00075.safetensors",
          "url": "https://huggingface.co/nbeerbower/Inkling-Gutenberg-DPO-colibri-int4/resolve/main/out-00075.safetensors?download=true"
        },
        {
          "label": "out-00076.safetensors",
          "url": "https://huggingface.co/nbeerbower/Inkling-Gutenberg-DPO-colibri-int4/resolve/main/out-00076.safetensors?download=true"
        },
        {
          "label": "out-00077.safetensors",
          "url": "https://huggingface.co/nbeerbower/Inkling-Gutenberg-DPO-colibri-int4/resolve/main/out-00077.safetensors?download=true"
        },
        {
          "label": "out-00078.safetensors",
          "url": "https://huggingface.co/nbeerbower/Inkling-Gutenberg-DPO-colibri-int4/resolve/main/out-00078.safetensors?download=true"
        },
        {
          "label": "out-00079.safetensors",
          "url": "https://huggingface.co/nbeerbower/Inkling-Gutenberg-DPO-colibri-int4/resolve/main/out-00079.safetensors?download=true"
        },
        {
          "label": "out-00080.safetensors",
          "url": "https://huggingface.co/nbeerbower/Inkling-Gutenberg-DPO-colibri-int4/resolve/main/out-00080.safetensors?download=true"
        },
        {
          "label": "out-00081.safetensors",
          "url": "https://huggingface.co/nbeerbower/Inkling-Gutenberg-DPO-colibri-int4/resolve/main/out-00081.safetensors?download=true"
        },
        {
          "label": "out-00082.safetensors",
          "url": "https://huggingface.co/nbeerbower/Inkling-Gutenberg-DPO-colibri-int4/resolve/main/out-00082.safetensors?download=true"
        },
        {
          "label": "out-00083.safetensors",
          "url": "https://huggingface.co/nbeerbower/Inkling-Gutenberg-DPO-colibri-int4/resolve/main/out-00083.safetensors?download=true"
        },
        {
          "label": "out-00084.safetensors",
          "url": "https://huggingface.co/nbeerbower/Inkling-Gutenberg-DPO-colibri-int4/resolve/main/out-00084.safetensors?download=true"
        },
        {
          "label": "out-00085.safetensors",
          "url": "https://huggingface.co/nbeerbower/Inkling-Gutenberg-DPO-colibri-int4/resolve/main/out-00085.safetensors?download=true"
        },
        {
          "label": "out-00086.safetensors",
          "url": "https://huggingface.co/nbeerbower/Inkling-Gutenberg-DPO-colibri-int4/resolve/main/out-00086.safetensors?download=true"
        },
        {
          "label": "out-00087.safetensors",
          "url": "https://huggingface.co/nbeerbower/Inkling-Gutenberg-DPO-colibri-int4/resolve/main/out-00087.safetensors?download=true"
        },
        {
          "label": "out-00088.safetensors",
          "url": "https://huggingface.co/nbeerbower/Inkling-Gutenberg-DPO-colibri-int4/resolve/main/out-00088.safetensors?download=true"
        },
        {
          "label": "out-00089.safetensors",
          "url": "https://huggingface.co/nbeerbower/Inkling-Gutenberg-DPO-colibri-int4/resolve/main/out-00089.safetensors?download=true"
        },
        {
          "label": "out-00090.safetensors",
          "url": "https://huggingface.co/nbeerbower/Inkling-Gutenberg-DPO-colibri-int4/resolve/main/out-00090.safetensors?download=true"
        },
        {
          "label": "out-00091.safetensors",
          "url": "https://huggingface.co/nbeerbower/Inkling-Gutenberg-DPO-colibri-int4/resolve/main/out-00091.safetensors?download=true"
        },
        {
          "label": "out-00092.safetensors",
          "url": "https://huggingface.co/nbeerbower/Inkling-Gutenberg-DPO-colibri-int4/resolve/main/out-00092.safetensors?download=true"
        },
        {
          "label": "out-00093.safetensors",
          "url": "https://huggingface.co/nbeerbower/Inkling-Gutenberg-DPO-colibri-int4/resolve/main/out-00093.safetensors?download=true"
        },
        {
          "label": "out-00094.safetensors",
          "url": "https://huggingface.co/nbeerbower/Inkling-Gutenberg-DPO-colibri-int4/resolve/main/out-00094.safetensors?download=true"
        },
        {
          "label": "out-00095.safetensors",
          "url": "https://huggingface.co/nbeerbower/Inkling-Gutenberg-DPO-colibri-int4/resolve/main/out-00095.safetensors?download=true"
        },
        {
          "label": "out-00096.safetensors",
          "url": "https://huggingface.co/nbeerbower/Inkling-Gutenberg-DPO-colibri-int4/resolve/main/out-00096.safetensors?download=true"
        },
        {
          "label": "out-00097.safetensors",
          "url": "https://huggingface.co/nbeerbower/Inkling-Gutenberg-DPO-colibri-int4/resolve/main/out-00097.safetensors?download=true"
        },
        {
          "label": "out-00098.safetensors",
          "url": "https://huggingface.co/nbeerbower/Inkling-Gutenberg-DPO-colibri-int4/resolve/main/out-00098.safetensors?download=true"
        },
        {
          "label": "out-00099.safetensors",
          "url": "https://huggingface.co/nbeerbower/Inkling-Gutenberg-DPO-colibri-int4/resolve/main/out-00099.safetensors?download=true"
        },
        {
          "label": "out-00100.safetensors",
          "url": "https://huggingface.co/nbeerbower/Inkling-Gutenberg-DPO-colibri-int4/resolve/main/out-00100.safetensors?download=true"
        },
        {
          "label": "out-00101.safetensors",
          "url": "https://huggingface.co/nbeerbower/Inkling-Gutenberg-DPO-colibri-int4/resolve/main/out-00101.safetensors?download=true"
        },
        {
          "label": "out-00102.safetensors",
          "url": "https://huggingface.co/nbeerbower/Inkling-Gutenberg-DPO-colibri-int4/resolve/main/out-00102.safetensors?download=true"
        },
        {
          "label": "out-00103.safetensors",
          "url": "https://huggingface.co/nbeerbower/Inkling-Gutenberg-DPO-colibri-int4/resolve/main/out-00103.safetensors?download=true"
        },
        {
          "label": "out-00104.safetensors",
          "url": "https://huggingface.co/nbeerbower/Inkling-Gutenberg-DPO-colibri-int4/resolve/main/out-00104.safetensors?download=true"
        },
        {
          "label": "out-00105.safetensors",
          "url": "https://huggingface.co/nbeerbower/Inkling-Gutenberg-DPO-colibri-int4/resolve/main/out-00105.safetensors?download=true"
        },
        {
          "label": "out-00106.safetensors",
          "url": "https://huggingface.co/nbeerbower/Inkling-Gutenberg-DPO-colibri-int4/resolve/main/out-00106.safetensors?download=true"
        },
        {
          "label": "out-00107.safetensors",
          "url": "https://huggingface.co/nbeerbower/Inkling-Gutenberg-DPO-colibri-int4/resolve/main/out-00107.safetensors?download=true"
        },
        {
          "label": "out-00108.safetensors",
          "url": "https://huggingface.co/nbeerbower/Inkling-Gutenberg-DPO-colibri-int4/resolve/main/out-00108.safetensors?download=true"
        },
        {
          "label": "out-mtp.safetensors",
          "url": "https://huggingface.co/nbeerbower/Inkling-Gutenberg-DPO-colibri-int4/resolve/main/out-mtp.safetensors?download=true"
        }
      ]
    },
    {
      "repo": "sabrewing-engine/Inkling-colibri-int4",
      "bRating": "Unknown",
      "parameters": "Unknown",
      "size": "478.7 GB",
      "files": [
        {
          "label": "out-00001.safetensors",
          "url": "https://huggingface.co/sabrewing-engine/Inkling-colibri-int4/resolve/main/out-00001.safetensors?download=true"
        },
        {
          "label": "out-00002.safetensors",
          "url": "https://huggingface.co/sabrewing-engine/Inkling-colibri-int4/resolve/main/out-00002.safetensors?download=true"
        },
        {
          "label": "out-00003.safetensors",
          "url": "https://huggingface.co/sabrewing-engine/Inkling-colibri-int4/resolve/main/out-00003.safetensors?download=true"
        },
        {
          "label": "out-00004.safetensors",
          "url": "https://huggingface.co/sabrewing-engine/Inkling-colibri-int4/resolve/main/out-00004.safetensors?download=true"
        },
        {
          "label": "out-00005.safetensors",
          "url": "https://huggingface.co/sabrewing-engine/Inkling-colibri-int4/resolve/main/out-00005.safetensors?download=true"
        },
        {
          "label": "out-00006.safetensors",
          "url": "https://huggingface.co/sabrewing-engine/Inkling-colibri-int4/resolve/main/out-00006.safetensors?download=true"
        },
        {
          "label": "out-00007.safetensors",
          "url": "https://huggingface.co/sabrewing-engine/Inkling-colibri-int4/resolve/main/out-00007.safetensors?download=true"
        },
        {
          "label": "out-00008.safetensors",
          "url": "https://huggingface.co/sabrewing-engine/Inkling-colibri-int4/resolve/main/out-00008.safetensors?download=true"
        },
        {
          "label": "out-00009.safetensors",
          "url": "https://huggingface.co/sabrewing-engine/Inkling-colibri-int4/resolve/main/out-00009.safetensors?download=true"
        },
        {
          "label": "out-00010.safetensors",
          "url": "https://huggingface.co/sabrewing-engine/Inkling-colibri-int4/resolve/main/out-00010.safetensors?download=true"
        },
        {
          "label": "out-00011.safetensors",
          "url": "https://huggingface.co/sabrewing-engine/Inkling-colibri-int4/resolve/main/out-00011.safetensors?download=true"
        },
        {
          "label": "out-00012.safetensors",
          "url": "https://huggingface.co/sabrewing-engine/Inkling-colibri-int4/resolve/main/out-00012.safetensors?download=true"
        },
        {
          "label": "out-00013.safetensors",
          "url": "https://huggingface.co/sabrewing-engine/Inkling-colibri-int4/resolve/main/out-00013.safetensors?download=true"
        },
        {
          "label": "out-00014.safetensors",
          "url": "https://huggingface.co/sabrewing-engine/Inkling-colibri-int4/resolve/main/out-00014.safetensors?download=true"
        },
        {
          "label": "out-00015.safetensors",
          "url": "https://huggingface.co/sabrewing-engine/Inkling-colibri-int4/resolve/main/out-00015.safetensors?download=true"
        },
        {
          "label": "out-00016.safetensors",
          "url": "https://huggingface.co/sabrewing-engine/Inkling-colibri-int4/resolve/main/out-00016.safetensors?download=true"
        },
        {
          "label": "out-00017.safetensors",
          "url": "https://huggingface.co/sabrewing-engine/Inkling-colibri-int4/resolve/main/out-00017.safetensors?download=true"
        },
        {
          "label": "out-00018.safetensors",
          "url": "https://huggingface.co/sabrewing-engine/Inkling-colibri-int4/resolve/main/out-00018.safetensors?download=true"
        },
        {
          "label": "out-00019.safetensors",
          "url": "https://huggingface.co/sabrewing-engine/Inkling-colibri-int4/resolve/main/out-00019.safetensors?download=true"
        },
        {
          "label": "out-00020.safetensors",
          "url": "https://huggingface.co/sabrewing-engine/Inkling-colibri-int4/resolve/main/out-00020.safetensors?download=true"
        },
        {
          "label": "out-00021.safetensors",
          "url": "https://huggingface.co/sabrewing-engine/Inkling-colibri-int4/resolve/main/out-00021.safetensors?download=true"
        },
        {
          "label": "out-00022.safetensors",
          "url": "https://huggingface.co/sabrewing-engine/Inkling-colibri-int4/resolve/main/out-00022.safetensors?download=true"
        },
        {
          "label": "out-00023.safetensors",
          "url": "https://huggingface.co/sabrewing-engine/Inkling-colibri-int4/resolve/main/out-00023.safetensors?download=true"
        },
        {
          "label": "out-00024.safetensors",
          "url": "https://huggingface.co/sabrewing-engine/Inkling-colibri-int4/resolve/main/out-00024.safetensors?download=true"
        },
        {
          "label": "out-00025.safetensors",
          "url": "https://huggingface.co/sabrewing-engine/Inkling-colibri-int4/resolve/main/out-00025.safetensors?download=true"
        },
        {
          "label": "out-00026.safetensors",
          "url": "https://huggingface.co/sabrewing-engine/Inkling-colibri-int4/resolve/main/out-00026.safetensors?download=true"
        },
        {
          "label": "out-00027.safetensors",
          "url": "https://huggingface.co/sabrewing-engine/Inkling-colibri-int4/resolve/main/out-00027.safetensors?download=true"
        },
        {
          "label": "out-00028.safetensors",
          "url": "https://huggingface.co/sabrewing-engine/Inkling-colibri-int4/resolve/main/out-00028.safetensors?download=true"
        },
        {
          "label": "out-00029.safetensors",
          "url": "https://huggingface.co/sabrewing-engine/Inkling-colibri-int4/resolve/main/out-00029.safetensors?download=true"
        },
        {
          "label": "out-00030.safetensors",
          "url": "https://huggingface.co/sabrewing-engine/Inkling-colibri-int4/resolve/main/out-00030.safetensors?download=true"
        },
        {
          "label": "out-00031.safetensors",
          "url": "https://huggingface.co/sabrewing-engine/Inkling-colibri-int4/resolve/main/out-00031.safetensors?download=true"
        },
        {
          "label": "out-00032.safetensors",
          "url": "https://huggingface.co/sabrewing-engine/Inkling-colibri-int4/resolve/main/out-00032.safetensors?download=true"
        },
        {
          "label": "out-00033.safetensors",
          "url": "https://huggingface.co/sabrewing-engine/Inkling-colibri-int4/resolve/main/out-00033.safetensors?download=true"
        },
        {
          "label": "out-00034.safetensors",
          "url": "https://huggingface.co/sabrewing-engine/Inkling-colibri-int4/resolve/main/out-00034.safetensors?download=true"
        },
        {
          "label": "out-00035.safetensors",
          "url": "https://huggingface.co/sabrewing-engine/Inkling-colibri-int4/resolve/main/out-00035.safetensors?download=true"
        },
        {
          "label": "out-00036.safetensors",
          "url": "https://huggingface.co/sabrewing-engine/Inkling-colibri-int4/resolve/main/out-00036.safetensors?download=true"
        },
        {
          "label": "out-00037.safetensors",
          "url": "https://huggingface.co/sabrewing-engine/Inkling-colibri-int4/resolve/main/out-00037.safetensors?download=true"
        },
        {
          "label": "out-00038.safetensors",
          "url": "https://huggingface.co/sabrewing-engine/Inkling-colibri-int4/resolve/main/out-00038.safetensors?download=true"
        },
        {
          "label": "out-00039.safetensors",
          "url": "https://huggingface.co/sabrewing-engine/Inkling-colibri-int4/resolve/main/out-00039.safetensors?download=true"
        },
        {
          "label": "out-00040.safetensors",
          "url": "https://huggingface.co/sabrewing-engine/Inkling-colibri-int4/resolve/main/out-00040.safetensors?download=true"
        },
        {
          "label": "out-00041.safetensors",
          "url": "https://huggingface.co/sabrewing-engine/Inkling-colibri-int4/resolve/main/out-00041.safetensors?download=true"
        },
        {
          "label": "out-00042.safetensors",
          "url": "https://huggingface.co/sabrewing-engine/Inkling-colibri-int4/resolve/main/out-00042.safetensors?download=true"
        },
        {
          "label": "out-00043.safetensors",
          "url": "https://huggingface.co/sabrewing-engine/Inkling-colibri-int4/resolve/main/out-00043.safetensors?download=true"
        },
        {
          "label": "out-00044.safetensors",
          "url": "https://huggingface.co/sabrewing-engine/Inkling-colibri-int4/resolve/main/out-00044.safetensors?download=true"
        },
        {
          "label": "out-00045.safetensors",
          "url": "https://huggingface.co/sabrewing-engine/Inkling-colibri-int4/resolve/main/out-00045.safetensors?download=true"
        },
        {
          "label": "out-00046.safetensors",
          "url": "https://huggingface.co/sabrewing-engine/Inkling-colibri-int4/resolve/main/out-00046.safetensors?download=true"
        },
        {
          "label": "out-00047.safetensors",
          "url": "https://huggingface.co/sabrewing-engine/Inkling-colibri-int4/resolve/main/out-00047.safetensors?download=true"
        },
        {
          "label": "out-00048.safetensors",
          "url": "https://huggingface.co/sabrewing-engine/Inkling-colibri-int4/resolve/main/out-00048.safetensors?download=true"
        },
        {
          "label": "out-00049.safetensors",
          "url": "https://huggingface.co/sabrewing-engine/Inkling-colibri-int4/resolve/main/out-00049.safetensors?download=true"
        },
        {
          "label": "out-00050.safetensors",
          "url": "https://huggingface.co/sabrewing-engine/Inkling-colibri-int4/resolve/main/out-00050.safetensors?download=true"
        },
        {
          "label": "out-00051.safetensors",
          "url": "https://huggingface.co/sabrewing-engine/Inkling-colibri-int4/resolve/main/out-00051.safetensors?download=true"
        },
        {
          "label": "out-00052.safetensors",
          "url": "https://huggingface.co/sabrewing-engine/Inkling-colibri-int4/resolve/main/out-00052.safetensors?download=true"
        },
        {
          "label": "out-00053.safetensors",
          "url": "https://huggingface.co/sabrewing-engine/Inkling-colibri-int4/resolve/main/out-00053.safetensors?download=true"
        },
        {
          "label": "out-00054.safetensors",
          "url": "https://huggingface.co/sabrewing-engine/Inkling-colibri-int4/resolve/main/out-00054.safetensors?download=true"
        },
        {
          "label": "out-00055.safetensors",
          "url": "https://huggingface.co/sabrewing-engine/Inkling-colibri-int4/resolve/main/out-00055.safetensors?download=true"
        },
        {
          "label": "out-00056.safetensors",
          "url": "https://huggingface.co/sabrewing-engine/Inkling-colibri-int4/resolve/main/out-00056.safetensors?download=true"
        },
        {
          "label": "out-00057.safetensors",
          "url": "https://huggingface.co/sabrewing-engine/Inkling-colibri-int4/resolve/main/out-00057.safetensors?download=true"
        },
        {
          "label": "out-00058.safetensors",
          "url": "https://huggingface.co/sabrewing-engine/Inkling-colibri-int4/resolve/main/out-00058.safetensors?download=true"
        },
        {
          "label": "out-00059.safetensors",
          "url": "https://huggingface.co/sabrewing-engine/Inkling-colibri-int4/resolve/main/out-00059.safetensors?download=true"
        },
        {
          "label": "out-00060.safetensors",
          "url": "https://huggingface.co/sabrewing-engine/Inkling-colibri-int4/resolve/main/out-00060.safetensors?download=true"
        },
        {
          "label": "out-00061.safetensors",
          "url": "https://huggingface.co/sabrewing-engine/Inkling-colibri-int4/resolve/main/out-00061.safetensors?download=true"
        },
        {
          "label": "out-00062.safetensors",
          "url": "https://huggingface.co/sabrewing-engine/Inkling-colibri-int4/resolve/main/out-00062.safetensors?download=true"
        },
        {
          "label": "out-00063.safetensors",
          "url": "https://huggingface.co/sabrewing-engine/Inkling-colibri-int4/resolve/main/out-00063.safetensors?download=true"
        },
        {
          "label": "out-00064.safetensors",
          "url": "https://huggingface.co/sabrewing-engine/Inkling-colibri-int4/resolve/main/out-00064.safetensors?download=true"
        },
        {
          "label": "out-00065.safetensors",
          "url": "https://huggingface.co/sabrewing-engine/Inkling-colibri-int4/resolve/main/out-00065.safetensors?download=true"
        },
        {
          "label": "out-00066.safetensors",
          "url": "https://huggingface.co/sabrewing-engine/Inkling-colibri-int4/resolve/main/out-00066.safetensors?download=true"
        },
        {
          "label": "out-00067.safetensors",
          "url": "https://huggingface.co/sabrewing-engine/Inkling-colibri-int4/resolve/main/out-00067.safetensors?download=true"
        },
        {
          "label": "out-00068.safetensors",
          "url": "https://huggingface.co/sabrewing-engine/Inkling-colibri-int4/resolve/main/out-00068.safetensors?download=true"
        },
        {
          "label": "out-00069.safetensors",
          "url": "https://huggingface.co/sabrewing-engine/Inkling-colibri-int4/resolve/main/out-00069.safetensors?download=true"
        },
        {
          "label": "out-00070.safetensors",
          "url": "https://huggingface.co/sabrewing-engine/Inkling-colibri-int4/resolve/main/out-00070.safetensors?download=true"
        },
        {
          "label": "out-00071.safetensors",
          "url": "https://huggingface.co/sabrewing-engine/Inkling-colibri-int4/resolve/main/out-00071.safetensors?download=true"
        },
        {
          "label": "out-00072.safetensors",
          "url": "https://huggingface.co/sabrewing-engine/Inkling-colibri-int4/resolve/main/out-00072.safetensors?download=true"
        },
        {
          "label": "out-00073.safetensors",
          "url": "https://huggingface.co/sabrewing-engine/Inkling-colibri-int4/resolve/main/out-00073.safetensors?download=true"
        },
        {
          "label": "out-00074.safetensors",
          "url": "https://huggingface.co/sabrewing-engine/Inkling-colibri-int4/resolve/main/out-00074.safetensors?download=true"
        },
        {
          "label": "out-00075.safetensors",
          "url": "https://huggingface.co/sabrewing-engine/Inkling-colibri-int4/resolve/main/out-00075.safetensors?download=true"
        },
        {
          "label": "out-00076.safetensors",
          "url": "https://huggingface.co/sabrewing-engine/Inkling-colibri-int4/resolve/main/out-00076.safetensors?download=true"
        },
        {
          "label": "out-00077.safetensors",
          "url": "https://huggingface.co/sabrewing-engine/Inkling-colibri-int4/resolve/main/out-00077.safetensors?download=true"
        },
        {
          "label": "out-00078.safetensors",
          "url": "https://huggingface.co/sabrewing-engine/Inkling-colibri-int4/resolve/main/out-00078.safetensors?download=true"
        },
        {
          "label": "out-00079.safetensors",
          "url": "https://huggingface.co/sabrewing-engine/Inkling-colibri-int4/resolve/main/out-00079.safetensors?download=true"
        },
        {
          "label": "out-00080.safetensors",
          "url": "https://huggingface.co/sabrewing-engine/Inkling-colibri-int4/resolve/main/out-00080.safetensors?download=true"
        },
        {
          "label": "out-00081.safetensors",
          "url": "https://huggingface.co/sabrewing-engine/Inkling-colibri-int4/resolve/main/out-00081.safetensors?download=true"
        },
        {
          "label": "out-00082.safetensors",
          "url": "https://huggingface.co/sabrewing-engine/Inkling-colibri-int4/resolve/main/out-00082.safetensors?download=true"
        },
        {
          "label": "out-00083.safetensors",
          "url": "https://huggingface.co/sabrewing-engine/Inkling-colibri-int4/resolve/main/out-00083.safetensors?download=true"
        },
        {
          "label": "out-00084.safetensors",
          "url": "https://huggingface.co/sabrewing-engine/Inkling-colibri-int4/resolve/main/out-00084.safetensors?download=true"
        },
        {
          "label": "out-00085.safetensors",
          "url": "https://huggingface.co/sabrewing-engine/Inkling-colibri-int4/resolve/main/out-00085.safetensors?download=true"
        },
        {
          "label": "out-00086.safetensors",
          "url": "https://huggingface.co/sabrewing-engine/Inkling-colibri-int4/resolve/main/out-00086.safetensors?download=true"
        },
        {
          "label": "out-00087.safetensors",
          "url": "https://huggingface.co/sabrewing-engine/Inkling-colibri-int4/resolve/main/out-00087.safetensors?download=true"
        },
        {
          "label": "out-00088.safetensors",
          "url": "https://huggingface.co/sabrewing-engine/Inkling-colibri-int4/resolve/main/out-00088.safetensors?download=true"
        },
        {
          "label": "out-00089.safetensors",
          "url": "https://huggingface.co/sabrewing-engine/Inkling-colibri-int4/resolve/main/out-00089.safetensors?download=true"
        },
        {
          "label": "out-00090.safetensors",
          "url": "https://huggingface.co/sabrewing-engine/Inkling-colibri-int4/resolve/main/out-00090.safetensors?download=true"
        },
        {
          "label": "out-00091.safetensors",
          "url": "https://huggingface.co/sabrewing-engine/Inkling-colibri-int4/resolve/main/out-00091.safetensors?download=true"
        },
        {
          "label": "out-00092.safetensors",
          "url": "https://huggingface.co/sabrewing-engine/Inkling-colibri-int4/resolve/main/out-00092.safetensors?download=true"
        },
        {
          "label": "out-00093.safetensors",
          "url": "https://huggingface.co/sabrewing-engine/Inkling-colibri-int4/resolve/main/out-00093.safetensors?download=true"
        },
        {
          "label": "out-00094.safetensors",
          "url": "https://huggingface.co/sabrewing-engine/Inkling-colibri-int4/resolve/main/out-00094.safetensors?download=true"
        },
        {
          "label": "out-00095.safetensors",
          "url": "https://huggingface.co/sabrewing-engine/Inkling-colibri-int4/resolve/main/out-00095.safetensors?download=true"
        },
        {
          "label": "out-00096.safetensors",
          "url": "https://huggingface.co/sabrewing-engine/Inkling-colibri-int4/resolve/main/out-00096.safetensors?download=true"
        },
        {
          "label": "out-00097.safetensors",
          "url": "https://huggingface.co/sabrewing-engine/Inkling-colibri-int4/resolve/main/out-00097.safetensors?download=true"
        },
        {
          "label": "out-00098.safetensors",
          "url": "https://huggingface.co/sabrewing-engine/Inkling-colibri-int4/resolve/main/out-00098.safetensors?download=true"
        },
        {
          "label": "out-00099.safetensors",
          "url": "https://huggingface.co/sabrewing-engine/Inkling-colibri-int4/resolve/main/out-00099.safetensors?download=true"
        },
        {
          "label": "out-00100.safetensors",
          "url": "https://huggingface.co/sabrewing-engine/Inkling-colibri-int4/resolve/main/out-00100.safetensors?download=true"
        },
        {
          "label": "out-00101.safetensors",
          "url": "https://huggingface.co/sabrewing-engine/Inkling-colibri-int4/resolve/main/out-00101.safetensors?download=true"
        },
        {
          "label": "out-00102.safetensors",
          "url": "https://huggingface.co/sabrewing-engine/Inkling-colibri-int4/resolve/main/out-00102.safetensors?download=true"
        },
        {
          "label": "out-00103.safetensors",
          "url": "https://huggingface.co/sabrewing-engine/Inkling-colibri-int4/resolve/main/out-00103.safetensors?download=true"
        },
        {
          "label": "out-00104.safetensors",
          "url": "https://huggingface.co/sabrewing-engine/Inkling-colibri-int4/resolve/main/out-00104.safetensors?download=true"
        },
        {
          "label": "out-00105.safetensors",
          "url": "https://huggingface.co/sabrewing-engine/Inkling-colibri-int4/resolve/main/out-00105.safetensors?download=true"
        },
        {
          "label": "out-00106.safetensors",
          "url": "https://huggingface.co/sabrewing-engine/Inkling-colibri-int4/resolve/main/out-00106.safetensors?download=true"
        },
        {
          "label": "out-00107.safetensors",
          "url": "https://huggingface.co/sabrewing-engine/Inkling-colibri-int4/resolve/main/out-00107.safetensors?download=true"
        },
        {
          "label": "out-00108.safetensors",
          "url": "https://huggingface.co/sabrewing-engine/Inkling-colibri-int4/resolve/main/out-00108.safetensors?download=true"
        },
        {
          "label": "out-mtp.safetensors",
          "url": "https://huggingface.co/sabrewing-engine/Inkling-colibri-int4/resolve/main/out-mtp.safetensors?download=true"
        }
      ]
    }
  ]
}
