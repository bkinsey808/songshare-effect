#!/bin/bash

# Cache invalidation script for Cloudflare Pages deployment
# This script purges Cloudflare cache after deployment

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🔄 Starting cache invalidation for prod site...${NC}"

# Check if we have the required environment variables
if [ -z "$CLOUDFLARE_API_TOKEN" ] || [ -z "$CLOUDFLARE_ZONE_ID" ]; then
    echo -e "${RED}❌ Missing required environment variables:${NC}"
    echo "   CLOUDFLARE_API_TOKEN - Your Cloudflare API token"
    echo "   CLOUDFLARE_ZONE_ID - Your Cloudflare zone ID"
    echo ""
    echo "You can find these in your Cloudflare dashboard:"
    echo "   1. API Token: https://dash.cloudflare.com/profile/api-tokens"
    echo "   2. Zone ID: In your domain's dashboard sidebar"
    exit 1
fi

# Purge cache for the entire zone
echo -e "${YELLOW}🧹 Purging cache for effect.bardoshare.com...${NC}"

RESPONSE=$(curl -s -X POST "https://api.cloudflare.com/client/v4/zones/$CLOUDFLARE_ZONE_ID/purge_cache" \
    -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
    -H "Content-Type: application/json" \
    --data '{"purge_everything":true}')

# Check if the purge was successful
if echo "$RESPONSE" | grep -q '"success":true'; then
    echo -e "${GREEN}✅ Cache purged successfully!${NC}"
    echo -e "${GREEN}🎉 Your changes should be visible within 30 seconds.${NC}"
else
    echo -e "${RED}❌ Cache purge failed:${NC}"
    echo "$RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$RESPONSE"
    exit 1
fi