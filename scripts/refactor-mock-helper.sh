#!/bin/bash
# Script to refactor test files to use mockCreateSupabaseClient helper

FILES=(
  "api/src/event/eventSave.test.ts"
  "api/src/event-user/eventUserAdd.test.ts"
  "api/src/event-user/eventUserJoin.test.ts"
  "api/src/event-user/eventUserRemove.test.ts"
  "api/src/event-user/eventUserUpdateRole.test.ts"
)

for file in "${FILES[@]}"; do
  echo "Refactoring $file..."
  
  # Update import statement
  sed -i 's/import makeSupabaseClient from "@\/api\/test-utils\/makeSupabaseClient.mock";/import mockCreateSupabaseClient from "@\/api\/test-utils\/mockCreateSupabaseClient.mock";/' "$file"
  
  echo "  - Updated import"
done

echo "Done! Please verify changes manually."
