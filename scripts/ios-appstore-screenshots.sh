#!/usr/bin/env bash
# Captures App Store screenshots of the compiled native app on simulators.
# The app must be built with EXPO_PUBLIC_APPSTORE_SHOTS=1; it then accepts
# grandcentury://shot/<home|nations|campaign|panel/<key>> launch URLs.
set -euo pipefail
app="$RUNNER_TEMP/grand-century-derived/Build/Products/Release-iphonesimulator/GrandCentury.app"
out="$RUNNER_TEMP/appstore-shots"
mkdir -p "$out"
bundle=net.lakesidegames.grandcentury

pick() { # $1 = name regex, $2 = exclude regex
  xcrun simctl list devices available --json | python3 -c '
import json,re,sys
inc,exc=re.compile(sys.argv[1]),re.compile(sys.argv[2])
c=[d for ds in json.load(sys.stdin)["devices"].values() for d in ds if inc.search(d["name"]) and not exc.search(d["name"])]
c.sort(key=lambda d:d["name"],reverse=True)
print(c[0]["udid"] if c else "")' "$1" "$2"
}

capture_device() { # $1 prefix, $2 udid, $3 width, $4 height
  local prefix=$1 dev=$2 w=$3 h=$4
  echo "== $prefix on $(xcrun simctl list devices available | grep "$dev" | head -1)"
  xcrun simctl boot "$dev" || true
  xcrun simctl bootstatus "$dev" -b
  xcrun simctl status_bar "$dev" override --time 9:41 --batteryState charged --batteryLevel 100 --cellularBars 4 --wifiBars 3 || true
  xcrun simctl install "$dev" "$app"
  xcrun simctl launch "$dev" "$bundle"
  sleep 25
  shot() { # $1 label
    xcrun simctl io "$dev" screenshot "$out/$prefix-$1.png"
    local pw ph
    pw=$(sips -g pixelWidth "$out/$prefix-$1.png" | awk '/pixelWidth/{print $2}')
    ph=$(sips -g pixelHeight "$out/$prefix-$1.png" | awk '/pixelHeight/{print $2}')
    echo "$prefix-$1.png ${pw}x${ph} (want ${w}x${h})"
    echo "$prefix-$1.png ${pw}x${ph}" >> "$out/sizes.txt"
    [ "$pw" = "$w" ] && [ "$ph" = "$h" ] || echo "SIZE MISMATCH for $prefix-$1" >&2
  }
  link() { xcrun simctl openurl "$dev" "grandcentury://shot/$1"; }
  link home; sleep 4; shot 1-home
  link nations; sleep 6; shot 5-nations
  link campaign; sleep 40; shot 2-campaign
  link panel/politics; sleep 6; shot 3-politics
  link panel/market; sleep 6; shot 4-market
  xcrun simctl status_bar "$dev" clear || true
  xcrun simctl shutdown "$dev" || true
}

phone=$(pick 'iPhone [0-9]+ Pro Max' 'zzzz')
pad=$(pick 'iPad Pro 13-inch' 'zzzz')
echo "phone=$phone pad=$pad"
[ -n "$phone" ] && [ -n "$pad" ] || { xcrun simctl list devices available >&2; echo "required simulators missing" >&2; exit 1; }
: > "$out/sizes.txt"
capture_device iphone "$phone" 1320 2868
capture_device ipad "$pad" 2064 2752
cat "$out/sizes.txt"
