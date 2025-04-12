powershell
# Full beatportdl Installer Script

# --- Constants ---
$appName = "beatportdl"
$appVersion = "1.0.0"
$goMinVersion = "1.21.0"
$defaultInstallDir = "C:\Program Files\$appName"
$defaultGOPATH = "$env:USERPROFILE\go"
$goInstallUrl = "https://go.dev/dl/go1.21.5.windows-amd64.msi"
$logFile = "$PSScriptRoot\install.log"
$innoSetupPath = "C:\Program Files (x86)\Inno Setup 6\ISCC.exe"
$innoSetupScript = "$PSScriptRoot\install.iss"
$extensionSource = "extension"
$chromiumSource = "chrome-win"
$appSource = "internal\cmd\beatportdl"
$outputDir = "$PSScriptRoot\Output"
# --- Configuration (Make Customizable) ---
$installDir = $defaultInstallDir
$GOPATH = $defaultGOPATH

# --- Helper Functions ---

# Log a message
function Write-Log($message, $type = "Info") {
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logEntry = "[$timestamp] [$type] $message"
    Add-Content -Path $logFile -Value $logEntry
    Write-Host $logEntry
}

# Check if a program is installed
function Test-ProgramInstalled($programName) {
    try {
        $null = Get-Command $programName -ErrorAction Stop
        Write-Log "$programName is installed."
        return $true
    } catch {
        Write-Log "$programName is not installed."
        return $false
    }
}

# Check if the correct Go version is installed
function Test-GoVersion($minVersion) {
    try {
        $goVersion = (go version) -replace "go version go", "" -replace " windows/amd64", ""
        Write-Log "Found Go version: $goVersion"
        if ($goVersion -ge $minVersion) {
            Write-Log "Go version is compatible."
            return $true
        } else {
            Write-Log "Go version is too old. Minimum required version: $minVersion"
            return $false
        }
    } catch {
        Write-Log "Error checking Go version: $_"
        return $false
    }
}

# Download a file
function Download-File($url, $destination) {
    Write-Log "Downloading $url to $destination..."
    try {
        $client = New-Object System.Net.WebClient
        $client.DownloadFile($url, $destination)
        Write-Log "Download complete."
    } catch {
        Write-Log "Error downloading file: $_" -type Error
        return $false
    }
    return $true
}

# Run an installer silently
function Install-ProgramSilent($installerPath) {
    Write-Log "Installing $installerPath silently..."
    try {
        Start-Process -FilePath "msiexec.exe" -ArgumentList "/i `"$installerPath`" /qn" -Wait -PassThru
        Write-Log "Installation complete."
    } catch {
        Write-Log "Error installing program: $_" -type Error
        return $false
    }
    return $true
}

# Copy a directory
function Copy-Directory($source, $destination) {
    Write-Log "Copying from $source to $destination..."
    try {
        New-Item -ItemType Directory -Force -Path $destination
        Copy-Item -Path "$source\*" -Destination $destination -Recurse -Force
        Write-Log "Copy complete."
    } catch {
        Write-Log "Error copying directory: $_" -type Error
        return $false
    }
    return $true
}

# --- Main Installation ---

Write-Log "Starting full $appName installation..."

# 1. Check Prerequisites (Go)
if (!(Test-ProgramInstalled "go") -or !(Test-GoVersion -minVersion $goMinVersion)) {
    Write-Log "Go is not installed or the version is too old. Installing..."

    # 2. Install Go (if necessary)
    $goInstallFile = "$env:TEMP\go_installer.msi"
    if (Download-File -url $goInstallUrl -destination $goInstallFile) {
        if (Install-ProgramSilent -installerPath $goInstallFile) {

            Write-Log "Setting GOPATH environment variable to '$GOPATH'..."
            [Environment]::SetEnvironmentVariable("GOPATH", $GOPATH, "User")
            $env:GOPATH = $GOPATH

            # Update PATH
            $newPath = "$env:PATH;$env:GOPATH\bin;C:\Go\bin"
            [Environment]::SetEnvironmentVariable("PATH", $newPath, "Machine")
            $env:PATH = $newPath
            Write-Log "Please restart your terminal to apply the changes."
        } else {
            Write-Log "Go installation failed." -type Error
            exit 1
        }
    } else {
        Write-Log "Go download failed." -type Error
        exit 1
    }
    Remove-Item -Path $goInstallFile -Force
} else {
    Write-Log "Go is already installed and compatible."
}

# 3. Build the application
Write-Log "Building $appName application..."
try {
    cd $PSScriptRoot\$appSource
    go build -o "$PSScriptRoot\$appSource\$appName.exe"
} catch {
    Write-Log "Error building the application: $_" -type Error
    exit 1
}
Write-Log "Beatportdl built."
# 4. Create Output directory
Write-Log "Creating the output directory"
if (!(Test-Path -Path $outputDir)) {
  New-Item -ItemType Directory -Path $outputDir -Force | Out-Null
}
# 5. copy app
Write-Log "Copy app to output"
if (!(Copy-Item -Path "$PSScriptRoot\$appSource\$appName.exe" -Destination "$outputDir" -Force)) {
     Write-Log "Error copying the executable" -type Error
     exit 1
}
# 6. Copy Extension
Write-Log "Copy the extension to output"
if (!(Copy-Directory -source "$PSScriptRoot\$extensionSource" -destination "$outputDir\$extensionSource")) {
     Write-Log "Error copying the extension" -type Error
     exit 1
}
# 7. Copy Chromium
Write-Log "Copy chromium to output"
if (!(Copy-Directory -source "$PSScriptRoot\$chromiumSource" -destination "$outputDir\$chromiumSource")) {
     Write-Log "Error copying the chromium" -type Error
     exit 1
}
# 8. Build the installer
Write-Log "Building the installer..."
try {
    & "$innoSetupPath" "$innoSetupScript"
} catch {
    Write-Log "Error building installer: $_" -type Error
    exit 1
}
Write-Log "Installer built successfully."
