#!/usr/bin/env bash
# Creates your Google Play *upload key* and (optionally) stores it as GitHub Secrets.
#
#   bash scripts/make-upload-key.sh
#
# Needs: keytool (comes with any Java JDK or Android Studio) and openssl.
# Optional: the GitHub CLI (gh), logged in, to set the secrets automatically.
#
# KEEP THE GENERATED FILE AND PASSWORD SAFE (e.g. in a password manager).
# With Play App Signing, Google holds the real app-signing key; if you ever lose this
# upload key you can ask Google to reset it, but it's much easier not to lose it.
set -euo pipefail

OUT_DIR="${1:-$HOME/super-wortschatz-keys}"
KEYSTORE="$OUT_DIR/upload-keystore.jks"
ALIAS="upload"

if ! command -v keytool >/dev/null 2>&1; then
  # Android Studio ships its own Java runtime
  for jbr in "/Applications/Android Studio.app/Contents/jbr/Contents/Home/bin" "$HOME/android-studio/jbr/bin" "/opt/android-studio/jbr/bin"; do
    if [ -x "$jbr/keytool" ]; then PATH="$jbr:$PATH"; break; fi
  done
fi
command -v keytool >/dev/null 2>&1 || { echo "keytool not found. Install a Java JDK (e.g. https://adoptium.net) or Android Studio, then run this again."; exit 1; }
command -v openssl >/dev/null 2>&1 || { echo "openssl not found."; exit 1; }

mkdir -p "$OUT_DIR"
chmod 700 "$OUT_DIR"
if [ -e "$KEYSTORE" ]; then
  echo "A keystore already exists at $KEYSTORE – not overwriting it."
  exit 1
fi

PASSWORD="$(openssl rand -base64 24 | tr -d '/+=' | cut -c1-24)"
keytool -genkeypair -v \
  -keystore "$KEYSTORE" -storetype JKS \
  -alias "$ALIAS" -keyalg RSA -keysize 4096 -validity 10000 \
  -storepass "$PASSWORD" -keypass "$PASSWORD" \
  -dname "CN=Super Wortschatz, O=Super Wortschatz" >/dev/null 2>&1
chmod 600 "$KEYSTORE"

B64_FILE="$OUT_DIR/upload-keystore.base64.txt"
base64 < "$KEYSTORE" | tr -d '\n' > "$B64_FILE"
printf 'Keystore: %s\nAlias: %s\nPassword (keystore and key): %s\n' "$KEYSTORE" "$ALIAS" "$PASSWORD" > "$OUT_DIR/README-KEEP-SAFE.txt"
chmod 600 "$B64_FILE" "$OUT_DIR/README-KEEP-SAFE.txt"

echo
echo "✅ Upload key created in $OUT_DIR"
echo "   Password and details: $OUT_DIR/README-KEEP-SAFE.txt  (store them in a password manager!)"
echo

if command -v gh >/dev/null 2>&1 && gh auth status >/dev/null 2>&1; then
  read -r -p "Set the GitHub Secrets for this repository now with the GitHub CLI? [y/N] " answer
  if [[ "$answer" =~ ^[Yy]$ ]]; then
    gh secret set ANDROID_UPLOAD_KEYSTORE_BASE64 < "$B64_FILE"
    gh secret set ANDROID_UPLOAD_KEYSTORE_PASSWORD --body "$PASSWORD"
    gh secret set ANDROID_UPLOAD_KEY_PASSWORD --body "$PASSWORD"
    gh secret set ANDROID_UPLOAD_KEY_ALIAS --body "$ALIAS"
    echo "✅ Secrets set. The next push to main builds SuperWortschatz.aab."
    exit 0
  fi
fi

cat <<EOF
Now add these four secrets in GitHub → your repo → Settings → Secrets and variables → Actions → New repository secret:

  ANDROID_UPLOAD_KEYSTORE_BASE64   = the contents of $B64_FILE
  ANDROID_UPLOAD_KEYSTORE_PASSWORD = $PASSWORD
  ANDROID_UPLOAD_KEY_PASSWORD      = $PASSWORD
  ANDROID_UPLOAD_KEY_ALIAS         = $ALIAS

The next push to main then builds SuperWortschatz.aab (Actions → the run → Artifacts).
EOF
