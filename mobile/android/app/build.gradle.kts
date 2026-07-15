plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

android {
    namespace = "com.ombakbagus.app"
    compileSdk = 34

    defaultConfig {
        applicationId = "com.ombakbagus.app"
        minSdk = 26
        targetSdk = 34
        versionCode = 13
        versionName = "0.1.3"
    }

    buildTypes {
        debug {
            isMinifyEnabled = false
        }
        // Sideload builds: sign with the automatic debug keystore so Android will install.
        // Play Store later can swap in a real upload key without changing applicationId.
        release {
            isMinifyEnabled = false
            signingConfig = signingConfigs.getByName("debug")
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlinOptions {
        jvmTarget = "17"
    }
    buildFeatures {
        buildConfig = true
    }
}

dependencies {
    implementation("androidx.core:core-ktx:1.13.1")
    implementation("androidx.appcompat:appcompat:1.7.0")
    implementation("com.google.android.material:material:1.12.0")
    implementation("androidx.webkit:webkit:1.11.0")
}