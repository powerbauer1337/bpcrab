powershell
# Installer Script for beatportdl and Browser Extension

# --- Configuration ---
$appName = "beatportdl"
$appVersion = "1.0.0" # Replace with actual version
$installDir = "C:\Program Files\$appName"
$goInstallUrl = "https://go.dev/dl/go1.21.5.windows-amd64.msi" # Use the latest version
$goInstallFile = "$env:TEMP\go_installer.msi"
$extensionSource = "extension" # Assuming the extension is in a subdirectory named "extension"
$extensionDir = "$env:LOCALAPPDATA\Google\Chrome\User Data\Default\Extensions\$appName" # Extension directory

# --- Helper Functions ---

# Check if a program is installed
function Check-ProgramInstalled($programName) {
    (Get-Command $programName -ErrorAction SilentlyContinue) -ne $null
}

# Download a file
function Download-File($url, $destination) {
    Write-Host "Downloading $url to $destination..."
    try {
        (New-Object System.Net.WebClient).DownloadFile($url, $destination)
        Write-Host "Download complete."
    } catch {
        Write-Error "Error downloading file: $_"
        exit 1
    }
}

# Run an installer silently
function Install-ProgramSilent($installerPath) {
    Write-Host "Installing $installerPath silently..."
    try {
        Start-Process -FilePath "msiexec.exe" -ArgumentList "/i `"$installerPath`" /qn" -Wait -PassThru
        Write-Host "Installation complete."
    } catch {
        Write-Error "Error installing program: $_"
        exit 1
    }
}

# Create a shortcut
function Create-Shortcut($targetPath, $shortcutPath) {
    Write-Host "Creating shortcut at $shortcutPath..."
    try {
        $WScriptShell = New-Object -ComObject WScript.Shell
        $shortcut = $WScriptShell.CreateShortcut($shortcutPath)
        $shortcut.TargetPath = $targetPath
        $shortcut.Save()
        Write-Host "Shortcut created."
    } catch {
        Write-Error "Error creating shortcut: $_"
    }
}

# Copy a directory
function Copy-Directory($source, $destination) {
    Write-Host "Copying from $source to $destination..."
    try {
        New-Item -ItemType Directory -Force -Path $destination
        Copy-Item -Path "$source\*" -Destination $destination -Recurse -Force
        Write-Host "Copy complete."
    } catch {
        Write-Error "Error copying directory: $_"
    }
}

# --- Main Installation ---

Write-Host "Starting $appName installation..."

# 1. Check Prerequisites (Go)
if (!(Check-ProgramInstalled "go")) {
    Write-Host "Go is not installed. Installing..."

    # 2. Install Go (if necessary)
    Download-File -url $goInstallUrl -destination $goInstallFile
    Install-ProgramSilent -installerPath $goInstallFile
    
    # Set GOPATH
    Write-Host "Setting GOPATH environment variable..."
    [Environment]::SetEnvironmentVariable("GOPATH", "$env:USERPROFILE\go", "User")
    $env:GOPATH = "$env:USERPROFILE\go"
    
    # Update PATH
    $newPath = "$env:PATH;$env:GOPATH\bin;C:\Go\bin"
    [Environment]::SetEnvironmentVariable("PATH", $newPath, "Machine")
    $env:PATH = $newPath
    
    Write-Host "Please restart your terminal to apply the changes."
    
} else {
    Write-Host "Go is already installed."
}

# 3. Build the application
Write-Host "Building $appName application..."
cd $PSScriptRoot\internal\cmd\beatportdl
go build -o "$installDir\beatportdl.exe"

# 4. Create installation directory
if (!(Test-Path -Path $installDir)) {
  New-Item -ItemType Directory -Path $installDir -Force | Out-Null
}

# 5. Copy the executable
Write-Host "Copying application to installation directory..."
Copy-Item -Path "$PSScriptRoot\internal\cmd\beatportdl\beatportdl.exe" -Destination "$installDir\beatportdl.exe" -Force

# 6. Create a shortcut
$shortcutPath = "$env:USERPROFILE\Desktop\$appName.lnk"
Create-Shortcut -targetPath "$installDir\beatportdl.exe" -shortcutPath $shortcutPath

# 7. Install the browser extension
Write-Host "Installing browser extension..."
Copy-Directory -source "$PSScriptRoot\$extensionSource" -destination "$extensionDir"
Write-Host "Browser extension installed to: $extensionDir"
Write-Host "To enable, go to chrome://extensions, enable 'Developer mode', click 'Load unpacked', and select the '$extensionDir' folder."

# 8. Run the app
Write-Host "Running the app for the first time..."
Start-Process -FilePath "$installDir\beatportdl.exe"

# 9. Cleanup
Write-Host "Cleaning up temporary files..."
if (Test-Path $goInstallFile) {
    Remove-Item -Path $goInstallFile -Force
}
Write-Host "$appName installation complete."
