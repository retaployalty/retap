#!/bin/bash

# Install Flutter
git clone https://github.com/flutter/flutter.git -b stable
export PATH="$PATH:`pwd`/flutter/bin"

# Install Flutter dependencies
cd apps/flutter-web-client
flutter pub get

# Build Flutter web app
flutter build web --release

# Return to root
cd ../.. 