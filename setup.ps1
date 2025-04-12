# Simplified beatportdl Installer Script

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
    Write-Log "Checking if $programName is installed..."
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
    Write-Log "Checking Go version. Minimum required: $minVersion"
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
        Write-Log "Error checking Go version: $_" -type Error
        return $false
    }
}

# Download a file
function Download-File($url, $destination) {
    Write-Log "Downloading $url to $destination..."
    try {
        Write-Log "Starting download"
        $client = New-Object System.Net.WebClient
        $client.DownloadFile($url, $destination)
        Write-Log "Download complete."
        return $true
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
        Write-Log "Installing with the command: msiexec.exe /i `"$installerPath`" /qn"
        Start-Process -FilePath "msiexec.exe" -ArgumentList "/i `"$installerPath`" /qn" -Wait -PassThru
        Write-Log "Installation complete."
        return $true
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
        Write-Log "Creating destination directory '$destination'"
        New-Item -ItemType Directory -Force -Path $destination | Out-Null
        Write-Log "Copying from '$source' to '$destination'"
        Copy-Item -Path "$source\*" -Destination $destination -Recurse -Force
        Write-Log "Copy complete."
    } catch {
        Write-Log "Error copying directory: $_" -type Error
        return $false
    }
    return $true
}
# Run a command
function Run-Command($command, $arguments) {
    Write-Log "Running command: $command $arguments"
    try {
        Write-Log "Starting process"
        $process = Start-Process -FilePath $command -ArgumentList $arguments -PassThru -Wait -ErrorAction Stop
        Write-Log "Command completed with exit code $($process.ExitCode)"
        return $process.ExitCode
    } catch {
        Write-Log "Error running command: $_" -type Error
        return 1
    }
}
# Remove item
function Remove-ItemForce($item) {
    Write-Log "Removing item '$item'..."
    try {
        Write-Log "Removing file or directory '$item'"
        Remove-Item -Path $item -Force -Recurse
        Write-Log "Item removed."
        return $true
    } catch {
        Write-Log "Error removing item: $_" -type Error
        return $false
    }
}

# --- Main Installation ---

Write-Log "Starting full $appName installation..."

# 0. Verify required folders
Write-Log "Verify folders"
if (!(Test-Path -Path "$PSScriptRoot\$appSource")) {
    Write-Log "Error: Application source directory '$PSScriptRoot\$appSource' does not exist." -type Error
    exit 1
}
if (!(Test-Path -Path "$PSScriptRoot\$extensionSource")) {
    Write-Log "Error: Extension source directory '$PSScriptRoot\$extensionSource' does not exist." -type Error
    exit 1
}
if (!(Test-Path -Path "$PSScriptRoot\$chromiumSource")) {
    Write-Log "Error: Chromium source directory '$PSScriptRoot\$chromiumSource' does not exist." -type Error
    exit 1
}
if (!(Test-Path -Path "$innoSetupScript")) {
    Write-Log "Error: inno setup script  '$innoSetupScript' does not exist." -type Error
    exit 1
}

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
$buildResult = Run-Command -command "go" -arguments "build -o `"$PSScriptRoot\$appSource\$appName.exe`""
if ($buildResult -ne 0) {
    Write-Log "Error building the application. Exit code: $buildResult" -type Error
    exit $buildResult
}
Write-Log "Beatportdl built."

# 4. Create Output directory (Removed)

# 5. copy app
Write-Log "Copy app to output"
$copyAppResult = Copy-Item -Path "$PSScriptRoot\$appSource\$appName.exe" -Destination "$outputDir" -Force
if (!$copyAppResult) {
     Write-Log "Error copying the executable" -type Error
     exit 1
} else {
  Write-Log "Copy app success."
}

# 6. Copy Extension
Write-Log "Copy the extension to output"
$copyExtensionResult = Copy-Directory -source "$PSScriptRoot\$extensionSource" -destination "$outputDir\$extensionSource"
if (!$copyExtensionResult) {
     Write-Log "Error copying the extension" -type Error
     exit 1
} else {
    Write-Log "Copy extension success."
}

# 7. Copy Chromium
Write-Log "Copy chromium to output"
$copyChromiumResult = Copy-Directory -source "$PSScriptRoot\$chromiumSource" -destination "$outputDir\$chromiumSource"
if (!$copyChromiumResult) {
     Write-Log "Error copying the chromium" -type Error
     exit 1
} else {
  Write-Log "Copy chromium success."
}

# 8. Build the installer
Write-Log "Building the installer..."
$innoResult = Run-Command -command "$innoSetupPath" -arguments "`"$innoSetupScript`""
if ($innoResult -ne 0) {
    Write-Log "Error building installer. Exit code: $innoResult" -type Error
    exit $innoResult
}
Write-Log "Installer built successfully."
Write-Log "Installer file located in the Output directory"
Write-Log "Installation process finished."
# Remove install and iss files
Write-Log "Removing install script and iss file"
Remove-ItemForce -item "$PSScriptRoot\install.ps1"
Remove-ItemForce -item "$PSScriptRoot\install.iss"
