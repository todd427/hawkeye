i#!/bin/bash
# Usage:
#   ./replace_ci.sh OLD NEW

OLD="$1"
NEW="$2"

if [ -z "$OLD" ] || [ -z "$NEW" ]; then
    echo "Usage: $0 <OLD> <NEW>"
    exit 1
fi

# Generate variants
OLD_LOWER=$(echo "$OLD" | tr '[:upper:]' '[:lower:]')
NEW_LOWER=$(echo "$NEW" | tr '[:upper:]' '[:lower:]')

OLD_UPPER=$(echo "$OLD" | tr '[:lower:]' '[:upper:]')
NEW_UPPER=$(echo "$NEW" | tr '[:lower:]' '[:upper:]')

OLD_CAP="${OLD_LOWER^}"
NEW_CAP="${NEW_LOWER^}"

echo "Replacing variants:"
echo "  '$OLD'       → '$NEW'"
echo "  '$OLD_LOWER' → '$NEW_LOWER'"
echo "  '$OLD_UPPER' → '$NEW_UPPER'"
echo "  '$OLD_CAP'   → '$NEW_CAP'"
echo

find . -type f | while read -r file; do
    if grep -Iq . "$file"; then
        sed -i \
            -e "s/$OLD/$NEW/g" \
            -e "s/$OLD_LOWER/$NEW_LOWER/g" \
            -e "s/$OLD_UPPER/$NEW_UPPER/g" \
            -e "s/$OLD_CAP/$NEW_CAP/g" \
            "$file"
    fi
done

echo "Done."

