# Syntara architecture

```text
                              SYN TARA
                                  |
            +---------------------+---------------------+
            |                     |                     |
           Chat                Agents                 API
            |                     |                     |
            +---------------------+---------------------+
                                  |
                           Control Plane
                                  |
                 +----------------+----------------+
                 |                |                |
              Model Hub       Manager           Projects
                 |                |                |
                 +----------------+----------------+
                                  |
                         Universal Model Layer
                                  |
                 +----------------+----------------+
                 |                                 |
        Direct execution                      Conversion
                 |                                 |
                 +----------------+----------------+
                                  |
                           Backend Router
                                  |
          +-------------+---------+---------+-------------+
          |             |                   |             |
       Syntara       llama.cpp             MLX          ONNX
        Engine       /compatible         /Apple       /future
          |             |                   |             |
          +-------------+---------+---------+-------------+
                                  |
                          Execution Planner
                                  |
                     CPU / GPU / NPU / Storage
                                  |
                           Memory Fabric
                                  |
                     VRAM / RAM / NVMe / Disk
```

The platform intentionally separates **format**, **architecture**, **backend** and **hardware** compatibility.

## Developer surfaces

Desktop app, local OpenAI-compatible API, Python SDK, developer CLI, n8n, VS Code and generic OpenAI-compatible IDE integrations all communicate through the same local control surface.

## Data ownership

Conversations, memories, projects, settings and agent configurations are local by default. Syntara itself does not require user accounts.
