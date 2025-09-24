#!/bin/bash
# Use the full path to pnpm from NVM
export PATH="/home/bkinsey/.nvm/versions/node/v24.4.1/bin:$PATH"

# Execute the pnpm command
exec pnpm "$@"