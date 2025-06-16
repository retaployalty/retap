plugins {
    id("com.android.application")
    id("kotlin-android")
    // The Flutter Gradle Plugin must be applied after the Android and Kotlin Gradle plugins.
    id("dev.flutter.flutter-gradle-plugin")
}

android {
    namespace = "co.retap.retap_pos"
    compileSdk = flutter.compileSdkVersion

    // ✅ Imposta l'NDK corretto per compatibilità plugin
    ndkVersion = "27.0.12077973"

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_11
        targetCompatibility = JavaVersion.VERSION_11
    }

    kotlinOptions {
        jvmTarget = JavaVersion.VERSION_11.toString()
    }

    defaultConfig {
        applicationId = "co.retap.retap_pos"

        // ✅ Imposta minSdk richiesto da flutter_nfc_kit
        minSdk = 26
        targetSdk = flutter.targetSdkVersion
        versionCode = flutter.versionCode
        versionName = flutter.versionName
    }

    buildTypes {
        release {
            // Debug signing config for quick builds
            signingConfig = signingConfigs.getByName("debug")
        }
    }
}

// Configurazione per sovrascrivere il namespace di uni_links
configurations.all {
    resolutionStrategy {
        force("androidx.core:core-ktx:1.9.0")
    }
}

dependencies {
    implementation("androidx.core:core-ktx:1.9.0")
}

flutter {
    source = "../.."
}