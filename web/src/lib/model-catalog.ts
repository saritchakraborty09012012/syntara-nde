/* Model catalog — GENERATED from Syntara_Model_Catalog_With_Params_Size.txt
   (catalog export dated 2026-09-26). Do not edit by hand; regenerate when
   the source catalog changes.

   Download URLs are data-only on purpose: the UI renders Download buttons
   that read these URLs at click time, never <a href> links, so the links
   are not exposed as navigable destinations on the family page. */

export interface CatalogFile {
  label: string
  url: string
}

export interface CatalogModel {
  repo: string
  bRating: string
  parameters: string
  size: string
  files: CatalogFile[]
}

export const modelCatalog: Record<string, CatalogModel[]> = {
  "gpt2-local": [
    {
      "repo": "openai-community/gpt2",
      "bRating": "150M",
      "parameters": "150M",
      "size": "≈0.3 GB (BF16 estimate)",
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
      "size": "≈40.0 GB (BF16 estimate)",
      "files": [
        {
          "label": "model.safetensors",
          "url": "https://huggingface.co/openai/gpt-oss-20b/resolve/main/model.safetensors?download=true"
        }
      ]
    },
    {
      "repo": "openai/gpt-oss-120b",
      "bRating": "120B",
      "parameters": "120B",
      "size": "≈240.0 GB (BF16 estimate)",
      "files": [
        {
          "label": "model.safetensors",
          "url": "https://huggingface.co/openai/gpt-oss-120b/resolve/main/model.safetensors?download=true"
        }
      ]
    }
  ],
  "llama-local": [
    {
      "repo": "meta-llama/Llama-3.1-8B",
      "bRating": "8B",
      "parameters": "8B",
      "size": "≈16.0 GB (BF16 estimate)",
      "files": [
        {
          "label": "model.safetensors",
          "url": "https://huggingface.co/meta-llama/Llama-3.1-8B/resolve/main/model.safetensors?download=true"
        }
      ]
    },
    {
      "repo": "meta-llama/Llama-3.1-8B-Instruct",
      "bRating": "8B",
      "parameters": "8B",
      "size": "≈16.0 GB (BF16 estimate)",
      "files": [
        {
          "label": "model.safetensors",
          "url": "https://huggingface.co/meta-llama/Llama-3.1-8B-Instruct/resolve/main/model.safetensors?download=true"
        }
      ]
    },
    {
      "repo": "meta-llama/Llama-3.1-70B",
      "bRating": "70B",
      "parameters": "70B",
      "size": "≈140.0 GB (BF16 estimate)",
      "files": [
        {
          "label": "model.safetensors",
          "url": "https://huggingface.co/meta-llama/Llama-3.1-70B/resolve/main/model.safetensors?download=true"
        }
      ]
    },
    {
      "repo": "meta-llama/Llama-3.1-70B-Instruct",
      "bRating": "70B",
      "parameters": "70B",
      "size": "≈140.0 GB (BF16 estimate)",
      "files": [
        {
          "label": "model.safetensors",
          "url": "https://huggingface.co/meta-llama/Llama-3.1-70B-Instruct/resolve/main/model.safetensors?download=true"
        }
      ]
    },
    {
      "repo": "meta-llama/Llama-3.3-70B-Instruct",
      "bRating": "70B",
      "parameters": "70B",
      "size": "≈140.0 GB (BF16 estimate)",
      "files": [
        {
          "label": "model.safetensors",
          "url": "https://huggingface.co/meta-llama/Llama-3.3-70B-Instruct/resolve/main/model.safetensors?download=true"
        }
      ]
    },
    {
      "repo": "meta-llama/Llama-3.2-1B",
      "bRating": "1B",
      "parameters": "1B",
      "size": "≈2.0 GB (BF16 estimate)",
      "files": [
        {
          "label": "model.safetensors",
          "url": "https://huggingface.co/meta-llama/Llama-3.2-1B/resolve/main/model.safetensors?download=true"
        }
      ]
    },
    {
      "repo": "meta-llama/Llama-3.2-3B",
      "bRating": "3B",
      "parameters": "3B",
      "size": "≈6.0 GB (BF16 estimate)",
      "files": [
        {
          "label": "model.safetensors",
          "url": "https://huggingface.co/meta-llama/Llama-3.2-3B/resolve/main/model.safetensors?download=true"
        }
      ]
    },
    {
      "repo": "meta-llama/Llama-3.2-1B-Instruct",
      "bRating": "1B",
      "parameters": "1B",
      "size": "≈2.0 GB (BF16 estimate)",
      "files": [
        {
          "label": "model.safetensors",
          "url": "https://huggingface.co/meta-llama/Llama-3.2-1B-Instruct/resolve/main/model.safetensors?download=true"
        }
      ]
    },
    {
      "repo": "meta-llama/Llama-3.2-3B-Instruct",
      "bRating": "3B",
      "parameters": "3B",
      "size": "≈6.0 GB (BF16 estimate)",
      "files": [
        {
          "label": "model.safetensors",
          "url": "https://huggingface.co/meta-llama/Llama-3.2-3B-Instruct/resolve/main/model.safetensors?download=true"
        }
      ]
    }
  ],
  "mistral-local": [
    {
      "repo": "mistralai/Mistral-7B-v0.1",
      "bRating": "7B",
      "parameters": "7B",
      "size": "≈14.0 GB (BF16 estimate)",
      "files": [
        {
          "label": "model.safetensors",
          "url": "https://huggingface.co/mistralai/Mistral-7B-v0.1/resolve/main/model.safetensors?download=true"
        }
      ]
    },
    {
      "repo": "mistralai/Mistral-7B-Instruct-v0.2",
      "bRating": "7B",
      "parameters": "7B",
      "size": "≈14.0 GB (BF16 estimate)",
      "files": [
        {
          "label": "model.safetensors",
          "url": "https://huggingface.co/mistralai/Mistral-7B-Instruct-v0.2/resolve/main/model.safetensors?download=true"
        }
      ]
    },
    {
      "repo": "mistralai/Mistral-7B-Instruct-v0.3",
      "bRating": "7B",
      "parameters": "7B",
      "size": "≈14.0 GB (BF16 estimate)",
      "files": [
        {
          "label": "model.safetensors",
          "url": "https://huggingface.co/mistralai/Mistral-7B-Instruct-v0.3/resolve/main/model.safetensors?download=true"
        }
      ]
    },
    {
      "repo": "mistralai/Mixtral-8x7B-v0.1",
      "bRating": "Unknown",
      "parameters": "Unknown",
      "size": "Unknown / repository-dependent",
      "files": [
        {
          "label": "model.safetensors",
          "url": "https://huggingface.co/mistralai/Mixtral-8x7B-v0.1/resolve/main/model.safetensors?download=true"
        }
      ]
    },
    {
      "repo": "mistralai/Mixtral-8x7B-Instruct-v0.1",
      "bRating": "Unknown",
      "parameters": "Unknown",
      "size": "Unknown / repository-dependent",
      "files": [
        {
          "label": "model.safetensors",
          "url": "https://huggingface.co/mistralai/Mixtral-8x7B-Instruct-v0.1/resolve/main/model.safetensors?download=true"
        }
      ]
    },
    {
      "repo": "mistralai/Mixtral-8x22B-v0.1",
      "bRating": "Unknown",
      "parameters": "Unknown",
      "size": "Unknown / repository-dependent",
      "files": [
        {
          "label": "model.safetensors",
          "url": "https://huggingface.co/mistralai/Mixtral-8x22B-v0.1/resolve/main/model.safetensors?download=true"
        }
      ]
    },
    {
      "repo": "mistralai/Mixtral-8x22B-Instruct-v0.1",
      "bRating": "Unknown",
      "parameters": "Unknown",
      "size": "Unknown / repository-dependent",
      "files": [
        {
          "label": "model.safetensors",
          "url": "https://huggingface.co/mistralai/Mixtral-8x22B-Instruct-v0.1/resolve/main/model.safetensors?download=true"
        }
      ]
    }
  ],
  "gemma-local": [
    {
      "repo": "google/gemma-2-2b",
      "bRating": "2B",
      "parameters": "2B",
      "size": "≈4.0 GB (BF16 estimate)",
      "files": [
        {
          "label": "model.safetensors",
          "url": "https://huggingface.co/google/gemma-2-2b/resolve/main/model.safetensors?download=true"
        }
      ]
    },
    {
      "repo": "google/gemma-2-2b-it",
      "bRating": "2B",
      "parameters": "2B",
      "size": "≈4.0 GB (BF16 estimate)",
      "files": [
        {
          "label": "model.safetensors",
          "url": "https://huggingface.co/google/gemma-2-2b-it/resolve/main/model.safetensors?download=true"
        }
      ]
    },
    {
      "repo": "google/gemma-2-9b",
      "bRating": "9B",
      "parameters": "9B",
      "size": "≈18.0 GB (BF16 estimate)",
      "files": [
        {
          "label": "model.safetensors",
          "url": "https://huggingface.co/google/gemma-2-9b/resolve/main/model.safetensors?download=true"
        }
      ]
    },
    {
      "repo": "google/gemma-2-9b-it",
      "bRating": "9B",
      "parameters": "9B",
      "size": "≈18.0 GB (BF16 estimate)",
      "files": [
        {
          "label": "model.safetensors",
          "url": "https://huggingface.co/google/gemma-2-9b-it/resolve/main/model.safetensors?download=true"
        }
      ]
    },
    {
      "repo": "google/gemma-2-27b",
      "bRating": "27B",
      "parameters": "27B",
      "size": "≈54.0 GB (BF16 estimate)",
      "files": [
        {
          "label": "model.safetensors",
          "url": "https://huggingface.co/google/gemma-2-27b/resolve/main/model.safetensors?download=true"
        }
      ]
    },
    {
      "repo": "google/gemma-2-27b-it",
      "bRating": "27B",
      "parameters": "27B",
      "size": "≈54.0 GB (BF16 estimate)",
      "files": [
        {
          "label": "model.safetensors",
          "url": "https://huggingface.co/google/gemma-2-27b-it/resolve/main/model.safetensors?download=true"
        }
      ]
    },
    {
      "repo": "google/gemma-3-1b-it",
      "bRating": "1B",
      "parameters": "1B",
      "size": "≈2.0 GB (BF16 estimate)",
      "files": [
        {
          "label": "model.safetensors",
          "url": "https://huggingface.co/google/gemma-3-1b-it/resolve/main/model.safetensors?download=true"
        }
      ]
    },
    {
      "repo": "google/gemma-3-4b-it",
      "bRating": "4B",
      "parameters": "4B",
      "size": "≈8.0 GB (BF16 estimate)",
      "files": [
        {
          "label": "model.safetensors",
          "url": "https://huggingface.co/google/gemma-3-4b-it/resolve/main/model.safetensors?download=true"
        }
      ]
    },
    {
      "repo": "google/gemma-3-12b-it",
      "bRating": "12B",
      "parameters": "12B",
      "size": "≈24.0 GB (BF16 estimate)",
      "files": [
        {
          "label": "model.safetensors",
          "url": "https://huggingface.co/google/gemma-3-12b-it/resolve/main/model.safetensors?download=true"
        }
      ]
    },
    {
      "repo": "google/gemma-3-27b-it",
      "bRating": "27B",
      "parameters": "27B",
      "size": "≈54.0 GB (BF16 estimate)",
      "files": [
        {
          "label": "model.safetensors",
          "url": "https://huggingface.co/google/gemma-3-27b-it/resolve/main/model.safetensors?download=true"
        }
      ]
    }
  ],
  "phi-local": [
    {
      "repo": "microsoft/phi-2",
      "bRating": "2.7B",
      "parameters": "2.7B",
      "size": "≈5.4 GB (BF16 estimate)",
      "files": [
        {
          "label": "model.safetensors",
          "url": "https://huggingface.co/microsoft/phi-2/resolve/main/model.safetensors?download=true"
        }
      ]
    },
    {
      "repo": "microsoft/Phi-3-mini-4k-instruct",
      "bRating": "Unknown",
      "parameters": "Unknown",
      "size": "Unknown / repository-dependent",
      "files": [
        {
          "label": "model.safetensors",
          "url": "https://huggingface.co/microsoft/Phi-3-mini-4k-instruct/resolve/main/model.safetensors?download=true"
        }
      ]
    },
    {
      "repo": "microsoft/Phi-3-medium-4k-instruct",
      "bRating": "Unknown",
      "parameters": "Unknown",
      "size": "Unknown / repository-dependent",
      "files": [
        {
          "label": "model.safetensors",
          "url": "https://huggingface.co/microsoft/Phi-3-medium-4k-instruct/resolve/main/model.safetensors?download=true"
        }
      ]
    },
    {
      "repo": "microsoft/Phi-3.5-mini-instruct",
      "bRating": "Unknown",
      "parameters": "Unknown",
      "size": "Unknown / repository-dependent",
      "files": [
        {
          "label": "model.safetensors",
          "url": "https://huggingface.co/microsoft/Phi-3.5-mini-instruct/resolve/main/model.safetensors?download=true"
        }
      ]
    },
    {
      "repo": "microsoft/Phi-3.5-MoE-instruct",
      "bRating": "Unknown",
      "parameters": "Unknown",
      "size": "Unknown / repository-dependent",
      "files": [
        {
          "label": "model.safetensors",
          "url": "https://huggingface.co/microsoft/Phi-3.5-MoE-instruct/resolve/main/model.safetensors?download=true"
        }
      ]
    },
    {
      "repo": "microsoft/phi-4",
      "bRating": "Unknown",
      "parameters": "Unknown",
      "size": "Unknown / repository-dependent",
      "files": [
        {
          "label": "model.safetensors",
          "url": "https://huggingface.co/microsoft/phi-4/resolve/main/model.safetensors?download=true"
        }
      ]
    },
    {
      "repo": "microsoft/Phi-4-mini-instruct",
      "bRating": "Unknown",
      "parameters": "Unknown",
      "size": "Unknown / repository-dependent",
      "files": [
        {
          "label": "model.safetensors",
          "url": "https://huggingface.co/microsoft/Phi-4-mini-instruct/resolve/main/model.safetensors?download=true"
        }
      ]
    }
  ],
  "falcon-local": [
    {
      "repo": "tiiuae/falcon-7b",
      "bRating": "7B",
      "parameters": "7B",
      "size": "≈14.0 GB (BF16 estimate)",
      "files": [
        {
          "label": "model.safetensors",
          "url": "https://huggingface.co/tiiuae/falcon-7b/resolve/main/model.safetensors?download=true"
        }
      ]
    },
    {
      "repo": "tiiuae/falcon-40b",
      "bRating": "40B",
      "parameters": "40B",
      "size": "≈80.0 GB (BF16 estimate)",
      "files": [
        {
          "label": "model.safetensors",
          "url": "https://huggingface.co/tiiuae/falcon-40b/resolve/main/model.safetensors?download=true"
        }
      ]
    },
    {
      "repo": "tiiuae/falcon-180B",
      "bRating": "180B",
      "parameters": "180B",
      "size": "≈360.0 GB (BF16 estimate)",
      "files": [
        {
          "label": "model.safetensors",
          "url": "https://huggingface.co/tiiuae/falcon-180B/resolve/main/model.safetensors?download=true"
        }
      ]
    }
  ],
  "bloom-local": [
    {
      "repo": "bigscience/bloom-560m",
      "bRating": "560M",
      "parameters": "560M",
      "size": "≈1.1 GB (BF16 estimate)",
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
      "size": "≈3.4 GB (BF16 estimate)",
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
      "size": "≈6.0 GB (BF16 estimate)",
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
      "size": "≈14.2 GB (BF16 estimate)",
      "files": [
        {
          "label": "model.safetensors",
          "url": "https://huggingface.co/bigscience/bloom-7b1/resolve/main/model.safetensors?download=true"
        }
      ]
    }
  ],
  "starcoder-local": [
    {
      "repo": "bigcode/starcoder",
      "bRating": "15.5B",
      "parameters": "15.5B",
      "size": "≈31.0 GB (BF16 estimate)",
      "files": [
        {
          "label": "model.safetensors",
          "url": "https://huggingface.co/bigcode/starcoder/resolve/main/model.safetensors?download=true"
        }
      ]
    },
    {
      "repo": "bigcode/starcoder2-3b",
      "bRating": "3B",
      "parameters": "3B",
      "size": "≈6.0 GB (BF16 estimate)",
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
      "size": "≈14.0 GB (BF16 estimate)",
      "files": [
        {
          "label": "model.safetensors",
          "url": "https://huggingface.co/bigcode/starcoder2-7b/resolve/main/model.safetensors?download=true"
        }
      ]
    },
    {
      "repo": "bigcode/starcoder2-15b",
      "bRating": "15B",
      "parameters": "15B",
      "size": "≈30.0 GB (BF16 estimate)",
      "files": [
        {
          "label": "model.safetensors",
          "url": "https://huggingface.co/bigcode/starcoder2-15b/resolve/main/model.safetensors?download=true"
        }
      ]
    }
  ],
  "olmo-local": [
    {
      "repo": "allenai/OLMo-1B",
      "bRating": "1B",
      "parameters": "1B",
      "size": "≈2.0 GB (BF16 estimate)",
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
      "size": "≈14.0 GB (BF16 estimate)",
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
      "size": "≈14.0 GB (BF16 estimate)",
      "files": [
        {
          "label": "model.safetensors",
          "url": "https://huggingface.co/allenai/OLMo-7B-Instruct/resolve/main/model.safetensors?download=true"
        }
      ]
    },
    {
      "repo": "allenai/OLMoE-1B-7B-0125",
      "bRating": "7.1B",
      "parameters": "7.1B",
      "size": "≈14.2 GB (BF16 estimate)",
      "files": [
        {
          "label": "Safetensors shard 1/6",
          "url": "https://huggingface.co/allenai/OLMoE-1B-7B-0125/resolve/main/model-00001-of-00006.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 2/6",
          "url": "https://huggingface.co/allenai/OLMoE-1B-7B-0125/resolve/main/model-00002-of-00006.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 3/6",
          "url": "https://huggingface.co/allenai/OLMoE-1B-7B-0125/resolve/main/model-00003-of-00006.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 4/6",
          "url": "https://huggingface.co/allenai/OLMoE-1B-7B-0125/resolve/main/model-00004-of-00006.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 5/6",
          "url": "https://huggingface.co/allenai/OLMoE-1B-7B-0125/resolve/main/model-00005-of-00006.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 6/6",
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
      "size": "≈12.0 GB (BF16 estimate)",
      "files": [
        {
          "label": "model.safetensors",
          "url": "https://huggingface.co/01-ai/Yi-6B/resolve/main/model.safetensors?download=true"
        }
      ]
    },
    {
      "repo": "01-ai/Yi-34B",
      "bRating": "34B",
      "parameters": "34B",
      "size": "≈68.0 GB (BF16 estimate)",
      "files": [
        {
          "label": "model.safetensors",
          "url": "https://huggingface.co/01-ai/Yi-34B/resolve/main/model.safetensors?download=true"
        }
      ]
    },
    {
      "repo": "01-ai/Yi-1.5-6B",
      "bRating": "6B",
      "parameters": "6B",
      "size": "≈12.0 GB (BF16 estimate)",
      "files": [
        {
          "label": "model.safetensors",
          "url": "https://huggingface.co/01-ai/Yi-1.5-6B/resolve/main/model.safetensors?download=true"
        }
      ]
    },
    {
      "repo": "01-ai/Yi-1.5-9B",
      "bRating": "9B",
      "parameters": "9B",
      "size": "≈18.0 GB (BF16 estimate)",
      "files": [
        {
          "label": "model.safetensors",
          "url": "https://huggingface.co/01-ai/Yi-1.5-9B/resolve/main/model.safetensors?download=true"
        }
      ]
    },
    {
      "repo": "01-ai/Yi-1.5-34B",
      "bRating": "34B",
      "parameters": "34B",
      "size": "≈68.0 GB (BF16 estimate)",
      "files": [
        {
          "label": "model.safetensors",
          "url": "https://huggingface.co/01-ai/Yi-1.5-34B/resolve/main/model.safetensors?download=true"
        }
      ]
    }
  ],
  "chatglm-local": [
    {
      "repo": "THUDM/chatglm3-6b",
      "bRating": "6B",
      "parameters": "6B",
      "size": "≈12.0 GB (BF16 estimate)",
      "files": [
        {
          "label": "model.safetensors",
          "url": "https://huggingface.co/THUDM/chatglm3-6b/resolve/main/model.safetensors?download=true"
        }
      ]
    }
  ],
  "glm-local": [
    {
      "repo": "THUDM/glm-4-9b",
      "bRating": "9B",
      "parameters": "9B",
      "size": "≈18.0 GB (BF16 estimate)",
      "files": [
        {
          "label": "model.safetensors",
          "url": "https://huggingface.co/THUDM/glm-4-9b/resolve/main/model.safetensors?download=true"
        }
      ]
    },
    {
      "repo": "THUDM/glm-4-9b-chat",
      "bRating": "9B",
      "parameters": "9B",
      "size": "≈18.0 GB (BF16 estimate)",
      "files": [
        {
          "label": "model.safetensors",
          "url": "https://huggingface.co/THUDM/glm-4-9b-chat/resolve/main/model.safetensors?download=true"
        }
      ]
    },
    {
      "repo": "zai-org/GLM-5.3",
      "bRating": "Unknown",
      "parameters": "Unknown",
      "size": "Unknown / repository-dependent",
      "files": [
        {
          "label": "model.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5.3/resolve/main/model.safetensors?download=true"
        }
      ]
    },
    {
      "repo": "zai-org/GLM-5.3-Flash",
      "bRating": "Unknown",
      "parameters": "Unknown",
      "size": "Unknown / repository-dependent",
      "files": [
        {
          "label": "model.safetensors",
          "url": "https://huggingface.co/zai-org/GLM-5.3-Flash/resolve/main/model.safetensors?download=true"
        }
      ]
    },
    {
      "repo": "zai-org/GLM-5",
      "bRating": "744B",
      "parameters": "744B",
      "size": "≈1.49 TB (BF16 estimate)",
      "files": [
        {
          "label": "Safetensors shard 1/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00001-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 2/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00002-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 3/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00003-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 4/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00004-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 5/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00005-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 6/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00006-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 7/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00007-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 8/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00008-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 9/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00009-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 10/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00010-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 11/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00011-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 12/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00012-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 13/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00013-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 14/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00014-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 15/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00015-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 16/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00016-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 17/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00017-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 18/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00018-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 19/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00019-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 20/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00020-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 21/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00021-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 22/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00022-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 23/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00023-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 24/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00024-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 25/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00025-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 26/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00026-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 27/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00027-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 28/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00028-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 29/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00029-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 30/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00030-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 31/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00031-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 32/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00032-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 33/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00033-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 34/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00034-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 35/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00035-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 36/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00036-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 37/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00037-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 38/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00038-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 39/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00039-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 40/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00040-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 41/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00041-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 42/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00042-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 43/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00043-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 44/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00044-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 45/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00045-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 46/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00046-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 47/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00047-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 48/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00048-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 49/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00049-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 50/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00050-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 51/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00051-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 52/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00052-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 53/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00053-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 54/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00054-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 55/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00055-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 56/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00056-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 57/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00057-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 58/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00058-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 59/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00059-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 60/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00060-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 61/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00061-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 62/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00062-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 63/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00063-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 64/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00064-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 65/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00065-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 66/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00066-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 67/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00067-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 68/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00068-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 69/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00069-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 70/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00070-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 71/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00071-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 72/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00072-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 73/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00073-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 74/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00074-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 75/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00075-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 76/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00076-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 77/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00077-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 78/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00078-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 79/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00079-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 80/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00080-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 81/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00081-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 82/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00082-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 83/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00083-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 84/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00084-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 85/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00085-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 86/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00086-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 87/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00087-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 88/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00088-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 89/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00089-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 90/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00090-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 91/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00091-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 92/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00092-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 93/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00093-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 94/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00094-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 95/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00095-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 96/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00096-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 97/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00097-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 98/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00098-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 99/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00099-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 100/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00100-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 101/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00101-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 102/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00102-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 103/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00103-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 104/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00104-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 105/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00105-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 106/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00106-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 107/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00107-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 108/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00108-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 109/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00109-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 110/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00110-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 111/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00111-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 112/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00112-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 113/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00113-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 114/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00114-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 115/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00115-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 116/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00116-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 117/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00117-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 118/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00118-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 119/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00119-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 120/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00120-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 121/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00121-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 122/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00122-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 123/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00123-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 124/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00124-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 125/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00125-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 126/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00126-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 127/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00127-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 128/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00128-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 129/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00129-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 130/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00130-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 131/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00131-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 132/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00132-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 133/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00133-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 134/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00134-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 135/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00135-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 136/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00136-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 137/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00137-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 138/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00138-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 139/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00139-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 140/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00140-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 141/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00141-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 142/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00142-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 143/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00143-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 144/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00144-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 145/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00145-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 146/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00146-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 147/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00147-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 148/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00148-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 149/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00149-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 150/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00150-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 151/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00151-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 152/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00152-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 153/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00153-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 154/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00154-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 155/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00155-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 156/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00156-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 157/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00157-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 158/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00158-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 159/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00159-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 160/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00160-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 161/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00161-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 162/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00162-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 163/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00163-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 164/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00164-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 165/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00165-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 166/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00166-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 167/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00167-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 168/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00168-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 169/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00169-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 170/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00170-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 171/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00171-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 172/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00172-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 173/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00173-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 174/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00174-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 175/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00175-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 176/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00176-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 177/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00177-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 178/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00178-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 179/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00179-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 180/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00180-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 181/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00181-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 182/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00182-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 183/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00183-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 184/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00184-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 185/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00185-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 186/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00186-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 187/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00187-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 188/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00188-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 189/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00189-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 190/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00190-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 191/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00191-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 192/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00192-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 193/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00193-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 194/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00194-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 195/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00195-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 196/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00196-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 197/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00197-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 198/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00198-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 199/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00199-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 200/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00200-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 201/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00201-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 202/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00202-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 203/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00203-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 204/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00204-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 205/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00205-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 206/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00206-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 207/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00207-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 208/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00208-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 209/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00209-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 210/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00210-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 211/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00211-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 212/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00212-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 213/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00213-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 214/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00214-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 215/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00215-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 216/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00216-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 217/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00217-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 218/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00218-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 219/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00219-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 220/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00220-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 221/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00221-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 222/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00222-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 223/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00223-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 224/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00224-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 225/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00225-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 226/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00226-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 227/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00227-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 228/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00228-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 229/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00229-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 230/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00230-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 231/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00231-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 232/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00232-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 233/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00233-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 234/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00234-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 235/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00235-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 236/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00236-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 237/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00237-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 238/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00238-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 239/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00239-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 240/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00240-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 241/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00241-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 242/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00242-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 243/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00243-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 244/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00244-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 245/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00245-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 246/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00246-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 247/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00247-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 248/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00248-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 249/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00249-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 250/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00250-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 251/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00251-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 252/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00252-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 253/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00253-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 254/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00254-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 255/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00255-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 256/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00256-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 257/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00257-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 258/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00258-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 259/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00259-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 260/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00260-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 261/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00261-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 262/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00262-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 263/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00263-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 264/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00264-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 265/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00265-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 266/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00266-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 267/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00267-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 268/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00268-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 269/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00269-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 270/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00270-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 271/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00271-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 272/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00272-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 273/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00273-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 274/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00274-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 275/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00275-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 276/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00276-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 277/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00277-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 278/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00278-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 279/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00279-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 280/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00280-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 281/282",
          "url": "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00281-of-00282.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 282/282",
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
      "size": "≈1.0 GB (BF16 estimate)",
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
      "size": "≈3.0 GB (BF16 estimate)",
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
      "size": "≈14.0 GB (BF16 estimate)",
      "files": [
        {
          "label": "model.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen2-7B/resolve/main/model.safetensors?download=true"
        }
      ]
    },
    {
      "repo": "Qwen/Qwen2-72B",
      "bRating": "72B",
      "parameters": "72B",
      "size": "≈144.0 GB (BF16 estimate)",
      "files": [
        {
          "label": "model.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen2-72B/resolve/main/model.safetensors?download=true"
        }
      ]
    },
    {
      "repo": "Qwen/Qwen2.5-0.5B",
      "bRating": "500M",
      "parameters": "500M",
      "size": "≈1.0 GB (BF16 estimate)",
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
      "size": "≈3.0 GB (BF16 estimate)",
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
      "size": "≈6.0 GB (BF16 estimate)",
      "files": [
        {
          "label": "model.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen2.5-3B/resolve/main/model.safetensors?download=true"
        }
      ]
    },
    {
      "repo": "Qwen/Qwen2.5-7B",
      "bRating": "7B",
      "parameters": "7B",
      "size": "≈14.0 GB (BF16 estimate)",
      "files": [
        {
          "label": "model.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen2.5-7B/resolve/main/model.safetensors?download=true"
        }
      ]
    },
    {
      "repo": "Qwen/Qwen2.5-14B",
      "bRating": "14B",
      "parameters": "14B",
      "size": "≈28.0 GB (BF16 estimate)",
      "files": [
        {
          "label": "model.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen2.5-14B/resolve/main/model.safetensors?download=true"
        }
      ]
    },
    {
      "repo": "Qwen/Qwen2.5-32B",
      "bRating": "32B",
      "parameters": "32B",
      "size": "≈64.0 GB (BF16 estimate)",
      "files": [
        {
          "label": "model.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen2.5-32B/resolve/main/model.safetensors?download=true"
        }
      ]
    },
    {
      "repo": "Qwen/Qwen2.5-72B",
      "bRating": "72B",
      "parameters": "72B",
      "size": "≈144.0 GB (BF16 estimate)",
      "files": [
        {
          "label": "model.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen2.5-72B/resolve/main/model.safetensors?download=true"
        }
      ]
    },
    {
      "repo": "Qwen/Qwen3-0.6B",
      "bRating": "600M",
      "parameters": "600M",
      "size": "≈1.2 GB (BF16 estimate)",
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
      "size": "≈3.4 GB (BF16 estimate)",
      "files": [
        {
          "label": "model.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-1.7B/resolve/main/model.safetensors?download=true"
        }
      ]
    },
    {
      "repo": "Qwen/Qwen3-4B",
      "bRating": "4B",
      "parameters": "4B",
      "size": "≈8.0 GB (BF16 estimate)",
      "files": [
        {
          "label": "model.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-4B/resolve/main/model.safetensors?download=true"
        }
      ]
    },
    {
      "repo": "Qwen/Qwen3-8B",
      "bRating": "8B",
      "parameters": "8B",
      "size": "≈16.0 GB (BF16 estimate)",
      "files": [
        {
          "label": "model.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-8B/resolve/main/model.safetensors?download=true"
        }
      ]
    },
    {
      "repo": "Qwen/Qwen3-14B",
      "bRating": "14B",
      "parameters": "14B",
      "size": "≈28.0 GB (BF16 estimate)",
      "files": [
        {
          "label": "model.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-14B/resolve/main/model.safetensors?download=true"
        }
      ]
    },
    {
      "repo": "Qwen/Qwen3-32B",
      "bRating": "32B",
      "parameters": "32B",
      "size": "≈64.0 GB (BF16 estimate)",
      "files": [
        {
          "label": "model.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-32B/resolve/main/model.safetensors?download=true"
        }
      ]
    },
    {
      "repo": "Qwen/Qwen3-30B-A3B",
      "bRating": "30B",
      "parameters": "30B",
      "size": "≈60.0 GB (BF16 estimate)",
      "files": [
        {
          "label": "model.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-30B-A3B/resolve/main/model.safetensors?download=true"
        }
      ]
    },
    {
      "repo": "Qwen/Qwen3-235B-A22B",
      "bRating": "235B",
      "parameters": "235B",
      "size": "≈470.0 GB (BF16 estimate)",
      "files": [
        {
          "label": "model.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-235B-A22B/resolve/main/model.safetensors?download=true"
        }
      ]
    },
    {
      "repo": "Qwen/Qwen3-Coder-30B-A3B-Instruct",
      "bRating": "30B",
      "parameters": "30B",
      "size": "≈60.0 GB (BF16 estimate)",
      "files": [
        {
          "label": "model.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-Coder-30B-A3B-Instruct/resolve/main/model.safetensors?download=true"
        }
      ]
    },
    {
      "repo": "Qwen/Qwen3-Coder-480B-A35B-Instruct",
      "bRating": "480B",
      "parameters": "480B",
      "size": "≈960.0 GB (BF16 estimate)",
      "files": [
        {
          "label": "model.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3-Coder-480B-A35B-Instruct/resolve/main/model.safetensors?download=true"
        }
      ]
    },
    {
      "repo": "nvidia/Qwen3.8-27B-NVFP4",
      "bRating": "27B",
      "parameters": "27B",
      "size": "≈54.0 GB (BF16 estimate)",
      "files": [
        {
          "label": "model.safetensors",
          "url": "https://huggingface.co/nvidia/Qwen3.8-27B-NVFP4/resolve/main/model.safetensors?download=true"
        }
      ]
    },
    {
      "repo": "Qwen/Qwen3.8-27B",
      "bRating": "27B",
      "parameters": "27B",
      "size": "≈54.0 GB (BF16 estimate)",
      "files": [
        {
          "label": "model.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3.8-27B/resolve/main/model.safetensors?download=true"
        }
      ]
    },
    {
      "repo": "Qwen/Qwen3.8-Flash-Next",
      "bRating": "Unknown",
      "parameters": "Unknown",
      "size": "Unknown / repository-dependent",
      "files": [
        {
          "label": "model.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen3.8-Flash-Next/resolve/main/model.safetensors?download=true"
        }
      ]
    },
    {
      "repo": "Qwen/Qwen-Drive-1.0-4B",
      "bRating": "4B",
      "parameters": "4B",
      "size": "≈8.0 GB (BF16 estimate)",
      "files": [
        {
          "label": "model.safetensors",
          "url": "https://huggingface.co/Qwen/Qwen-Drive-1.0-4B/resolve/main/model.safetensors?download=true"
        }
      ]
    },
    {
      "repo": "Qwen/Qwen3.6-35B-A3B",
      "bRating": "35B",
      "parameters": "35B",
      "size": "≈70.0 GB (BF16 estimate)",
      "files": [
        {
          "label": "Safetensors shard 1/26",
          "url": "https://huggingface.co/Qwen/Qwen3.6-35B-A3B/resolve/main/model-00001-of-00026.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 2/26",
          "url": "https://huggingface.co/Qwen/Qwen3.6-35B-A3B/resolve/main/model-00002-of-00026.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 3/26",
          "url": "https://huggingface.co/Qwen/Qwen3.6-35B-A3B/resolve/main/model-00003-of-00026.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 4/26",
          "url": "https://huggingface.co/Qwen/Qwen3.6-35B-A3B/resolve/main/model-00004-of-00026.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 5/26",
          "url": "https://huggingface.co/Qwen/Qwen3.6-35B-A3B/resolve/main/model-00005-of-00026.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 6/26",
          "url": "https://huggingface.co/Qwen/Qwen3.6-35B-A3B/resolve/main/model-00006-of-00026.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 7/26",
          "url": "https://huggingface.co/Qwen/Qwen3.6-35B-A3B/resolve/main/model-00007-of-00026.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 8/26",
          "url": "https://huggingface.co/Qwen/Qwen3.6-35B-A3B/resolve/main/model-00008-of-00026.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 9/26",
          "url": "https://huggingface.co/Qwen/Qwen3.6-35B-A3B/resolve/main/model-00009-of-00026.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 10/26",
          "url": "https://huggingface.co/Qwen/Qwen3.6-35B-A3B/resolve/main/model-00010-of-00026.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 11/26",
          "url": "https://huggingface.co/Qwen/Qwen3.6-35B-A3B/resolve/main/model-00011-of-00026.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 12/26",
          "url": "https://huggingface.co/Qwen/Qwen3.6-35B-A3B/resolve/main/model-00012-of-00026.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 13/26",
          "url": "https://huggingface.co/Qwen/Qwen3.6-35B-A3B/resolve/main/model-00013-of-00026.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 14/26",
          "url": "https://huggingface.co/Qwen/Qwen3.6-35B-A3B/resolve/main/model-00014-of-00026.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 15/26",
          "url": "https://huggingface.co/Qwen/Qwen3.6-35B-A3B/resolve/main/model-00015-of-00026.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 16/26",
          "url": "https://huggingface.co/Qwen/Qwen3.6-35B-A3B/resolve/main/model-00016-of-00026.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 17/26",
          "url": "https://huggingface.co/Qwen/Qwen3.6-35B-A3B/resolve/main/model-00017-of-00026.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 18/26",
          "url": "https://huggingface.co/Qwen/Qwen3.6-35B-A3B/resolve/main/model-00018-of-00026.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 19/26",
          "url": "https://huggingface.co/Qwen/Qwen3.6-35B-A3B/resolve/main/model-00019-of-00026.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 20/26",
          "url": "https://huggingface.co/Qwen/Qwen3.6-35B-A3B/resolve/main/model-00020-of-00026.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 21/26",
          "url": "https://huggingface.co/Qwen/Qwen3.6-35B-A3B/resolve/main/model-00021-of-00026.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 22/26",
          "url": "https://huggingface.co/Qwen/Qwen3.6-35B-A3B/resolve/main/model-00022-of-00026.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 23/26",
          "url": "https://huggingface.co/Qwen/Qwen3.6-35B-A3B/resolve/main/model-00023-of-00026.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 24/26",
          "url": "https://huggingface.co/Qwen/Qwen3.6-35B-A3B/resolve/main/model-00024-of-00026.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 25/26",
          "url": "https://huggingface.co/Qwen/Qwen3.6-35B-A3B/resolve/main/model-00025-of-00026.safetensors?download=true"
        },
        {
          "label": "Safetensors shard 26/26",
          "url": "https://huggingface.co/Qwen/Qwen3.6-35B-A3B/resolve/main/model-00026-of-00026.safetensors?download=true"
        }
      ]
    },
    {
      "repo": "Qwen/Qwen-Image-2.1",
      "bRating": "Unknown",
      "parameters": "Unknown",
      "size": "Unknown / repository-dependent",
      "files": [
        {
          "label": "text_encoder shard 1/4",
          "url": "https://huggingface.co/Qwen/Qwen-Image-2.1/resolve/main/text_encoder/model-00001-of-00004.safetensors?download=true"
        },
        {
          "label": "text_encoder shard 2/4",
          "url": "https://huggingface.co/Qwen/Qwen-Image-2.1/resolve/main/text_encoder/model-00002-of-00004.safetensors?download=true"
        },
        {
          "label": "text_encoder shard 3/4",
          "url": "https://huggingface.co/Qwen/Qwen-Image-2.1/resolve/main/text_encoder/model-00003-of-00004.safetensors?download=true"
        },
        {
          "label": "text_encoder shard 4/4",
          "url": "https://huggingface.co/Qwen/Qwen-Image-2.1/resolve/main/text_encoder/model-00004-of-00004.safetensors?download=true"
        },
        {
          "label": "VAE",
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
      "size": "≈14.0 GB (BF16 estimate)",
      "files": [
        {
          "label": "model.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-R1-Distill-Qwen-7B/resolve/main/model.safetensors?download=true"
        }
      ]
    },
    {
      "repo": "deepseek-ai/DeepSeek-R1-Distill-Qwen-14B",
      "bRating": "14B",
      "parameters": "14B",
      "size": "≈28.0 GB (BF16 estimate)",
      "files": [
        {
          "label": "model.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-R1-Distill-Qwen-14B/resolve/main/model.safetensors?download=true"
        }
      ]
    },
    {
      "repo": "deepseek-ai/DeepSeek-R1-Distill-Qwen-32B",
      "bRating": "32B",
      "parameters": "32B",
      "size": "≈64.0 GB (BF16 estimate)",
      "files": [
        {
          "label": "model.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-R1-Distill-Qwen-32B/resolve/main/model.safetensors?download=true"
        }
      ]
    },
    {
      "repo": "deepseek-ai/DeepSeek-R1-Distill-Llama-8B",
      "bRating": "8B",
      "parameters": "8B",
      "size": "≈16.0 GB (BF16 estimate)",
      "files": [
        {
          "label": "model.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-R1-Distill-Llama-8B/resolve/main/model.safetensors?download=true"
        }
      ]
    },
    {
      "repo": "deepseek-ai/DeepSeek-R1-Distill-Llama-70B",
      "bRating": "70B",
      "parameters": "70B",
      "size": "≈140.0 GB (BF16 estimate)",
      "files": [
        {
          "label": "model.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-R1-Distill-Llama-70B/resolve/main/model.safetensors?download=true"
        }
      ]
    },
    {
      "repo": "deepseek-ai/DeepSeek-V3",
      "bRating": "671B",
      "parameters": "671B",
      "size": "≈1.34 TB (BF16 estimate)",
      "files": [
        {
          "label": "model.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3/resolve/main/model.safetensors?download=true"
        }
      ]
    },
    {
      "repo": "deepseek-ai/DeepSeek-V3-0324",
      "bRating": "671B",
      "parameters": "671B",
      "size": "≈1.34 TB (BF16 estimate)",
      "files": [
        {
          "label": "model.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V3-0324/resolve/main/model.safetensors?download=true"
        }
      ]
    },
    {
      "repo": "deepseek-ai/DeepSeek-R1",
      "bRating": "671B",
      "parameters": "671B",
      "size": "≈1.34 TB (BF16 estimate)",
      "files": [
        {
          "label": "model.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-R1/resolve/main/model.safetensors?download=true"
        }
      ]
    },
    {
      "repo": "deepseek-ai/DeepSeek-V4.1-Flash",
      "bRating": "763B",
      "parameters": "763B",
      "size": "≈510.3 GB (verified tensor total)",
      "files": [
        {
          "label": "model.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V4.1-Flash/resolve/main/model.safetensors?download=true"
        }
      ]
    },
    {
      "repo": "deepseek-ai/DeepSeek-V4-Flash-Vision-Exp",
      "bRating": "Unknown",
      "parameters": "Unknown",
      "size": "Unknown / repository-dependent",
      "files": [
        {
          "label": "model.safetensors",
          "url": "https://huggingface.co/deepseek-ai/DeepSeek-V4-Flash-Vision-Exp/resolve/main/model.safetensors?download=true"
        }
      ]
    }
  ],
  "grok-local": [
    {
      "repo": "xai-org/grok-1",
      "bRating": "314B",
      "parameters": "314B",
      "size": "≈628.0 GB (BF16 estimate)",
      "files": [
        {
          "label": "model.safetensors",
          "url": "https://huggingface.co/xai-org/grok-1/resolve/main/model.safetensors?download=true"
        }
      ]
    }
  ],
  "granite-local": [
    {
      "repo": "ibm-granite/granite-3.0-2b-instruct",
      "bRating": "2B",
      "parameters": "2B",
      "size": "≈4.0 GB (BF16 estimate)",
      "files": [
        {
          "label": "model.safetensors",
          "url": "https://huggingface.co/ibm-granite/granite-3.0-2b-instruct/resolve/main/model.safetensors?download=true"
        }
      ]
    },
    {
      "repo": "ibm-granite/granite-3.0-8b-instruct",
      "bRating": "8B",
      "parameters": "8B",
      "size": "≈16.0 GB (BF16 estimate)",
      "files": [
        {
          "label": "model.safetensors",
          "url": "https://huggingface.co/ibm-granite/granite-3.0-8b-instruct/resolve/main/model.safetensors?download=true"
        }
      ]
    },
    {
      "repo": "ibm-granite/granite-3.1-2b-instruct",
      "bRating": "2B",
      "parameters": "2B",
      "size": "≈4.0 GB (BF16 estimate)",
      "files": [
        {
          "label": "model.safetensors",
          "url": "https://huggingface.co/ibm-granite/granite-3.1-2b-instruct/resolve/main/model.safetensors?download=true"
        }
      ]
    },
    {
      "repo": "ibm-granite/granite-3.1-8b-instruct",
      "bRating": "8B",
      "parameters": "8B",
      "size": "≈16.0 GB (BF16 estimate)",
      "files": [
        {
          "label": "model.safetensors",
          "url": "https://huggingface.co/ibm-granite/granite-3.1-8b-instruct/resolve/main/model.safetensors?download=true"
        }
      ]
    }
  ],
  "aya-local": [
    {
      "repo": "CohereForAI/aya-23-8B",
      "bRating": "8B",
      "parameters": "8B",
      "size": "≈16.0 GB (BF16 estimate)",
      "files": [
        {
          "label": "model.safetensors",
          "url": "https://huggingface.co/CohereForAI/aya-23-8B/resolve/main/model.safetensors?download=true"
        }
      ]
    },
    {
      "repo": "CohereForAI/aya-23-35B",
      "bRating": "35B",
      "parameters": "35B",
      "size": "≈70.0 GB (BF16 estimate)",
      "files": [
        {
          "label": "model.safetensors",
          "url": "https://huggingface.co/CohereForAI/aya-23-35B/resolve/main/model.safetensors?download=true"
        }
      ]
    },
    {
      "repo": "convaiinnovations/laya",
      "bRating": "Unknown",
      "parameters": "Unknown",
      "size": "Unknown / repository-dependent",
      "files": [
        {
          "label": "model.safetensors",
          "url": "https://huggingface.co/convaiinnovations/laya/resolve/main/model.safetensors?download=true"
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
      ]
    },
    {
      "repo": "stabilityai/stablelm-2-1_6b",
      "bRating": "1.6B",
      "parameters": "1.6B",
      "size": "≈3.2 GB (BF16 estimate)",
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
      "size": "≈24.0 GB (BF16 estimate)",
      "files": [
        {
          "label": "model.safetensors",
          "url": "https://huggingface.co/stabilityai/stablelm-2-12b/resolve/main/model.safetensors?download=true"
        }
      ]
    },
    {
      "repo": "m-a-p/YuE2-3B",
      "bRating": "3B",
      "parameters": "3B",
      "size": "≈6.0 GB (BF16 estimate)",
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
      "size": "≈14.0 GB (BF16 estimate)",
      "files": [
        {
          "label": "model.safetensors",
          "url": "https://huggingface.co/microsoft/VibeVoice-ASR-Streaming-7B/resolve/main/model.safetensors?download=true"
        }
      ]
    }
  ],
  "pythia-local": [
    {
      "repo": "EleutherAI/pythia-160m",
      "bRating": "160M",
      "parameters": "160M",
      "size": "≈0.3 GB (BF16 estimate)",
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
      "size": "≈0.8 GB (BF16 estimate)",
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
      "size": "≈2.0 GB (BF16 estimate)",
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
      "size": "≈5.6 GB (BF16 estimate)",
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
      "size": "≈13.8 GB (BF16 estimate)",
      "files": [
        {
          "label": "model.safetensors",
          "url": "https://huggingface.co/EleutherAI/pythia-6.9b/resolve/main/model.safetensors?download=true"
        }
      ]
    },
    {
      "repo": "EleutherAI/pythia-12b",
      "bRating": "12B",
      "parameters": "12B",
      "size": "≈24.0 GB (BF16 estimate)",
      "files": [
        {
          "label": "model.safetensors",
          "url": "https://huggingface.co/EleutherAI/pythia-12b/resolve/main/model.safetensors?download=true"
        }
      ]
    }
  ],
  "openbmb-local": [
    {
      "repo": "openbmb/MiniCPM5-2B",
      "bRating": "2B",
      "parameters": "2B",
      "size": "≈4.0 GB (BF16 estimate)",
      "files": [
        {
          "label": "model.safetensors",
          "url": "https://huggingface.co/openbmb/MiniCPM5-2B/resolve/main/model.safetensors?download=true"
        }
      ]
    }
  ],
  "ltx-local": [
    {
      "repo": "Lightricks/LTX-2.5",
      "bRating": "Unknown",
      "parameters": "Unknown",
      "size": "Unknown / repository-dependent",
      "files": [
        {
          "label": "model.safetensors",
          "url": "https://huggingface.co/Lightricks/LTX-2.5/resolve/main/model.safetensors?download=true"
        }
      ]
    }
  ],
  "colibri-local": [
    {
      "repo": "nbeerbower/Inkling-Gutenberg-DPO-colibri-int4",
      "bRating": "Unknown",
      "parameters": "Unknown",
      "size": "Unknown / repository-dependent",
      "files": [
        {
          "label": "out-00044.safetensors",
          "url": "https://huggingface.co/nbeerbower/Inkling-Gutenberg-DPO-colibri-int4/resolve/main/out-00044.safetensors?download=true"
        }
      ]
    },
    {
      "repo": "sabrewing-engine/Inkling-colibri-int4",
      "bRating": "Unknown",
      "parameters": "Unknown",
      "size": "Unknown / repository-dependent",
      "files": [
        {
          "label": "out-mtp.safetensors",
          "url": "https://huggingface.co/sabrewing-engine/Inkling-colibri-int4/resolve/main/out-mtp.safetensors?download=true"
        }
      ]
    }
  ]
}
