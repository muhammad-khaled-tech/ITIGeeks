#!/bin/bash

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}--- ITIGeeks Smart Sync ---${NC}"

# 1. Check status
if [[ -z $(git status -s) ]]; then
    echo -e "${GREEN}Nothing to commit, working tree clean.${NC}"
    exit 0
fi

# 2. Pull latest changes to avoid conflicts
echo -e "${YELLOW}Pulling latest changes...${NC}"
git pull
if [ $? -ne 0 ]; then
    echo -e "${RED}Error pulling changes. Please resolve conflicts manually.${NC}"
    exit 1
fi

# 3. Add all changes
echo -e "${YELLOW}Staging changes...${NC}"
git add .

# 4. Commit
echo -e "${YELLOW}Enter commit message (Press Enter for auto-timestamp):${NC}"
read commitMessage

if [ -z "$commitMessage" ]; then
    commitMessage="Auto-update: $(date '+%Y-%m-%d %H:%M:%S')"
fi

git commit -m "$commitMessage"

# 5. Push
echo -e "${YELLOW}Pushing to GitHub...${NC}"
git push -u origin main

if [ $? -eq 0 ]; then
    echo -e "${GREEN}🚀 Success! Project updated on GitHub.${NC}"
else
    echo -e "${RED}❌ Error pushing to GitHub. Check your internet or credentials.${NC}"
fi
