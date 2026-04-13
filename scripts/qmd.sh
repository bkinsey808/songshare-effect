#!/usr/bin/env bash
# Wrapper around qmd that suppresses node-llama-cpp/cmake build noise.
# Usage: ./scripts/qmd.sh search "my query"
#        ./scripts/qmd.sh vsearch "my query"
./node_modules/.bin/qmd "$@" 2>&1 | grep -Ev \
  "^--|CMAKE|CMake|Call Stack|xpack/|llama\.cpp/|node-llama|Vulkan|SpawnError|createError|ChildProcess|Not searching|ERROR OMG|cmake-js|QMD Warning|(found version)"
